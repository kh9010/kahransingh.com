"""Print studies/01/index.html in the shape the Artifact tool publishes (it adds its own doctype/head/body).
python3 artifact_page.py > <scratch>/inspiration-pile.html"""
import pathlib, re
s = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').read_text()
for pat in (r'<!doctype html>\s*', r'<html[^>]*>\s*', r'<head>\s*', r'<meta charset[^>]*>\s*', r'<meta name="viewport"[^>]*>\s*', r'</head>\s*', r'<body>\s*', r'\s*</body>\s*</html>\s*$'):
    s = re.sub(pat, '', s, count=1, flags=re.I)
print(s)
