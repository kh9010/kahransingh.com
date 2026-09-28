#!/usr/bin/env python3
"""add_photos.py — merge an exported set of photographs into the daily rotation.

Input is the export `kbs-tools/photo-tagger/site_picks.py --export` writes (web-sized JPEGs
+ manifest.json with place and caption) plus a directory of score files, one JSON object
keyed by filename, carrying the seven axes, `hour`, `alt`, `notes` and `people_identifiable`.

A photograph enters the rotation only if it is scored, every axis is inside 0..1, and nobody
in it is identifiable — by the scorer's reading OR by the names in --hold. People on the
site is a decision that has not been made, so either flag holds the photograph out.

Deterministic, no model, no network. Re-running is safe: a photograph already in
data.json is skipped. Prints a JSON report; --dry writes nothing.
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

AXES = ("light", "warmth", "wet", "stillness", "season", "inside", "mood")
HOURS = ("dawn", "day", "dusk", "night", "any")


def load_scores(scores_dir: Path) -> dict:
    scores = {}
    for f in sorted(scores_dir.glob("*.json")):
        scores.update(json.loads(f.read_text()))
    return scores


def score_problem(s: dict) -> str:
    """'' if the score entry is usable, else why not."""
    for a in AXES:
        v = s.get(a)
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not 0 <= v <= 1:
            return f"axis {a} is {v!r}"
    if s.get("hour") not in HOURS:
        return f"hour is {s.get('hour')!r}"
    if not (s.get("alt") or "").strip():
        return "no alt text"
    if not isinstance(s.get("people_identifiable"), bool):
        return "people_identifiable is not true/false"
    return ""


def plan(manifest: list, scores: dict, hold: set, existing_srcs: set) -> dict:
    add, held, skipped, already = [], [], [], []
    for m in manifest:
        name = m["file"]
        src = f"/photos/{name}"
        if src in existing_srcs:
            already.append(name)
            continue
        s = scores.get(name)
        if s is None:
            skipped.append({"file": name, "why": "not scored"})
            continue
        why = score_problem(s)
        if why:
            skipped.append({"file": name, "why": why})
            continue
        if not (m.get("place") or "").strip() or m.get("lat") is None or m.get("lon") is None:
            skipped.append({"file": name, "why": "no place"})
            continue
        if name in hold or s["people_identifiable"]:
            held.append(name)
            continue
        entry = {"src": src, "alt": s["alt"].strip(), "caption": m["caption"]}
        score = {a: round(float(s[a]), 2) for a in AXES}
        score["hour"] = s["hour"]
        score["place"] = {"name": m["place"], "lat": round(m["lat"], 2), "lon": round(m["lon"], 2)}
        score["notes"] = (s.get("notes") or "").strip()
        add.append({"file": name, "entry": entry, "score": score})
    return {"add": add, "held": held, "skipped": skipped, "already": already}


def write_json(path: Path, obj, like: str) -> None:
    text = json.dumps(obj, indent=1, ensure_ascii=False)
    if like.endswith("\n"):
        text += "\n"
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text)
    tmp.replace(path)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--export", required=True, type=Path, help="dir with the JPEGs and manifest.json")
    ap.add_argument("--scores", required=True, type=Path, help="dir of score *.json files")
    ap.add_argument("--hold", type=Path, help="JSON list of filenames to hold out")
    ap.add_argument("--repo", type=Path, default=Path(__file__).resolve().parent.parent)
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args(argv)

    data_p = args.repo / "v2" / "data.json"
    scores_p = args.repo / "v2" / "scores-photos.json"
    data_raw, scores_raw = data_p.read_text(), scores_p.read_text()
    data, site_scores = json.loads(data_raw), json.loads(scores_raw)

    manifest = json.loads((args.export / "manifest.json").read_text())
    hold = set(json.loads(args.hold.read_text())) if args.hold else set()
    p = plan(manifest, load_scores(args.scores), hold, {x["src"] for x in data["photos"]})

    missing = [a["file"] for a in p["add"] if not (args.export / a["file"]).is_file()]
    clash = [a["file"] for a in p["add"] if (args.repo / "photos" / a["file"]).exists()]
    if missing or clash:
        print(json.dumps({"error": "refusing", "missing_jpeg": missing, "file_exists_in_repo": clash}))
        return 1

    if not args.dry:
        for a in p["add"]:
            shutil.copy2(args.export / a["file"], args.repo / "photos" / a["file"])
            data["photos"].append(a["entry"])
            site_scores["photos"][a["entry"]["src"]] = a["score"]
        write_json(data_p, data, data_raw)
        write_json(scores_p, site_scores, scores_raw)

    print(json.dumps({"added": [a["file"] for a in p["add"]], "held_for_people": p["held"],
                      "skipped": p["skipped"], "already_there": p["already"],
                      "photos_in_rotation": len(data["photos"]), "dry": args.dry},
                     indent=1, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
