# Handoff: kahransingh.com
Last updated: 2026-10-04. Version v2; scoped infographic-detail iteration.

## Current goal
Give each of the five infographic ideas useful tap/hover depth without expanding the overview into sixteen boxes. Explain the constituent tools and distinctions that the short labels cannot carry.

## Where things stand
Candidate on `kahran-oct04-infographic-details`, based on `origin/main`. Not merged or deployed. Existing v1/v2 entry points remain; this single-page interaction change does not replace the homepage with a version rail.

## Open with the owner right now
- The reading panels: density, descriptions and desktop/phone reading comfort.

## Rules that came out of this work
- 2026-10-04 user request: deeper tap/hover details; retain the five-idea overview.
- The canonical idea/tool map remains `IDEAS` in `v2/home.js`; the provenance artifact and tests verify it, not supply a second runtime map.
- Preserve audited graph relationships. See `docs/2026-09-22-flow-edges.md`.
- Treat descriptions as explanations of source-backed responsibilities, not assertions that every service is healthy today.

## Version v2 detail iteration
- Five portalled reading panels. Each has an introduction, a description of every constituent tool, and a useful distinction. Context retains its deeper page link.
- Hover or keyboard focus previews; click/tap pins. Close restores focus. Escape closes the detail before closing the diagram.
- The pointer can cross the space between a tile and its panel, including other tiles, without losing or silently replacing the intended text. Switching previews requires settled hover.
- Desktop uses adjacent reading space; compact viewports use a bounded, scrollable sheet. Touch scrolling does not toggle the panel.
- No new runtime dependency, outbound endpoint, stored user data or automatic publication.

## Wrong turns worth knowing
- Treating the panel like a tooltip with one timeout failed real pointer traversal. A cursor crossing Context on its way from a later tile replaced the intended panel. Separate preview intent from dismissal, preserve the passage, and assert the panel heading after traversal.
- The diagram's Escape handler restored focus to its opener, which immediately reopened it. Suppress only the restoration-induced focus-open event.
- An early test checked that *a* panel stayed visible; it missed the wrong-panel swap. Keep the exact-heading assertion.
- Review caught backward Tab losing a preview behind the pin guard, and mouse-restored focus keeping the hover diagram open. Keyboard focus now changes previews explicitly; hover dismissal distinguishes focus-visible intent and does not collapse the touch diagram after Close.
- Once mouse dismissal worked, sequential browser tests had to re-enter through the diagram opener instead of assuming it stayed open between cases. Keep that setup and the separate dismissal regression.

## Workspace state
- Runtime: `v2/home.js`, `v2/home.css`, `v2/flow.js`.
- Coverage: `docs/idea-details-coverage.json`.
- Static/HTTP checker: `node verify.mjs` (server required, `BASE_URL` optional).
- Browser checks: `tools/check_idea_details.py`, `tools/check_idea_details_edges.py`; Playwright plus Chrome required. Reports/screenshots live in ignored `.review/idea-details/`.
- Local server: `python3 -m http.server 8798 --bind 127.0.0.1` from the worktree. Checker default: `http://127.0.0.1:8798`.

## Verification
Expected and observed `node verify.mjs` output:

```text
PASS idea coverage: 5 ideas, 16 explained tools
PASS audited graph: 4 data arrows, 12 surface feeds
PASS public provenance: 16 tools with repository sources
PASS HTTP: home, v1, Context and 3 exact-source assets
```

Also run:
- `python3 -m unittest discover -s tools -p 'test_*.py'`: 53 tests, OK; same clean baseline.
- `node tools/test_pick_js.mjs`: four checks, all passed.
- `node --check v2/home.js` and `node --check v2/flow.js`: passed.
- Main Chrome acceptance script: desktop, reduced-motion, 390×844 touch, 320×568 touch; all five panels and sixteen tools, exact hover target, pin/close, keyboard, scrolling, no-JS fallback, preserved arrows. No page errors or broken local requests.
- Edge script: 1280×720, 901×600, 768×1024 touch and 844×390 touch; real wheel/touch gestures, Close accessibility, Context navigation, two-level Escape, backward Tab, mouse dismissal and keyboard retention. Overflowing cards showed actual touch scrollTop changes; touch Close preserved the diagram. All passed.
- Desktop and phone renders inspected. Third-party analytics requests may abort during headless tests; recorded separately, not counted as local asset failures.

## Research already captured
- `context/index.html`: public Context/tool explanations.
- `docs/2026-09-22-flow-edges.md`: dated wiring and delivery audit.
- `docs/idea-details-coverage.json`: repository sources for every constituent tool.

## Working preferences to preserve
Preserve the existing design. Build in an isolated worktree; exact-index review and an open PR before the merge boundary. The public site changes only after separately authorized publication.
