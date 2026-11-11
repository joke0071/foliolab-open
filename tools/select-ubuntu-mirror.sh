#!/usr/bin/env bash
# Select an HTTPS Ubuntu mirror; APT still verifies repository signatures.
# This helper prints one URL and never edits system configuration.
set -euo pipefail
kind=${1:-}
codename=${2:-}
[[ "$codename" =~ ^[a-z]+$ ]] || { echo 'Invalid Ubuntu codename' >&2; exit 2; }
case "$kind" in
  archive) hosts=(archive.ubuntu.com us.archive.ubuntu.com) ;;
  security) hosts=(security.ubuntu.com archive.ubuntu.com us.archive.ubuntu.com) ;;
  *) echo 'Expected archive or security' >&2; exit 2 ;;
esac
pocket=$codename
[[ "$kind" != security ]] || pocket=$codename-security
probe=$(mktemp)
trap 'rm -f "$probe"' EXIT
for host in "${hosts[@]}"; do
  url="https://$host/ubuntu/"
  echo "Checking Ubuntu $kind mirror: $host ($pocket)" >&2
  if curl --fail --silent --show-error --proto '=https' --connect-timeout 3 --max-time 8 --retry 0 \
      --output "$probe" "${url}dists/$pocket/InRelease"; then
    if [[ $(head -n 1 "$probe") == '-----BEGIN PGP SIGNED MESSAGE-----' ]]; then
      printf '%s\n' "$url"
      exit 0
    fi
    echo "Rejected unexpected InRelease response from $host" >&2
  fi
done
echo "No reachable Ubuntu $kind mirror; configuration unchanged" >&2
exit 1
