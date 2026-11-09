# kahransingh.com — working notes for Claude

This is a **public** GitHub Pages repo (custom domain kahransingh.com, plain HTML/CSS/JS, no build step). Anything committed — including **commit messages and git history** — is world-readable forever.

## Privacy rules (load-bearing)

- **Never put other people's names in commit messages.** Use neutral phrasing like "roster corrections" or "update reunion list" instead of naming who was added, removed, or merged. Commit messages are indexed by GitHub search and cannot be un-published without a history rewrite.
- **Keep third-party PII off the pages** — no home addresses, personal phone numbers, personal emails, or maiden-name/identity linkages for anyone but Kahran. Business/venue contact info is fine. The reunion roster is first-name + last-name only, no provenance notes in the source.
- Private-ish sections (`/reunion/`, `/40/`, `/winter/`, `/wedding/`) use `<meta name="robots" content="noindex, nofollow">` to stay out of search. Rely on that meta tag — do **not** also add a `robots.txt` Disallow for the same path (a Disallow stops crawlers from ever reading the noindex, which backfires).

## Conventions

- Serve media at web-appropriate sizes: photos ≤ ~2400px long edge / ≤ ~1MB; loop videos re-encoded small (see `video-poems/` at 540px). GitHub Pages can't serve Git LFS, so keep assets in the repo but small — don't move served media to LFS.
- Every page carries the Google Analytics tag (`G-H63H3KD6WQ`), private sections included; `verify.mjs` fails on a page without it (exempt: `studies/NN/` drafts, redirect stubs, and `lately/record/`, which the weekly generator rewrites from its tagged template). Clicks that open something go as events through `/track.js`, which reads the markup and lists its event names at the top; it is loaded on the home, both Abouts, the photography page and, via `poems/related.js`, every poem. Rename a class it counts and `verify.mjs` says so.
- Every top-level page carries `<title>`, meta description, canonical, and OG/Twitter card tags. New poem pages should mirror `og:description` into a `<meta name="description">` and include an `og:image`.

## Three versions live side by side (since 2026-11-09; two since 2026-09-21)

- `/` is **v3, the stone** (Kahran's call, 8 Nov: "lets plan on 2"): `/index.html` + `/v3/stone.js` + `/v3/stone.css`, assembled from the studies he picked, their code carried over, not rewritten: 33's masses cut over the day's photograph, the poem broken across it (door lines in line order, 28), the walk through door lines and facet doors (24, 28), 39's grow crossing (a crossfade under reduced motion), every facet giving a piece of his work (37 `?y=shape`), the six ideas in the facet nearest the where line (40), the where line arriving as 35 `?a=line` and opening 34 b's chain (36 c), and the photograph's own facet holding its EXIF month and year, which flies the photograph into its year in the About's years (38 `?d=c`, 27 a).
  - **Its code and data are copies of the studies', made by `node v3/build.mjs`** (versions share no files; `regions.json` is split into `v3/regions/<photo>.json` so a visit loads only the photographs it shows; `body.js`'s sources point at `v3/body/`). Rebuild after any of those studies changes: `tools/test_home.mjs` runs `--check` and goes red until the copies agree.
  - **The numbers are `v3/defaults.json`**, loaded at startup and written onto `:root` for the CSS. No `?tune` and no study switch on the live page; tune a study, then carry the value here.
  - **The way into the About's years is one seam**: `YEARS` near the top of `v3/stone.js`, today 27 a's address (`/studies/27/index.html?v=a`), opened in a frame the first time it is wanted. If 27 a becomes `about.html`, change that one constant; a page there without 27 a's year rows is simply opened.
  - It still reads the home's own parts live: today's pick through `/v2/pick.js`, `/v2/weather.js`, `/v2/data.json` and `/v2/days.json` (via `v3/today.js`), and **IDEAS from `/v2/home.js`**, which stays the one table of the six ideas.
  - Old links to `/#flow` are sent on to `/v2/#flow`.
  - `tools/test_home.mjs` pins it (wired into `verify.mjs`): the studies' load-bearing checks, run on the live page with the clock and sky pinned, at 1440x900, 390x844 and 844x390.
- `/v2/index.html` is **v2**, the wall's home, moved there whole on 2026-11-09 as v1 was: the daily photo + poem opening, the wall of six ideas, the flow view (`/v2/#flow`) and the Right now lines, which live on `/v2/` only (`/v2/home.css`, `/v2/home.js`, data in `/v2/data.json`). Today's pick follows the live weather reading shown under the date (`v2/pick.js`, `v2/weather.js`); a past day replays its frozen archive entry (`v2/days.json`, written nightly by `tools/daily_pick.py`); anything neither can answer falls back to a deterministic hash of the date, so a past day never reshuffles. Full formula: `docs/2026-09-21-daily-pick-design.md`.
- `/v1/index.html` is the first home, untouched in content; `/v1/about.html` is the old About (moved 2026-10-28, when `about.html` became the one picked at the Study 09 desk), and the old home's nav points at it. Every other old page (about, poetry, photography, projects, speaking, cv, poem-films, the private event pages, `/poems/`, `/lately/`) stays at its original URL and is shared by both versions; their nav "kahran" link points at `/v1/`.
- **The wall is six ideas, not sixteen tools (2026-09-22, Home added 2026-10-27).** Kahran:
  *"we don't need every single box on this home page … maybe there's a big idea of context
  that subsumes some of these sub boxes."* Context, Keeping track, Staying up to date,
  Topically suggesting, Self-healing, Home — three across and three beneath, leaning, one hue
  each (Home is plum). **The map from an idea to the tools under it is `IDEAS` at the top of
  `/v2/home.js` and lives nowhere else**; the wall is built from it, so re-cutting the system
  is an edit to that one table. `v2/index.html` holds only an empty `#wall-block` plus a
  `<noscript>` copy of the same six lines, which `tools/test_wall.mjs` pins to `IDEAS`; the stone's
  `index.html` carries the same six lines in its own `<noscript>`, pinned by `tools/test_home.mjs`.
- **What runs behind each part** is `tools/wall-map.json`, keyed by part name (not served).
  The system repo's weekly `wall-drift` job reads it on kMini and reports a part whose jobs
  have stopped, or a running job no part accounts for. Re-cut `IDEAS`, re-key the map:
  `tools/test_wall.mjs` fails until they name the same parts.
- **Never name the system on the site** (Kahran, 2026-10-27): no "day-flow" in any copy a
  visitor reads; plain words only. Samwise and the Curator are the only working names that
  are public. `tools/test_wall.mjs` checks the wall, the flow view and `/context/`.
- "how they fit together" flies the same six tiles into a data-flow layout
  (`/v2/flow.js`, styles at the end of `/v2/home.css`; `#flow` opens it directly). Where each
  idea lands and **what feeds what** live in `PLACE` and `EDGES` at the top of `flow.js` and
  nowhere else. An idea-level arrow is only drawn where an audited part-level arrow crosses
  between the two ideas — every one of those is justified by the line where the TARGET reads
  what the source wrote, in `docs/2026-09-22-flow-edges.md`, whose last section, "Six ideas
  (2026-10-27)", holds the current parts→ideas map, the five arrows and the surfaces.
  That file also records the arrows that turned out to be false and why. Change an arrow,
  change that table; keep the list honest rather than tidy, and leave a tile unconnected
  before inventing a lane for it. `SURFACES` and `FEEDS` in the same file are the other half —
  a third column of the things he actually gets (the 06:30 message, a message of its own, a
  question on WhatsApp, a page, when he asks, the family group, everyone) and which idea comes
  out where, audited from the sending side in that doc. The 06:30 message is no longer the
  only scheduled outbound; the doc's 2026-10-27 section has the ledger counts.
- Tiles are the SAME size in both views — the flight is FLIP and only translates, so a box
  that also changed size would pop. `--tile` therefore sets the wall's width AND the flow
  grid's columns, and `--tools-w` (3 tiles + 2 gaps) is what the poem's max-width is computed
  against: raise the tile ceiling and the poem starts losing room.
- `/context/` is the first idea with a page of its own (`context/index.html` + `context.css`,
  no JS). It replaced `/movement/`, which is now a meta-refresh stub pointing at
  `/context/#movement`. A box gets a page by giving its `IDEAS` entry an `href`.
- A small fixed "v3 · v2 · v1" tab switches between them (top right on the stone, bottom right on v2 and v1). Nothing gets migrated into an older version until Kahran decides where it goes.

## Deploy versus live (since 2026-10-27)

- **Live** is `main`, served by this repo's GitHub Pages at kahransingh.com. **Deploy** is the `preview` branch, served at https://kh9010.github.io/ by the mirror repo `kh9010/kh9010.github.io` (a copy, `robots.txt` disallow-all, no `CNAME`). Put any branch on deploy with `tools/preview.sh [branch]`; `tools/preview-publish.sh` does the copy and runs every 15 minutes on kMini (`tools/launchd/com.kahran.site-preview-publish.plist`, installed as a copy in `~/Library/LaunchAgents`). Never edit the mirror repo by hand.
