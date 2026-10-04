#!/usr/bin/env bash
# Builds dist/fixpass.zip: the plugin as WordPress installs it (no sources or dev files).
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/fixpass
cp -R fixpass.php uninstall.php includes assets mu-plugin build dist/fixpass/
[ -f readme.txt ] && cp readme.txt dist/fixpass/
(cd dist && zip -qr fixpass.zip fixpass && rm -rf fixpass)
echo "dist/fixpass.zip"
