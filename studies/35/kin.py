#!/usr/bin/env python3
"""Study 26 (copied into 28, then 35): what each photograph looks like, region by region, so a facet's fragment can find the photograph that answers it.
Every photograph of v2/data.json, measured the way Study 13's features.py measures a whole picture (Lab lightness and colour,
the spread of lightness, edge energy by direction), but on a 6x4 grid of regions, cover-cropped to 3:2 as nothing is.
Also the ideas 21 read in it (ideas.json photos), and the month it was taken, from its own EXIF, where it has one. Writes kin.json beside this file.
Run: python3 studies/35/kin.py"""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
COLS, ROWS = 6, 4
MONTHS = 'January February March April May June July August September October November December'.split()


def lab(rgb):  # studies/13/features.py
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return 116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])


def region(L, a, b, mono):
    gy, gx = np.gradient(L)
    mag = np.hypot(gx, gy)
    ang = (np.degrees(np.arctan2(gy, gx)) + 180) % 180
    bins = []
    for centre in (90, 0):
        d = np.minimum(np.abs(ang - centre), 180 - np.abs(ang - centre))
        bins.append(float((mag * (d < 22.5)).sum()))
    tot = float(mag.sum()) or 1.0
    return [round(float(L.mean()), 1), 0.0 if mono else round(float(a.mean()), 1), 0.0 if mono else round(float(b.mean()), 1),
            round(float(L.std()), 1), round(bins[0] / tot, 2), round(bins[1] / tot, 2), round(float(mag.mean()), 2)]


def month(im):
    e = im.getexif()
    dt = e.get_ifd(0x8769).get(36867) or e.get(306)
    try:
        y, m = str(dt).split(':')[:2]
        return f'{MONTHS[int(m) - 1]} {int(y)}'
    except Exception:
        return None


IDEAS = json.loads((ROOT / 'studies/21/ideas.json').read_text())  # 21's hand reading: the ideas each photograph holds


def main():
    data = json.loads((ROOT / 'v2/data.json').read_text())
    out = {}
    for p in data['photos']:
        im0 = Image.open(ROOT / p['src'].lstrip('/'))
        when = month(im0)
        im = ImageOps.fit(ImageOps.exif_transpose(im0).convert('RGB'), (COLS * 24, ROWS * 24), Image.LANCZOS)
        mono = 'Monochrome' in (p.get('caption') or '')
        L, a, b = lab(np.asarray(im, dtype=np.float64))
        cells = [region(L[r * 24:(r + 1) * 24, c * 24:(c + 1) * 24], a[r * 24:(r + 1) * 24, c * 24:(c + 1) * 24], b[r * 24:(r + 1) * 24, c * 24:(c + 1) * 24], mono)
                 for r in range(ROWS) for c in range(COLS)]
        slug = p['src'].split('/')[-1].rsplit('.', 1)[0]
        out[p['src']] = {'when': when, 'mono': mono, 'concepts': IDEAS['photos'].get(slug, '').split(), 'cells': cells}
    (HERE / 'kin.json').write_text(json.dumps({'made_by': 'studies/26/kin.py', 'grid': [COLS, ROWS],
        'cell': ['L', 'a', 'b', 'contrast', 'horizontal', 'vertical', 'density'], 'photos': out}, separators=(',', ':')))
    print(len(out), 'photographs,', sum(1 for v in out.values() if v['when']), 'dated')


main()
