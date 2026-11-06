#!/usr/bin/env node
// studies/14/check.mjs — the stone holds today's real pair, the same one `/` shows.
// For 1440x900 and 390x844: loads `/` and reads what it chose (#poem-link, #photo); then, in the
// same tab (so the same cached weather reading), loads ?v=a, b, c and checks each:
//   the stone renders (cut facets with real area), today's poem title and today's photograph
//   are on the page and match `/` and the page's own v2/pick.js answer, no picture is drawn out
//   of its own shape (1%), and nothing is written to the console as an error.
// Pictures are measured by their layout box: the facets' slight lamp tilt is a projection, not a stretch.
// Screenshots go to studies/14/shots/14-<v>-<w>x<h>.png.
// Run: node studies/14/check.mjs   (non-zero exit on any failure)
import { spawn } from "node:child_process";
import { readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SHOTS = path.join(HERE, "shots");
const VIEWPORTS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }];
const VARIANTS = (process.env.VARIANTS || "a,b,c").split(",");

function findShell() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
  if (!existsSync(base)) return null;
  for (const v of readdirSync(base).sort().reverse()) {
    const p = path.join(base, v, "chrome-headless-shell-mac-arm64/chrome-headless-shell");
    if (existsSync(p)) return p;
  }
  return null;
}
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, tries = 200) {
  for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v; } catch {} await sleep(100); }
  throw new Error("timed out waiting for " + label);
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = [];
    ws.onmessage = (m) => { const msg = JSON.parse(m.data);
      if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
      else this.listeners.forEach((f) => f(msg)); }; }
  send(method, params = {}) { const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page threw: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
    return r.result.value;
  }
}

const HOME = `(() => { const a = document.getElementById('poem-link'), i = document.getElementById('photo');
  return a && a.textContent && i && i.getAttribute('src') ? { title: a.textContent, slug: a.getAttribute('href'), photo: new URL(i.src).pathname } : null })()`;

const PROBE = `(async () => {
  const imgs = [...document.querySelectorAll('img')];
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000) })));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const vis = e => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return b.width > 2 && b.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && b.right > 0 && b.bottom > 0 && b.left < innerWidth && b.top < innerHeight * 1.5 };
  const area = q => { const pts = (q.match(/-?[\\d.]+px -?[\\d.]+px/g) || []).map(s => s.split(' ').map(parseFloat)); let a = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0 } return Math.abs(a / 2) };
  const facets = [...document.querySelectorAll('#stone .s')].map(s => area(getComputedStyle(s).clipPath));
  const stoneBox = document.getElementById('stone').getBoundingClientRect();
  const titles = [...document.querySelectorAll('[data-today-title]')].filter(vis).map(e => e.textContent.trim());
  const photos = [...document.querySelectorAll('img[data-today]')].filter(i => i.naturalWidth && vis(i)).map(i => new URL(i.src).pathname);
  const iso = (() => { const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach(x => p[x.type] = x.value); return p.year + '-' + p.month + '-' + p.day })();
  const own = window.kahranPick && window.kahranPick.pickFor(iso, true);
  const warped = imgs.filter(i => i.naturalWidth && vis(i)).map(i => { const b = { width: i.offsetWidth, height: i.offsetHeight }, fit = getComputedStyle(i).objectFit; return { src: i.src.split('/').pop(), fit, off: Math.abs((b.width / b.height) / (i.naturalWidth / i.naturalHeight) - 1) } }).filter(x => x.fit !== 'fill' || x.off > 0.01);
  return { facets: facets.length, cut: facets.filter(a => a > 400).length, stoneArea: stoneBox.width * stoneBox.height,
    titles, photos, how: document.body.dataset.how, slug: document.body.dataset.poem, own, where: (document.getElementById('where').textContent || ''), warped };
})()`;

const shell = findShell();
if (!shell) { console.error("no chrome-headless-shell under ~/.cache/puppeteer"); process.exit(2); }
mkdirSync(SHOTS, { recursive: true });
const HTTP_PORT = await freePort(), CDP_PORT = await freePort();
const server = spawn("python3", ["-m", "http.server", String(HTTP_PORT), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
const chrome = spawn(shell, ["--headless", "--use-mock-keychain", "--password-store=basic", "--no-first-run", "--hide-scrollbars",
  `--remote-debugging-port=${CDP_PORT}`, "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} };
process.on("exit", cleanup);

let failures = 0, errors = [];
const check = (cond, label, detail) => { if (cond) console.log("ok   " + label); else { failures++; console.log("FAIL " + label + (detail ? " — " + detail : "")); } };

try {
  const base = `http://127.0.0.1:${HTTP_PORT}`;
  await waitFor(() => fetch(base + "/").then((r) => r.ok), "static server");
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json()), "devtools");
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws);
  cdp.listeners.push((m) => {
    if (m.method === "Runtime.exceptionThrown") errors.push("exception: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console.error: " + m.params.args.map((a) => a.value ?? a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/favicon\.ico/.test(m.params.entry.url || "")) errors.push("log: " + m.params.entry.text + " " + (m.params.entry.url || ""));
  });
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("Log.enable");

  for (const vp of VIEWPORTS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mobile });
    await cdp.send("Page.navigate", { url: base + "/" });
    await waitFor(() => cdp.evaluate(HOME), "the home's pick");
    await sleep(4500); // the weather line lands and the home re-draws on it, as a visitor's page would
    const home = await cdp.evaluate(HOME);
    console.log(`     / at ${vp.w}x${vp.h} shows "${home.title}" with ${home.photo}`);
    for (const v of VARIANTS) {
      errors = [];
      await cdp.send("Page.navigate", { url: `${base}/studies/14/?v=${v}` });
      await waitFor(() => cdp.evaluate("document.body && document.body.dataset.ready === 'yes'"), `?v=${v} ready`);
      await sleep(3500);
      const r = await cdp.evaluate(PROBE);
      const tag = `?v=${v} ${vp.w}x${vp.h}`;
      check(r.facets >= 6 && r.cut >= 6 && r.stoneArea > vp.w * vp.h * 0.3, `${tag}: the stone renders`, `${r.cut}/${r.facets} cut facets, stone ${Math.round(r.stoneArea)}px²`);
      check(r.titles.includes(home.title), `${tag}: today's poem title shows and matches / ("${home.title}")`, `on page: ${JSON.stringify(r.titles)}`);
      check(r.photos.includes(home.photo), `${tag}: today's photograph shows and matches / (${home.photo})`, `on page: ${JSON.stringify([...new Set(r.photos)])}`);
      check(!r.own || (r.own.poem === r.slug && r.photos.includes(r.own.photo)), `${tag}: the same pair v2/pick.js answers in the page (${r.how})`, JSON.stringify(r.own));
      check(r.warped.length === 0, `${tag}: no picture drawn out of its own shape`, JSON.stringify(r.warped.slice(0, 3)));
      check(errors.length === 0, `${tag}: no console errors`, errors.slice(0, 4).join(" | "));
      const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(path.join(SHOTS, `14-${v}-${vp.w}x${vp.h}.png`), Buffer.from(shot.data, "base64"));
    }
  }
} catch (e) {
  failures++; console.log("FAIL " + (e && e.message ? e.message : e) + (errors.length ? " — " + errors.join(" | ") : ""));
}
console.log(failures ? `${failures} failed` : "PASS");
cleanup();
process.exit(failures ? 1 : 0);
