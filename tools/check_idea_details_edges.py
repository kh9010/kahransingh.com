"""Edge-size and real-input regressions for infographic details.
Run with Playwright installed and the preview server running (BASE_URL optional).
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:8798')
OUT = Path(__file__).resolve().parents[1] / '.review' / 'idea-details'
OUT.mkdir(parents=True, exist_ok=True)
results = []

def passed(label):
    results.append(label)
    (OUT / 'edge-report.json').write_text(json.dumps(results, indent=2))
    print('PASS ' + label, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    for width, height, touch in [(1280, 720, False), (901, 600, False), (768, 1024, True), (844, 390, True)]:
        ctx = browser.new_context(viewport={'width': width, 'height': height}, has_touch=touch, is_mobile=touch)
        page = ctx.new_page()
        errors = []
        touch_session = ctx.new_cdp_session(page) if touch else None
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(BASE + '/#flow', wait_until='networkidle')
        expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-landed'))
        for i in range(5):
            trigger = page.locator('.idea-trigger').nth(i)
            if touch:
                trigger.tap()
            else:
                page.locator('#doing-tools').hover()
                expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-landed'))
                trigger.click()
            panel = page.locator('.idea-detail:not([hidden])')
            expect(panel).to_be_visible()
            expect(panel.locator('h2')).to_have_text(trigger.get_attribute('aria-label'))
            # Settle the composited hit region before sending physical input.
            page.evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
            box = panel.bounding_box()
            assert box['x'] >= 0 and box['y'] >= 0, box
            assert box['x'] + box['width'] <= width + 1, box
            assert box['y'] + box['height'] <= height + 1, box
            if touch:
                assert touch_session is not None
                before = panel.evaluate('el => ({top: el.scrollTop, overflows: el.scrollHeight > el.clientHeight})')
                # A frame-paced finger swipe, not DOM scrollTop assignment.
                # Chrome's synthetic-scroll helper can skip a subsequent card.
                x = box['x'] + box['width'] / 2
                y = box['y'] + box['height'] * .7
                touch_session.send('Input.dispatchTouchEvent', {
                    'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}],
                })
                for step in range(1, 9):
                    touch_session.send('Input.dispatchTouchEvent', {
                        'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y - 140 * step / 8}],
                    })
                    page.evaluate('new Promise(requestAnimationFrame)')
                touch_session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
                expect(panel).to_be_visible()
                if before['overflows']:
                    page.wait_for_function('(id) => document.getElementById(id).scrollTop > 0', arg=panel.get_attribute('id'))
                    after = panel.evaluate('el => el.scrollTop')
                    assert after > before['top'], (before, after)
                    passed(f'{width}x{height}: {trigger.get_attribute("aria-label")} touch scrollTop {before["top"]} -> {after}')
            else:
                panel.hover()
                page.mouse.wheel(0, 400)
                expect(panel).to_be_visible()
            close = panel.locator('.idea-close')
            expect(close).to_be_in_viewport()
            close.tap() if touch else close.click()
            expect(panel).to_be_hidden()
            expect(trigger).to_be_focused()
            if touch:
                page.wait_for_timeout(400)
                expect(page.locator('#doing-tools')).to_have_attribute('aria-expanded', 'true')
        assert not errors, errors
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        passed(f'{width}x{height}: five cards fit; scrolling preserves details; Close reachable')
        ctx.close()

    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.goto(BASE + '/#flow', wait_until='networkidle')
    expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-landed'))
    page.locator('.idea-trigger').first.click()
    page.locator('.idea-detail:not([hidden]) a').click()
    expect(page).to_have_url(BASE + '/context/')
    passed('Context detail link reaches the existing page')

    page.goto(BASE + '/', wait_until='networkidle')
    page.locator('#doing-tools').hover()
    page.locator('.idea-trigger').first.click()
    page.keyboard.press('Escape')
    expect(page.locator('.idea-detail:not([hidden])')).to_have_count(0)
    expect(page.locator('#doing-tools')).to_have_attribute('aria-expanded', 'true')
    page.keyboard.press('Escape')
    expect(page.locator('#doing-tools')).to_have_attribute('aria-expanded', 'false')
    expect(page.locator('#doing-tools')).to_be_focused()
    passed('Normal homepage entry; first Escape closes details, second closes diagram')
    page.goto(BASE + '/#flow', wait_until='networkidle')
    expect(page.locator('.tools-layer')).to_have_class(__import__('re').compile('is-landed'))
    keeping = page.locator('.idea-trigger').nth(1)
    context = page.locator('.idea-trigger').first
    keeping.click()
    page.keyboard.press('Shift+Tab')
    expect(keeping).to_be_focused()
    page.keyboard.press('Shift+Tab')
    expect(context).to_be_focused()
    expect(context).to_have_attribute('aria-expanded', 'true')
    expect(keeping).to_have_attribute('aria-expanded', 'false')
    expect(page.locator('.idea-detail:not([hidden]) h2')).to_have_text('Context')
    passed('Backward Tab from a pinned card previews the newly focused idea')
    page.goto(BASE + '/', wait_until='networkidle')
    page.locator('#doing-tools').hover()
    page.locator('.idea-trigger').first.click()
    page.locator('.idea-detail:not([hidden]) .idea-close').click()
    expect(page.locator('.idea-detail:not([hidden])')).to_have_count(0)
    expect(page.locator('.idea-trigger').first).to_be_focused()
    assert not page.locator('.idea-trigger').first.evaluate("el => el.matches(':focus-visible')")
    page.mouse.move(5, 5)
    expect(page.locator('#doing-tools')).to_have_attribute('aria-expanded', 'false')
    passed('Mouse Close then region exit dismisses the hover-open diagram')

    # Keyboard-restored focus must still keep the diagram available.
    page.goto(BASE + '/', wait_until='networkidle')
    page.locator('#doing-tools').hover()
    page.locator('.idea-trigger').first.click()
    page.keyboard.press('Escape')
    page.mouse.move(5, 5)
    page.wait_for_timeout(1200)
    expect(page.locator('.idea-trigger').first).to_be_focused()
    assert page.locator('.idea-trigger').first.evaluate("el => el.matches(':focus-visible')")
    expect(page.locator('#doing-tools')).to_have_attribute('aria-expanded', 'true')
    passed('Keyboard-restored focus preserves the diagram after pointer exit')
    browser.close()
