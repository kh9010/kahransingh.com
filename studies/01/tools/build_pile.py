"""Build studies/01/pile.json + media/ from a capture run.
python3 build_pile.py <cands.json> <run dir> [drop-id:reason ...]
run dir = capture.cjs output (results.json + media/). Extra args drop captures that loaded but never rendered.
Phone stills are packed 20 to a sheet (media/phones-NN.jpg) so the artifact stays under its file cap."""
import json, shutil, subprocess, sys, pathlib
cands, run = json.load(open(sys.argv[1])), pathlib.Path(sys.argv[2])
manual = dict(a.split(':', 1) for a in sys.argv[3:])
res = json.load(open(run / 'results.json'))
here = pathlib.Path(__file__).resolve().parent.parent
media = here / 'media'
shutil.rmtree(media, ignore_errors=True); media.mkdir()
items, dropped = [], []
for c in cands:
    r = res.get(c['id'])
    if not r: continue
    why = manual.get(c['id']) or (None if r.get('ok') else r.get('err'))
    if why: dropped.append({'url': c['url'], 'source': c['source'], 'why': why}); continue
    items.append({k: c[k] for k in ('id', 'url', 'name', 'source', 'meta')})
    for ext in ('.jpg', '.mp4'):
        shutil.copy2(run / 'media' / (c['id'] + ext), media / (c['id'] + ext))
PER = 20
phones = [it for it in items if (run / 'media' / (it['id'] + '-m.jpg')).exists()]
for s in range(0, len(phones), PER):
    group = phones[s:s + PER]
    out = media / f'phones-{s // PER + 1:02d}.jpg'
    args = ['ffmpeg', '-v', 'error', '-y']
    for it in group: args += ['-i', str(run / 'media' / (it['id'] + '-m.jpg'))]
    args += ['-filter_complex', ''.join(f'[{i}:v]' for i in range(len(group))) + f'hstack=inputs={len(group)}' if len(group) > 1 else 'null', '-q:v', '5', str(out)]
    subprocess.run(args, check=True)
    for i, it in enumerate(group): it['phone'] = [out.name, i, len(group)]
json.dump({'seed': 20261007, 'gathered': '2026-10-07', 'items': items, 'dropped': dropped}, open(here / 'pile.json', 'w'), indent=1)
print(len(items), 'cards,', len(phones), 'phone stills,', len(dropped), 'dropped')
