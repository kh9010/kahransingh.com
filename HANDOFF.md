# Handoff: kahransingh.com
Last updated: 2026-10-26. Version 2 (the home at `/`; `/v1/` is the old one).

## Current goal
A grounded, dense personal site: one photograph and one poem a day on the home, and the wall of "tools to support myself" beside them. Kahran, 2026-10-15: "the photo should definitely stay put … I think the photo should not change."

## Where things stand
- Live on GitHub Pages from `main`; no build step.
- The repo map (v1/v2 split, pick formula, the five ideas, the flow diagram) is in `CLAUDE.md`; this file does not repeat it.
- This repo has no versions rail or `?tune` yet. Studies and tune arrive on the next change that is more than a tweak.
- Uncommitted: nothing after this session's PR lands.

## Open with Kahran right now
- Nothing blocking. The sticky photograph is live once the PR merges; look at it on a long poem day.

## Rules that came out of this work
- **The photograph never re-crops.** Kahran, 2026-10-15. The picture is exactly one screen, sticks to the top of the window, and a long poem scrolls over it. Pinned by `tools/test_photo_stays.mjs`.
- A long poem still lengthens the first block (Kahran's 2026-09-22 design, kept): the poem joins the flow the moment it starts travelling, so the page is one screen at rest whatever the poem's length.

## Version 2 in detail
- **2026-10-15, photo stays put.** `.stage-photo img` is `position: sticky; height: 100svh` inside the absolute wrapper that spans the block; the wrapper is what stops it at the block's end. Cut: a sticky *wrapper* with a negative bottom margin, which let the picture slide 100svh past the block and show unveiled under the fade to paper.
- **2026-10-04, infographic details (merged in from `kahran-oct04-infographic-details`).** Readable detail cards for the five ideas and sixteen tools. Tiles are now buttons that pin a panel; Context's page link lives inside its panel. Hover or focus previews, a tap opens a sheet on touch, Escape closes the detail before the diagram. The copy lives inside the `IDEAS` entries in `v2/home.js`; the `CHANNEL` table in `flow.js` was removed. Provenance: `docs/idea-details-coverage.json`; arrows stay as audited in `docs/2026-09-22-flow-edges.md`.
- Earlier: see `git log` and `CLAUDE.md`.

## Wrong turns worth knowing
- **The first fix (sticky wrapper + `margin-bottom: -100svh`) passed the checker and failed the eye.** Sticky constrains the margin box, not the border box, so a negative margin lets the element overrun its parent. Cost: one screenshot pass. Lesson: the checker measures the photograph's box, not where the page ends; look at the foot of the page too.
- The Claude-in-Chrome extension cannot open the local server (error page on both `127.0.0.1` and `localhost`); screenshots come from Chrome for Testing's headless shell via CDP instead.
- **Detail-panel interaction pitfalls.** One timeout for preview and dismissal failed real pointer traversal: a cursor crossing Context on its way to a later tile swapped the panel, so keep preview intent separate from dismissal and assert the exact panel heading. The diagram's Escape restored focus to its opener, which reopened it; suppress only the restoration-induced focus-open. Backward Tab lost a preview behind the pin guard. Browser tests must re-enter through the diagram opener rather than assume it stayed open.

## Workspace state
- Run locally: `python3 -m http.server 8123` at the root.
- Checks: `node verify.mjs` (python3 + Chrome for Testing's headless shell under `~/.cache/puppeteer`; launches must carry `--use-mock-keychain --password-store=basic` or macOS prompts for the keychain).
- Idea-detail checks: `node tools/test_idea_details.mjs` (wired into verify). `tools/check_idea_details.py` and `tools/check_idea_details_edges.py` are browser acceptance scripts that need Playwright, which is not installed; they are not wired into verify. Reports land in ignored `.review/idea-details/`.
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
PASS idea details: coverage, audited graph, public provenance: idea coverage: 5 ideas, 16 explained tools; audited graph: 4 data arrows, 12 surface feeds; public provenance: 16 tools with repository sources
```

## Research already captured
- `docs/2026-09-21-daily-pick-design.md`, `docs/2026-09-22-flow-edges.md`.

## Open questions
- None from this session.

## Working preferences to preserve
- Public repo: no third-party names in commit messages or history (`CLAUDE.md`).
- Same result with less change; one seam per fix.
