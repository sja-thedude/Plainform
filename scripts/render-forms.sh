#!/usr/bin/env bash
# Renders the blank sample form templates in scripts/forms to PNGs in
# public/samples using headless Chrome.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p public/samples
for name in visa hospital rental; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1240,1754 --screenshot="public/samples/$name.png" \
    "file://$PWD/scripts/forms/$name.html" 2>/dev/null
  echo "rendered public/samples/$name.png"
done
