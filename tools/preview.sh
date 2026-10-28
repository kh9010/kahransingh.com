#!/bin/sh
# preview.sh [branch] — put a branch on the deploy (https://kh9010.github.io/) without touching live.
# Pushes the branch to `preview` on origin, then publishes the mirror right away.
set -eu
branch="${1:-$(git branch --show-current)}"
git push -f origin "$branch:refs/heads/preview"
exec "$(dirname "$0")/preview-publish.sh"
