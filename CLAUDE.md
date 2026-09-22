# kahransingh.com — working notes for Claude

This is a **public** GitHub Pages repo (custom domain kahransingh.com, plain HTML/CSS/JS, no build step). Anything committed — including **commit messages and git history** — is world-readable forever.

## Privacy rules (load-bearing)

- **Never put other people's names in commit messages.** Use neutral phrasing like "roster corrections" or "update reunion list" instead of naming who was added, removed, or merged. Commit messages are indexed by GitHub search and cannot be un-published without a history rewrite.
- **Keep third-party PII off the pages** — no home addresses, personal phone numbers, personal emails, or maiden-name/identity linkages for anyone but Kahran. Business/venue contact info is fine. The reunion roster is first-name + last-name only, no provenance notes in the source.
- Private-ish sections (`/reunion/`, `/40/`, `/winter/`, `/wedding/`) use `<meta name="robots" content="noindex, nofollow">` to stay out of search. Rely on that meta tag — do **not** also add a `robots.txt` Disallow for the same path (a Disallow stops crawlers from ever reading the noindex, which backfires).

## Conventions

- Serve media at web-appropriate sizes: photos ≤ ~2400px long edge / ≤ ~1MB; loop videos re-encoded small (see `video-poems/` at 540px). GitHub Pages can't serve Git LFS, so keep assets in the repo but small — don't move served media to LFS.
- Every top-level page carries `<title>`, meta description, canonical, and OG/Twitter card tags. New poem pages should mirror `og:description` into a `<meta name="description">` and include an `og:image`.

## Two versions live side by side (since 2026-09-21)

- `/` is **v2**: the daily photo + poem opening and the wall of five ideas (`/index.html`, `/v2/home.css`, `/v2/home.js`, data in `/v2/data.json`). Today's pick follows the live weather reading shown under the date (`v2/pick.js`, `v2/weather.js`); a past day replays its frozen archive entry (`v2/days.json`, written nightly by `tools/daily_pick.py`); anything neither can answer falls back to a deterministic hash of the date, so a past day never reshuffles. Full formula: `docs/2026-09-21-daily-pick-design.md`.
- `/v1/index.html` is the old home, untouched in content. Every other old page (about, poetry, photography, projects, speaking, cv, poem-films, the private event pages, `/poems/`, `/lately/`) stays at its original URL and is shared by both versions; their nav "kahran" link points at `/v1/`.
- **The wall is five ideas, not sixteen tools (2026-09-22).** Kahran: *"we don't need every
  single box on this home page … maybe there's a big idea of context that subsumes some of
  these sub boxes."* Context, Keeping track, Staying up to date, Topically suggesting,
  Self-healing — three across and two beneath, leaning, one hue each. **The map from an idea
  to the tools under it is `IDEAS` at the top of `/v2/home.js` and lives nowhere else**; the
  wall is built from it, so re-cutting the system is an edit to that one table. `index.html`
  holds only an empty `#wall-block` plus a `<noscript>` copy of the same five lines. All
  sixteen tools still have a home (Travel days is under Topically suggesting).
- "how they fit together" flies the same five tiles into a data-flow layout
  (`/v2/flow.js`, styles at the end of `/v2/home.css`; `#flow` opens it directly). Where each
  idea lands and **what feeds what** live in `PLACE` and `EDGES` at the top of `flow.js` and
  nowhere else. An idea-level arrow is only drawn where an audited part-level arrow crosses
  between the two ideas — every one of those is justified by the line where the TARGET reads
  what the source wrote, in `docs/2026-09-22-flow-edges.md`, whose "The five ideas" section
  holds the parts→ideas map and the collapse (4 arrows drawn, 8 gone internal, 0 invented).
  That file also records the arrows that turned out to be false and why. Change an arrow,
  change that table; keep the list honest rather than tidy, and leave a tile unconnected
  before inventing a lane for it. `SURFACES` and `FEEDS` in the same file are the other half —
  a third column of the things he actually gets (the 06:30 message, a question on WhatsApp, a
  page, when he asks) and which idea comes out where, audited from the sending side in that
  doc's "Reaches Kahran" section.
- Tiles are the SAME size in both views — the flight is FLIP and only translates, so a box
  that also changed size would pop. `--tile` therefore sets the wall's width AND the flow
  grid's columns, and `--tools-w` (3 tiles + 2 gaps) is what the poem's max-width is computed
  against: raise the tile ceiling and the poem starts losing room.
- `/context/` is the first idea with a page of its own (`context/index.html` + `context.css`,
  no JS). It replaced `/movement/`, which is now a meta-refresh stub pointing at
  `/context/#movement`. A box gets a page by giving its `IDEAS` entry an `href`.
- A small fixed "v2 · v1" tab switches between them. Nothing gets migrated into v2 until Kahran decides where it goes.
