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

---

# Reaches Kahran

Added 2026-09-22, after Kahran: *"maybe that's the key element we are missing:
an arrow going off so it's clear how they impact me."*

The sixteen edges above are the system talking to itself. These are the only
lines that leave it. Same test as before, from the other end: an arrow is only
real if there is a **sending call** — the line that puts something on a surface
a person looks at. The channel names on the page come straight out of this
table, and `REACH` in `/v2/flow.js` has to agree with it.

## The fact that decides most of the table

`store_lib/notify.py` keeps a static class registry (`CALLER_CLASS`, `:148`)
with four classes, least to most restrictive: `protocol` < `briefing` <
`alert` < `receipt`. Only the first two reach his phone.

- **`protocol`** delivers with no guards at all. One caller: `flight-routine`.
- **`briefing`** delivers, but obeys quiet hours, once-a-day, never-canned and a
  six-a-day budget. Callers: `morning-deliver`, `meeting-reconcile`,
  `presence-confirm`.
- **`alert`** pushes **nothing**. It appends to `~/Tome/health/alert-inbox.jsonl`
  and returns `"inbox"` (`notify.py:883-892`). It is also the default for any
  caller not in the registry (`DEFAULT_CLASS`, `:188`).
- **`receipt`** writes a ledger line and nothing else.

So *calling notify.py is not the same as reaching him*, and two tiles that look
like they page him do not.

## The table

The **surface** column is the node each tile's arrow points at in the fourth
column of the flow view. `SURFACES` and `FEEDS` in `/v2/flow.js` have to match
this; if a channel changes, change both.

| tile | surface | channel | the sending call | |
|---|---|---|---|---|
| Mail triage | the 06:30 message · when I ask for it | the mail card at 06:30, and /inbox | `hermes-kmini/bin/morning-deliver.py:629` `mail_card_lines()`; `~/.claude/commands/inbox.md` | INDIRECT |
| The miners | the 06:30 message | his own words, quoted back | `transforms/conversation_miner.py:1038` `write_extras()` → `morning-deliver.py:1013` `clarify_lines()` | INDIRECT |
| The Curator | the 06:30 message · when I ask for it | three questions, and the pending list | `curator/checkins.py:204` `block()` → `morning-deliver.py:1200` `confirm_lines()`; `bin/backlog.py:269` | INDIRECT |
| The sparks garden | when I ask for it | never pushed | `day-flow/commands/sparks.md`; `sparks-canvas/core.py:300` | VERIFIED |
| Noticings | the 06:30 message | one line, with a link to the pages | `morning-deliver.py:1372` `noticing_lines()`; pages at `sparks-canvas/noticings.py:534` | INDIRECT |
| Movement | a question on WhatsApp | one question, only when it cannot tell | `transforms/presence_refresh.py:193` `settle_confirm()` — `briefing` class | **VERIFIED** |
| The now brain | a page I open · when I ask for it | the page, and "unstick me" | `now-web/server.py:1616` `route()`; `bin/unstick.py` | INDIRECT |
| The workout planner | when I ask for it | today's session | `planner/workout_card.py:278` `main()` → the hermes `workout` skill | INDIRECT |
| Travel days | the flight-day messages | the doses and the evening ask | `planner/flight_routine.py:676` `_send_all()` — `protocol` class | **VERIFIED** |
| Samwise | the 06:30 message | a count, not a push | `samwise/samwise.py:457` → `alert` → inbox → `morning-deliver.py:1415` | INDIRECT |
| The repairer | the 06:30 message | a count; the rest on the health page | `samwise/fixer/fix.py:232`, `:149` → inbox | INDIRECT |
| The health page | a page I open | the page, when he opens it | `now-web/server.py:1640` `route()` | **VERIFIED** |
| The weekly record | everyone | published; nothing tells him | `tools/publish_weekly.sh` opens a PR and merges it | — |

**Three tiles have no arrow out, and that is the point of them:** the raw store,
capture, and the judge never speak to him. Capture and the store are *inbound*
(`POST /api/voice` is him talking to it). The judge's keeps do reach him, but
through the Curator's list, which already has its own arrows — drawing both
would count it twice.

**Two corrections from an earlier draft of this page.** The Curator does not
raise its own WhatsApp question: `checkins.py` has no send at all, by design
(*"A question never writes anything but a record of itself"*), and its three
questions ride the 06:30 message. So exactly one thing in the system is allowed
to interrupt him unasked — Movement, when it cannot tell where he is. And the
workout planner's week lands in Notion **for his coach** (`plan_week.py:386`);
the arrow drawn here is his own, thinner, pull-only one.

## Two that surprise

**Samwise does not page him.** Its caller is not in the registry, so
`post_notify()` resolves to `alert` and only writes the inbox. The comment above
it at `samwise.py:921` says "the first red of a streak reaches him same-day",
which is stale — don't build anything off that line. Lane reds reach him as a
count in the 06:30 message, on `/health`, or when he asks the `alerts` skill.
The thing that *does* message his phone is the watcher of the watcher,
`transforms/samwise_fresh.py:195`, and only when **Samwise itself** goes quiet.

**The workout planner's Notion write goes to his coach, not to him.**
`planner/plan_week.py:386` `upsert_row()` publishes the week for review — the
reader is the coach. His own channel from that tool is the much thinner pull
path through `workout_card.py`, and that is what the diagram draws.

## Six arrows, one bus

Mail triage, the miners, the Curator, Noticings, Samwise and the judge all reach
him through the **single scheduled outbound** in the system:
`hermes-kmini/bin/morning-deliver.py`, wired as the `morning-brief` cron at
06:30 (`hermes-kmini/DEPLOY.md:211`), whose docstring says *"SINCE 2026-08-06 IT
IS THE \*ONLY\* SCHEDULED OUTBOUND."* The page draws one line per tile because
the tile is what the reader is looking at, but they are six strands of one rope.
Everything else is pull: he asks, and a skill or a page answers.
