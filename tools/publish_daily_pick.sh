#!/bin/bash
# Daily pick publish — runs on the mini, 05:10 local (see
# com.kahran.daily-pick-publish.plist), ahead of the day starting.
# Publish, not deploy: writes a branch, lands through a PR like every site change.
# Idempotent: a day already picked exits 0 without touching git.
set -euo pipefail
export PATH="/opt/homebrew/bin:$PATH"   # mini launchd/ssh shells lack it; gh and python3 live there
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
