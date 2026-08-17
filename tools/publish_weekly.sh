#!/bin/bash
# Weekly record publish — runs on the mini, Monday 08:05, after the 07:40 extract syncs.
# Publish, not deploy: writes a branch, lands through a PR like every site change.
# Idempotent: a week already published exits 0 without touching git.
set -euo pipefail
cd "$(dirname "$0")/.."
git fetch origin && git checkout -q main && git pull -q --ff-only
python3 tools/weekly_record.py "$HOME/Sync/pending-work/coding-record/coding-days.json"
git diff --quiet -- lately && { echo "no new week — nothing to publish"; exit 0; }
BR="kahran-$(date +%b%d | tr A-Z a-z)-record"
git checkout -q -B "$BR"
git add lately
git commit -q -m "Publish the weekly record for $(date -v-7d +%G-W%V)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push -qu origin "$BR"
gh pr create --fill 2>&1 | tail -1
gh pr merge --merge --delete-branch 2>&1 | tail -1
git checkout -q main
