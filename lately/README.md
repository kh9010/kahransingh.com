# Lately publication boundary

This public repository must never read or contain `activity-log.md` or
`activity-records.jsonl`. Those are private.

`entries.json` is the only accepted input. It is a mechanical, field-reduced export of
canonical activity records whose visibility is explicitly `public`; the exporter removes the
private source pointer. Do not hand-copy raw log lines here. A public record has already passed
the heartbeat summarizer's fail-closed privacy rules and must carry a reviewed public URL.

This page is deliberately absent from the site navigation until Kahran reviews the first export.
Future GitHub, Instagram, and Substack adapters should produce the same canonical record contract,
not add source-specific rendering branches to this page.
