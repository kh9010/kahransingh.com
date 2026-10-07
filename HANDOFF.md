# Handoff: kahransingh.com studies

Last updated: 7 October 2026. Study 01.

The repo adopts the house way from this session (`~/dev/house/HANDOFF.md`; point there, not here). Scope of this file: `studies/` only. The live site (v2 at `/`, v1 at `/v1/`) is described in `CLAUDE.md` and is untouched by studies.

## Current goal

Kahran picks his own website inspiration. Divya, 23 Sep (Granola, raw.db id 3622667): "Go look on Awwwards … 30-something websites … don't get Claude to do it … find mechanical influences and find linguistic influences … I have never seen these websites, so there is no preconceived notion of the brand." Kahran, 7 Oct: "I don't want you to find the inspiration for me. I want you to go find a bunch of things that I might find inspiring … so I can choose them … very fast and easy." Claude gathers; he chooses. Nothing in the study ranks, labels or recommends.

## Where things stand

- **Study 01, the inspiration pile:** 171 sites, blind, one at a time, keep or skip. Branch `kahran-oct07-study-01-inspiration`, PR open, not merged (guard.py: no unattended merges here).
- **The link he uses:** the artifact https://claude.ai/artifact/MGk5XPBUduxc8XtNZvjods (private to him) (phone and desktop). Picks live in its `db`.
- Local copy: `node studies/server.cjs`, then `http://127.0.0.1:8791/studies/`. Writes `studies/01/picks.json`. Used by `verify`; not a second place to pick.
- No picks yet.

## Open with Kahran right now

- The pass: open the artifact, go through the pile. Then the kept board (`kept` top right, or `b`), trim to about 30.
- After his pass: read the picks back (below) and write his selection into this file, with his tags and notes, as the input to the next home version.

## Rules that came out of this work

- **Blind until judged** (Divya, 23 Sep): no name, address, gallery or award on a card before the verdict; the reveal comes after, on the strip under the buttons. Media files are named by an opaque 8-hex id. `verify` pins it.
- **Claude finds, Kahran chooses** (Kahran, 7 Oct): no Claude descriptions, taste labels, ranking or pre-filtering for taste on cards. Quotas per gallery category are the only selection; breadth on purpose.
- **One order for everyone:** the shuffle is seeded (`pile.json` `seed`), so the order is the same on phone and desktop and resume is "first card without a verdict".
- **Picks live in the artifact's db, not in the browser** (this session's call, 7 Oct). Why: he picks on his phone as well as the desk; GitHub Pages cannot take writes; a local server is not reachable from his phone; the db is durable and Claude reads it with `ArtifactData`. The Rachna lesson ("the artifact breaks too much; the review link is the one to show") was about a 27-page site of 219 files rendered inside the artifact frame; this is one page whose only moving parts are a video, two images and a db write, so the risk that bit Rachna does not apply. If it does break, the local server is the fallback and writes the same shape.
- **Media out of git** (this session's call, 7 Oct): 62 MB of third-party screenshots and clips, over the ~50 MB line for a public repo, and permanent in history once committed. `studies/01/media/` is ignored; the files live on the MacBook and in the artifact. `pile.json` (names, urls, sources) is committed; the gather tools rebuild the media.

## Study 01 in detail

- **Card:** the desktop clip (about 7 s, muted, looping: a hold, three hovers, a scroll, two hovers) fills the stage; the phone still sits in the corner on desktop and under the clip on a phone. Verdict bar: skip, undo, keep. Below it, the last card revealed: verdict, name (links out), address, gallery, award; on a kept card the three tags (mechanical, linguistic, composition) and a one-line "this thing ↓" note, both optional.
- **Keys:** → or k keep; ← j or x skip; z, backspace or ↓ undo; 1 2 3 toggle the tags on the card just kept; n the note; b the kept board; esc back. **Phone:** swipe right keep, left skip, or the buttons.
- **Kept board** (`#kept`): kept cards grouped by tag (a card with two tags shows in both), untagged last, names shown, hover plays the clip. `trim` takes a card out of the final set without losing it (`back in` restores); skipped cards sit in a closed list at the foot with `keep` to rescue. Header: in · trimmed · skipped.
- **Pick record:** `picks/<id>` = `{v: keep|skip|trim, tags: [...], note, at}`. Final selection = `v == keep`.
- **The pile:** 181 gathered, 171 kept: Awwwards 68 (fixed quotas per list: personal 12, photography 9, SOTD 8, SOTM 6, typography 5, poetry 5, experimental 5, writer 4, storytelling 4, art-illustration 4, culture 4, blog 3, minimal 3, honorable 3, editorial 2), gathered by hand 62 (writers and poets, photographers and artists, living/daily/weather, editorial, desk and object sites, dense indexes; `tools/hand.txt`), One Page Love 16, Hoverstates 15, minimal.gallery 10. Every card has a phone still. Dropped 10: 4 cookie walls, 2 unresolvable domains, 2 HTTP errors (403, 404), 1 blank page, 1 stuck on its loader for the whole clip (failed to load, 4xx, blank, or a cookie wall over the page); the list with reasons is `pile.json` `dropped`.
- Cut: Claude-written descriptions, "why it might fit" lines, any score. A separate reveal screen (slower than the strip).

## Reading the picks back

- Artifact: `ArtifactData` `list`, collection `picks`, on the artifact url. Each doc id is a `pile.json` id.
- Local: `studies/01/picks.json`, same shape keyed by id.
- Join on `id` with `studies/01/pile.json` `items` for name and url.

## Wrong turns worth knowing

- **The first blind check passed with the name on the card.** It skipped names under five characters to avoid matching labels, and the first card was "twks". Now the card on screen is checked at any length.
- **516 media files against the artifact's 511-file cap.** Phone stills are now packed 20 to a sheet (`media/phones-NN.jpg`, a CSS sprite), 351 files.
- The first capture pass treated any full-screen fixed element mentioning cookies as a wall; it is a heuristic, so a site or two may have been dropped that a click would have opened (see `dropped`).

## Workspace state

```
studies/index.html          the rail (noindex); opens on the newest study
studies/server.cjs          node studies/server.cjs → :8791; PORT=0, PICKS=<file>
studies/01/index.html       the picker (also the artifact page, via tools/artifact_page.py)
studies/01/pile.json        cards, seed, dropped list (committed)
studies/01/picks.json       local picks (committed; {} until used locally)
studies/01/media/           <id>.jpg, <id>.mp4, <id>-m.jpg (ignored; MacBook + artifact)
studies/01/tools/           gather: parse_aww.py → build_cands.py (+ hand.txt) → capture.cjs → build_pile.py
verify.mjs                  node verify.mjs
```

Gather, from a scratch dir: curl the Awwwards and gallery listing pages into `dl/`, `python3 parse_aww.py`, `python3 build_cands.py`, `npm i playwright-core` then `node capture.cjs cands.json run`, then `python3 build_pile.py cands.json run`. Headless Chrome always launches with `--use-mock-keychain --password-store=basic`.

Publish: `python3 studies/01/tools/artifact_page.py > <scratch>/inspiration-pile.html`, copy `pile.json` and `media/` beside it, and publish to the artifact url with them as files (two publishes: 255 files and 64 MB each at most; 511 files per version), capabilities `{db: {}}`.

## Verification

`node verify.mjs` (starts its own server on a free port with a throwaway picks file; needs the media on disk). Expected:

```
PASS studies are noindexed: 2 pages carry noindex, nofollow; robots.txt leaves them crawlable so the tag is read
PASS the rail matches the studies: 1 study listed, opens on 01
PASS no instruction text: 0 <p>; 18 words of chrome, all labels
PASS the pile is whole: 171 cards from Awwwards 68, Hoverstates 15, minimal.gallery 10, One Page Love 16, Gathered 62; 171 with a phone still; media 351 files, 62.4 MB
PASS cards render blind: 171 names and addresses checked against the DOM, 0 present; the clip plays from media/<id>.mp4
PASS a pick round-trips to storage: keep + tag written, name revealed after, reload resumes at 1 / 171, undo deletes it
PASS the server keeps the picks file clean: 4 malformed writes 400, foreign origin 403, file untouched
```

Each browser check was seen red once: noindex removed (FAIL noindexed); the card name put in a `title` (FAIL blind); the save made a no-op (FAIL round-trip); undo not saved (FAIL round-trip); tag validation removed from the server (FAIL server); an unlisted `studies/02` (FAIL rail). Restored, green.

## Research already captured

- Divya's 23 Sep notes: raw.db id 3622667 (kMini). Her other points for the home, not acted on here: composition over "half and half"; "solve information and aesthetics together"; a time-of-day gradient, photos as Polaroids, poems as pinned scraps, a diegetic thermometer or clock.
- Rachna studies 01–31 (`~/dev/rachna-website/HANDOFF.md`): lessons used here are don't overbuild, one thing at a time, no instruction text, research goes broad and does not pre-decide.
- Awwwards listings read 7 Oct 2026 (SOTD pages 1–3, SOTM, honorable, nominees, and the personal, poetry, writer, editorial, photography, typography, storytelling, experimental, art-illustration, blog, culture, minimal categories); Hoverstates, minimal.gallery and One Page Love (personal, photography, experimental) home and genre pages the same day.

- Study 01 live (7 Oct): `studies/01/live.html` is the default at `/studies/01/` when served by `studies/server.cjs`; the clip picker stays at `01/index.html`. Real site in an iframe under a 48px bar; the note field has focus on load, Enter keeps, Esc leaves the field so keys work.
- 45 sites send frame-blocking headers (`frames: false` in pile.json, an upper bound): no iframe, the site opens in the named window `study01-site`. "pop out" is the fallback for a frame that loads blank.
- `studies/01/picks.json` is committed on purpose: his durable inspiration record (kept ones carry name and url). The first 7 picks were seeded from the artifact db.
- The artifact build has no live view (needs the server); the live page only works locally.

## Open questions

- Does the trimmed set of about 30 become study 02 (a board of his picks, side by side with Divya's direction), or go straight into a home version?
- Divya may want to see his picks; the artifact can be shared with her as a viewer (read only) or a contributor (she could pick too, into the same db; then picks need a `by`).

## Working preferences to preserve

In global `~/.claude/CLAUDE.md`, memory, and `~/dev/house`; read them there.

## What landed, first pass (7 Oct, 15 of 171 seen, his words in `studies/01/picks.json`)
Kept: Maggie Appleton (simplicity, clarity), windy.com (soft movement, a feeling), muda.co (the blue ball), tej.as/story (clarity, ease of the information), Union Boulangerie (a point of view, deliberately not over-polished).
Pushed away: slow loads, scroll-jacking ("don't make me scroll at your speed"), low information density, sites that make the brain work to learn what they are (Austensor), clean-but-nothing (Sinedogma).
Read: clarity and density first, with one soft, alive element and a point of view. That echoes Divya's 23 Sep note: solve information and aesthetics separately, then compose.
Friction: pop-out windows are easy to close by mistake and lose the place, so frame-only piles next time.

## Study 02, targeted pile (7 Oct)
`studies/02/live.html` at `/studies/02/`: 50 live sites, frame-only (no pop-out), blind; picks to `studies/02/picks.json`. Gathered for his pass-1 signal across five families (`why` in `pile.json`, not shown on the card); server now takes `/api/study-01|02/`.
Filters (curl, ~730 tried): frame-blocking, over ~1.5s first byte or 3s total or 1.5MB, lenis/locomotive/three/webgl markers all dropped. Thin spots: brands and photo+poem families (few unpolished small brands and photo+poem sites survived).

## What landed, second pass (7 Oct, Study 02, 16 of 50 seen)
Kept: MSCHF (breaks all the rules, applied mischief), Cat Bounce (dumb, cute, honours the physics), Mental Nodes (clear and easy, but shallow), teenage engineering (the turning band pulls you in; scrolls without being annoying), Pug in a Rug (useless corners of the internet), Zoomquilt (intrigue; seasons change as you zoom), Cheeseboard (a dog and a cow run across a pizza site). Idle Words and joanna latka kept without comment.
Pushed away: writing-only sites that give no reason to care (Julia Evans, Cassidy, danluu), atmosphere with no "why am I here" (lofi.cafe), poor density (Tracy Durnell), sites that make him work (bonkerfield). Wants depth and *connections between ideas*: "so much of my work is connecting ideas."
Read across both passes: clarity and density as the floor; delight, mischief and intrigue as the lift (a "what is happening here?" moment); motion that respects the reader; more than writing alone.
