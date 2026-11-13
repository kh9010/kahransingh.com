#!/usr/bin/env node
// test_photo_aspect.mjs — no picture on the site is ever stretched.
// Kahran, 2026-10-28: "they should never get warped from an axis ratio point
// of view on any device."
//
// Loads /photography.html and the home page in headless Chrome at six
// viewports (desktop, laptop, iPad portrait, two phones, a phone on its side),
// forces every picture to load, and for each visible <img> compares the shape
// it is drawn in with its file's own shape (naturalWidth / naturalHeight).
//   - object-fit fill (the default): the content box must match the file
//     within 1%; anything else is a warp.
//   - object-fit cover / contain: never a warp, but cover crops, so it is
//     allowed only on the home page's stage photo (a deliberate full-bleed
//     crop: one screen, the photo stays put). There, object-fit must be cover.
// The walk shuffles, so photography.html is loaded with three fixed seeds to
// put different pictures side by side in the pairs.
//
// Run: node tools/test_photo_aspect.mjs   (exits non-zero on any failure)
//      VERBOSE=1 lists every measured picture.
// Needs: Chrome for Testing's headless shell in
// ~/.cache/puppeteer (any version).
// Every wait is on a condition with one deadline (WAIT_MS, default 60000), never
// a fixed sleep, so it holds under load (several runs at once, a busy verify).
// Third-party requests (web fonts, analytics) are blocked: a picture's shape
// never depends on them, and a slow font server held the parser for 15 s+ when
// several runs went at once. Ports come from the server and Chrome (port 0).

import { spawn } from "node:child_process";
import http from "node:http";
import { readdirSync, existsSync, mkdtempSync, rmSync, statSync, readFile } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, "..");
const TOL = 0.01;
const VIEWPORTS = [
  { w: 1440, h: 900, mobile: false }, { w: 1200, h: 800, mobile: false },
  { w: 1024, h: 1366, mobile: true }, { w: 390, h: 844, mobile: true },
  { w: 430, h: 932, mobile: true }, { w: 844, h: 390, mobile: true },
];
const HOME_PAGE = "/v2/";
const PAGES = (process.env.PAGES || "/photography.html,/v2/").split(","); // the wall's home is /v2/ since 2026-11-09; the stone at / draws its photograph on a canvas, covered, never stretched (tools/test_home.mjs)
const SEEDS = [1, 2, 3];
const STAGE = "#photo";   // the home stage photo: cover allowed, stretch never

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WAIT_MS = Number(process.env.WAIT_MS) || 60000;
// Poll a condition until it holds or the deadline passes; the error says what it last saw.
async function waitFor(fn, label, ms = WAIT_MS) {
  const end = Date.now() + ms; let last;
  for (;;) {
    try { const v = await fn(); if (v) return v; last = v; } catch (e) { last = "threw: " + e.message; }
    if (Date.now() > end) throw new Error(`timed out after ${ms} ms waiting for ${label} (last: ${JSON.stringify(last)})`);
    await sleep(50);
  }
}
// Read a port a child process prints once it is listening (port 0: the OS picks a free one, no race).
function portFrom(child, stream, re, label) {
  return new Promise((res, rej) => {
    let buf = "";
    const t = setTimeout(() => rej(new Error(`${label} did not start within ${WAIT_MS} ms: ${buf.slice(-300)}`)), WAIT_MS);
    child[stream].on("data", (d) => { buf += d; const m = buf.match(re); if (m) { clearTimeout(t); res(Number(m[1])); } });
    child.once("exit", (c) => { clearTimeout(t); rej(new Error(`${label} exited (${c}): ${buf.slice(-300)}`)); });
  });
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map();
    ws.onmessage = (m) => { const msg = JSON.parse(m.data);
      if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); } }; }
  send(method, params = {}) { const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params })); }); }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page threw: " + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    return r.result.value;
  }
}

const MEASURE = `(async () => {
  const imgs = [...document.images];
  imgs.forEach(i => { i.loading = 'eager'; });
  // every picture, however long it takes (the harness deadline bounds it): a
  // picture given up on would drop out of the count unmeasured
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); })));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const px = v => parseFloat(v) || 0;
  return imgs.map(i => {
    const b = i.getBoundingClientRect(), cs = getComputedStyle(i);
    if (!i.naturalWidth && i.getAttribute('src')) return { broken: true, src: i.getAttribute('src') };
    if (!i.naturalWidth || b.width < 2 || b.height < 2 || cs.display === 'none' || cs.visibility === 'hidden') return null;
    const cw = b.width - px(cs.paddingLeft) - px(cs.paddingRight) - px(cs.borderLeftWidth) - px(cs.borderRightWidth);
    const ch = b.height - px(cs.paddingTop) - px(cs.paddingBottom) - px(cs.borderTopWidth) - px(cs.borderBottomWidth);
    return { src: (i.currentSrc || i.src).split('/').pop(), id: i.id, stage: i.matches(${JSON.stringify(STAGE)}),
      fit: cs.objectFit, box: [Math.round(b.width), Math.round(b.height)], content: [Math.round(cw * 10) / 10, Math.round(ch * 10) / 10],
      natural: [i.naturalWidth, i.naturalHeight], rendered: cw / ch, nat: i.naturalWidth / i.naturalHeight };
  }).filter(Boolean);
})()`;

// Seeded Math.random so the shuffled walk is reproducible per seed.
const seedScript = (seed) => `(() => { let s = ${seed} >>> 0 || 1; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();`;

// The site, served in-process. (python3 -m http.server listens with a backlog
// of 5: under load Chrome's burst of picture requests overflowed it and came
// back ERR_CONNECTION_RESET, and those pictures silently went unmeasured.)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".avif": "image/avif", ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2", ".txt": "text/plain" };
function serve(root) {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let f = path.join(root, p);
    if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
    try { if (statSync(f).isDirectory()) f = path.join(f, "index.html"); } catch {}
    readFile(f, (err, body) => {
      if (err) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(body);
    });
  });
  return new Promise((res) => s.listen(0, "127.0.0.1", () => res(s)));
}

const shell = findShell();
if (!shell) { console.error("no chrome-headless-shell under ~/.cache/puppeteer"); process.exit(2); }
const profile = mkdtempSync(path.join(os.tmpdir(), "ks-photo-aspect-"));
const server = await serve(SITE_ROOT);
const chrome = spawn(shell, ["--headless", "--use-mock-keychain", "--password-store=basic", "--no-first-run",
  `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--window-size=1440,900", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.close(); server.closeAllConnections(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} };
process.on("exit", cleanup);

let failures = 0, measured = 0;
const bad = [];
function check(cond, label, detail) {
  if (cond) console.log("ok   " + label);
  else { failures++; console.log("FAIL " + label + (detail ? " — " + detail : "")); }
}

try {
  const HTTP_PORT = server.address().port;
  const CDP_PORT = await portFrom(chrome, "stderr", /DevTools listening on ws:\/\/[^:]+:(\d+)\//, "Chrome");
  await waitFor(() => fetch(`http://127.0.0.1:${HTTP_PORT}/`).then((r) => r.ok), "static server");
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json()).then((t) => t.find((x) => x.type === "page") && t), "devtools");
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  if (!process.env.LIVE_FONTS) await cdp.send("Network.setBlockedURLs", { urls: ["*fonts.googleapis.com*", "*fonts.gstatic.com*", "*googletagmanager.com*", "*google-analytics.com*"] });
  let scriptId = null;
  for (const pg of PAGES) {
    const seeds = pg.includes("photography") || pg.includes("/studies/") ? SEEDS : [1];
    for (const vp of VIEWPORTS) {
      let pageBad = 0, pageN = 0, stageSeen = false; const broken = [];
      for (const seed of seeds) {
        if (scriptId) await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
        scriptId = (await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: seedScript(seed) })).identifier;
        await cdp.send("Emulation.setDeviceMetricsOverride", { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mobile });
        // the old page is marked first, so the wait can never pass on it
        await cdp.evaluate("window.__harnessOld = true").catch(() => {});
        await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}${pg}` });
        await waitFor(() => cdp.evaluate("!window.__harnessOld && document.readyState === 'complete'"), `load ${pg} at ${vp.w}x${vp.h}`);
        // the home sets its stage photo once data.json lands: wait for that picture, not a fixed time
        if (pg === HOME_PAGE) await waitFor(() => cdp.evaluate(`(() => { const i = document.querySelector(${JSON.stringify(STAGE)}); return !!i && i.complete && i.naturalWidth > 0; })()`), `the stage photo at ${vp.w}x${vp.h}`).catch(() => {});
        const rows = await Promise.race([cdp.evaluate(MEASURE), sleep(WAIT_MS).then(() => { throw new Error(`timed out after ${WAIT_MS} ms waiting for the pictures on ${pg} at ${vp.w}x${vp.h}`); })]);
        for (const r of rows) {
          if (r.broken) { broken.push(r.src); continue; }
          pageN++; measured++;
          const off = Math.abs(r.rendered / r.nat - 1);
          let why = null;
          if (r.stage) { stageSeen = true; if (r.fit !== "cover") why = `stage photo object-fit is ${r.fit}, not cover`; }
          else if (r.fit === "cover" && off > TOL) why = `object-fit cover crops ${(off * 100).toFixed(1)}%`;
          else if (r.fit === "fill" && off > TOL) why = `stretched ${(off * 100).toFixed(1)}%`;
          if (process.env.VERBOSE) console.log(`     ${pg} ${vp.w}x${vp.h} s${seed} ${r.src} fit=${r.fit} box=${r.box} content=${r.content} natural=${r.natural} off=${(off * 100).toFixed(2)}%`);
          if (why) { pageBad++; bad.push({ pg, vp: `${vp.w}x${vp.h}`, seed, ...r, off, why }); }
        }
      }
      check(pageBad === 0, `${pg} at ${vp.w}x${vp.h}: no picture stretched or cropped (${pageN} measured${pg === HOME_PAGE ? (stageSeen ? ", stage photo among them" : ", NO stage photo seen") : ""})`,
        pageBad ? bad.filter((b) => b.pg === pg && b.vp === `${vp.w}x${vp.h}`).slice(0, 4).map((b) => `${b.src} ${b.why} (content ${b.content.join("x")}, file ${b.natural.join("x")})`).join("; ") : "");
      check(broken.length === 0, `${pg} at ${vp.w}x${vp.h}: every picture loaded, so none goes unmeasured`, [...new Set(broken)].slice(0, 4).join(", "));
      if (pg === HOME_PAGE && !stageSeen) { failures++; console.log("FAIL the home stage photo was not found at " + `${vp.w}x${vp.h}`); }
    }
  }
} catch (e) {
  failures++;
  console.log("FAIL " + (e && e.message ? e.message : e));
}
if (bad.length && process.env.JSON) console.log(JSON.stringify(bad));
console.log(`${measured} pictures measured, ${bad.length} off`);
cleanup();
process.exit(failures ? 1 : 0);
