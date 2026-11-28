"""Check the Cloudflare build for this commit and both anonymous entry points."""
import json
import os
import re
import subprocess
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def deployment_host():
    sha = os.environ["GITHUB_SHA"]
    endpoint = f"repos/{os.environ['GITHUB_REPOSITORY']}/commits/{sha}/check-runs?per_page=100"
    for _ in range(30):
        checks = json.loads(subprocess.check_output(["gh", "api", endpoint]))["check_runs"]
        runs = [r for r in checks if r["head_sha"] == sha
                and r["app"]["slug"] == "cloudflare-workers-and-pages"
                and "/pages/view/foliolab/" in (r["details_url"] or "")]
        if runs:
            run = max(runs, key=lambda r: r["id"])
            if run["status"] == "completed":
                if run["conclusion"] != "success":
                    raise RuntimeError(f"Cloudflare build finished with {run['conclusion']}")
                match = re.search(r"https://([a-f0-9]+\.foliolab\.pages\.dev)\b",
                                  run["output"]["summary"] or "")
                if not match:
                    raise RuntimeError("Cloudflare build did not report its deployment URL")
                return match[1]
        time.sleep(10)
    raise RuntimeError(f"No completed Cloudflare Pages build for {sha}")


def check_login(host, path):
    url = f"https://{host}{path}"
    request = Request(url, headers={"User-Agent": "FolioLab-Release-Check/1.0", "Accept": "text/html"})
    try:
        with build_opener(NoRedirect()).open(request, timeout=20) as response:
            raise RuntimeError(f"{url} returned HTTP {response.status} without a login")
    except HTTPError as error:
        target = urlsplit(error.headers.get("Location", ""))
        if (error.code not in (302, 303, 307) or target.scheme != "https"
                or target.hostname != "foliolab.cloudflareaccess.com"
                or target.path != f"/cdn-cgi/access/login/{host}"):
            raise RuntimeError(f"{url} did not redirect to its Cloudflare Access login (HTTP {error.code})") from None
    print(f"Access login verified for {url}", flush=True)


if __name__ == "__main__":
    for hostname in ("foliolab.pages.dev", deployment_host()):
        for path in ("/", "/sw.js"):
            check_login(hostname, path)
