#!/bin/sh
# Clone + pin PeTTa and install SWI-Prolog deps (Debian/Ubuntu).
# The cross-platform logic lives in setup_petta.py; this script only adds the
# system packages a fresh Linux box needs.
set -e
if ! command -v swipl >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-add-repository -y ppa:swi-prolog/stable
    sudo apt-get update
    sudo apt-get install -y swi-prolog-nox git python3
  else
    echo "Install SWI-Prolog >= 9.3 from https://www.swi-prolog.org and re-run." >&2
    exit 1
  fi
fi
python3 "$(dirname "$0")/setup_petta.py"
