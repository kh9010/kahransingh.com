#!/usr/bin/env python3
"""place_feed.py — turns presence.json into the public place feed, v2/place.json.

Reads the mini's ~/Sync/pending-work/presence.json (schema: day, tz, home, away,
place, place_key, lat, lon, until, confidence, sources[]) and writes exactly one
path: v2/place.json — {"place", "lat", "lon", "tz", "updated"}.

Privacy floor: only "high" or "confirmed" confidence ever publishes a place. Any
lower confidence (low/medium, or a missing/unrecognised value) writes a null
place with no coordinates. This mirrors the presence system's own honesty rule
(store_lib/places.py: "a miss here is honest") — a guess never reaches the site.

Coordinates are rounded to 2 decimal places (~1km) DELIBERATELY: this is a
city-level feed, never the exact point. Do not increase the precision.

stdlib-only, no dependencies, no build step. Same allowlist-write pattern as
tools/weekly_record.py: the writable path is asserted in code, not left to the
caller being careful.
"""
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE_ROOT = HERE.parent
DEFAULT_PRESENCE = Path.home() / "Sync" / "pending-work" / "presence.json"

# The complete set of paths this script may write. Asserted here rather than
# left to the caller being careful (see tools/weekly_record.py's WRITABLE).
WRITABLE = re.compile(r"^v2/place\.json$")

# Confidence levels that are trustworthy enough to publish a place at all.
PUBLISHABLE_CONFIDENCE = {"high", "confirmed"}

# Small override map: place_key -> short public name. Keys come from
# ~/dev/day-flow/store_lib/places.py's PLACES dict ("short" field), which is
# the canonical gazetteer this feed borrows names from without importing it
# (that repo isn't a sibling of this one on every machine that might run this).
PLACE_KEY_OVERRIDES = {
    "nyc": "New York",
    "ptown": "Provincetown",
    "boston": "Boston",
    "bangalore": "Bangalore",
    "delhi": "Delhi",
    "leavenworth": "Leavenworth",
    "sitges": "Sitges",
    "enchantments": "the Enchantments",
}

# Trailing ", ST" / ", Country" style suffixes on a free-text place name, e.g.
# "New York, NY" -> "New York", "Sitges, Spain" -> "Sitges".
_SUFFIX_RE = re.compile(r"^(.*?),\s*[A-Za-z .]+$")


def short_name(place_key, place_text):
    """The short public city name for a place_key/place pair.

    place_key hits the override map first (it's the stable, unambiguous
    identifier); free text falls back to stripping a trailing ", ST"/", Country"
    suffix.
    """
    if place_key and place_key in PLACE_KEY_OVERRIDES:
        return PLACE_KEY_OVERRIDES[place_key]
    if not place_text:
        return None
    m = _SUFFIX_RE.match(place_text.strip())
    return m.group(1).strip() if m else place_text.strip()


def round_coord(value):
    """Round to 2 decimals (~1km). City-level only — never publish the exact point."""
    if value is None:
        return None
    return round(float(value), 2)


def build_output(presence):
    """presence dict -> the v2/place.json dict (order-stable keys)."""
    confidence = presence.get("confidence")
    day = presence.get("day") or presence.get("generated", "")[:10]

    if confidence not in PUBLISHABLE_CONFIDENCE:
        return {"place": None, "lat": None, "lon": None, "tz": None, "updated": day}

    place_key = presence.get("place_key")
    place_text = presence.get("place")
    name = short_name(place_key, place_text)
    if not name:
        return {"place": None, "lat": None, "lon": None, "tz": None, "updated": day}

    return {
        "place": name,
        "lat": round_coord(presence.get("lat")),
        "lon": round_coord(presence.get("lon")),
        "tz": presence.get("tz"),
        "updated": day,
    }


def load_presence(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_output(rel, content, dry_run):
    if not WRITABLE.fullmatch(rel):
        raise SystemExit(f"REFUSING to write {rel}: not this script's one writable path")
    target = SITE_ROOT / rel
    if target.exists():
        existing = target.read_text(encoding="utf-8")
        if existing == content:
            print(f"{rel}: unchanged, no write")
            return "unchanged"
    if dry_run:
        print(f"--check: would write {rel}:")
        print(content)
        return "would-write"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    print(f"{rel}: written")
    return "written"


def main(argv):
    presence_path = argv[1] if len(argv) > 1 and not argv[1].startswith("--") else str(DEFAULT_PRESENCE)
    check = "--check" in argv

    if not os.path.exists(presence_path):
        print(f"presence file not found: {presence_path}", file=sys.stderr)
        return 1

    try:
        presence = load_presence(presence_path)
    except json.JSONDecodeError as e:
        print(f"presence file is not valid JSON: {e}", file=sys.stderr)
        return 1

    out = build_output(presence)
    content = json.dumps(out, indent=2, sort_keys=False) + "\n"

    write_output("v2/place.json", content, dry_run=check)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
