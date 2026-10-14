# Lately publication boundary

This public repository must never read or contain `activity-log.md` or
`activity-records.jsonl`. Those are private.

`entries.json` is the only accepted input. Every entry in it meets the contract in
`tools/lately_feed.py` (`validate_entry`), and producers write it only through that module's
`load`/`merge`. Do not hand-copy raw log lines here. `feed.xml` is the second consumer: a
public Atom feed (newest 20 entries) rendered from `entries.json` by the same module, linked
from `index.html` by one autodiscovery `<link>` and not from the site nav.

## What lives in this directory

`index.html` is the index and stays that way: it renders `entries.json` and nothing else.
A row's mark and stat fragment come from that file too — `mark` and `stats`, both optional,
both strand-agnostic, defined once in `tools/weekly_record.py` beside `ENTRIES_SCHEMA`. A new
strand describes itself in those fields; it does not earn a branch in the page.
Everything a strand publishes sits beside it, in its own dated directory —
`lately/2026-w33/` for the weekly coding record, one URL per issue, permanent. The newest
issue is also copied to `lately/record/`, a door whose canonical points back at the dated
URL. Only `tools/weekly_record.py` writes those; it is barred from `index.html` and this
file by an allowlist, so a page reviewed by hand stays a page reviewed by hand.

This page was held out of the site navigation until Kahran reviewed the first export. It is in the nav now, and in the sitemap.
Future GitHub, Instagram, and Substack adapters should produce the same canonical record contract,
not add source-specific rendering branches to this page.
