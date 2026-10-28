#!/bin/sh
# preview-publish.sh — copy the site's `preview` branch into kh9010/kh9010.github.io,
# which GitHub Pages serves at https://kh9010.github.io/ (the deploy; main is the live).
# Runs every 15 minutes on kMini (tools/launchd/com.kahran.site-preview-publish.plist)
# and on demand from tools/preview.sh. Idempotent: no push when preview has not moved.
set -eu
SRC="https://github.com/kh9010/kahransingh.com"
MIRROR="${PREVIEW_MIRROR:-$HOME/Dev/_preview-mirror}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

sha=$(git ls-remote "$SRC" refs/heads/preview | cut -c1-40)
[ -n "$sha" ] || { echo "no preview branch on $SRC"; exit 1; }

if [ ! -d "$MIRROR/.git" ]; then
  gh repo clone kh9010/kh9010.github.io "$MIRROR" -- -q
fi
cd "$MIRROR"
git fetch -q origin main && git reset -q --hard origin/main
last=$(git log -1 --format=%s | sed -n 's/^preview \([0-9a-f]\{40\}\).*/\1/p')
if [ "$last" = "$sha" ]; then echo "preview unchanged at $(printf %s "$sha" | cut -c1-7)"; exit 0; fi

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
git -C "$tmp" init -q && git -C "$tmp" fetch -q --depth 1 "$SRC" "$sha"
git -C "$tmp" archive "$sha" | tar -x -C "$tmp"
rm -rf "$tmp/.git" "$tmp/CNAME"
printf 'User-agent: *\nDisallow: /\n' > "$tmp/robots.txt"
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$tmp"/. .
git add -A
git -c user.email=kahran_s@hotmail.com -c user.name="Kahran Singh" commit -q -m "preview $sha" || { echo "nothing to publish"; exit 0; }
git push -q origin main
echo "published preview $(printf %s "$sha" | cut -c1-7) -> https://kh9010.github.io/"
