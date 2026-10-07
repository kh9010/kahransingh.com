# Gather step 1: parse saved Awwwards listing pages (dl/*.html, fetched with curl) into aww.json. Run from a scratch dir.
import re,html,json,sys,glob
out={}
for f in sorted(glob.glob('dl/*.html')):
    if 'sotd1' not in f and not f.startswith('dl/websites'): continue
    s=open(f).read()
    chunks=s.split('<li class="col-3 js-collectable"')[1:]
    slugs=[]
    for c in chunks:
        m=re.search(r'data-collectable-model-value="([^"]*)"',c)
        if not m: continue
        model=json.loads(html.unescape(m.group(1)))
        u=re.search(r'class="figure-rollover__bt"\s+href="([^"]+)"',c)
        aw=re.search(r'card-site__awards">(.*?)</div>\s*</div>',c,re.S)
        awards=re.findall(r"budget-tag--(\w+)",c)
        if not u: continue
        slugs.append(model['slug'])
        d=out.setdefault(model['slug'],{'slug':model['slug'],'title':html.unescape(model['title']),'url':u.group(1),'tags':model.get('tags',[]),'created':model.get('createdAt'),'awards':sorted(set(awards)),'lists':[]})
        d['lists'].append(f[3:-5])
    print(f, len(slugs), slugs[:3], file=sys.stderr)
json.dump(out,open('aww.json','w'),indent=1)
print(len(out))
