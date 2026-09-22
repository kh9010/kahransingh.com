# tools/ — the weekly record generator

`weekly_record.py` builds the public weekly coding record. It is stdlib-only
python3, no dependencies, no build step.

## What it writes — exactly three paths, and nothing else

```
lately/<iso-week>/index.html   the permanent dated issue
lately/record/index.html       a copy of the newest issue
lately/entries.json            one merged entry per issue
```

Everything the record publishes lives under `/lately/`, and `/lately/` itself
stays what `lately/README.md` says it is: an index rendered from
`entries.json`, one strand among the several to come. The latest issue is a
door at `/lately/record/` rather than the top of the index, because the index
is a hand-reviewed page and the generator must not be able to write it.

It never touches `lately/index.html`, the site `index.html`, any `<nav>`,
`sitemap.xml`, `style.css` or any other page. `Writer.write` checks every path
against `WRITABLE` and exits rather than writing a fourth one — the issues now
sit in the same directory as a hand-written page, so the blast radius is
asserted in code instead of left to the caller being careful.

`lately/record/index.html` is byte-identical to the newest dated issue,
including its `<link rel="canonical">`, which points at the dated URL.
`/lately/record/` is a door; the dated URL is the durable address; Google sees
one page, not two.

## Running it

```sh
cd ~/dev/kahransingh.com                     # cwd must be the repo (or pass --site-root)
python3 tools/weekly_record.py ~/Sync/pending-work/coding-record/coding-days.json
```

| flag | what it does |
|---|---|
| *(positional)* | path to `coding-days.json`; defaults to `~/Sync/pending-work/coding-record/coding-days.json` |
| `--week 2026-W33` | rebuild one specific issue instead of the newest complete week |
| `--site-root PATH` | repo root, if not the parent of `tools/` |
| `--archive-dir PATH` | where pre-overwrite copies land (default `<data dir>/_archive`) |
| `--dry-run` | print what would happen, write nothing |
| `--force` | overwrite a target that changed since the last run (see below) |

**Which week.** The newest week whose Sunday is in the past by *both* clocks —
the data file's last day and the wall clock. A week in progress is never
published, and a stale data file can never make a partial week look complete.

**Idempotent.** Re-running for the same week rewrites that week's files
byte-identically and touches no other week. `generated_at` in `entries.json` only
moves when the entry set actually changes, so a no-op run is a true no-op.

**Write-defensively.** Before overwriting anything that already exists it copies
the current file to `<archive-dir>/<path>.<timestamp>.bak`, and it records a
checksum of everything it writes in `<archive-dir>/written.json`. If a target's
content no longer matches that checksum, someone edited the page by hand: the
script **refuses to run** and says so, rather than picking a winner. The fix is
to move the edit into this script — where it will survive every future run — and
then re-run with `--force`.

Consequence worth stating plainly: **do not hand-edit a rendered issue.** The
standing prose lives in the `COLOPHON` constant at the top of the script. Change
it there.

## How it looks

The issue links `/style.css` and carries the site's chrome — the same sidebar
nav, the same `.page-header`, Fraunces and Space Grotesk, the same paper and
inks. The `<style>` block adds only the marks this page needs. Those marks are
monochrome by rule: projects are told apart by weight and texture (a four-step
grey scale, then a hatch for the summed tail), never by hue, and the hour ridge
ramps from pale paper to ink. A categorical colour scheme is what made an
earlier draft read as a different publication rather than as this site.

`NAV_LINKS` holds the site's navigation. Adding a link to the site nav is still
a hand edit made once across the hand-written pages; changing it here is what
carries it into the generated ones.

## The privacy floor

Kahran's rule: numbers and project names are publishable; commit subjects, file
names and meeting titles are not. That is enforced by construction rather than by
review — the generator only ever reads these fields out of a day:

```
active_min longest_focus_min sessions user_msgs projects tokens models hourly
mini_msgs   commits[].{repo, ins, del, merge, claude}
```

`subject`, `sha`, `t`, `machine`, `top_files`, `files_touched` and `meetings` are
never read, so they cannot leak. The rendered page is static HTML with **no
embedded data blob** — no `<script id="coding-data">`, no fetch. What is visible
on the page is the entirety of what the page contains.

Four naming controls sit together at the top of the script:

- `PRIVATE_MARKERS` — a project whose directory name marks it private publishes
  as `private` and nothing else, and every worktree or spike cut from it
  collapses onto that same single line. The rule matches the marker rather than
  a spelled-out repo name, so this file — served from a public repo like every
  other file here — never writes that name down either.
- `PUBLIC_NAME` — renames a project for publication, e.g. `dev-misc` ->
  `unnamed sessions`.
- `DENY` — names that must never print. Anything listed still contributes its
  minutes to the bars but renders as "a private project". Currently empty, per
  Kahran's stated floor. Adding one line here is the whole retraction mechanism,
  and it fires on the exact name you type: a denied project is never rolled into
  a family first, so denying one spike does not require denying its parent.
- `NAMED_PROJECTS = 4` — only the four largest projects are ever named on a page;
  everything below is summed into "N smaller projects". The long tail of repo
  names therefore never publishes, even as the roster changes week to week.

`ROLLUP_FAMILIES` folds worktrees and spikes into their parent project, so
`day-flow-tome-build` reads as `day-flow` rather than exposing branch-shaped
directory names.

## Running it weekly on the mini

The record is a *publish*, not a deploy: the mini writes to a branch, and the
change lands through a PR like every other site change.

```sh
# Monday morning, after the extract has refreshed coding-days.json
cd ~/dev/kahransingh.com
git fetch origin && git checkout -B kahran-$(date +%b%d | tr A-Z a-z)-record origin/main
python3 tools/weekly_record.py ~/Sync/pending-work/coding-record/coding-days.json
git add lately                              # exact paths only, never `git add -A`
git commit -m "Publish the weekly record for $(date -v-7d +%G-W%V)"
git push -u origin HEAD
gh pr create --fill && gh pr merge --merge --delete-branch
```

Notes for whoever wires the job:

- **cwd must be the repo.** The script resolves the site root from its own
  location, so `python3 ~/dev/kahransingh.com/tools/weekly_record.py` also works
  from anywhere; passing `--site-root` is the explicit form.
- **The data file is the dependency, not the schedule.** If
  `coding-days.json` is stale the script publishes the newest week it can
  legitimately complete and simply rewrites it identically next time. It will
  never invent a week.
- **Exit codes.** `0` on success (including a no-op), non-zero with a readable
  message on: missing data file, no complete week, a week with no recorded
  activity, unparseable `entries.json`, or a hand-edited target. Any non-zero
  exit should surface as an alert rather than being retried blindly.
- **Keep it disabled until Kahran has reviewed the first issue.** The nav and
  sitemap links land in a separate change for exactly that reason — see
  `lately/README.md`, which is the gate this build honours.

## Reviewing an issue before it goes out

```sh
python3 -m http.server 8791          # from the repo root
open http://127.0.0.1:8791/lately/record/
```

`file://` will not do: the page's own assets are fine, but `/lately/` uses
site-absolute paths and `fetch`, both of which need a server.

## Place feed

`place_feed.py` reads the mini's `~/Sync/pending-work/presence.json` and writes
exactly one path, `v2/place.json` — `{"place", "lat", "lon", "tz", "updated"}` —
which `v2/weather.js` fetches client-side to render "Kahran's in New York and
it's raining." under the date. It is stdlib-only python3, same allowlist-write
pattern as `weekly_record.py`.

Only `confidence: "high"` or `"confirmed"` in presence.json ever publishes a
place; anything lower writes `{"place": null, ...}`. Coordinates are rounded to
2 decimals (~1km) deliberately — city-level only, never the exact point.

```sh
cd ~/dev/kahransingh.com
python3 tools/place_feed.py --check          # print what would be written
python3 tools/place_feed.py                  # write v2/place.json
python3 -m unittest tools.test_place_feed -v # unit tests (phrase map, name stripping)
```

`publish_place.sh` mirrors `publish_weekly.sh`: fetch, checkout main, ff pull,
run the generator, diff-quiet exit-0 if unchanged, else a `kahran-<mmmdd>-place`
branch, commit, push, `gh pr create --fill`, `gh pr merge --merge
--delete-branch`, back to main. Commit messages never name the place (privacy
rule at the top of this repo's CLAUDE.md) — "Update the place feed" is the
whole message.

**Envelope stamp (2026-09-22).** An `EXIT` trap stamps one day-flow envelope
per run — `ok` on exit 0 (including "no change"), `failed` otherwise — via
`~/Dev/day-flow/bin/envelope-stamp.py`, watched as `[site-place-feed]` in
day-flow's `samwise/lanes.toml`. Guarded: if that path isn't there (day-flow
not checked out on this box), the script logs it and publishes anyway — a
missing watcher must never break the publish.

### Installing the launchd agent on the mini (attended, one-time)

Not installed by default — this is a separate attended step:

```sh
cp ~/Dev/kahransingh.com/tools/com.kahran.place-feed-publish.plist \
   ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) \
   ~/Library/LaunchAgents/com.kahran.place-feed-publish.plist
launchctl kickstart -k gui/$(id -u)/com.kahran.place-feed-publish   # test one run now
tail -f ~/Library/Logs/place-feed-publish.log
```

Runs every 3 hours (`StartInterval 10800`), working directory
`~/Dev/kahransingh.com` (the mini's clone). Requires `gh` to be authenticated
with **file-based token storage** on the mini (keychain is walled off from
SSH/daemons there — see the kMini gh auth note) and a Tailscale path to
`100.69.200.2` for reading `presence.json`, though since it's the mini's own
`~/Sync/pending-work/presence.json` that's just the local Syncthing copy.

To uninstall: `launchctl bootout gui/$(id -u)/com.kahran.place-feed-publish`.

## Daily pick

Today's poem and photograph are chosen **live in the browser**, from the same
weather reading `v2/weather.js` renders under the date ("We're in New York
and it's raining.") — `v2/pick.js` ports this script's scoring (weights,
place bonus, novelty, tiebreak) to JS and picks against it directly, so the
pair changes if and only if that reading changes. See
`docs/2026-09-21-daily-pick-design.md`.

`daily_pick.py` runs once, near the end of the day, and writes that day's
pick into `v2/days.json` as its permanent **archive** entry — so a day that
has happened never reshuffles on a later visit. `v2/home.js` reads a past
day's stored "why" vector to recompute its pick the same way `v2/pick.js`
would; if that's unavailable it falls back to the literal stored poem/photo
in `v2/days.json`, then to the date hash. Full formula reference and scoring
math are documented in the module docstring; short version: it builds a "day
vector" (light, warmth, wet, stillness, season, inside, mood) from the day's
Open-Meteo weather at wherever `presence.json` says Kahran is, then picks
whichever poem/photo has the closest vector in `v2/scores-poems.json` /
`v2/scores-photos.json`, with a place bonus for photos and a novelty penalty
against recently-shown items. If a scores file is missing, every item
defaults to a neutral 0.5 on every axis — the picker degrades to novelty + a
stable tiebreak rather than crashing a run. The frozen `why` also records the
wind speed and cloud cover the run saw, alongside the seven axes, purely for
the archive — older entries without those two keys stay valid, nothing reads
them back into the scoring formula.

Like `place_feed.py`, a place name is only ever written when presence
confidence is `high`/`confirmed`; the commit message never names it.

```sh
cd ~/dev/kahransingh.com
python3 tools/daily_pick.py --dry            # print what would be picked
python3 tools/daily_pick.py                  # pick + write v2/days.json
python3 -m unittest tools.test_daily_pick -v # unit tests
```

| flag | what it does |
|---|---|
| `--date YYYY-MM-DD` | pick for a specific date instead of today |
| `--presence PATH` | presence.json to read (default `~/Sync/pending-work/presence.json`) |
| `--scores-dir DIR` | dir holding `scores-poems.json` / `scores-photos.json` (default `v2`) |
| `--data PATH` | the poem/photo catalog (default `v2/data.json`) |
| `--offline WEATHER.json` | read weather from a fixture file instead of calling Open-Meteo (used by the tests) |
| `--dry` | print what would happen, write nothing |

**Idempotent.** A date already present in `v2/days.json` exits 0 immediately
and prints "already picked" — it never overwrites a day once picked.

**Reads America/New_York wall clock unless presence says otherwise** — the
default `--date` is today in `presence.json`'s `tz`, falling back to
`America/New_York` if presence is missing, low/medium confidence, or has no
`tz`.

`publish_daily_pick.sh` mirrors `publish_place.sh`: fetch, checkout main, ff
pull, run the picker, diff-quiet exit-0 if unchanged, else a
`kahran-<mmmdd>-pick` branch, commit "Pick the day" (no place name in the
message — same privacy rule as the place feed), push, `gh pr create --fill`,
`gh pr merge --merge --delete-branch`, back to main.

**Envelope stamp (2026-09-22).** Same `EXIT`-trap pattern as `publish_place.sh`,
watched as `[site-daily-pick]` in day-flow's `samwise/lanes.toml` — `ok` on
exit 0, `failed` otherwise, via `~/Dev/day-flow/bin/envelope-stamp.py`, guarded
so a missing day-flow checkout never breaks the publish.

### Installing the launchd agent on the mini (attended, one-time)

Not installed by default:

```sh
cp ~/Dev/kahransingh.com/tools/com.kahran.daily-pick-publish.plist \
   ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) \
   ~/Library/LaunchAgents/com.kahran.daily-pick-publish.plist
launchctl kickstart -k gui/$(id -u)/com.kahran.daily-pick-publish   # test one run now
tail -f ~/Library/Logs/daily-pick-publish.log
```

Runs at 23:50 local every day (`StartCalendarInterval` Hour 23 Minute 50),
near the day's end so the archive entry reflects the day that happened rather
than a forecast of it, working directory `~/Dev/kahransingh.com` (the mini's
clone). Same `gh` file-based-token and Tailscale-to-`presence.json`
requirements as the place feed above.

To uninstall: `launchctl bootout gui/$(id -u)/com.kahran.daily-pick-publish`.
