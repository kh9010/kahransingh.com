"""Real Chrome acceptance checks. Serve repo, then run with Playwright installed.
BASE_URL defaults to http://127.0.0.1:8798; artifacts stay in .review/idea-details/.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.review' / 'idea-details'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:8798')
coverage = json.loads((ROOT / 'docs/idea-details-coverage.json').read_text()) if (ROOT / 'docs/idea-details-coverage.json').exists() else []
report = {'checks': [], 'screenshots': [], 'external_failures': []}
def passed(text):
    print('PASS ' + text, flush=True)
    report['checks'].append(text)
    (OUT / 'report.json').write_text(json.dumps(report, indent=2))
def shot(page, name):
    path = OUT / (name + '.png')
    page.screenshot(path=str(path), full_page=True)
    report['screenshots'].append(str(path.relative_to(ROOT)))
def fits(page):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    assert page.locator('.idea-detail:not([hidden])').evaluate('(e) => {const r=e.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1}')
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    for mode in ['desktop', 'reduced', 'touch', 'small-touch']:
        mobile = 'touch' in mode
        ctx = browser.new_context(viewport={'width': 320 if mode == 'small-touch' else 390 if mobile else 1440, 'height': 568 if mode == 'small-touch' else 844 if mobile else 1000}, has_touch=mobile, is_mobile=mobile, reduced_motion='reduce' if mode == 'reduced' else 'no-preference')
        page = ctx.new_page()
        errors, bad = [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: bad.append(r.url) if r.url.startswith(BASE) and r.status >= 400 else None)
        page.on('requestfailed', lambda r: report['external_failures'].append(r.url) if not r.url.startswith(BASE) else None)
        page.goto(BASE + '/#flow', wait_until='networkidle')
        expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-landed'))
        expect(page.locator('.tile .idea-trigger')).to_have_count(5)
        assert page.locator('.flow-wire--main').count() == 4
        assert page.locator('.flow-line').count() == 12
        for i, idea in enumerate(coverage):
            print('CHECK', mode, idea['idea'], flush=True)
            trigger = page.locator('.idea-trigger').nth(i)
            if mobile:
                trigger.tap()
            else:
                # Mouse Close may dismiss the diagram; re-enter through its door.
                page.locator('#doing-tools').hover()
                expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-landed'))
                trigger.hover()
                panel = page.locator('.idea-detail:not([hidden])')
                expect(panel).to_be_visible()
                # Traverse actual pointer path, then wait beyond both grace timers.
                box = panel.bounding_box()
                page.mouse.move(box['x'] + box['width']/2, box['y'] + 30, steps=12)
                page.wait_for_timeout(700)
                expect(panel).to_be_visible()
                expect(panel.locator('h2')).to_have_text(idea['idea'])
                expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-flow'))
                trigger.click()  # a preview becomes pinned, never toggles shut
                page.mouse.move(5, 5)
                page.wait_for_timeout(700)
            panel = page.locator('.idea-detail:not([hidden])')
            expect(panel).to_be_visible()
            expect(panel.locator('h2')).to_have_text(idea['idea'])
            assert panel.locator('dt').all_text_contents() == [t['name'] for t in idea['tools']]
            fits(page)
            # Scroll reading surface; a scroll must not dismiss it.
            panel.evaluate('(e) => e.scrollTop = e.scrollHeight')
            expect(panel).to_be_visible()
            panel.evaluate('(e) => e.scrollTop = 0')
            if mode in ['desktop', 'touch']:
                shot(page, f'{mode}-{i+1}')
            panel.locator('.idea-close').click()
            expect(panel).to_be_hidden()
            expect(trigger).to_be_focused()
            expect(trigger).to_have_attribute('aria-expanded', 'false')
        passed(f'{mode}: 5 panels, 16 tools, viewport fit, scrolling, pin and close')
        trigger = page.locator('.idea-trigger').first
        if not mobile:
            page.locator('#doing-tools').hover()
            expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-landed'))
            trigger.focus()
            trigger.press('Enter')
            expect(page.locator('.idea-detail:not([hidden])')).to_be_visible()
            expect(page.locator('.idea-detail:not([hidden]) .idea-close')).to_be_focused()
            page.keyboard.press('Escape')
            expect(page.locator('.idea-detail:not([hidden])')).to_have_count(0)
            expect(trigger).to_be_focused()
            expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-flow'))
            # Tab focus alone previews; Tab can enter the associated reading panel.
            trigger.press('Tab')
            page.keyboard.press('Shift+Tab')
            expect(page.locator('.idea-detail:not([hidden])')).to_be_visible()
            page.keyboard.press('Tab')
            expect(page.locator('.idea-detail:not([hidden]) .idea-close')).to_be_focused()
            page.keyboard.press('Escape')
            passed(f'{mode}: keyboard preview, Enter, Tab, Escape and focus restoration')
        else:
            trigger.tap()
            page.evaluate('window.scrollBy(0, -100)')
            expect(page.locator('.idea-detail:not([hidden])')).to_be_visible()
            fits(page)
            page.locator('.idea-close:visible').tap()
            passed(f'{mode}: page scroll does not dismiss pinned details')
        assert not errors, errors
        assert not bad, bad
        passed(f'{mode}: no page errors or broken local requests; audited arrows unchanged')
        ctx.close()
    ctx = browser.new_context(java_script_enabled=False)
    page = ctx.new_page()
    page.goto(BASE + '/', wait_until='networkidle')
    assert page.locator('.wall-plain li').count() == 5
    assert page.locator('.wall-plain a[href="/context/"]').count() == 1
    passed('no JavaScript: five-idea overview and Context link retained')
    browser.close()
(OUT / 'report.json').write_text(json.dumps(report, indent=2))
