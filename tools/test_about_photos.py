"""Static contracts for the About + Photos entry points (stdlib only)."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, name):
        super().__init__()
        self.tags = []
        self.text = []
        self.excluded = 0
        self.feed((ROOT / name).read_text())

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'):
            self.excluded += 1
        if not self.excluded:
            self.tags.append((tag, dict(attrs)))

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'):
            self.excluded -= 1

    def handle_data(self, data):
        if not self.excluded:
            self.text.append(data)


class AboutPhotosTests(unittest.TestCase):
    def test_home_links_to_about_and_photos_without_javascript(self):
        links = {attrs.get('href') for tag, attrs in Page('index.html').tags if tag == 'a'}
        self.assertTrue({'/about.html', '/photography.html'} <= links)

    def test_old_about_stays_openable_as_v1_with_its_copy(self):
        # The pre-desk About moved to /v1/about.html on 2026-10-28 (picked from Study 09).
        page = Page('v1/about.html')
        text = ''.join(page.text)
        self.assertIn('Kahran Singh is a storyteller, poet, and creative consultant', text)
        self.assertIn('Sometimes I smile at myself (in the mirror)', text)
        links = {attrs.get('href') for tag, attrs in Page('v1/index.html').tags if tag == 'a'}
        self.assertIn('/v1/about.html', links)

    def test_desk_about_stays_openable_at_v2_with_its_copy(self):
        # The desk's About (picked from Study 09 on 2026-10-28) moved to /v2/about.html on 2026-11-09,
        # when about.html became Study 27 a. It reads without JS and returns to the v2 home.
        page = Page('v2/about.html')
        text = ''.join(page.text)
        self.assertIn('Hello. I’m Kahran.', text)
        self.assertIn('Write to me. Especially if you are drawing up your own contract with the world', text)
        self.assertIn('Tell me what’s going on.', text)
        self.assertNotIn('data-count', (ROOT / 'v2/about.html').read_text())
        # 28 Oct: the word pile came back; without JS it shows one of its six quotes.
        self.assertIn('Sometimes I smile at myself (in the mirror)', text)
        self.assertNotIn('lenticular', (ROOT / 'v2/about.html').read_text())
        names = [attrs['href'] for tag, attrs in page.tags if tag == 'a' and
                 attrs.get('class') in ('nav-name', 'mobile-header')]
        self.assertEqual(names, ['/v2/', '/v2/'])
        links = {attrs.get('href') for tag, attrs in Page('v2/index.html').tags if tag == 'a'}
        self.assertIn('/v2/about.html', links)

    def test_about_is_27a_and_reads_without_javascript(self):
        # 2026-11-09: about.html is Study 27 a (Kahran's pick, 8 Nov), built by studies/27/build.mjs --about.
        page = Page('about.html')
        text = ' '.join(' '.join(page.text).split())
        self.assertIn('I make poems, photographs, tools and companies, and I am learning Kathak.', text)
        self.assertIn('Write to me. Especially if you are drawing up your own contract with the world', text)
        self.assertIn('Board of TomboyX', text)
        self.assertIn('How the World Works', text)
        hrefs = [attrs.get('href', '') for tag, attrs in page.tags if tag == 'a']
        self.assertFalse([h for h in hrefs if h.startswith('?')], 'no version switcher or ?tune on the live page')

    def test_about_returns_to_current_home_and_keeps_v1_accessible(self):
        tags = Page('about.html').tags
        names = [attrs['href'] for tag, attrs in tags if tag == 'a' and
                 attrs.get('class') in ('nav-name', 'mobile-header')]
        self.assertEqual(names, ['/', '/'])
        self.assertIn('/v1/', [attrs.get('href') for tag, attrs in tags if tag == 'a'])

    def test_photo_catalog_is_available_without_javascript(self):
        import re
        source = (ROOT / 'photography.html').read_text()
        catalog = re.findall(r"\{ f: '([^']+)', c: '[^']+', alt: '([^']+)'", source)
        images = [(attrs['src'].removeprefix('photos/'), attrs['alt'])
                  for tag, attrs in Page('photography.html').tags
                  if tag == 'img' and attrs.get('src', '').startswith('photos/')]
        self.assertTrue(catalog)
        self.assertEqual(images, catalog)
        for name, _ in images:
            self.assertTrue((ROOT / 'photos' / name).is_file(), name)

    def test_mono_alias_selects_existing_monochrome_catalog(self):
        import json
        import subprocess
        source = (ROOT / 'photography.html').read_text()
        script = source.split('const allPhotos = ', 1)[1].split('// Shuffle', 1)[0]
        result = subprocess.check_output([
            'node', '-e', "const window = {location: {search: '?camera=mono'}};"
            + 'const allPhotos = ' + script
            + 'console.log(JSON.stringify({actual: photos, expected: allPhotos.filter(p => p.c === "q2mono")}));'
        ], text=True)
        result = json.loads(result)
        self.assertTrue(result['expected'])
        self.assertEqual(result['actual'], result['expected'])

    def test_photo_camera_filters_are_discoverable(self):
        links = {attrs.get('href') for tag, attrs in Page('photography.html').tags if tag == 'a'}
        for camera in ('q2mono', 'q2', 'fuji', 'canon'):
            self.assertIn('/photography.html?camera=' + camera, links)


if __name__ == '__main__':
    unittest.main()
