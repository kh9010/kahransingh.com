"""Build studies/01/pile.json + media/ from a capture run.
python3 build_pile.py <cands.json> <run dir>   (run dir = capture.cjs output: results.json + media/)"""
import json, shutil, sys, pathlib
cands, run = json.load(open(sys.argv[1])), pathlib.Path(sys.argv[2])
res = json.load(open(run / 'results.json'))
here = pathlib.Path(__file__).resolve().parent.parent
media = here / 'media'; media.mkdir(exist_ok=True)
items, dropped = [], []
for c in cands:
    r = res.get(c['id'])
    if not r: continue
    if not r.get('ok'): dropped.append({'url': c['url'], 'source': c['source'], 'why': r.get('err')}); continue
    item = {k: c[k] for k in ('id', 'url', 'name', 'source', 'meta')}
    item['mobile'] = bool(r.get('mobile'))
    items.append(item)
    for ext in ('.jpg', '.mp4') + (('-m.jpg',) if item['mobile'] else ()):
        shutil.copy2(run / 'media' / (c['id'] + ext), media / (c['id'] + ext))
json.dump({'seed': 20261007, 'gathered': '2026-10-07', 'items': items, 'dropped': dropped}, open(here / 'pile.json', 'w'), indent=1)
print(len(items), 'cards,', len(dropped), 'dropped')
