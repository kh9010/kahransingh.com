// Gather step 3: node capture.cjs cands.json <run dir> (needs playwright-core installed in the scratch dir). Writes media/<id>.{jpg,mp4} + <id>-m.jpg and results.json.
const { chromium } = require('playwright-core')
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process')
const [, , candsPath, outDir, onlyN] = process.argv
const EXE = path.join(process.env.HOME, 'Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell')
const cands = JSON.parse(fs.readFileSync(candsPath, 'utf8')).slice(0, onlyN ? +onlyN : undefined)
const media = path.join(outDir, 'media'), tmp = path.join(outDir, 'tmpvid')
fs.mkdirSync(media, { recursive: true }); fs.mkdirSync(tmp, { recursive: true })
const resPath = path.join(outDir, 'results.json')
const results = fs.existsSync(resPath) ? JSON.parse(fs.readFileSync(resPath, 'utf8')) : {}
const W = 1280, H = 800
const sleep = ms => new Promise(r => setTimeout(r, ms))
const ACCEPT = /^(accept( all)?( cookies)?|allow( all)?( cookies)?|i agree|agree|got it|ok|okay|accept & close|alle akzeptieren|accepter|tout accepter|aceptar|accetta)$/i

async function dismiss(page) {
  for (const f of page.frames()) {
    try {
      const btns = await f.$$('button, a[role=button], [role=button], input[type=button]')
      for (const b of btns.slice(0, 200)) {
        const t = ((await b.innerText().catch(() => '')) || '').trim()
        if (t && t.length < 30 && ACCEPT.test(t) && await b.isVisible()) { await b.click({ timeout: 1500 }).catch(() => {}); await sleep(400); return true }
      }
    } catch {}
  }
  return false
}

async function wallCheck(page) {
  // a cookie/consent overlay covering most of the viewport counts as a wall
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('body *')].slice(0, 4000)
    for (const e of els) {
      const s = getComputedStyle(e); if (s.position !== 'fixed' || s.visibility === 'hidden' || s.display === 'none' || +s.opacity < .3) continue
      const r = e.getBoundingClientRect(); if (r.width * r.height < innerWidth * innerHeight * .6) continue
      const t = (e.innerText || '').toLowerCase()
      if (/cookie|consent|privacy/.test(t) && t.length < 3000) return true
    }
    return false
  }).catch(() => false)
}

async function one(browser, c) {
  const out = { id: c.id }
  const vctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: tmp, size: { width: W, height: H } }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', locale: 'en-US' })
  const page = await vctx.newPage()
  const t0 = Date.now()
  try {
    const resp = await page.goto(c.url, { waitUntil: 'load', timeout: 35000 }).catch(async e => {
      if (/Timeout/.test(e.message)) return page.waitForLoadState('domcontentloaded', { timeout: 5000 }).then(() => 'slow').catch(() => { throw e })
      throw e
    })
    if (resp && resp !== 'slow' && resp.status && resp.status() >= 400) throw new Error('http ' + resp.status())
    await sleep(3500)
    await dismiss(page)
    await sleep(600)
    if (await wallCheck(page)) throw new Error('cookie wall')
    const text = await page.evaluate(() => (document.body?.innerText || '').length).catch(() => 0)
    const shot = await page.screenshot({ type: 'jpeg', quality: 72 })
    if (shot.length < 9000 && text < 20) throw new Error('blank page')
    fs.writeFileSync(path.join(media, c.id + '.jpg'), shot)
    // the clip: hold, hover a few things, scroll, hover again
    const start = (Date.now() - t0) / 1000
    await page.mouse.move(W * .5, H * .45); await sleep(1100)
    const targets = await page.evaluate(() => [...document.querySelectorAll('a, button, img, h1, h2')].map(e => e.getBoundingClientRect()).filter(r => r.width > 20 && r.height > 10 && r.top > 0 && r.bottom < innerHeight && r.left >= 0 && r.right <= innerWidth).slice(0, 12).map(r => [r.left + r.width / 2, r.top + r.height / 2])).catch(() => [])
    for (const [x, y] of targets.filter((_, i) => i % 3 === 0).slice(0, 3)) { await page.mouse.move(x, y, { steps: 12 }); await sleep(450) }
    for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, 90); await sleep(130) }
    await sleep(500)
    const t2 = await page.evaluate(() => [...document.querySelectorAll('a, img, figure')].map(e => e.getBoundingClientRect()).filter(r => r.width > 40 && r.top > 80 && r.bottom < innerHeight - 40).slice(0, 4).map(r => [r.left + r.width / 2, r.top + r.height / 2])).catch(() => [])
    for (const [x, y] of t2.slice(0, 2)) { await page.mouse.move(x, y, { steps: 10 }); await sleep(450) }
    await sleep(600)
    const end = (Date.now() - t0) / 1000
    out.title = await page.title().catch(() => '')
    out.finalUrl = page.url()
    await vctx.close()
    const raw = await page.video().path()
    const dur = Math.min(8, end - start + 0.2)
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', start.toFixed(2), '-i', raw, '-t', dur.toFixed(2), '-an', '-vf', 'scale=960:-2,fps=24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '31', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(media, c.id + '.mp4')])
    fs.unlinkSync(raw)
    // phone still
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })
    try {
      const mp = await mctx.newPage()
      await mp.goto(c.url, { waitUntil: 'load', timeout: 30000 }).catch(() => mp.waitForLoadState('domcontentloaded', { timeout: 5000 }))
      await sleep(3000); await dismiss(mp); await sleep(500)
      const buf = await mp.screenshot({ type: 'jpeg', quality: 70 })
      fs.writeFileSync(path.join(media, c.id + '-m.jpg'), buf)
      out.mobile = true
    } catch (e) { out.mobile = false } finally { await mctx.close() }
    if (out.mobile) execFileSync('sips', ['-Z', '780', path.join(media, c.id + '-m.jpg')], { stdio: 'ignore' })
    out.ok = true
  } catch (e) {
    out.ok = false; out.err = String(e.message).split('\n')[0].slice(0, 120)
    await vctx.close().catch(() => {})
    try { fs.unlinkSync(await page.video().path()) } catch {}
    for (const ext of ['.jpg', '.mp4', '-m.jpg']) try { fs.unlinkSync(path.join(media, c.id + ext)) } catch {}
  }
  return out
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--use-mock-keychain', '--password-store=basic', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
  const queue = cands.filter(c => !results[c.id])
  let n = 0
  async function worker() {
    while (queue.length) {
      const c = queue.shift()
      const r = await Promise.race([one(browser, c), sleep(110000).then(() => ({ id: c.id, ok: false, err: 'hung' }))])
      results[c.id] = r; n++
      fs.writeFileSync(resPath, JSON.stringify(results, null, 1))
      console.log(n, c.id, r.ok ? 'ok' : 'DROP ' + r.err, c.url)
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker))
  await browser.close()
})()
