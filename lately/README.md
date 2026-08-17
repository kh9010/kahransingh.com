# Lately publication boundary

This public repository must never read or contain `activity-log.md` or
`activity-records.jsonl`. Those are private.

`entries.json` is the only accepted input. It is a mechanical, field-reduced export of
canonical activity records whose visibility is explicitly `public`; the exporter removes the
private source pointer. Do not hand-copy raw log lines here. A public record has already passed
the heartbeat summarizer's fail-closed privacy rules and must carry a reviewed public URL.

## What lives in this directory

`index.html` is the index and stays that way: it renders `entries.json` and nothing else.
Everything a strand publishes sits beside it, in its own dated directory —
`lately/2026-w33/` for the weekly coding record, one URL per issue, permanent. The newest
issue is also copied to `lately/record/`, a door whose canonical points back at the dated
URL. Only `tools/weekly_record.py` writes those; it is barred from `index.html` and this
file by an allowlist, so a page reviewed by hand stays a page reviewed by hand.

This page was held out of the site navigation until Kahran reviewed the first export. It is in the nav now, and in the sitemap.
Future GitHub, Instagram, and Substack adapters should produce the same canonical record contract,
not add source-specific rendering branches to this page.
