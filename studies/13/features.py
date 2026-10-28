#!/usr/bin/env python3
"""features.py — what each picture in the photography walk looks like, as numbers.

Reads the walk's own catalogue (`allPhotos` in /photography.html, the one list), opens each
file the way a browser shows it (EXIF turn applied), and measures a 128px copy:

  tone     mean lightness (Lab L, 0-100) and its spread (contrast)
  colour   mean a/b (Lab), mean chroma, a 12-bin hue histogram weighted by chroma, mono flag
  lines    edge energy by direction (horizontal, vertical, two diagonals) and edge density
  horizon  height (0 top .. 1 bottom) of the strongest band of horizontal edges, and how strong
  layout   an 8x8 grid of lightness, mean removed (where the mass sits)
  subject  word groups from the alt text (trees, water, a path, night ...)
  place    from the home page's caption when the picture is also on the home (26 of 71)

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

# The alt text is the public description; eight files' alt texts describe other pictures
# (seen 2026-10-28 on a contact sheet). The subject words below use what is in the frame.
SUBJECT_FIX = {
    "spotted-deer-D8AE667C.jpg": "light reflected on a wet beach at dusk",
    "sea-cliff-8632EF29.jpg": "stone stair and railing up a cliff to a temple",
    "poppy-macro-2B2A81D7.jpg": "sunset over the sea, a figure on the beach at dusk",
    "langur-climbing-9B6D6B84.jpg": "sunset over the sea, a figure on the beach at dusk",
    "firework-burst-5004742B.jpg": "a person in silhouette against the sea at dusk",
    "langur-sitting-6C239336.jpg": "a person in a hood drinking from a cup in a room",
    "beach-reflection-DDAF92C4.jpg": "a person beside a painted temple spire",
    "diwali-gifts-7E597412.jpg": "two people in a living room",
}

GROUPS = {
    "trees": "tree trees pine pines cypress banyan forest jungle juniper palm foliage reeds",
    "water": "lake sea water river sound beach reflection reflected kayak creek stream shoreline riverfront surfers waves wet",
    "a path": "path boardwalk walkway trail staircase stair stairs bridge corridor tunnel sidewalk hallway",
    "night": "night fireworks firework lanterns",
    "dusk": "dusk sunset silhouette",
    "flowers": "lilies geranium poppy chive flowers lavender bougainvillea leaves berries plant",
    "animals": "gull langur deer sheep monkey",
    "mountains": "mountain mountains summit pass valley canyon cliff hillside volcanic glacial alpine snowy",
    "street": "street plaza market sidewalk cart scooter van jeep porsche winnebago",
    "people": "figure person people surfers friends vendors",
    "indoors": "museum gallery kitchen restaurant room hallway sculpture quilt interior",
    "temples": "temple spire buddha",
}
WORD2GROUP = {w: g for g, ws in GROUPS.items() for w in ws.split()}


def catalogue():
    html = (ROOT / "photography.html").read_text()
    rows = re.findall(r"\{ f: '([^']+)', c: '([^']+)', alt: '([^']+)', w: (\d+), h: (\d+) \}", html)
    return [dict(f=f, c=c, alt=alt, w=int(w), h=int(h)) for f, c, alt, w, h in rows]


def places():
    data = json.loads((ROOT / "v2/data.json").read_text())
    out = {}
    for p in data["photos"]:
        cap = p.get("caption") or ""
        if " — " in cap:
            out[p["src"].rsplit("/", 1)[-1]] = cap.split(" — ")[0].strip()
    return out


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
    pl = places()
    out = []
    for p in catalogue():
        f = measure(ROOT / "photos" / p["f"])
        out.append(dict(f=p["f"], c=p["c"], alt=p["alt"], w=p["w"], h=p["h"],
                        place=pl.get(p["f"]), subject=subjects(SUBJECT_FIX.get(p["f"], p["alt"])), **f))
    text = json.dumps({"made_by": "studies/13/features.py", "photos": out}, separators=(",", ":")) + "\n"
    if "--check" in sys.argv:
        if OUT.read_text() != text:
            sys.exit("features.json is stale: run python3 studies/13/features.py")
        print(f"{len(out)} photographs, features.json current")
        return
    OUT.write_text(text)
    print(f"{len(out)} photographs -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
