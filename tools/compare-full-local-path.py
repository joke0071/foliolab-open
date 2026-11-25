from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import json
import os
import re
import subprocess
import sys
import threading
import time
from urllib.request import urlopen

import yaml

BASELINE = "8de635271c341d7462d4d33e5f268089c26da6d0"
CANDIDATE = "5c2d7aca"
ROOT = Path.cwd()
OUTPUT = ROOT / "artifacts/full-local-pair"


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


def named_step(steps, title):
    return next(step for step in steps if step.get("name") == title)


def browser_step(original, shard=None):
    script = original["run"]
    # Start and stop the same loopback server explicitly between both variants.
    script = "\n".join(
        line for line in script.splitlines()
        if "http.server 4173" not in line and "for i in $(seq 1 30)" not in line
    )
    if shard:
        script = script.replace("${{ matrix.shard }}", shard)
    return script, original.get("env", {})


def read_steps(checkout, job):
    workflow = yaml.safe_load((checkout / ".github/workflows/import.yml").read_text())
    if job == "wallet":
        wallet = yaml.safe_load((checkout / ".github/workflows/wallet-scan-ci.yml").read_text())
        return [(step["run"], {}) for step in wallet["jobs"]["tests"]["steps"] if "run" in step]
    if job.startswith("cross"):
        steps = workflow["jobs"]["cross-engine"]["steps"]
        return [browser_step(named_step(steps, "Test portfolio workflows on Firefox and WebKit"), job[-1])]
    steps = workflow["jobs"]["test"]["steps"]
    return [
        (named_step(steps, name)["run"], {}) for name in (
            "Require a service-worker cache revision for shipped asset changes",
            "Prepare static site",
            "Verify standalone application",
        )
    ] + [
        browser_step(named_step(steps, "Browser smoke tests (320–1440 px)")),
        (named_step(steps, "Expose bounded synthetic C5 PR review")["run"], {}),
    ]


def now():
    return datetime.now(timezone.utc).isoformat()


def resources():
    cpu = list(map(int, Path("/proc/stat").read_text().splitlines()[0].split()[1:9]))
    memory = int(next(
        row.split()[1] for row in Path("/proc/meminfo").read_text().splitlines()
        if row.startswith("MemAvailable:")
    ))
    return {"elapsedMonotonicSeconds": time.monotonic(), "cpuTicks": cpu, "memoryAvailableKiB": memory}


def wait_localhost(server):
    for _ in range(60):
        if server.poll() is not None:
            raise RuntimeError("Local HTTP server exited")
        try:
            with urlopen("http://127.0.0.1:4173/", timeout=1) as response:
                if response.status == 200:
                    return
        except OSError:
            time.sleep(.25)
    raise RuntimeError("Local HTTP server was not ready")


def run_variant(job, label, revision, checkout):
    steps = read_steps(checkout, job)
    env = {**os.environ, "GITHUB_EVENT_NAME": "pull_request", "GITHUB_SHA": revision,
           "GITHUB_REF": "refs/pull/430/merge"}
    dest = OUTPUT / label
    dest.mkdir(parents=True, exist_ok=True)
    log_path = dest / "steps.log"
    samples = []
    stop = threading.Event()

    def sample():
        while not stop.is_set():
            samples.append(resources())
            stop.wait(5)

    log_server = dest / "server.log"
    server = None
    sampler = threading.Thread(target=sample, daemon=True)
    stamp = now()
    start = time.monotonic()
    timings = []
    ret = 1
    try:
        with log_server.open("w") as serve, log_path.open("w") as log:
            if job != "wallet":
                server = subprocess.Popen(
                    ["python3", "-m", "http.server", "4173", "--bind", "127.0.0.1"],
                    cwd=checkout, stdout=serve, stderr=subprocess.STDOUT,
                )
                wait_localhost(server)
            sampler.start()
            ret = 0
            for command, overrides in steps:
                segment = time.monotonic()
                ret = subprocess.run(
                    ["bash", "-euo", "pipefail", "-x", "-c", command],
                    cwd=checkout, env={**env, **overrides}, stdout=log, stderr=subprocess.STDOUT,
                ).returncode
                timings.append({"elapsedSeconds": time.monotonic() - segment, "exit": ret})
                if ret:
                    break
    finally:
        stop.set()
        if sampler.is_alive():
            sampler.join()
        if server:
            server.terminate()
            server.wait(timeout=5)
    text = log_path.read_text()
    test_lines = [line[2:] for line in text.splitlines()
                  if re.match(r"^\+ (?:node tests/|npm (?:test|run check))", line)]
    parity = [json.loads(row.split("P1A timing ", 1)[1]) for row in text.splitlines()
              if row.startswith("P1A timing {")]
    receipt = {"variant": label, "revision": revision, "job": job, "startedAt": stamp,
               "lastStepSeconds": time.monotonic() - start, "exit": ret, "retries": 0,
               "steps": timings, "executedTestList": test_lines, "parity": parity,
               "resourceSamples": samples, "nodeVersion": subprocess.check_output(["node", "-v"], text=True).strip(),
               "affinity": sorted(os.sched_getaffinity(0))}
    (dest / "result.json").write_text(json.dumps(receipt, indent=2)+"\n")
    print(f"{job} {label}: {ret} after {receipt['lastStepSeconds']:.3f} s", flush=True)
    return receipt


def main():
    job, order = sys.argv[1:]
    assert job in {"chromium", "cross1", "cross2", "cross3", "wallet"}
    assert order in {"AB", "BA"}
    versions = {"A": git("rev-parse", BASELINE), "B": git("rev-parse", CANDIDATE)}
    git("diff", "--exit-code", versions["A"], versions["B"], "--",
        "index.html", "manifest.webmanifest", "sw.js", "styles.css", "src", "icons")
    receipts = []
    for label in order:
        checkout = Path(os.environ["RUNNER_TEMP"]) / f"foliolab-pair-{label}"
        git("worktree", "add", "--detach", str(checkout), versions[label])
        if job != "wallet":
            (checkout / "node_modules").symlink_to(ROOT / "node_modules", target_is_directory=True)
        receipts.append(run_variant(job, label, versions[label], checkout))
    same = receipts[0]["executedTestList"] == receipts[1]["executedTestList"]
    eligible = same and all(r["exit"] == 0 for r in receipts)
    summary = {"job": job, "order": order, "sameExecutedTestList": same, "eligible": eligible,
               "testListSha256": sha256(json.dumps(receipts[0]["executedTestList"]).encode()).hexdigest(),
               "seconds": {r["variant"]: r["lastStepSeconds"] for r in receipts}}
    (OUTPUT / "comparison.json").write_text(json.dumps(summary, indent=2)+"\n")
    print(json.dumps(summary))
    return 0 if eligible else 1


if __name__ == "__main__":
    raise SystemExit(main())
