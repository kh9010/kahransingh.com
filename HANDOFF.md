# Handoff: kahransingh.com
Last updated: 2026-10-26. Version 2 (the home at `/`; `/v1/` is the old one).

## Current goal
A grounded, dense personal site: one photograph and one poem a day on the home, and the wall of "tools to support myself" beside them. Kahran, 2026-10-15: "the photo should definitely stay put … I think the photo should not change."

## Where things stand
- Live on GitHub Pages from `main`; no build step.
- The repo map (v1/v2 split, pick formula, the five ideas, the flow diagram) is in `CLAUDE.md`; this file does not repeat it.
- This repo has no versions rail or `?tune` yet. Studies and tune arrive on the next change that is more than a tweak.
- Uncommitted: nothing after this session's PRs land.

## Open with Kahran right now
- Nothing blocking. The sticky photograph is live once the PR merges; look at it on a long poem day.

## Rules that came out of this work
- **A resting pointer never stops the photography walk.** Kahran, 2026-10-26 ("the auto-scroll on the photos isn't working anymore"). The walk holds only while the pointer is moving over a picture, or a finger is on one, and lets go 1.5 s after the hand stops. Pinned by `tools/test_photo_autoscroll.mjs`.
- **The photograph never re-crops.** Kahran, 2026-10-15. The picture is exactly one screen, sticks to the top of the window, and a long poem scrolls over it. Pinned by `tools/test_photo_stays.mjs`.
- A long poem still lengthens the first block (Kahran's 2026-09-22 design, kept): the poem joins the flow the moment it starts travelling, so the page is one screen at rest whatever the poem's length.

## Version 2 in detail
- **2026-10-26, the photography walk unfrozen.** The pause listeners sat on the wraps, which are full-width blocks a screen tall, so a still pointer anywhere below the header was "inside" one, and the page scrolling under it counted as entering. They now sit on the pictures, fire on `mousemove` with non-zero movement (a scroll-induced hover update has none), and let go after 1.5 s of rest. Reproduced in headless Chrome: pointer parked at the window centre, scrollY stays 0 for 15 s; no pointer, it walks. The page code had not changed since March, so what changed is most likely when the browser updates hover state under a programmatic scroll.
- **2026-10-15, photo stays put.** `.stage-photo img` is `position: sticky; height: 100svh` inside the absolute wrapper that spans the block; the wrapper is what stops it at the block's end. Cut: a sticky *wrapper* with a negative bottom margin, which let the picture slide 100svh past the block and show unveiled under the fade to paper.
- Earlier: see `git log` and `CLAUDE.md`.

## Wrong turns worth knowing
- **Two headless runs with no pointer walked fine and nearly sent the search into the v2-launch diff** (which only touched the nav). The reproduction needed a parked pointer. A tab opened through the Chrome extension sits hidden, so `requestAnimationFrame` never runs there and it proves nothing either way.
- **The first fix (sticky wrapper + `margin-bottom: -100svh`) passed the checker and failed the eye.** Sticky constrains the margin box, not the border box, so a negative margin lets the element overrun its parent. Cost: one screenshot pass. Lesson: the checker measures the photograph's box, not where the page ends; look at the foot of the page too.
- The Claude-in-Chrome extension cannot open the local server (error page on both `127.0.0.1` and `localhost`); screenshots come from Chrome for Testing's headless shell via CDP instead.

## Workspace state
- Run locally: `python3 -m http.server 8123` at the root.
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
PASS the photography walk goes on under a resting pointer and holds under a moving one: 4 checks at 1200x800
PASS the photograph never re-crops when the poem comes forward: 5 checks at 1200x800
```

## Research already captured
- `docs/2026-09-21-daily-pick-design.md`, `docs/2026-09-22-flow-edges.md`.

## Open questions
- None from this session.

## Working preferences to preserve
- Public repo: no third-party names in commit messages or history (`CLAUDE.md`).
- Same result with less change; one seam per fix.
