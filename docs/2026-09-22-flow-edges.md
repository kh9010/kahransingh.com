# The flow view's arrows, and the code that justifies each one

The "how they fit together" view on the home page draws the sixteen tiles as a
data flow. An arrow **A → B** claims that data moves from A to B. This file is
the evidence for every arrow, so the next person can check the picture without
re-deriving it — and so a wrong arrow gets caught rather than inherited.

The list the page actually draws lives in `EDGES` at the top of `/v2/flow.js`.
**This file and that list have to agree.** If you change one, change the other.

Audited 2026-09-22 against `~/dev/day-flow`, `~/dev/raw-store`,
`~/dev/hermes-kmini` and this repo's own `tools/`. Line numbers are as of that
date; treat them as a starting point, not gospel.

## The test an arrow has to pass

An arrow is only as good as **the read call on the target's side** — the line
where B opens, queries or imports what A produced. A docstring saying "reads the
raw store" proves nothing; the `sqlite3.connect`, the `open()`, the HTTP call or
the import-and-call does.

- **VERIFIED** — B's own code reads the exact artifact A's code writes, with no
  third module transforming it on the way.
- **INDIRECT** — the data really does get from A to B, but a third module reads
  A's output and writes something else, which is what B reads. The intermediate
  is named. These are still true arrows; they are just not one hop.

Nothing goes on the page that can't be put in one of those two rows.

## The sixteen edges

| # | edge | status | the target's read | intermediate |
|---|---|---|---|---|
| 1 | Voice & WhatsApp capture → Raw store | VERIFIED | `raw-store/raw_store/store.py:248` `write_records` — `executemany("INSERT OR IGNORE INTO records …")`, reached from `pullers/whatsapp.py:322` and `pullers/voice_transcripts.py:450` | — |
| 2 | Raw store → Mail triage | VERIFIED | `mail-triage/correspondents.py:113` `refresh_cache` — `sqlite3.connect("file:%s?mode=ro" % RAW_DB, uri=True)`; also `search.py:132`, `mine_backfill.py:147` | — |
| 3 | Raw store → The miners | VERIFIED | `transforms/voice_note_miner.py:616` `run_mine` · `store_lib/assistant.py:126` `his_turns` (for `conversation_miner.py:390`) · `store_lib/granola.py:300` `_rows` — all via `store_lib/rawdb.py:88` `connect` | — |
| 4 | The miners → The judge | VERIFIED | `transforms/judge_proposals.py:402` `_read_proposals_jsonl` — `open(_proposals_jsonl_path())` | `~/Tome/proposals/proposals.jsonl` |
| 5 | The judge → The Curator | INDIRECT | `curator/seam.py:126` `Seam.open_rows` → `notion_backlog.query_open()` → `notion_backlog.py:465` `_request` | the Notion "Pending" database |
| 6 | The judge → The sparks garden | INDIRECT | `sparks-canvas/core.py:315` `route` — `open(ctx["sparks_md"])` | `sparks-inbox/` → folded by `mini/process-sparks.sh:18` → `sparks.md` |
| 7 | Raw store → Noticings | INDIRECT | the grower's own Read of the pack, per `grower/PROMPT.md:35`; it has Bash denied and cannot reach raw.db | `noticings/.depth-pack-<date>.md`, built by `grower/depth.py:551` |
| 8 | Voice & WhatsApp capture → Movement | VERIFIED | `store_lib/presence.py:629` `read_explicit` — `open(explicit_path(path))`; written by `hermes-kmini/bin/presence_set.py:88` | `presence-explicit.json` |
| 9 | Raw store → The now brain | INDIRECT | `planner/now_core.py:1259` `gather` → `store_lib/tome_views.py:103` `_read_json` | `~/Tome/views/open.json` + `calendar-days.json`, built by `transforms/context_open.py:188` and `view_calendar_days.py:161` |
| 10 | The Curator → The now brain | INDIRECT | `planner/now_core.py:989` `pending_now_items` → `store_lib/backlog_read.py:95` `load` | Notion → `backlog.json`, via `transforms/pull_backlog.py:341` |
| 11 | Movement → The now brain | VERIFIED | `planner/now_core.py:1287` `gather` — `away_plan.verdict(day)` → `presence.py:598` `read` | — |
| 12 | Movement → The workout planner | VERIFIED | `planner/plan_week.py:468` `generate_week` — `away_plan.week_away_line(away_plan.verdict(), …)`; also `plan_agent.py:378`, `run_planner.py:199` | — |
| 13 | The workout planner → Travel days | INDIRECT | `planner/flight_routine.py:203` `read_today_flight` — `json.load(f)` on the rhythm file | `day-rhythm.json`, written by `planner/rhythm.py:649` as a stage of `run-daily.sh:148` |
| 14 | Raw store → The weekly record | INDIRECT | this repo's `tools/weekly_record.py:991` `main` — `json.loads(data_path.read_text())` | `coding-record/coding-days.json`, built by `day-flow/sparks-canvas/record/extract.py:568` reading raw.db over ssh |
| 15 | Samwise → The repairer | VERIFIED (poll) | `samwise/fixer/fix.py:49` `_health` — `json.load(open(p))`; on its own 30-minute schedule, `scheduler/jobs.toml:671` | `~/Tome/health/lanes.json` |
| 16 | Samwise → The health page | VERIFIED | `now-web/server.py:560` `_health_payload` → `server.py:215` `_load_json` | `~/Tome/health/lanes.json` |

**9 VERIFIED, 7 INDIRECT.**

## The watcher's threads

Samwise derives every lane's health from envelopes on disk and nothing else:
`samwise/samwise.py:131` `load_registry` reads `samwise/lanes.toml`, and
`samwise.py:261` `check_lane` reads `<tome>/envelopes/<lane>.latest.json`
(`store_lib/envelope.py:148`).

A registered lane exists for **twelve** of the thirteen non-watcher tiles — the
raw store alone has 21, one per source. **The weekly record has none**: the
Monday publish behind `/lately/` writes no envelope, so nothing watches it. The
page draws no thread to it, rather than claim a watch that isn't kept. That is
the `UNWATCHED` map in `flow.js`. If a lane is ever added for the publish, take
the weekly record out of that map.

## Three arrows that were wrong, and are now gone

Worth keeping, because each was plausible and each was false.

**Mail triage → Raw store.** Backwards. mail-triage keeps its own `state.db` and
opens raw.db strictly read-only, to ask who a correspondent is. Every
`connect` on `RAW_DB` in `mail-triage/*.py` carries `mode=ro`, and there is no
INSERT/UPDATE/DELETE anywhere in it. raw-store is single-writer on purpose
(`store_lib/rawdb.py:19`). The arrow now points out of the store.

**Raw store → Movement.** There is no such path, and the absence is deliberate.
Movement is `store_lib/presence.py`, and its five sources are: what Kahran told
the assistant (`presence-explicit.json`), all-day calendar events and lodging
bookings (**three ICS feeds fetched live over the network**,
`planner/calendar_read.py:77`), the timezone his ring reports (`facts.json`) and
a persona note. `rawdb`, `raw.db` and `sqlite3` appear **nowhere** in
`presence.py`, `transforms/presence_refresh.py`, `store_lib/places.py` or
`store_lib/local_clock.py` — and `presence_refresh.py:14-19` is a comment headed
"WHY THE ICS FEEDS AND NOT raw-store". The one raw.db touch nearby
(`owner_verdicts` deciding whose calendar event it is) can only *drop* a foreign
event; it can never establish or name a place.

So the arrow was replaced by the source presence ranks first and which does come
from a tile: **capture → Movement**. Note the honest gap — Movement's dominant
input is a live network fetch, and the calendar feeds behind it are **not** on
the wall at all.

**Movement → Travel days.** Travel days is `planner/flight_routine.py`, which
imports neither `presence` nor `away_plan`. The rhythm file it reads *does*
carry an `away` field (`rhythm.py:603`), but `read_today_flight` takes only
`r["flight"]` and `slots.bedtime` (`flight_routine.py:207-210`), and the flight
slot is built by `detect_flights` off live calendar events with no presence
input at all.

## The one arrow to argue about

**#13, The workout planner → Travel days**, rests on reading that tile as the
whole daily planning chain — `run-daily.sh`, the `[planner-daily]` lane
(`lanes.toml:223`) — rather than `plan_week.py` alone. `rhythm.py`, which writes
the file the flight routine reads, is a sibling stage of that chain, not part of
`plan_week.py`. Read the tile narrowly and this arrow goes too, and Travel days
has no incoming edge from any of the sixteen: its remaining inputs are live ICS
feeds and a hand-kept `tomorrow.md`, neither of which is a tile. It is drawn
light, which is what a real but secondary lane should look like.

## What the wall has no tile for

The picture is honest about its arrows and silent about its gaps. Named here so
the gaps are at least written down somewhere:

- **The Tome.** `contracts/TOME.md` rule 1 is that consumers read only the
  store, never a source and never another consumer's output. Four of the seven
  INDIRECT edges pass through it. It is the most load-bearing thing on the
  diagram that isn't on it.
- **The calendar feeds** — three live ICS URLs, the dominant input to Movement.
- **The scheduler** (`scheduler/jobs.toml`), which is what actually fires the
  miners, the judge, the Curator, Samwise and the repairer. The page implies
  causality; the truth is a five-minute tick.
- **The PWA** (`now-web/server.py`) and **the WhatsApp assistant**
  (`hermes-kmini`), which are the two doors all of this is read through.
- **`facts.json`** and **`activity-log.md`**, both hand- or sensor-kept files on
  the Sync mesh with no tile of their own.

## A dead end, recorded so it isn't re-walked

`/lately/` is **not** built from `activity-log.md`.
`planner/derive_activity_records.py` does read that log and does write
`activity-records.jsonl` and `activity-public.json` — but nothing in this repo
ever opens either file. `entries.json` is written solely by
`tools/weekly_record.py:1022` from the week it computed out of
`coding-days.json`. `lately/README.md` describing `entries.json` as "a
field-reduced export of canonical activity records" is stale intent, not live
wiring. The real chain is edge #14.
