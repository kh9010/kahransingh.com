#!/usr/bin/env python3
"""Study 33: what is in each photograph, region by region, so the stone can be cut from it.
Every photograph of v2/data.json, read once, offline, at 256 px wide (numpy and PIL only):
  horizon  the strongest near-level straight line (a Hough vote of gradient aligned to the line), with the tone on each side
  line     the strongest straight line at any angle, when it is not the horizon
  masses   the photograph's light and dark masses (lightness, blurred, split into two or three tones by 1-D k-means, cleaned),
           and anchors along the borders between them: where, which way across, how strong the step in tone is there
  eye      where the eye goes: spectral-residual saliency blended with centre-surround contrast; the largest salient blob,
           its peak, its box and anchors along its outline
  edges    the photograph's own sharpest edges (gradient after non-maximum suppression), spaced out, strongest first
  light    where the light is: the brightest broad region, and its tone
  grids    tone mass, saliency and edge energy on a 24-column grid, so any point of the stone can say what lies under it
Coordinates are fractions of the whole photograph (u across, v down); directions are unit vectors in pixel space,
which the cover crop keeps (it only scales). Writes regions.json beside this file.
Run: python3 studies/33/build.py"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
AW = 256          # analysis width
GC = 24          # grid columns


def lab_l(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    y = c @ np.array([0.2126, 0.7152, 0.0722])
    f = np.where(y > 0.008856, np.cbrt(y), 7.787 * y + 16 / 116)
    return 116 * f - 16


def lab_ab(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])


def box(a, r):
    if r < 1:
        return a
    r = int(r)
    p = np.pad(a, r, mode='edge')
    c = p.cumsum(0).cumsum(1)
    c = np.pad(c, ((1, 0), (1, 0)))
    k = 2 * r + 1
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)


def blur(a, r):
    for _ in range(3):
        a = box(a, r)
    return a


def norm01(a):
    lo, hi = float(a.min()), float(a.max())
    return (a - lo) / (hi - lo) if hi > lo else a * 0


def grid_digits(a, rows):
    h, w = a.shape
    out = []
    for r in range(rows):
        y0, y1 = int(r * h / rows), max(int(r * h / rows) + 1, int((r + 1) * h / rows))
        row = ''
        for c in range(GC):
            x0, x1 = int(c * w / GC), max(int(c * w / GC) + 1, int((c + 1) * w / GC))
            row += str(int(min(9, max(0, round(float(a[y0:y1, x0:x1].mean()) * 9)))))
        out.append(row)
    return out


def grid_labels(lab, rows):
    h, w = lab.shape
    out = []
    for r in range(rows):
        y0, y1 = int(r * h / rows), max(int(r * h / rows) + 1, int((r + 1) * h / rows))
        row = ''
        for c in range(GC):
            x0, x1 = int(c * w / GC), max(int(c * w / GC) + 1, int((c + 1) * w / GC))
            row += str(int(np.bincount(lab[y0:y1, x0:x1].ravel()).argmax()))
        out.append(row)
    return out


def spaced(cands, gap, cap):
    """cands: rows (x, y, ...score last), strongest first; keep those at least gap px from every kept one"""
    keep = []
    for c in cands:
        if all((c[0] - k[0]) ** 2 + (c[1] - k[1]) ** 2 >= gap * gap for k in keep):
            keep.append(c)
            if len(keep) >= cap:
                break
    return keep


def hough(L, mag, gx, gy, thetas):
    h, w = L.shape
    ys, xs = np.nonzero(mag > np.percentile(mag, 88))
    m = mag[ys, xs]
    gang = np.arctan2(gy[ys, xs], gx[ys, xs])
    diag = int(np.ceil(np.hypot(w, h)))
    best = None
    for th in thetas:
        t = np.radians(th)
        nx, ny = np.cos(t), np.sin(t)                    # the line's normal
        align = np.abs(np.cos(gang - t))                 # gradient across the line, not along it
        rho = np.round(xs * nx + ys * ny).astype(int) + diag
        acc = np.bincount(rho, weights=m * align ** 4, minlength=2 * diag + 1)
        acc = np.convolve(acc, [0.25, 0.5, 0.25], mode='same')
        k = int(acc.argmax())
        if best is None or acc[k] > best[0]:
            best = (float(acc[k]), th, k - diag)
    return best


def line_of(L, mag, gx, gy, thetas, ref):
    h, w = L.shape
    got = hough(L, mag, gx, gy, thetas)
    if not got:
        return None
    votes, th, rho = got
    t = np.radians(th)
    nx, ny = np.cos(t), np.sin(t)
    # where the line crosses the frame
    pts = []
    for x in (0, w - 1):
        if abs(ny) > 1e-6:
            y = (rho - x * nx) / ny
            if 0 <= y <= h - 1:
                pts.append((x, y))
    for y in (0, h - 1):
        if abs(nx) > 1e-6:
            x = (rho - y * ny) / nx
            if 0 <= x <= w - 1:
                pts.append((x, y))
    pts = sorted(set((round(a, 2), round(b, 2)) for a, b in pts))
    if len(pts) < 2:
        return None
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    length = np.hypot(x1 - x0, y1 - y0)
    if length < 0.3 * min(w, h):
        return None
    yy, xx = np.mgrid[0:h, 0:w]
    side = xx * nx + yy * ny - rho
    band = max(4, int(0.08 * h))
    A = L[(side < 0) & (side > -band)]
    B = L[(side > 0) & (side < band)]
    if len(A) < 20 or len(B) < 20:
        return None
    score = votes / (length * ref)
    return {'p0': [round(x0 / w, 4), round(y0 / h, 4)], 'p1': [round(x1 / w, 4), round(y1 / h, 4)],
            'n': [round(nx, 4), round(ny, 4)], 'angle': round(float((th - 90 + 90) % 180 - 90), 1),
            'score': round(float(score), 3), 'toneA': round(float(A.mean()), 1), 'toneB': round(float(B.mean()), 1),
            'step': round(float(abs(A.mean() - B.mean())), 1)}


def kmeans1(v, k, it=30):
    cs = np.percentile(v, np.linspace(15, 85, k))
    for _ in range(it):
        lab = np.abs(v[:, None] - cs[None, :]).argmin(1)
        new = np.array([v[lab == j].mean() if (lab == j).any() else cs[j] for j in range(k)])
        if np.allclose(new, cs):
            break
        cs = new
    order = np.argsort(cs)
    return cs[order], order


def components(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask, bool)
    best = []
    for y0 in range(h):
        for x0 in range(w):
            if mask[y0, x0] and not seen[y0, x0]:
                st, comp = [(y0, x0)], []
                seen[y0, x0] = True
                while st:
                    y, x = st.pop()
                    comp.append((y, x))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not seen[yy, xx]:
                            seen[yy, xx] = True
                            st.append((yy, xx))
                if len(comp) > len(best):
                    best = comp
    return best


def analyse(path, mono):
    im = Image.open(path).convert('RGB')
    W0, H0 = im.size
    h = round(AW * H0 / W0)
    rgb = np.asarray(im.resize((AW, h), Image.LANCZOS), dtype=np.float64)
    L = lab_l(rgb)
    a, b = lab_ab(rgb)
    w = AW
    rows = max(8, round(GC * h / w))
    Ls = blur(L, 1)
    gy, gx = np.gradient(Ls)
    mag = np.hypot(gx, gy)
    ref = float(np.percentile(mag, 99)) or 1.0

    # straight lines: the horizon (normal within 20 degrees of vertical) and the strongest of any angle
    horizon = line_of(Ls, mag, gx, gy, list(range(70, 111)), ref)
    line = line_of(Ls, mag, gx, gy, list(range(0, 180, 2)), ref)
    if line and horizon and abs(line['angle'] - horizon['angle']) < 8 and abs(line['p0'][1] - horizon['p0'][1]) < .06:
        line = None

    # light and dark masses
    Lb = blur(L, max(2, w // 60))
    spread = float(Lb.std())
    k = 3 if spread > 9 else 2
    cs, order = kmeans1(Lb.ravel(), k)
    lab = np.abs(Lb[..., None] - cs[None, None, :]).argmin(2)
    for _ in range(3):  # majority clean-up
        votes = np.stack([box((lab == j).astype(float), 2) for j in range(k)])
        lab = votes.argmax(0)
    names = ['dark', 'light'] if k == 2 else ['dark', 'mid', 'light']
    areas = [round(float((lab == j).mean()), 3) for j in range(k)]
    tones = [round(float(L[lab == j].mean()), 1) if (lab == j).any() else round(float(cs[j]), 1) for j in range(k)]
    Lg = blur(L, max(2, w // 80))
    ggy, ggx = np.gradient(Lg)
    gm = np.hypot(ggx, ggy) + 1e-9
    edge = np.zeros_like(lab, bool)
    edge[:, :-1] |= lab[:, :-1] != lab[:, 1:]
    edge[:-1, :] |= lab[:-1, :] != lab[1:, :]
    ys, xs = np.nonzero(edge)
    cands = []
    for y, x in zip(ys, xs):
        if x < 2 or y < 2 or x > w - 3 or y > h - 3:
            continue
        nx, ny = ggx[y, x] / gm[y, x], ggy[y, x] / gm[y, x]   # pointing toward the lighter side
        r = 4
        xa, ya = int(round(x - nx * r)), int(round(y - ny * r))
        xb, yb = int(round(x + nx * r)), int(round(y + ny * r))
        if not (0 <= xa < w and 0 <= xb < w and 0 <= ya < h and 0 <= yb < h):
            continue
        step = float(Lb[yb, xb] - Lb[ya, xa])
        if step < 3:
            continue
        cands.append((x, y, nx, ny, int(lab[ya, xa]), int(lab[yb, xb]), step))
    cands.sort(key=lambda c: -c[-1])
    mass_anchors = [[round(x / w, 3), round(y / h, 3), round(nx, 2), round(ny, 2), names[la], names[lb2], round(s, 1)]
                    for x, y, nx, ny, la, lb2, s in spaced(cands, 0.04 * w, 40)]

    # where the eye goes
    sw = 64
    sh = max(8, round(sw * h / w))
    Ls64 = np.asarray(Image.fromarray(L.astype(np.float32)).resize((sw, sh), Image.BILINEAR), dtype=np.float64)
    F = np.fft.fft2(Ls64)
    amp, ph = np.log(np.abs(F) + 1e-9), np.angle(F)
    sr = np.abs(np.fft.ifft2(np.exp(amp - box(amp, 1) + 1j * ph))) ** 2
    sr = norm01(blur(sr, 1))
    cs_ = np.hypot(L - blur(L, w // 10), 0 if mono else np.hypot(a - blur(a, w // 10), b - blur(b, w // 10)))
    cs64 = norm01(np.asarray(Image.fromarray(cs_.astype(np.float32)).resize((sw, sh), Image.BILINEAR), dtype=np.float64))
    yy, xx = np.mgrid[0:sh, 0:sw]
    taper = np.clip(np.minimum.reduce([xx + .5, sw - .5 - xx, yy + .5, sh - .5 - yy]) / (0.08 * sw), 0, 1)  # the FFT wraps at the frame: its seam is not something in the photograph
    sal = norm01(blur(0.5 * sr + 0.5 * cs64, 1) * taper)
    mask = sal > max(0.45, float(np.percentile(sal, 90)))
    comp = components(mask)
    eye = None
    if comp:
        cy = np.array([p[0] for p in comp]); cx = np.array([p[1] for p in comp])
        pk = int(np.argmax([sal[y, x] for y, x in comp]))
        blob = np.zeros_like(mask)
        blob[cy, cx] = True
        sgy, sgx = np.gradient(blur(blob.astype(float), 1))
        out = []
        for y, x in comp:
            if any(not (0 <= y + dy < sh and 0 <= x + dx < sw) or not blob[y + dy, x + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                g = np.hypot(sgx[y, x], sgy[y, x]) or 1
                out.append(((x + .5) / sw * w, (y + .5) / sh * h, -sgx[y, x] / g, -sgy[y, x] / g, float(sal[y, x])))
        out.sort(key=lambda c: -c[-1])
        eye = {'peak': [round((cx[pk] + .5) / sw, 4), round((cy[pk] + .5) / sh, 4)],
               'centre': [round(float(cx.mean() + .5) / sw, 4), round(float(cy.mean() + .5) / sh, 4)],
               'box': [round(float(cx.min()) / sw, 4), round(float(cy.min()) / sh, 4), round(float(cx.max() + 1) / sw, 4), round(float(cy.max() + 1) / sh, 4)],
               'share': round(len(comp) / (sw * sh), 4),
               'strength': round(float(sal[cy, cx].mean()), 3),
               'outline': [[round(x / w, 3), round(y / h, 3), round(nx, 2), round(ny, 2)] for x, y, nx, ny, _ in spaced(out, 0.035 * w, 24)]}

    # the photograph's own sharpest edges
    ang = (np.degrees(np.arctan2(gy, gx)) + 180) % 180
    q = (np.round(ang / 45) % 4).astype(int)
    nms = np.zeros_like(mag, bool)
    offs = {0: (0, 1), 1: (1, 1), 2: (1, 0), 3: (1, -1)}
    for d, (dy, dx) in offs.items():
        sel = q == d
        f = np.roll(np.roll(mag, -dy, 0), -dx, 1)
        bk = np.roll(np.roll(mag, dy, 0), dx, 1)
        nms |= sel & (mag >= f) & (mag >= bk)
    nms[:2] = nms[-2:] = False
    nms[:, :2] = nms[:, -2:] = False
    ys, xs = np.nonzero(nms & (mag > np.percentile(mag, 90)))
    order_ = np.argsort(-mag[ys, xs])
    ec = [(float(xs[i]), float(ys[i]), gx[ys[i], xs[i]] / (mag[ys[i], xs[i]] + 1e-9), gy[ys[i], xs[i]] / (mag[ys[i], xs[i]] + 1e-9), float(mag[ys[i], xs[i]] / ref)) for i in order_[:6000]]
    edge_anchors = [[round(x / w, 3), round(y / h, 3), round(nx, 2), round(ny, 2), round(m, 2)] for x, y, nx, ny, m in spaced(ec, 0.045 * w, 40)]

    # where the light is
    Lbig = blur(L, w // 14)
    ly, lx = np.unravel_index(int(Lbig.argmax()), Lbig.shape)
    top = L >= np.percentile(L, 95)
    ty, tx = np.nonzero(top)
    light = {'peak': [round((lx + .5) / w, 4), round((ly + .5) / h, 4)], 'tone': round(float(Lbig[ly, lx]), 1),
             'brightest': [round(float(tx.mean() + .5) / w, 4), round(float(ty.mean() + .5) / h, 4)]}

    return {'a': round(W0 / H0, 4), 'rows': rows, 'mono': bool(mono), 'tone': round(float(L.mean()), 1), 'spread': round(spread, 1),
            'horizon': horizon, 'line': line,
            'masses': {'names': names, 'tones': tones, 'areas': areas, 'anchors': mass_anchors, 'grid': grid_labels(lab, rows)},
            'eye': eye, 'edges': {'anchors': edge_anchors, 'grid': grid_digits(norm01(blur(mag, 2)), rows)},
            'salience': grid_digits(np.asarray(Image.fromarray(sal.astype(np.float32)).resize((w, h), Image.BILINEAR)), rows),
            'light': light}


def main():
    data = json.loads((ROOT / 'v2/data.json').read_text())
    kin = json.loads((ROOT / 'studies/28/kin.json').read_text())['photos'] if (ROOT / 'studies/28/kin.json').exists() else {}
    out = {}
    for p in data['photos']:
        src = p['src']
        mono = (kin.get(src) or {}).get('mono', 'Monochrome' in (p.get('caption') or ''))
        out[src] = analyse(ROOT / src.lstrip('/'), mono)
        r = out[src]
        print(f"{src:52s} horizon {r['horizon'] and r['horizon']['score']}  line {r['line'] and r['line']['score']}  masses {len(r['masses']['anchors'])}  eye {r['eye'] and r['eye']['share']}  edges {len(r['edges']['anchors'])}")
    doc = {'made_by': 'studies/33/build.py', 'analysis_width': AW, 'grid_columns': GC, 'photos': out}
    (HERE / 'regions.json').write_text(json.dumps(doc, separators=(',', ':')))
    print('wrote', HERE / 'regions.json', (HERE / 'regions.json').stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
