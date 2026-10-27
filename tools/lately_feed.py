#!/usr/bin/env python3
"""The Lately feed layer: one entry contract, every reader of it.

`lately/entries.json` is the record of what Kahran has published lately. Until
now it had one writer (`weekly_record.py`) and one reader (`lately/index.html`),
and the shape of an entry lived inside the writer. This module is where that
shape lives instead, so a second strand can write entries and a second consumer
can read them without either knowing about `weekly_record.py`.

    ENTRY CONTRACT (schema_version 2)
        id       str  required  stable, unique across strands ("record-2026-w41")
        date     str  required  YYYY-MM-DD, the day the entry is about
        strand   str  required  lowercase slug ("code"); the index filters on it
        link     str  required  site-relative path ("/lately/2026-w41/")
        title    str  one of    title / summary must be present
        summary  str  one of
        stats    [str]          optional, already worded
        mark     {shape, values, label}  optional small multiple

The rules are the same ones `lately/index.html` already applies in its filter,
written down once here and enforced on the way in rather than skipped on the
way out.

Consumers
    lately/index.html   renders entries.json in the browser (unchanged)
    lately/feed.xml     an Atom feed of the same entries, rendered here by
                        render_atom(); readers subscribe instead of revisiting

The feed is a pure function of entries.json: no clock, no environment. Its
<updated> is the newest entry's date, so rebuilding an unchanged file is
byte-identical and the weekly job's `git diff --quiet` still means "nothing new".

Usage
    python3 tools/lately_feed.py            # rebuild lately/feed.xml from entries.json
    python3 tools/lately_feed.py --check    # validate entries.json, print the feed, write nothing
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

SCHEMA_VERSION = 2
SITE = "https://kahransingh.com"
SECTION = "lately"
FEED_PATH = f"{SECTION}/feed.xml"
ENTRIES_PATH = f"{SECTION}/entries.json"
FEED_TITLE = "Lately — Kahran Singh"
FEED_SUBTITLE = "Every public issue of Kahran Singh's record, newest first."
AUTHOR = "Kahran Singh"
FEED_LIMIT = 20

_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_STRAND = re.compile(r"^[a-z][a-z0-9-]*$")
_MARK_SHAPES = {"bars"}


class EntryError(ValueError):
    """An entry that does not meet the contract. Raised, never silently dropped."""


def validate_entry(entry: dict) -> dict:
    """Return the entry unchanged if it meets the contract; raise EntryError otherwise."""
    if not isinstance(entry, dict):
        raise EntryError(f"entry is not an object: {entry!r}")
    for key in ("id", "date", "strand", "link"):
        if not isinstance(entry.get(key), str) or not entry[key]:
            raise EntryError(f"entry {entry.get('id')!r} is missing {key}")
    if not _DATE.fullmatch(entry["date"]):
        raise EntryError(f"entry {entry['id']!r} has date {entry['date']!r}, want YYYY-MM-DD")
    if not _STRAND.fullmatch(entry["strand"]):
        raise EntryError(f"entry {entry['id']!r} has strand {entry['strand']!r}, want a lowercase slug")
    if not entry["link"].startswith("/") or entry["link"].startswith("//"):
        raise EntryError(f"entry {entry['id']!r} link {entry['link']!r} must be site-relative")
    if not (entry.get("title") or entry.get("summary")):
        raise EntryError(f"entry {entry['id']!r} needs a title or a summary")
    stats = entry.get("stats")
    if stats is not None and not (isinstance(stats, list) and all(isinstance(s, str) for s in stats)):
        raise EntryError(f"entry {entry['id']!r} stats must be a list of strings")
    mark = entry.get("mark")
    if mark is not None:
        if not isinstance(mark, dict) or mark.get("shape") not in _MARK_SHAPES:
            raise EntryError(f"entry {entry['id']!r} mark.shape must be one of {sorted(_MARK_SHAPES)}")
        values = mark.get("values")
        if not (isinstance(values, list) and all(isinstance(v, (int, float)) and not isinstance(v, bool)
                                                 for v in values)):
            raise EntryError(f"entry {entry['id']!r} mark.values must be a list of numbers")
    return entry


def load(path: Path) -> dict:
    """Read entries.json, or an empty document if it does not exist yet."""
    if not path.exists():
        return {"schema_version": SCHEMA_VERSION, "generated_at": None, "entries": []}
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"{ENTRIES_PATH} is not valid JSON ({exc}); refusing to touch it")
    if not isinstance(doc, dict) or not isinstance(doc.get("entries", []), list):
        raise SystemExit(f"{ENTRIES_PATH} has no entries list; refusing to touch it")
    return doc


def merge(doc: dict, entry: dict, now: str) -> dict:
    """Merge one entry by id, leaving every other entry alone.

    Newest first, ties broken by id. `generated_at` moves to `now` only when the
    entries actually changed, so a re-run of the same week is a no-op.
    """
    validate_entry(entry)
    old = doc.get("entries", [])
    entries = [e for e in old if e.get("id") != entry["id"]]
    entries.append(entry)
    entries.sort(key=lambda e: (e.get("date", ""), e.get("id", "")), reverse=True)
    out = dict(doc)
    out["entries"] = entries
    out["schema_version"] = max(int(doc.get("schema_version", 1) or 1), SCHEMA_VERSION)
    if json.dumps(old, sort_keys=True) != json.dumps(entries, sort_keys=True) or not doc.get("generated_at"):
        out["generated_at"] = now
    return out


def _entry_text(e: dict) -> str:
    parts = [e.get("summary") or e.get("title") or ""]
    if e.get("stats"):
        parts.append(" · ".join(e["stats"]))
    return "\n".join(p for p in parts if p)


def render_atom(doc: dict, limit: int = FEED_LIMIT) -> str:
    """Render an Atom 1.0 feed from an entries document. Pure: same doc, same bytes.

    Every entry must pass validate_entry; a bad entry fails the build rather
    than disappearing from the feed while still showing on the index.
    """
    entries = [validate_entry(e) for e in doc.get("entries", [])]
    entries.sort(key=lambda e: (e["date"], e["id"]), reverse=True)
    entries = entries[:limit]
    feed_url = f"{SITE}/{FEED_PATH}"
    home = f"{SITE}/{SECTION}/"
    updated = f"{entries[0]['date']}T00:00:00Z" if entries else "1970-01-01T00:00:00Z"
    out = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<feed xmlns="http://www.w3.org/2005/Atom">',
        f"  <title>{escape(FEED_TITLE)}</title>",
        f"  <subtitle>{escape(FEED_SUBTITLE)}</subtitle>",
        f'  <link rel="self" type="application/atom+xml" href="{escape(feed_url)}"/>',
        f'  <link rel="alternate" type="text/html" href="{escape(home)}"/>',
        f"  <id>{escape(home)}</id>",
        f"  <updated>{updated}</updated>",
        f"  <author><name>{escape(AUTHOR)}</name></author>",
    ]
    for e in entries:
        url = SITE + e["link"]
        title = e.get("title") or e.get("summary") or ""
        out += [
            "  <entry>",
            f"    <title>{escape(title)}</title>",
            f'    <link rel="alternate" type="text/html" href="{escape(url)}"/>',
            # tag: URIs are stable even if the site moves; the entry id is already unique.
            f"    <id>tag:kahransingh.com,2026:{SECTION}/{escape(e['id'])}</id>",
            f"    <updated>{e['date']}T00:00:00Z</updated>",
            f'    <category term="{escape(e["strand"], {chr(34): "&quot;"})}"/>',
            f"    <summary>{escape(_entry_text(e))}</summary>",
            "  </entry>",
        ]
    out.append("</feed>")
    return "\n".join(out) + "\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site-root", help="repo root (default: the parent of tools/)")
    ap.add_argument("--check", action="store_true", help="validate and print, write nothing")
    args = ap.parse_args(argv)
    root = Path(args.site_root).expanduser() if args.site_root else Path(__file__).resolve().parent.parent
    doc = load(root / ENTRIES_PATH)
    feed = render_atom(doc)
    if args.check:
        sys.stdout.write(feed)
        return 0
    target = root / FEED_PATH
    if target.exists() and target.read_text(encoding="utf-8") == feed:
        print(f"unchanged  {FEED_PATH}")
        return 0
    target.write_text(feed, encoding="utf-8")
    print(f"wrote      {FEED_PATH}  ({len(doc.get('entries', []))} entries)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
