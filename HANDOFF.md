# Handoff: kahransingh.com
Last updated: 2026-10-26. Version 2 (the home at `/`; `/v1/` is the old one). Studies 06–08 (About) on the rail at `/studies/`.

## Current goal
A grounded, dense personal site: one photograph and one poem a day on the home, and the wall of "tools to support myself" beside them. Kahran, 2026-10-15: "the photo should definitely stay put … I think the photo should not change."

## Where things stand
- Live on GitHub Pages from `main`; no build step.
- The repo map (v1/v2 split, pick formula, the five ideas, the flow diagram) is in `CLAUDE.md`; this file does not repeat it.
- **About studies 06, 07, 08** on branch `kahran-oct26-about-studies` (PR open, not merged): three candidate About pages to pick from, each a real site page at `/studies/NN/`, the rail at `/studies/`. `about.html` is untouched until he picks.
- The rail and numbering continue PR #136's studies 01–05 (branch `kahran-oct07-study-01-inspiration`, worktree `~/dev/_wt/ks-study-01`). This branch's `studies/index.html` lists 06–08 only; when #136 lands, union the two `<aside>` lists (three lines) and the `verify.mjs` tails. #136 also rewrote this file as a studies-only handoff: whoever merges second reconciles, keeping both the live-site sections here and its studies sections.
- `?tune` arrived with the studies (below). The live pages still have no dials.
- Uncommitted: nothing after this session's PR lands.

## Open with Kahran right now
- **Pick an About**: `/studies/` opens on 08. 06 is a ledger of facts, 07 is the things he makes with one real piece each, 08 is a short letter and ten years in a line. Pick one, or name the cut between them; then it replaces `about.html` as the next version.
- The lenticular wedding photograph and the GSAP word pile from the current About are in none of the three. Kept out on purpose (two gimmicks, no story); say if one should come back.
- The sticky photograph is live; look at it on a long poem day.

## Rules that came out of this work
- **A study may only say what the public pages already say.** Claude, 2026-10-26, from the privacy rules in `CLAUDE.md`. Every capitalised name and every year on a study is checked against the public pages by `verify`; the sources were cv, projects, work with me, speaking, archive, the v1 home, the wedding and elopement pages, context and the home data. Nothing from the private context repo that is not already on the site.
- **A study of a page is the page.** Same stylesheet, same nav with `about` current, the same foot (Full CV, the three contacts), noindex. No captions, numbering or "proposed" inside it; the rail carries the number.
- **Dials, not sentences.** Each study's numbers live in its `defaults.json`; the CSS fallbacks must equal them (`verify` pins the coupling), so the page reads the same with JS off.
- **The photograph never re-crops.** Kahran, 2026-10-15. The picture is exactly one screen, sticks to the top of the window, and a long poem scrolls over it. Pinned by `tools/test_photo_stays.mjs`.
- A long poem still lengthens the first block (Kahran's 2026-09-22 design, kept): the poem joins the flow the moment it starts travelling, so the page is one screen at rest whatever the poem's length.

## Studies 06–08 in detail (2026-10-26)
- **06 / A life in facts.** One Fraunces line ("Poet, investor, counsel to founders. Bangalore and New York.", from the v1 title), then a 21-line ledger, newest first, year in a narrow column. Every line is from the CV or the archive. Dials: measure, lede size and gap, line size and leading, year column, row gap, rule colour.
- **07 / The things I make.** "I make poems, photographs, tools and companies, and I am learning Kathak. One of each." Six sections, artefact left and text right (820px measure; stacks under 700px): the poem *Oh that again* in full; the Mt Rainier photograph; the five ideas with the home page's own one-liners (from `IDEAS` in `v2/home.js`); four companies with role and years; Poem Films and The Line Before; the Kathak Legacy Project. Dials: measure, artefact column, gaps, lede and body sizes, photo height, rule.
- **08 / A letter and the years.** Five short first-person paragraphs, signed K, then ten years in a line. Voice: `~/dev/joyus/voice-spec/STYLE_SPEC.md` governed (claim first, connective tissue cut, one hard thing named plainly: Vidyanext). The message-shaped editor (`voice-gepa/candidates/36f5d5ddc1c6aadc.txt`) was run as a structural pass only: its moves that survive are the uneven sentence lengths and the one-line close; its spoken hedge and "like" budgets were not applied, because a page is written, not spoken (house-style routes an About to STYLE_SPEC). Dials: measure, letter size and leading, gap to the years, line size, year column, row gap, rule.
- Cut from all three: the lenticular photograph, the word pile, GSAP, any JS the page needs to read.
- Tune: `node studies/tune-server.cjs` → `http://127.0.0.1:8792/studies/08/?tune`; the panel writes `studies/NN/defaults.json` on every change. `tune.js` is copied into each study (versions share no files).

## Version 2 in detail
- **2026-10-15, photo stays put.** `.stage-photo img` is `position: sticky; height: 100svh` inside the absolute wrapper that spans the block; the wrapper is what stops it at the block's end. Cut: a sticky *wrapper* with a negative bottom margin, which let the picture slide 100svh past the block and show unveiled under the fade to paper.
- Earlier: see `git log` and `CLAUDE.md`.

## Wrong turns worth knowing
- **The first public-safe check listed the private topics it was guarding against, in a public repo.** Caught before commit. Replaced by the sourced-names check, which says nothing about what is excluded. Lesson: a deny-list of secrets is itself a leak; check for provenance instead.
- The first draft of 07's tools list carried Claude's glosses of the five ideas; the home page has its own one-liners, and the rule is that a mock carries only what the site would. Swapped.
- **The first fix (sticky wrapper + `margin-bottom: -100svh`) passed the checker and failed the eye.** Sticky constrains the margin box, not the border box, so a negative margin lets the element overrun its parent. Cost: one screenshot pass. Lesson: the checker measures the photograph's box, not where the page ends; look at the foot of the page too.
- The Claude-in-Chrome extension cannot open the local server (error page on both `127.0.0.1` and `localhost`); screenshots come from Chrome for Testing's headless shell via CDP instead.

## Workspace state
- Run locally: `python3 -m http.server 8123` at the root. For the dials: `node studies/tune-server.cjs` (:8792) and add `?tune`.
- Checks: `node verify.mjs` (python3 + Chrome for Testing's headless shell under `~/.cache/puppeteer`; launches must carry `--use-mock-keychain --password-store=basic` or macOS prompts for the keychain).
- Unit tests live in `tools/`; the python ones import siblings, so run them from inside `tools/` (verify does).
- Branches `kahran-<mmmDD>-<task>`, merged on the remote by PR into `main`.

## Verification
```
PASS daily pick follows the weather, then the archive, then the date hash: 26 tests
PASS place feed: 13 tests
PASS adding photographs: 8 tests
PASS About and Photos entry points: 6 tests
PASS Lately feed layer: 14 tests
PASS pick.js agrees with daily_pick.py: all checks passed
PASS the photograph never re-crops when the poem comes forward: 5 checks at 1200x800
PASS the rail matches the studies and opens on the newest: 3 studies (06, 07, 08), opens on 08
PASS a study is a site page: noindex, title, description, the site nav with about current, and it reads without JS: 3 pages, 1070 words of static copy
PASS no instruction text and nothing a mock would not carry: 3 pages, 0 hits
PASS every name and year on a study is already on the site: 140 names and 34 years checked against 14 public pages
PASS tune: every dial lives in defaults.json and the CSS fallback equals it: 24 dials across 3 studies, fallbacks match
PASS every link out of a study resolves: 69 internal targets exist on disk, 26 external left to the link audit
```
Each study check was seen red once on 2026-10-26: a name no public page carries; "click" in the copy; a CSS fallback drifted from `defaults.json`; a rail entry renumbered; the nav without `about` current; a dead poem link. Restored, green.

## Research already captured
- `docs/2026-09-21-daily-pick-design.md`, `docs/2026-09-22-flow-edges.md`.

## Open questions
- Which About, or which cut between them. Then: does the chosen one keep the "Full CV" foot, or fold the CV in (06 nearly is the CV)?
- Whether the five ideas' one-liners should be read from `v2/home.js` at build time rather than copied; today 07 copies them, and `verify` does not pin the copy.

## Working preferences to preserve
- Public repo: no third-party names in commit messages or history (`CLAUDE.md`).
- Same result with less change; one seam per fix.
