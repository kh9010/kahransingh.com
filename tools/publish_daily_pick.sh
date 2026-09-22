#!/bin/bash
# Daily pick publish — runs on the mini, 05:10 local (see
# com.kahran.daily-pick-publish.plist), ahead of the day starting.
# Publish, not deploy: writes a branch, lands through a PR like every site change.
# Idempotent: a day already picked exits 0 without touching git.
set -euo pipefail
export PATH="/opt/homebrew/bin:$PATH"   # mini launchd/ssh shells lack it; gh and python3 live there

# Envelope stamp (day-flow contracts/ENVELOPE.md, samwise/lanes.toml [site-daily-pick]):
# one envelope per run, including a run that published nothing (unchanged is `ok`).
# Guarded — a missing day-flow checkout must never break publishing, just go unwatched.
STAMP="$HOME/Dev/day-flow/bin/envelope-stamp.py"
stamp_exit() {
  local rc=$?
  if [ -x "$STAMP" ]; then
    if [ "$rc" -eq 0 ]; then
      "$STAMP" site-daily-pick ok --producer tools/publish_daily_pick.sh \
        --source kahransingh.com/v2/days.json || true
    else
      "$STAMP" site-daily-pick failed --producer tools/publish_daily_pick.sh \
        --source kahransingh.com/v2/days.json --note "exit $rc" || true
    fi
  else
    echo "envelope-stamp.py not found at $STAMP — day-flow not checked out on this box, skipping envelope" >&2
  fi
  exit "$rc"
}
trap stamp_exit EXIT

cd "$(dirname "$0")/.."
git fetch origin && git checkout -q main && git pull -q --ff-only
python3 tools/daily_pick.py --presence "$HOME/Sync/pending-work/presence.json"
# status, not diff: the first ever run creates the file, and an untracked file has no diff
[ -z "$(git status --porcelain -- v2/days.json)" ] && { echo "already picked — nothing to publish"; exit 0; }
BR="kahran-$(date +%b%d | tr A-Z a-z)-pick"
git checkout -q -B "$BR"
git add v2/days.json
git commit -q -m "Pick the day

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -qu origin "$BR"
gh pr create --fill 2>&1 | tail -1
gh pr merge --merge --delete-branch 2>&1 | tail -1
git checkout -q main
