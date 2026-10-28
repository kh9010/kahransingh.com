# Gather step 2: aww.json + dl/ gallery pages + hand.txt -> cands.json. Run from the same scratch dir.
import json,hashlib,re,glob
aww=json.load(open('aww.json'))
quota={'websites_personal_':12,'websites_poetry_':5,'websites_writer_':4,'websites_editorial_':2,'websites_photography_':9,
 'sotd1':8,'websites_sites_of_the_month_':6,'websites_typography_':5,'websites_storytelling_':4,'websites_experimental_':5,
 'websites_art-illustration_':4,'websites_blog_':3,'websites_culture-education_':4,'websites_minimal_':3,'websites_honorable_':3}
LBL={'sotd':'Site of the Day','sotm':'Site of the Month','soty':'Site of the Year','hm':'Honorable Mention','dev':'Developer Award','ah':'Honors'}
order={}
for slug,d in aww.items():
    for l in d['lists']: order.setdefault(l,[]).append(slug)
cands=[];seen=set()
def add(url,name,source,meta=''):
    key=re.sub(r'^https?://(www\.)?','',url).rstrip('/').lower()
    if key in seen: return
    seen.add(key)
    cands.append({'id':hashlib.sha1(key.encode()).hexdigest()[:8],'url':url,'name':name,'source':source,'meta':meta})
for l,n in quota.items():
    taken=0
    for slug in order.get(l,[]):
        if taken>=n: break
        d=aww[slug]
        if 'essay-writer' in slug: continue
        before=len(cands)
        add(d['url'],d['title'],'Awwwards',' · '.join([LBL.get(a,a) for a in d['awards'] if a!='dev'] or ['Nominee']) + ' · ' + l.replace('websites_','').strip('_').replace('sotd1','sites_of_the_day').replace('_',' '))
        if len(cands)>before: taken+=1
hover=re.findall(r'href="(https?://[^"]+)"',open('dl/hover.html').read())
for u in sorted(set(hover))[:15]:
    if 'iubenda' in u: continue
    add(u,re.sub(r'^https?://(www\.)?','',u).rstrip('/'),'Hoverstates')
for u in re.findall(r'href="(https?://[^"]+)\?ref=minimal\.gallery"',open('dl/minimal.html').read())[:10]:
    add(u,re.sub(r'^https?://(www\.)?','',u).rstrip('/'),'minimal.gallery')
for f in sorted(glob.glob('dl/opl_*.html')):
    for u in re.findall(r'href="(https?://[^"]+?)\?ref=onepagelove"',open(f).read())[:4]:
        add(u,re.sub(r'^https?://(www\.)?','',u).rstrip('/'),'One Page Love', f.split('genre_')[1][:-5].replace('_page_2','').replace('_',' '))
for line in open('hand.txt'):
    line=line.strip()
    if not line or line.startswith('#'): continue
    u,kind=line.split(' ',1)
    add(u,re.sub(r'^https?://(www\.)?','',u).rstrip('/'),'Gathered',kind)
json.dump(cands,open('cands.json','w'),indent=1)
import collections;print(len(cands),collections.Counter(c['source'] for c in cands))
