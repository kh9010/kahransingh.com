#!/usr/bin/env python3
"""build.py — Study 21, the big ideas. Writes studies/21/doors.json (same shape as 15's, plus notes).

The judgements are data, not code:
  readings.txt  every poem, read whole: its candidate door lines in order of strength, each tagged
                with the fine-grained concepts it holds, and a note where the ideas strain
  ideas.json    the concepts; four vocabularies that group them differently and name them in a
                different kind (tensions, questions, nouns, his own phrases); the photographs,
                tagged by looking at each image

What the script does mechanically, and only this:
  - a phrase is matched to the poem's own characters (straight vs curly apostrophe only) and must sit
    inside one stanza; anything else that does not match fails the build
  - per vocabulary, a poem's doors are its candidates taken in order, each carrying the first of its
    concepts that this vocabulary names and that no earlier door in the poem has used, up to three
  - a photograph carries every idea its concepts map to

Run: python3 studies/21/build.py      then: node studies/21/check.mjs
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
APOS = {"'": "’", "’": "'"}


def find_verbatim(phrase, stanzas):
    """The phrase as written in one stanza (apostrophes may differ), or None."""
    tries = [phrase, phrase.replace("'", "’"), phrase.replace("’", "'"), "".join(APOS.get(c, c) for c in phrase)]
    for s in stanzas:
        for t in tries:
            if t in s:
                return t
    return None


def read_readings():
    poems, notes, slug = {}, {}, None
    for n, raw in enumerate((HERE / "readings.txt").read_text().splitlines(), 1):
        if not raw.strip() or raw.startswith("#"):
            continue
        if raw.startswith("@ "):
            slug = raw[2:].strip()
            poems[slug] = []
        elif raw.strip().startswith("note:"):
            notes[slug] = raw.strip()[5:].strip()
        else:
            phrase, tags = raw.rsplit("|", 1)
            poems[slug].append((phrase.strip().replace("\\n", "\n"), tags.split(), n))
    return poems, notes


def main():
    data = json.loads((ROOT / "v2/data.json").read_text())
    ideas = json.loads((HERE / "ideas.json").read_text())
    stanzas = {p["slug"]: p["stanzas"] for p in data["poems"]}
    srcs = {Path(p["src"]).stem: p["src"] for p in data["photos"]}
    concepts = ideas["concepts"]
    readings, notes = read_readings()
    errors = []

    for slug in set(stanzas) - set(readings):
        errors.append(f"poem not read: {slug}")
    for slug in set(readings) - set(stanzas):
        errors.append(f"unknown poem: {slug}")
    for slug, cands in readings.items():
        for phrase, tags, n in cands:
            for t in tags:
                if t not in concepts:
                    errors.append(f"readings.txt:{n}: unknown concept '{t}'")
    for stem in set(srcs) - set(ideas["photos"]):
        errors.append(f"photo not looked at: {stem}")
    for stem, tags in ideas["photos"].items():
        if stem not in srcs:
            errors.append(f"unknown photo: {stem}")
        for t in tags.split():
            if t not in concepts:
                errors.append(f"photo {stem}: unknown concept '{t}'")
    if errors:
        print("\n".join(errors)); sys.exit(1)

    out = {"made_by": "studies/21/build.py", "from": ["studies/21/readings.txt", "studies/21/ideas.json"],
           "concepts": concepts, "notes": {s: notes[s] for s in stanzas if s in notes}, "vocabs": {}}
    for vname, v in ideas["vocabs"].items():
        idea_of = {}
        for idea in v["ideas"]:
            for c in idea["concepts"]:
                if c in idea_of:
                    errors.append(f"{vname}: concept '{c}' in two ideas")
                idea_of[c] = idea["name"]
            if "from" in idea and find_verbatim(idea["name"], stanzas.get(idea["from"], [])) is None:
                errors.append(f"{vname}: '{idea['name']}' is not in {idea['from']}")
        poems, photos = {}, {}
        for slug in stanzas:
            doors, used = [], set()
            for phrase, tags, n in readings[slug]:
                if len(doors) == 3:
                    break
                word = next((idea_of[t] for t in tags if t in idea_of and idea_of[t] not in used), None)
                if word is None:
                    continue
                found = find_verbatim(phrase, stanzas[slug])
                if found is None:
                    errors.append(f"readings.txt:{n}: not in {slug}: {phrase!r}")
                    continue
                used.add(word)
                doors.append({"phrase": found, "word": word})
            if len(doors) < 2:
                errors.append(f"{vname}: {slug} has {len(doors)} door(s)")
            poems[slug] = doors
        for stem, tags in ideas["photos"].items():
            ws = []
            for t in tags.split():
                if t in idea_of and idea_of[t] not in ws:
                    ws.append(idea_of[t])
            if ws:
                photos[srcs[stem]] = ws
        words = []
        for idea in v["ideas"]:
            w = idea["name"]
            entry = {"word": w, "concepts": idea["concepts"],
                     "poems": [s for s, ds in poems.items() if any(d["word"] == w for d in ds)],
                     "photos": [s for s, ws in photos.items() if w in ws]}
            if "from" in idea:
                entry["from"] = idea["from"]
            if "strain" in idea:
                entry["strain"] = idea["strain"]
            if len(entry["poems"]) < 3:
                errors.append(f"{vname}: '{w}' reaches {len(entry['poems'])} poems")
            words.append(entry)
        out["vocabs"][vname] = {"label": v["label"], "words": words, "poems": poems, "photos": photos}
        if "left_out" in v:
            out["vocabs"][vname]["left_out"] = v["left_out"]
    if errors:
        print("\n".join(errors)); sys.exit(1)

    (HERE / "doors.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    for vname, v in out["vocabs"].items():
        nd = sum(len(d) for d in v["poems"].values())
        print(f"{vname}: {len(v['words'])} ideas, {nd} doors, {len(v['photos'])}/{len(srcs)} photos")
        for w in v["words"]:
            print(f"  {w['word']:<32} {len(w['poems']):>3} poems {len(w['photos']):>3} photos")


if __name__ == "__main__":
    main()
