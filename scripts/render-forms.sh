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

# Small WebP thumbnails for the sample cards on the landing page.
mkdir -p public/samples/thumbs
node -e '
const sharp = require("sharp");
for (const n of ["visa", "hospital", "rental"]) {
  sharp(`public/samples/${n}.png`).extract({ left: 0, top: 0, width: 1240, height: 930 })
    .resize(480).webp({ quality: 78 }).toFile(`public/samples/thumbs/${n}.webp`)
    .then((i) => console.log(`thumb ${n}.webp ${i.size} bytes`));
}'
