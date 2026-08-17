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
