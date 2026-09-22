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

- `/` is **v2**: the daily photo + poem opening and the wall of tools (`/index.html`, `/v2/home.css`, `/v2/home.js`, data in `/v2/data.json`). Today's pick follows the live weather reading shown under the date (`v2/pick.js`, `v2/weather.js`); a past day replays its frozen archive entry (`v2/days.json`, written nightly by `tools/daily_pick.py`); anything neither can answer falls back to a deterministic hash of the date, so a past day never reshuffles. Full formula: `docs/2026-09-21-daily-pick-design.md`.
- `/v1/index.html` is the old home, untouched in content. Every other old page (about, poetry, photography, projects, speaking, cv, poem-films, the private event pages, `/poems/`, `/lately/`) stays at its original URL and is shared by both versions; their nav "kahran" link points at `/v1/`.
- "how they fit together" on the wall flies the same sixteen tiles into a data-flow layout
  (`/v2/flow.js`, styles at the end of `/v2/home.css`; `#flow` opens it directly). Where each
  tool lands and **what feeds what** live in `PLACE` and `EDGES` at the top of `flow.js` and
  nowhere else — they are read off day-flow's own docs and code, so check there before changing
  an arrow, and keep the edge list honest rather than tidy.
- A small fixed "v2 · v1" tab switches between them. Nothing gets migrated into v2 until Kahran decides where it goes; when a box on the wall gets a page, link it from `/v2/home.js`.
