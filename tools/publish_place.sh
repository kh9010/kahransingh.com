#!/bin/bash
# Place feed publish — runs on the mini, every 3 hours (see com.kahran.place-feed-publish.plist).
# Publish, not deploy: writes a branch, lands through a PR like every site change.
# Idempotent: an unchanged place exits 0 without touching git.
set -euo pipefail
export PATH="/opt/homebrew/bin:$PATH"   # mini launchd/ssh shells lack it; gh and python3 live there

# Envelope stamp (day-flow contracts/ENVELOPE.md, samwise/lanes.toml [site-place-feed]):
# one envelope per run, including a run that published nothing (unchanged is `ok`).
# Guarded — a missing day-flow checkout must never break publishing, just go unwatched.
STAMP="$HOME/Dev/day-flow/bin/envelope-stamp.py"
stamp_exit() {
  local rc=$?
  if [ -x "$STAMP" ]; then
    if [ "$rc" -eq 0 ]; then
      "$STAMP" site-place-feed ok --producer tools/publish_place.sh \
        --source kahransingh.com/v2/place.json || true
    else
      "$STAMP" site-place-feed failed --producer tools/publish_place.sh \
        --source kahransingh.com/v2/place.json --note "exit $rc" || true
    fi
  else
    echo "envelope-stamp.py not found at $STAMP — day-flow not checked out on this box, skipping envelope" >&2
  fi
  exit "$rc"
}
trap stamp_exit EXIT

cd "$(dirname "$0")/.."
git fetch origin && git checkout -q main && git pull -q --ff-only
python3 tools/place_feed.py "$HOME/Sync/pending-work/presence.json"
git diff --quiet -- v2/place.json && { echo "no change — nothing to publish"; exit 0; }
BR="kahran-$(date +%b%d | tr A-Z a-z)-place"
git checkout -q -B "$BR"
git add v2/place.json
git commit -q -m "Update the place feed

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -qu origin "$BR"
gh pr create --fill 2>&1 | tail -1
gh pr merge --merge --delete-branch 2>&1 | tail -1
git checkout -q main
