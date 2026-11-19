#!/usr/bin/env bash
# Prepare a prioritized HTTPS mirror list; APT verifies repository signatures.
# The caller installs the list only after both archive and security probes succeed.
set -euo pipefail
kind=${1:-}
codename=${2:-}
[[ "$codename" =~ ^[a-z]+$ ]] || { echo 'Invalid Ubuntu codename' >&2; exit 2; }
case "$kind" in
  archive)
    mirrors=(https://archive.ubuntu.com/ubuntu/ https://mirrors.edge.kernel.org/ubuntu/ https://us.archive.ubuntu.com/ubuntu/)
    pockets=("$codename" "$codename-updates") ;;
  security)
    mirrors=(https://security.ubuntu.com/ubuntu/ https://archive.ubuntu.com/ubuntu/ https://us.archive.ubuntu.com/ubuntu/ https://mirrors.edge.kernel.org/ubuntu/)
    pockets=("$codename-security") ;;
  *) echo 'Expected archive or security' >&2; exit 2 ;;
esac
mirrors+=(https://mirror.math.princeton.edu/pub/ubuntu/)
probe_directory=$(mktemp -d)
trap 'rm -rf "$probe_directory"' EXIT

probe_mirror() {
  local url=$1 probe=$2 pocket
  for pocket in "${pockets[@]}"; do
    echo "Checking Ubuntu $kind mirror: $url ($pocket)" >&2
    curl --fail --silent --show-error --proto '=https' --connect-timeout 10 --max-time 15 --retry 0 \
      --output "$probe" "${url}dists/$pocket/InRelease" || return 1
    if [[ $(head -n 1 "$probe") != '-----BEGIN PGP SIGNED MESSAGE-----' ]] ||
        ! grep -Fxq "Suite: $pocket" "$probe"; then
      echo "Rejected unexpected InRelease response from $url ($pocket)" >&2
      return 1
    fi
  done
}

# Give slow TLS connections time without charging that time per mirror.
for i in "${!mirrors[@]}"; do
  probe_mirror "${mirrors[i]}" "$probe_directory/$i" &
  probes[i]=$!
done
reachable=0
for i in "${!mirrors[@]}"; do
  if wait "${probes[i]}"; then
    # APT's mirror+file transport tries lower priorities first and can fail over.
    printf '%s\tpriority:%d\n' "${mirrors[i]}" "$((i+1))"
    reachable=1
  fi
done
if ((reachable)); then exit 0; fi
echo "No reachable Ubuntu $kind mirror; configuration unchanged" >&2
exit 1
