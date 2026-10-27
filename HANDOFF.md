# Handoff: kahransingh.com
Last updated: 2026-10-27. Version 2 (the home at `/`; `/v1/` is the old one).

## Current goal
A grounded, dense personal site: one photograph and one poem a day on the home, and the wall of "tools to support myself" beside them. Kahran, 2026-10-15: "the photo should definitely stay put … I think the photo should not change."
- **Studies** (`studies/`, branch `kahran-oct07-study-01-inspiration`): Kahran picks his own website inspiration. Divya, 23 Sep (Granola, raw.db id 3622667): "Go look on Awwwards … 30-something websites … don't get Claude to do it … find mechanical influences and find linguistic influences." Kahran, 7 Oct: "I don't want you to find the inspiration for me. I want you to go find a bunch of things that I might find inspiring … so I can choose them … very fast and easy." Claude gathers; he chooses. Nothing in the study ranks, labels or recommends. Scope of the studies bullets below: `studies/` only; the live site is untouched by them.

## Where things stand
- Live on GitHub Pages from `main`; no build step.
- The repo map (v1/v2 split, pick formula, the five ideas, the flow diagram) is in `CLAUDE.md`; this file does not repeat it.
- `?tune` arrived with the About studies (06–08, below). The live pages still have no dials. The versions rail is the studies rail below.
- Uncommitted: nothing after this session's PRs land.
- The studies rail at `/studies/` (noindex, opens on the newest study) holds Studies 01 to 08 and opens on 08; it came in with PR #136 (01–05) and PR #185 (06–08).
- **About studies 06, 07, 08:** three candidate About pages to pick from, each a real site page at `/studies/NN/`. `about.html` is untouched until he picks.
- **Study 01, the inspiration pile:** 171 sites, blind, one at a time, keep or skip. Artifact https://claude.ai/artifact/MGk5XPBUduxc8XtNZvjods (private to him; phone and desktop), picks live in its `db`.
- Local copy: `node studies/server.cjs`, then `http://127.0.0.1:8791/studies/`. Writes `studies/01/picks.json`. Used by verify; not a second place to pick.

## Open with Kahran right now
- **Pick an About study:** 06 life in facts / 07 the things I make / 08 a letter and the years, or a blend; `about.html` unchanged until then. `/studies/` opens on 08. The chosen one replaces `about.html` as the next version.
- The lenticular wedding photograph and the GSAP word pile from the current About are in none of the three. Kept out on purpose (two gimmicks, no story); say if one should come back.
- The sticky photograph is live; look at it on a long poem day.
- The studies pass: open the artifact, go through the pile, then the kept board (`kept` top right, or `b`), trim to about 30.
- After his pass: read the picks back (Workspace state) and write his selection into this file, with his tags and notes, as the input to the next home version.

## Rules that came out of this work
- **A resting pointer never stops the photography walk.** Kahran, 2026-10-26 ("the auto-scroll on the photos isn't working anymore"). The walk holds only while the pointer is moving over a picture, or a finger is on one, and lets go 1.5 s after the hand stops. Pinned by `tools/test_photo_autoscroll.mjs`.
- **The photograph never re-crops.** Kahran, 2026-10-15. The picture is exactly one screen, sticks to the top of the window, and a long poem scrolls over it. Pinned by `tools/test_photo_stays.mjs`.
- **A study may only say what the public pages already say.** Claude, 2026-10-26, from the privacy rules in `CLAUDE.md`. Every capitalised name and every year on an About study is checked against the public pages by `verify`; the sources were cv, projects, work with me, speaking, archive, the v1 home, the wedding and elopement pages, context and the home data. Nothing from the private context repo that is not already on the site.
- **A study of a page is the page.** Same stylesheet, same nav with `about` current, the same foot (Full CV, the three contacts), noindex. No captions, numbering or "proposed" inside it; the rail carries the number.
- **Dials, not sentences.** Each About study's numbers live in its `defaults.json`; the CSS fallbacks must equal them (`verify` pins the coupling), so the page reads the same with JS off.
- A long poem still lengthens the first block (Kahran's 2026-09-22 design, kept): the poem joins the flow the moment it starts travelling, so the page is one screen at rest whatever the poem's length.
- **Blind until judged** (Divya, 23 Sep): no name, address, gallery or award on a card before the verdict; the reveal comes after, on the strip under the buttons. Media files are named by an opaque 8-hex id. `verify` pins it.
- **Claude finds, Kahran chooses** (Kahran, 7 Oct): no Claude descriptions, taste labels, ranking or pre-filtering for taste on cards. Quotas per gallery category are the only selection; breadth on purpose.
- **One order for everyone:** the shuffle is seeded (`pile.json` `seed`), so the order is the same on phone and desktop and resume is "first card without a verdict".
- **Picks live in the artifact's db, not in the browser** (this session's call, 7 Oct). Why: he picks on his phone as well as the desk; GitHub Pages cannot take writes; a local server is not reachable from his phone; the db is durable and Claude reads it with `ArtifactData`. The Rachna lesson ("the artifact breaks too much; the review link is the one to show") was about a 27-page site of 219 files rendered inside the artifact frame; this is one page whose only moving parts are a video, two images and a db write, so the risk that bit Rachna does not apply. If it does break, the local server is the fallback and writes the same shape.
- **Media out of git** (this session's call, 7 Oct): 62 MB of third-party screenshots and clips, over the ~50 MB line for a public repo, and permanent in history once committed. `studies/01/media/` is ignored; the files live on the MacBook and in the artifact. `pile.json` (names, urls, sources) is committed; the gather tools rebuild the media.

## Version 2 in detail
- **2026-10-26, the photography walk unfrozen.** The pause listeners sat on the wraps, which are full-width blocks a screen tall, so a still pointer anywhere below the header was "inside" one, and the page scrolling under it counted as entering. They now sit on the pictures, fire on `mousemove` with non-zero movement (a scroll-induced hover update has none), and let go after 1.5 s of rest. Reproduced in headless Chrome: pointer parked at the window centre, scrollY stays 0 for 15 s; no pointer, it walks. The page code had not changed since March, so what changed is most likely when the browser updates hover state under a programmatic scroll.
- **2026-10-15, photo stays put.** `.stage-photo img` is `position: sticky; height: 100svh` inside the absolute wrapper that spans the block; the wrapper is what stops it at the block's end. Cut: a sticky *wrapper* with a negative bottom margin, which let the picture slide 100svh past the block and show unveiled under the fade to paper.
- **2026-10-04, infographic details (`kahran-oct04-infographic-details`, PR #128).** Readable detail cards for the five ideas and sixteen tools. Tiles are now buttons that pin a panel; Context's page link lives inside its panel. Hover or focus previews, a tap opens a sheet on touch, Escape closes the detail before the diagram. The copy lives inside the `IDEAS` entries in `v2/home.js`; the `CHANNEL` table in `flow.js` was removed. Provenance: `docs/idea-details-coverage.json`; arrows stay as audited in `docs/2026-09-22-flow-edges.md`.
- **2026-10-26, About studies 06, 07, 08 (`studies/06–08/`).**
  - **06 / A life in facts.** One Fraunces line ("Poet, investor, counsel to founders. Bangalore and New York.", from the v1 title), then a 21-line ledger, newest first, year in a narrow column. Every line is from the CV or the archive. Dials: measure, lede size and gap, line size and leading, year column, row gap, rule colour.
  - **07 / The things I make.** "I make poems, photographs, tools and companies, and I am learning Kathak. One of each." Six sections, artefact left and text right (820px measure; stacks under 700px): the poem *Oh that again* in full; the Mt Rainier photograph; the five ideas with the home page's own tile lines (`line` in `IDEAS`, `v2/home.js`; until 2026-10-27 these were the per-idea one-liners, which PR #128 removed from the home, so 07 now quotes the parts lines the wall shows); four companies with role and years; Poem Films and The Line Before; the Kathak Legacy Project. Dials: measure, artefact column, gaps, lede and body sizes, photo height, rule.
  - **08 / A letter and the years.** Five short first-person paragraphs, signed K, then ten years in a line. Voice: `~/dev/joyus/voice-spec/STYLE_SPEC.md` governed (claim first, connective tissue cut, one hard thing named plainly: Vidyanext). The message-shaped editor (`voice-gepa/candidates/36f5d5ddc1c6aadc.txt`) was run as a structural pass only: its moves that survive are the uneven sentence lengths and the one-line close; its spoken hedge and "like" budgets were not applied, because a page is written, not spoken (house-style routes an About to STYLE_SPEC). Dials: measure, letter size and leading, gap to the years, line size, year column, row gap, rule.
  - Cut from all three: the lenticular photograph, the word pile, GSAP, any JS the page needs to read.
  - Tune: `node studies/tune-server.cjs` → `http://127.0.0.1:8792/studies/08/?tune`; the panel writes `studies/NN/defaults.json` on every change. `tune.js` is copied into each study (versions share no files).
- Earlier: see `git log` and `CLAUDE.md`.
- **2026-10-27, Study 05 A paints its third photograph on every day.** `paint` took the third photo at `(h >> 8) % n`; the date hash is unsigned, so on any day it is over 2^31 (13 of the 60 days from 1 Oct, every day 20 to 29 Oct) the signed shift went negative, the index fell off the list and `p.src` threw. Now `>>>`; days under 2^31 pick exactly as before.
- **Study 01, the inspiration pile (7 Oct).** Card: the desktop clip (about 7 s, muted, looping) fills the stage; the phone still sits in the corner on desktop and under the clip on a phone. Verdict bar: skip, undo, keep. Below it the last card revealed: verdict, name (links out), address, gallery, award; on a kept card the three tags (mechanical, linguistic, composition) and a one-line "this thing ↓" note, both optional.
  - Keys: → or k keep; ← j or x skip; z, backspace or ↓ undo; 1 2 3 toggle tags on the card just kept; n the note; b the kept board; esc back. Phone: swipe right keep, left skip, or the buttons.
  - Kept board (`#kept`): kept cards grouped by tag, untagged last, names shown, hover plays the clip. `trim` takes a card out of the final set without losing it (`back in` restores); skipped cards sit in a closed list at the foot with `keep` to rescue.
  - Pick record: `picks/<id>` = `{v: keep|skip|trim, tags: [...], note, at}`. Final selection = `v == keep`.
  - The pile: 181 gathered, 171 kept: Awwwards 68 (fixed quotas per list), gathered by hand 62 (`tools/hand.txt`), One Page Love 16, Hoverstates 15, minimal.gallery 10. Every card has a phone still. Dropped 10 (cookie walls, dead domains, HTTP errors, blank or stuck pages); the list with reasons is `pile.json` `dropped`.
  - Live view: `studies/01/live.html` is the default at `/studies/01/` when served by `studies/server.cjs`; the clip picker stays at `01/index.html`. Real site in an iframe under a 48px bar; the note field has focus on load, Enter keeps, Esc leaves the field so keys work. 45 sites send frame-blocking headers (`frames: false` in pile.json, an upper bound): no iframe, the site opens in the named window `study01-site`; "pop out" is the fallback for a frame that loads blank. The artifact build has no live view.
  - `studies/01/picks.json` is committed on purpose: his durable inspiration record. The first 7 picks were seeded from the artifact db.
  - Cut: Claude-written descriptions, "why it might fit" lines, any score; a separate reveal screen (slower than the strip).
- **Study 02, targeted pile (7 Oct).** `studies/02/live.html` at `/studies/02/`: 50 live sites, frame-only (no pop-out), blind; picks to `studies/02/picks.json`. Gathered for his pass-1 signal across five families (`why` in `pile.json`, not shown on the card). Filters (curl, ~730 tried): frame-blocking, over ~1.5s first byte or 3s total or 1.5MB, lenis/locomotive/three/webgl markers all dropped. Thin spots: brands and photo+poem families.
- **Study 03, board + four directions (7 Oct).** `/studies/03/`: every keep from 01 and 02 with his note verbatim, the noted skips, the two read-across lines; built by `studies/03/board.mjs` from the picks files (rerun after a pass; verify goes red if a keep or its note is missing). `a.html` garden of connections · `b.html` desk (hour-following background, Polaroids, pinned scraps) · `c.html` mischief (today's weather walks across on legs) · `d.html` zoom (photo, poem, place, tools, next photo). All four read the live v2 parts through `studies/03/shared.js` (weather.js, pick.js, data/score files, IDEAS parsed out of home.js), so nothing is copied. Rough: tool-to-content wires in A are two hand-picked links.
- **Study 04, the gem (8 Oct).** `/studies/04/`: three takes on Divya's facets plus his childhood photo cube, on his live content via `03/shared.js` + `04/sky.js`. `a.html` cut stone (three.js r128) · `b.html` 80-face icosahedron on one canvas atlas · `c.html` CSS 3D cube with the poem film. Verdict (8 Oct): "Oh god, no, this is terrible… I want something beautiful." All three rejected, the childhood cube off the table; the gem idea (Divya: facets, multi-facetedness) stands. verify allows open-meteo network failures (the page falls back).
- **Study 05, four beauty-first takes (`studies/05/`).** Each built by its own agent from a shared brief (folded in here; the brief file is gone) and render-checked on the GPU. A prism, B mosaic stone, C jewel in the weather, D kaleidoscope. Known rough: the corner line on all four says "We're in New York" (should be Kahran's); C's sapphire runs electric; D shows a seam at ~85% open. Debug params (`?t=`, `?peek=`, `?sliver`, `?stone=`) are left in.

## Wrong turns worth knowing
- **Two headless runs with no pointer walked fine and nearly sent the search into the v2-launch diff** (which only touched the nav). The reproduction needed a parked pointer. A tab opened through the Chrome extension sits hidden, so `requestAnimationFrame` never runs there and it proves nothing either way.
- **The first public-safe check for the About studies was a privacy deny-list: it listed the excluded topics, so committing it would have published them.** Caught before commit and replaced with a provenance check (every name and year must already be on a public page), which says nothing about what is excluded. Lesson: a deny-list of secrets is itself a leak; check for provenance instead.
- The first draft of 07's tools list carried Claude's glosses of the five ideas; the home page has its own one-liners, and the rule is that a mock carries only what the site would. Swapped.
- **The first fix (sticky wrapper + `margin-bottom: -100svh`) passed the checker and failed the eye.** Sticky constrains the margin box, not the border box, so a negative margin lets the element overrun its parent. Cost: one screenshot pass. Lesson: the checker measures the photograph's box, not where the page ends; look at the foot of the page too.
- **Detail-panel interaction pitfalls.** One timeout for preview and dismissal failed real pointer traversal: a cursor crossing Context on its way to a later tile swapped the panel, so keep preview intent separate from dismissal and assert the exact panel heading. The diagram's Escape restored focus to its opener, which reopened it; suppress only the restoration-induced focus-open. Backward Tab lost a preview behind the pin guard. Browser tests must re-enter through the diagram opener rather than assume it stayed open.
- **Study 07 quoted the home page's idea one-liners, and PR #128 removed them.** The provenance check went red on merge (a sentence-initial word no public page carried any more). 07 now quotes the tile lines; the copy is still a copy (Open questions).
- The Claude-in-Chrome extension cannot open the local server (error page on both `127.0.0.1` and `localhost`); screenshots come from Chrome for Testing's headless shell via CDP instead.
- **The first blind check passed with the name on the card.** It skipped names under five characters to avoid matching labels, and the first card was "twks". Now the card on screen is checked at any length.
- **516 media files against the artifact's 511-file cap.** Phone stills are now packed 20 to a sheet (`media/phones-NN.jpg`, a CSS sprite), 351 files.
- **The Study 05 "flake" was a real bug hidden by timing.** The check waited 3 s; `S03.load` itself waits up to 3 s for the sky, so on a slow weather reply the page was closed before `paint` ran and the check passed. The wait is now 5 s, which turned it red every run until the fix above.
- The first capture pass treated any full-screen fixed element mentioning cookies as a wall; it is a heuristic, so a site or two may have been dropped that a click would have opened (see `dropped`).

## Workspace state
- Run locally: `python3 -m http.server 8123` at the root. For the About studies' dials: `node studies/tune-server.cjs` (:8792) and add `?tune`.
- Checks: `node verify.mjs` (python3 + Chrome for Testing's headless shell under `~/.cache/puppeteer`; launches must carry `--use-mock-keychain --password-store=basic` or macOS prompts for the keychain).
- Idea-detail checks: `node tools/test_idea_details.mjs` (wired into verify). `tools/check_idea_details.py` and `tools/check_idea_details_edges.py` are browser acceptance scripts that need Playwright, which is not installed; they are not wired into verify. Reports land in ignored `.review/idea-details/`.
- Unit tests live in `tools/`; the python ones import siblings, so run them from inside `tools/` (verify does).
- Branches `kahran-<mmmDD>-<task>`, merged on the remote by PR into `main`.
- Studies layout:
  - `studies/index.html` the rail (noindex); `studies/server.cjs` → :8791 (`PORT=0`, `PICKS=<file>`); `studies/01/index.html` the picker (also the artifact page, via `tools/artifact_page.py`); `pile.json` cards, seed, dropped list; `picks.json` local picks; `media/` gitignored (MacBook + artifact; without it on disk verify prints SKIP for the three checks that need the clips); `studies/01/tools/` gather: parse_aww.py → build_cands.py (+ hand.txt) → capture.cjs → build_pile.py.
  - Gather, from a scratch dir: curl the Awwwards and gallery listing pages into `dl/`, `python3 parse_aww.py`, `python3 build_cands.py`, `npm i playwright-core`, `node capture.cjs cands.json run`, `python3 build_pile.py cands.json run`.
  - Publish: `python3 studies/01/tools/artifact_page.py > <scratch>/inspiration-pile.html`, copy `pile.json` and `media/` beside it, publish to the artifact url with them as files (two publishes: 255 files and 64 MB each at most; 511 files per version), capabilities `{db: {}}`.
  - Reading picks back: artifact `ArtifactData` `list`, collection `picks`; local `studies/01/picks.json`; join on `id` with `pile.json` `items`.
- The studies checks start their own server on a free port with a throwaway picks file and drive Chrome (playwright's headless shell under `~/Library/Caches/ms-playwright`, else Chrome for Testing's under `~/.cache/puppeteer`, or `CHROME=`).

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
PASS studies are noindexed: 5 pages carry noindex, nofollow; robots.txt leaves them crawlable so the tag is read
PASS the rail matches the studies: 8 study listed, opens on 08
PASS study 03: the board holds every keep in his words, four directions, all noindexed and on the rail: 13 keeps on the board with their notes verbatim; 4 directions linked; 5 pages noindexed
PASS no instruction text: 0 <p>; 18 words of chrome, all labels
SKIP the pile is whole: studies/01/media is not on this machine (it lives in the MacBook worktree)
SKIP cards render blind: studies/01/media is not on this machine (it lives in the MacBook worktree)
SKIP a pick round-trips to storage: studies/01/media is not on this machine (it lives in the MacBook worktree)
PASS the server keeps the picks file clean: 4 malformed writes 400, foreign origin 403, file untouched
PASS live: notes do not fire shortcuts, a keep with a note round-trips, blocked sites get no iframe: note typing inert, Enter keeps with its note, resume works, blocked cards get no iframe
PASS study 04: three gems, noindexed, on the rail, each loads clean with his content on its faces: 4 pages noindexed; on the rail; a, b, c load with 0 console errors, faces filled, floor and caption present
PASS study 05: four beautiful gems, noindexed, on the rail, each loads clean: 5 pages noindexed; on the rail; a–d load with 0 console errors
PASS the rail matches the studies and opens on the newest: 8 studies (01, 02, 03, 04, 05, 06, 07, 08), opens on 08
PASS a study is a site page: noindex, title, description, the site nav with about current, and it reads without JS: 3 pages, 1042 words of static copy
PASS no instruction text and nothing a mock would not carry: 3 pages, 0 hits
PASS every name and year on a study is already on the site: 137 names and 34 years checked against 14 public pages
PASS tune: every dial lives in defaults.json and the CSS fallback equals it: 24 dials across 3 studies, fallbacks match
PASS every link out of a study resolves: 69 internal targets exist on disk, 26 external left to the link audit
PASS idea details: coverage, audited graph, public provenance: idea coverage: 5 ideas, 16 explained tools; audited graph: 4 data arrows, 12 surface feeds; public provenance: 16 tools with repository sources
```

Each studies browser check was seen red once when it was written (noindex removed, card name put in a `title`, save made a no-op, undo not saved, tag validation removed, an unlisted study); restored, green. Each About study check was seen red once on 2026-10-26: a name no public page carries; "click" in the copy; a CSS fallback drifted from `defaults.json`; a rail entry renumbered; the nav without `about` current; a dead poem link. Restored, green. The About page-shape checks run over 06 onwards; the rail check covers all eight. Study 05's page-load check went red with the signed-shift bug in `05/a.html` `paint` (Wrong turns) and green with the fix. This run is on kMini, where `studies/01/media` is absent, so three checks print SKIP; with an empty `media/` folder present the pile check goes red ("media for <id>.jpg"), so the skip only fires when the folder is missing. Where the media is present all 19 lines are expected PASS (not run tonight; the media was out of reach).

## Research already captured
- `docs/2026-09-21-daily-pick-design.md`, `docs/2026-09-22-flow-edges.md`.
- Divya's 23 Sep notes: raw.db id 3622667 (kMini). Her other points for the home, not acted on here: composition over "half and half"; "solve information and aesthetics together"; a time-of-day gradient, photos as Polaroids, poems as pinned scraps, a diegetic thermometer or clock.
- Rachna studies 01–31 (`~/dev/rachna-website/HANDOFF.md`): don't overbuild, one thing at a time, no instruction text, research goes broad and does not pre-decide.
- Awwwards listings read 7 Oct 2026 (SOTD pages 1–3, SOTM, honorable, nominees, and sixteen categories); Hoverstates, minimal.gallery and One Page Love home and genre pages the same day.
- **What landed, first pass (7 Oct, 15 of 171 seen, his words in `studies/01/picks.json`).** Kept: Maggie Appleton (simplicity, clarity), windy.com (soft movement, a feeling), muda.co (the blue ball), tej.as/story (clarity, ease of the information), Union Boulangerie (a point of view, deliberately not over-polished). Pushed away: slow loads, scroll-jacking, low information density, sites that make the brain work to learn what they are, clean-but-nothing. Read: clarity and density first, with one soft, alive element and a point of view. Friction: pop-out windows are easy to close by mistake, so frame-only piles next time.
- **What landed, second pass (7 Oct, Study 02, 16 of 50 seen).** Kept: MSCHF, Cat Bounce, Mental Nodes, teenage engineering, Pug in a Rug, Zoomquilt, Cheeseboard. Pushed away: sites with no reason to care, atmosphere with no "why am I here", poor density, sites that make him work. Wants depth and connections between ideas: "so much of my work is connecting ideas." Across both passes: clarity and density as the floor; delight, mischief and intrigue as the lift; motion that respects the reader; more than writing alone.

## Open questions
- Does the trimmed set of about 30 become a board of his picks next to Divya's direction (Study 03 does this for the first two passes), or go straight into a home version?
- Which About, or which blend. Then: does the chosen one keep the "Full CV" foot, or fold the CV in (06 nearly is the CV)?
- Whether 07's five lines should be read from `v2/home.js` rather than copied; today 07 copies the tile lines, and `verify` pins only that every name in them is public, not that they match the home. Kahran may also prefer the detail intros to the tile lines there.
- Divya may want to see his picks; the artifact can be shared with her as a viewer or a contributor (then picks need a `by`).

## Working preferences to preserve
- Public repo: no third-party names in commit messages or history (`CLAUDE.md`).
- Same result with less change; one seam per fix.
