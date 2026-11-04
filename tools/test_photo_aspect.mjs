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
// Needs: python3 (static server) and Chrome for Testing's headless shell in
// ~/.cache/puppeteer (any version).

import { spawn } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import net from "node:net";
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
const PAGES = (process.env.PAGES || "/photography.html,/").split(",");
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
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, tries = 150) {
  for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v; } catch {} await sleep(100); }
  throw new Error("timed out waiting for " + label);
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
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const px = v => parseFloat(v) || 0;
  return imgs.map(i => {
    const b = i.getBoundingClientRect(), cs = getComputedStyle(i);
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

const shell = findShell();
if (!shell) { console.error("no chrome-headless-shell under ~/.cache/puppeteer"); process.exit(2); }
const HTTP_PORT = await freePort(), CDP_PORT = await freePort();
const server = spawn("python3", ["-m", "http.server", String(HTTP_PORT), "--bind", "127.0.0.1"], { cwd: SITE_ROOT, stdio: "ignore" });
const chrome = spawn(shell, ["--headless", "--use-mock-keychain", "--password-store=basic", "--no-first-run",
  `--remote-debugging-port=${CDP_PORT}`, "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} };
process.on("exit", cleanup);

let failures = 0, measured = 0;
const bad = [];
function check(cond, label, detail) {
  if (cond) console.log("ok   " + label);
  else { failures++; console.log("FAIL " + label + (detail ? " — " + detail : "")); }
}

try {
  await waitFor(() => fetch(`http://127.0.0.1:${HTTP_PORT}/`).then((r) => r.ok), "static server");
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json()), "devtools");
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  let scriptId = null;
  for (const pg of PAGES) {
    const seeds = pg.includes("photography") || pg.includes("/studies/") ? SEEDS : [1];
    for (const vp of VIEWPORTS) {
      let pageBad = 0, pageN = 0, stageSeen = false;
      for (const seed of seeds) {
        if (scriptId) await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
        scriptId = (await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: seedScript(seed) })).identifier;
        await cdp.send("Emulation.setDeviceMetricsOverride", { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mobile });
        await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}${pg}` });
        await sleep(600);
        await waitFor(() => cdp.evaluate("document.readyState === 'complete' || document.readyState === 'interactive'"), "load");
        await sleep(pg === "/" ? 1500 : 400);
        const rows = await cdp.evaluate(MEASURE);
        for (const r of rows) {
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
      check(pageBad === 0, `${pg} at ${vp.w}x${vp.h}: no picture stretched or cropped (${pageN} measured${pg === "/" ? (stageSeen ? ", stage photo among them" : ", NO stage photo seen") : ""})`,
        pageBad ? bad.filter((b) => b.pg === pg && b.vp === `${vp.w}x${vp.h}`).slice(0, 4).map((b) => `${b.src} ${b.why} (content ${b.content.join("x")}, file ${b.natural.join("x")})`).join("; ") : "");
      if (pg === "/" && !stageSeen) { failures++; console.log("FAIL the home stage photo was not found at " + `${vp.w}x${vp.h}`); }
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
