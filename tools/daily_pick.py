#!/usr/bin/env python3
"""daily_pick.py — picks TODAY's poem and photograph and freezes the choice.

Each night at 23:50 local (via publish_daily_pick.sh on the mini, once the
day is effectively over) this script reads where Kahran is
(~/Sync/pending-work/presence.json) and the day's weather at that place
(Open-Meteo, no key), turns both into a small "day vector" of 0..1 axes, and
picks the poem and photograph whose own vectors (v2/scores-poems.json,
v2/scores-photos.json) sit closest to it. The pick is appended to exactly one
path, v2/days.json, and never touched again — it becomes that day's permanent
archive entry.

During the day itself, v2/home.js and v2/pick.js pick TODAY live in the
browser from the same weather reading v2/weather.js renders under the date —
see docs/2026-09-21-daily-pick-design.md. This script's frozen entry for
today (once 23:50 has run) becomes a fallback for that day, read only if a
visitor's weather fetch fails; v2/home.js falls back to it, then to the date
hash, for any day that isn't in v2/days.json at all.

It is deliberately hard to make this crash a run: a missing scores file
degrades every item to a neutral 0.5 on every axis (so the picker becomes
novelty + a stable tiebreak), a missing/low-confidence presence degrades to
home coordinates with no place named, and any weather-API failure should be
caught by the caller (publish_daily_pick.sh) rather than by this script
inventing weather.

Axes (all 0..1): light, warmth, wet, stillness, season, inside, mood.

    light      = sunshine_duration / daylight_duration (Open-Meteo daily
                 fields, both seconds), clamped to [0, 1], then damped by
                 0.7x when the day's weather_code is fog (45/48) or overcast
                 (3) — the sunshine fraction alone under-penalises a hazy,
                 glare-lit-but-grey day.
    warmth     = clamp((tmax_c - (-5)) / 35, 0, 1) — -5C reads as 0 (cold
                 floor), 30C reads as 1 (warm ceiling); linear between.
    wet        = max(a continuous read of precipitation_sum in mm, clamped
                 at 10mm+ = fully wet, i.e. min(precip_mm / 10, 1)) and a
                 per-weather_code floor (drizzle/rain/snow/fog codes each
                 carry a minimum "wetness" even on a day recorded as low
                 rainfall, because a foggy or lightly-drizzling day still
                 reads as damp) — see WET_CODE_FLOORS.
    stillness  = clamp(1 - wind_speed_10m_max_kmh / 40, 0, 1), then +0.3
                 (clamped back to 1) when presence.away is true — travel
                 days read as more "away from routine", which this axis
                 borrows as a proxy for stillness/quiet since we have no
                 direct signal for it.
    season     = cosine position of the date in the year, peaking at 1 on
                 21 June (day-of-year 172, "midsummer") and bottoming at 0
                 on ~21 December ("midwinter"): season =
                 (1 + cos(2*pi*(doy - 172) / 365.25)) / 2. Flipped
                 (season = 1 - season) when presence lat < 0 (southern
                 hemisphere midsummer is December).
    inside     = 1 - mean(wet, 1 - warmth) — rain and cold both push a day
                 "inside"; a warm dry day pushes it "outside". Roughly, not
                 exactly, the mirror of (wet, warmth).
    mood       = 0.5, ALWAYS. Deliberate, not a placeholder: the site must
                 never infer that Kahran is sad because it rained, or happy
                 because it's sunny. Nothing in this script's inputs (weather,
                 date, coarse location) is evidence of mood, so this axis
                 carries no signal and every poem/photo scored on it is
                 compared against the same constant. If mood scoring is ever
                 wanted, it needs an actual mood input — never derived from
                 weather.

Picking. For every candidate poem (photo), compute:

    score = -weighted_euclidean(day_vector, item_vector)   # axes above
            + place_bonus                                   # photos only
            - novelty_penalty
            + tiebreak

    weighted_euclidean = sqrt(sum(weight[axis] * (day[axis] - item[axis])**2
                                   for axis in AXES))
    weights = light 1.0, warmth 1.0, wet 1.2, stillness 0.6, season 0.8,
              inside 0.6, mood 0.3

    place_bonus (photos only, needs the photo's "place":{lat,lon} in
    scores-photos.json and presence lat/lon): +0.35 within 50km (haversine),
    +0.15 within 500km, else 0.

    novelty_penalty: -1.0 if the same slug/src was already picked within the
    last 60 days (poems) / 30 days (photos), read from the existing
    v2/days.json entries before today.

    tiebreak: a tiny (<=1e-6) deterministic value from sha256(date + slug),
    only large enough to break exact ties stably — never enough to move a
    real ranking.

The item with the highest score wins. Ties (after the real terms) fall to
the tiebreak, so the same day vector always resolves the same way.

Usage
    python3 tools/daily_pick.py                      # pick today, write it
    python3 tools/daily_pick.py --dry                 # print, write nothing
    python3 tools/daily_pick.py --date 2026-09-22
    python3 tools/daily_pick.py --presence PATH.json
    python3 tools/daily_pick.py --scores-dir v2
    python3 tools/daily_pick.py --offline fixtures/weather.json --dry

Exit codes: 0 on success, including the idempotent no-op ("already picked").
Non-zero with a message on a genuine failure (bad presence JSON, weather
fetch failure when not --offline, unwritable path).
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE_ROOT = HERE.parent
DEFAULT_PRESENCE = Path.home() / "Sync" / "pending-work" / "presence.json"
DEFAULT_SCORES_DIR = SITE_ROOT / "v2"
DEFAULT_DATA = SITE_ROOT / "v2" / "data.json"
DAYS_PATH = "v2/days.json"

# The one path this script may write, asserted in code (see place_feed.py /
# weekly_record.py's WRITABLE pattern).
WRITABLE = re.compile(r"^v2/days\.json$")

HOME_LAT, HOME_LON, HOME_TZ = 40.71, -74.01, "America/New_York"
PUBLISHABLE_CONFIDENCE = {"high", "confirmed"}

AXES = ("light", "warmth", "wet", "stillness", "season", "inside", "mood")
WEIGHTS = {
    "light": 1.0, "warmth": 1.0, "wet": 1.2, "stillness": 0.6,
    "season": 0.8, "inside": 0.6, "mood": 0.3,
}

FOG_OR_OVERCAST_CODES = {3, 45, 48}
# weather_code -> minimum "wet" reading, even on a day with little recorded
# precipitation (a foggy or lightly-drizzling day still reads as damp).
WET_CODE_FLOORS = {
    45: 0.4, 48: 0.4,                                   # fog
    51: 0.3, 53: 0.35, 55: 0.4, 56: 0.35, 57: 0.4,       # drizzle
    61: 0.5, 63: 0.6, 65: 0.75, 66: 0.5, 67: 0.65,       # rain
    80: 0.5, 81: 0.6, 82: 0.8,                           # rain showers
    71: 0.6, 73: 0.65, 75: 0.75, 77: 0.6, 85: 0.6, 86: 0.75,  # snow
    95: 0.8, 96: 0.85, 99: 0.9,                          # thunderstorm
}

NOVELTY_DAYS = {"poem": 60, "photo": 30}
PLACE_BONUS_NEAR_KM = 50
PLACE_BONUS_FAR_KM = 500
PLACE_BONUS_NEAR = 0.35
PLACE_BONUS_FAR = 0.15
NOVELTY_PENALTY = -1.0
SEASON_PEAK_DOY = 172  # 21 June


def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


# --------------------------------------------------------------- presence --

def load_presence(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def resolve_location(presence):
    """presence dict -> (lat, lon, tz, place_name_or_None).

    Mirrors place_feed.py's privacy floor: a place name is only ever returned
    for high/confirmed confidence. Below that (or missing lat/lon), falls
    back to home coordinates with place=None — never a guessed location.
    """
    confidence = presence.get("confidence") if presence else None
    lat, lon = presence.get("lat") if presence else None, presence.get("lon") if presence else None
    tz = (presence.get("tz") if presence else None) or HOME_TZ

    if confidence not in PUBLISHABLE_CONFIDENCE or lat is None or lon is None:
        return HOME_LAT, HOME_LON, tz, None

    return float(lat), float(lon), tz, presence.get("place")


def today_in_tz(tz_name):
    """Best-effort local date in tz_name using only the stdlib. Falls back to
    the system local date if zoneinfo can't resolve the name (e.g. Python
    built without tzdata) — this only affects which calendar day counts as
    "today" for the default run; --date always overrides it.
    """
    try:
        from zoneinfo import ZoneInfo
        return dt.datetime.now(ZoneInfo(tz_name)).date().isoformat()
    except Exception:
        return dt.date.today().isoformat()


# ----------------------------------------------------------------- weather --

def fetch_weather(lat, lon, tz, date_iso):
    """Open-Meteo daily forecast for date_iso at (lat, lon). Returns the dict
    of daily fields for that one date, or raises on any HTTP/parse failure —
    callers that want a hard failure to become a clean no-write should use
    --offline in tests; the publish script should let a real failure abort
    the run rather than pick blind.
    """
    fields = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration,daylight_duration,wind_speed_10m_max,cloud_cover_mean"
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}&daily={fields}"
        f"&timezone={urllib.parse.quote(tz, safe='')}"
        f"&start_date={date_iso}&end_date={date_iso}"
    )
    with urllib.request.urlopen(url, timeout=20) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return _extract_daily_for(payload, date_iso)


def load_offline_weather(path, date_iso):
    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)
    return _extract_daily_for(payload, date_iso)


def _extract_daily_for(payload, date_iso):
    """Open-Meteo's daily block is parallel arrays keyed by 'time'. Pull the
    single day matching date_iso into a flat dict; the fixture files used by
    --offline use the same shape so the two code paths share this."""
    daily = payload.get("daily") or {}
    times = daily.get("time") or []
    if date_iso not in times:
        # single-day requests still come back as index 0
        idx = 0 if times else None
    else:
        idx = times.index(date_iso)
    if idx is None:
        raise ValueError(f"no daily weather for {date_iso} in payload")

    def at(key, default=None):
        arr = daily.get(key)
        if not arr or idx >= len(arr):
            return default
        return arr[idx]

    return {
        "weather_code": at("weather_code", 0),
        "tmax": at("temperature_2m_max", 15.0),
        "tmin": at("temperature_2m_min", 5.0),
        "precip_mm": at("precipitation_sum", 0.0) or 0.0,
        "sunshine_s": at("sunshine_duration", 0.0) or 0.0,
        "daylight_s": at("daylight_duration", 1.0) or 1.0,
        "wind_kmh": at("wind_speed_10m_max", 0.0) or 0.0,
        # Recorded into "why" alongside the axes, for the archive — not read
        # back into the scoring formula (light/stillness above already derive
        # from sunshine/daylight/wind); see build_pick().
        "cloud_pct": at("cloud_cover_mean", None),
    }


# ------------------------------------------------------------- day vector --

def day_vector(date_iso, weather, lat, presence):
    doy = dt.date.fromisoformat(date_iso).timetuple().tm_yday

    light = clamp(weather["sunshine_s"] / weather["daylight_s"] if weather["daylight_s"] else 0.5)
    if weather["weather_code"] in FOG_OR_OVERCAST_CODES:
        light *= 0.7

    warmth = clamp((weather["tmax"] - (-5)) / 35)

    wet_continuous = clamp(weather["precip_mm"] / 10)
    wet = max(wet_continuous, WET_CODE_FLOORS.get(weather["weather_code"], 0.0))

    stillness = clamp(1 - weather["wind_kmh"] / 40)
    if presence and presence.get("away"):
        stillness = clamp(stillness + 0.3)

    season = (1 + math.cos(2 * math.pi * (doy - SEASON_PEAK_DOY) / 365.25)) / 2
    if lat is not None and lat < 0:
        season = 1 - season

    inside = 1 - (wet + (1 - warmth)) / 2

    mood = 0.5  # deliberate — see module docstring

    return {
        "light": light, "warmth": warmth, "wet": wet, "stillness": stillness,
        "season": season, "inside": inside, "mood": mood,
    }


# ----------------------------------------------------------------- scores --

def load_scores(scores_dir, name):
    path = Path(scores_dir) / name
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def item_vector(scores_doc, key):
    """key's axis dict from a scores file (checking both its "poems" and
    "photos" tables, whichever this scores_doc has), defaulting every axis to
    0.5 when the file is missing entirely or the item just isn't in it — the
    picker must never crash or refuse to pick over an absent/partial scores
    file."""
    vec = {axis: 0.5 for axis in AXES}
    if not scores_doc:
        return vec
    entry = scores_doc.get("poems", {}).get(key) or scores_doc.get("photos", {}).get(key)
    if entry:
        for axis in AXES:
            if axis in entry:
                vec[axis] = clamp(float(entry[axis]))
    return vec


def weighted_distance(day, item):
    total = 0.0
    for axis in AXES:
        d = day[axis] - item[axis]
        total += WEIGHTS[axis] * d * d
    return math.sqrt(total)


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def place_bonus(photo_place, lat, lon):
    if not photo_place or lat is None or lon is None:
        return 0.0
    plat, plon = photo_place.get("lat"), photo_place.get("lon")
    if plat is None or plon is None:
        return 0.0
    km = haversine_km(lat, lon, float(plat), float(plon))
    if km <= PLACE_BONUS_NEAR_KM:
        return PLACE_BONUS_NEAR
    if km <= PLACE_BONUS_FAR_KM:
        return PLACE_BONUS_FAR
    return 0.0


def tiebreak(date_iso, key):
    digest = hashlib.sha256(f"{date_iso}|{key}".encode("utf-8")).hexdigest()
    # a value in [0, 1e-6) — enough to order exact ties stably, never enough
    # to outweigh a real difference in any other term.
    return (int(digest[:8], 16) / 0xFFFFFFFF) * 1e-6


def recently_shown(days_doc, kind, before_date, window_days):
    """Set of slugs/srcs picked for `kind` ('poem'/'photo') in the
    window_days before before_date, read from the existing days.json."""
    shown = set()
    if not days_doc:
        return shown
    cutoff = dt.date.fromisoformat(before_date) - dt.timedelta(days=window_days)
    for date_iso, entry in days_doc.get("days", {}).items():
        try:
            d = dt.date.fromisoformat(date_iso)
        except ValueError:
            continue
        if cutoff <= d < dt.date.fromisoformat(before_date) and kind in entry:
            shown.add(entry[kind])
    return shown


def pick_best(candidates, key_field, day, scores_doc, date_iso, kind, days_doc, lat=None, lon=None):
    novelty_window = NOVELTY_DAYS[kind]
    recent = recently_shown(days_doc, kind, date_iso, novelty_window)

    best_key, best_score, best_vec = None, None, None
    for item in candidates:
        key = item[key_field]
        vec = item_vector(scores_doc, key)
        score = -weighted_distance(day, vec)
        if kind == "photo":
            scored_entry = (scores_doc or {}).get("photos", {}).get(key) or {}
            score += place_bonus(scored_entry.get("place"), lat, lon)
        if key in recent:
            score += NOVELTY_PENALTY
        score += tiebreak(date_iso, key)
        if best_score is None or score > best_score:
            best_key, best_score, best_vec = key, score, vec
    return best_key, best_vec


# ------------------------------------------------------------------- I/O --

def load_days(site_root):
    path = site_root / DAYS_PATH
    if not path.exists():
        return {"version": 1, "days": {}}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_days(site_root, rel, content, dry_run):
    if not WRITABLE.fullmatch(rel):
        raise SystemExit(f"REFUSING to write {rel}: not this script's one writable path")
    target = site_root / rel
    if dry_run:
        print(f"--dry: would write {rel}:")
        print(content)
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    print(f"{rel}: written")


# ------------------------------------------------------------------- main --

def build_pick(date_iso, presence, weather, data_doc, poem_scores, photo_scores, days_doc):
    lat, lon, tz, place_name = resolve_location(presence)
    day = day_vector(date_iso, weather, lat, presence)

    poem_slug, _ = pick_best(
        data_doc["poems"], "slug", day, poem_scores, date_iso, "poem", days_doc,
    )
    photo_src, _ = pick_best(
        data_doc["photos"], "src", day, photo_scores, date_iso, "photo", days_doc,
        lat=lat, lon=lon,
    )

    entry = {
        "poem": poem_slug,
        "photo": photo_src,
        "place": place_name,
        "why": dict(
            day,
            weather_code=weather["weather_code"],
            tmax=weather["tmax"],
            # Recorded for the archive (the mini now writes this at 23:50, after
            # the day is over) alongside the seven axes; not new inputs to the
            # scoring formula. Older days.json entries predate these two keys
            # and stay valid — every reader treats them as optional.
            wind_kmh=weather["wind_kmh"],
            cloud_pct=weather.get("cloud_pct"),
        ),
    }
    return entry


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--date", help="YYYY-MM-DD; defaults to today in presence tz (or America/New_York)")
    ap.add_argument("--dry", action="store_true", help="print what would happen, write nothing")
    ap.add_argument("--presence", default=str(DEFAULT_PRESENCE), help="path to presence.json")
    ap.add_argument("--scores-dir", default=str(DEFAULT_SCORES_DIR), help="dir holding scores-poems.json / scores-photos.json")
    ap.add_argument("--data", default=str(DEFAULT_DATA), help="path to v2/data.json (poem/photo catalog)")
    ap.add_argument("--offline", metavar="WEATHER_JSON", help="read weather from this file instead of calling Open-Meteo")
    args = ap.parse_args(argv)

    presence = None
    if os.path.exists(args.presence):
        try:
            presence = load_presence(args.presence)
        except json.JSONDecodeError as e:
            print(f"presence file is not valid JSON: {e}", file=sys.stderr)
            return 1

    lat, lon, tz, _ = resolve_location(presence)
    date_iso = args.date or today_in_tz(tz)

    days_doc = load_days(SITE_ROOT)
    if date_iso in days_doc.get("days", {}):
        print(f"already picked for {date_iso}")
        return 0

    with open(args.data, "r", encoding="utf-8") as f:
        data_doc = json.load(f)

    try:
        if args.offline:
            weather = load_offline_weather(args.offline, date_iso)
        else:
            weather = fetch_weather(lat, lon, tz, date_iso)
    except Exception as e:
        print(f"weather fetch failed: {e}", file=sys.stderr)
        return 1

    poem_scores = load_scores(args.scores_dir, "scores-poems.json")
    photo_scores = load_scores(args.scores_dir, "scores-photos.json")

    entry = build_pick(date_iso, presence, weather, data_doc, poem_scores, photo_scores, days_doc)

    days_doc.setdefault("version", 1)
    days_doc.setdefault("days", {})
    days_doc["days"][date_iso] = entry

    content = json.dumps(days_doc, indent=2, sort_keys=False) + "\n"
    write_days(SITE_ROOT, DAYS_PATH, content, args.dry)

    print(f"{date_iso}: poem={entry['poem']} photo={entry['photo']} place={entry['place']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
