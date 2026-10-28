#!/usr/bin/env python3
"""features.py — what each picture in the photography walk looks like, as numbers.

Reads the walk's own catalogue (`allPhotos` in /photography.html, the one list), opens each
file the way a browser shows it (EXIF turn applied), and measures a 128px copy:

  tone     mean lightness (Lab L, 0-100) and its spread (contrast)
  colour   mean a/b (Lab), mean chroma, a 12-bin hue histogram weighted by chroma, mono flag
  lines    edge energy by direction (horizontal, vertical, two diagonals) and edge density
  horizon  height (0 top .. 1 bottom) of the strongest band of horizontal edges, and how strong
  layout   an 8x8 grid of lightness, mean removed (where the mass sits)
  subject  word groups from the scoring's notes (trees, water, a path, night ...)
  place    the scoring's place name; hour (dawn, day, dusk, night) likewise

Writes studies/13/features.json. Deterministic, no model, no network.
Run: python3 studies/13/features.py          (--check: exit 1 if features.json would change)
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).with_name("features.json")
THUMBS = Path(__file__).with_name("thumbs")   # 96px copies for the graph view

# What is in the frame comes from the site's own photo scoring, not from alt text:
# v2/scores-photos.json (the daily pick's file: seven axes, hour, place, notes) covers 26 of the
# walk's 71; the other 45 were scored in the same shape for this study only
# (studies/13/scores-study.json, not in the daily rotation). Alt text is the fallback.
SCORE_FILES = (ROOT / "v2/scores-photos.json", Path(__file__).with_name("scores-study.json"))

GROUPS = {
    "trees": "tree trees pine pines cypress banyan forest jungle juniper palm foliage reeds",
    "water": "lake sea water river sound beach reflection reflected kayak kayaks creek stream shoreline riverfront riverside surfers waves wet pool tetrapods",
    "a path": "path boardwalk walkway walk trail staircase stair stairs bridge footbridge corridor tunnel sidewalk hallway",
    "night": "night fireworks firework lanterns",
    "dusk": "dusk sunset silhouette",
    "flowers": "lilies geranium poppy chive flowers lavender bougainvillea leaves berries plant coleus",
    "animals": "gull langur deer sheep monkey",
    "mountains": "mountain mountains summit pass valley canyon cliff hillside volcanic glacial alpine snowy",
    "street": "street plaza market sidewalk cart scooter van jeep porsche winnebago",
    "people": "figure figures person people someone man hiker walkers visitors visitor couple surfers friends vendors",
    "indoors": "museum gallery kitchen restaurant room hallway sculpture quilt interior inside",
    "temples": "temple spire buddha monastery",
}
WORD2GROUP = {w: g for g, ws in GROUPS.items() for w in ws.split()}


def catalogue():
    html = (ROOT / "photography.html").read_text()
    rows = re.findall(r"\{ f: '([^']+)', c: '([^']+)', alt: '([^']+)', w: (\d+), h: (\d+) \}", html)
    return [dict(f=f, c=c, alt=alt, w=int(w), h=int(h)) for f, c, alt, w, h in rows]


def scores():
    out = {}
    for f in SCORE_FILES:
        for k, v in json.loads(f.read_text())["photos"].items():
            out.setdefault(k.rsplit("/", 1)[-1], v)
    return out


def place_name(score):
    name = ((score or {}).get("place") or {}).get("name")
    return name.split(",")[-1].strip() if name else None   # "Roma Norte, Mexico City" -> "Mexico City"


def lab(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    a = 500 * (f[..., 0] - f[..., 1])
    b = 200 * (f[..., 1] - f[..., 2])
    return L, a, b


def thumb(path):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    im.thumbnail((96, 96), Image.LANCZOS)
    THUMBS.mkdir(exist_ok=True)
    im.save(THUMBS / path.name, quality=82)


def measure(path):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    im.thumbnail((128, 128), Image.LANCZOS)
    rgb = np.asarray(im, dtype=np.float64)
    L, a, b = lab(rgb)
    chroma = np.hypot(a, b)
    hue = (np.degrees(np.arctan2(b, a)) + 360) % 360
    hist = np.bincount((hue // 30).astype(int).ravel() % 12, weights=chroma.ravel(), minlength=12)
    hist = hist / hist.sum() if hist.sum() > 0 else hist
    # edges on lightness
    gy, gx = np.gradient(L)
    mag = np.hypot(gx, gy)
    ang = (np.degrees(np.arctan2(gy, gx)) + 180) % 180   # gradient direction; an edge runs across it
    # gradient near 90 deg = a horizontal edge; near 0/180 = a vertical edge
    bins = np.zeros(4)
    for k, centre in enumerate((90, 0, 45, 135)):
        d = np.minimum(np.abs(ang - centre), 180 - np.abs(ang - centre))
        bins[k] = (mag * (d < 22.5)).sum()
    orient = bins / bins.sum() if bins.sum() else bins
    density = float(mag.mean())
    rows = np.abs(gy).mean(axis=1)
    rows = np.convolve(rows, np.ones(5) / 5, mode="same")
    edge = slice(4, len(rows) - 4)                         # ignore the frame's own border
    r = rows[edge]
    hy = (int(np.argmax(r)) + 4) / len(rows)
    hstrength = float(r.max() / (r.mean() + 1e-9))
    g = np.asarray(Image.fromarray(L.astype(np.float32)).resize((8, 8), Image.BILINEAR), dtype=np.float64)
    layout = (g - g.mean()) / 100
    # where the dark mass sits: centroid of (100 - L)
    ys, xs = np.mgrid[0:L.shape[0], 0:L.shape[1]]
    wdark = (100 - L) ** 2
    cx = float((xs * wdark).sum() / wdark.sum() / (L.shape[1] - 1))
    cy = float((ys * wdark).sum() / wdark.sum() / (L.shape[0] - 1))
    return dict(
        L=round(float(L.mean()), 2), contrast=round(float(L.std()), 2),
        a=round(float(a.mean()), 2), b=round(float(b.mean()), 2), chroma=round(float(chroma.mean()), 2),
        hue=[round(float(x), 3) for x in hist], mono=bool(chroma.mean() < 4),
        orient=[round(float(x), 3) for x in orient], density=round(density, 2),
        horizon=round(hy, 3), hstrength=round(hstrength, 2),
        layout=[round(float(x), 3) for x in layout.ravel()],
        mass=[round(cx, 3), round(cy, 3)],
    )


def subjects(text):
    words = re.findall(r"[a-z]+", text.lower())
    return sorted({WORD2GROUP[w] for w in words if w in WORD2GROUP})


def main():
    sc = scores()
    out = []
    for p in catalogue():
        f = measure(ROOT / "photos" / p["f"])
        s = sc.get(p["f"])
        out.append(dict(f=p["f"], c=p["c"], alt=p["alt"], w=p["w"], h=p["h"],
                        place=place_name(s), hour=(s or {}).get("hour"), notes=(s or {}).get("notes"),
                        scored=s is not None, subject=subjects(s["notes"] if s else p["alt"]), **f))
    text = json.dumps({"made_by": "studies/13/features.py", "photos": out}, separators=(",", ":")) + "\n"
    if "--check" in sys.argv:
        if OUT.read_text() != text:
            sys.exit("features.json is stale: run python3 studies/13/features.py")
        missing = [p["f"] for p in out if not (THUMBS / p["f"]).exists()]
        if missing:
            sys.exit(f"{len(missing)} thumbs missing: run python3 studies/13/features.py")
        print(f"{len(out)} photographs, features.json and thumbs current")
        return
    for p in out:
        thumb(ROOT / "photos" / p["f"])
    OUT.write_text(text)
    print(f"{len(out)} photographs -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
