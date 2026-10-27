#!/usr/bin/env node
// test_photo_autoscroll.mjs — the photography page keeps walking through the
// pictures on its own with a pointer resting anywhere on it, and pauses only
// while the pointer is actually moving over a picture.
//
// Loads /photography.html in headless Chrome with the pointer parked in the
// middle of the window, checks the page advances; then moves the pointer
// over the picture nearest the centre and checks the walk holds, and that it
// resumes once the pointer is still again.
//
// Run: node tools/test_photo_autoscroll.mjs   (exits non-zero on any failure)
// Needs: python3 (static server) and Chrome for Testing's headless shell in
// ~/.cache/puppeteer (any version).

import { spawn } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, "..");
const HTTP_PORT = 8124, CDP_PORT = 9334;
const W = 1200, H = 800;

function findShell() {
  const base = path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
  if (!existsSync(base)) return null;
  for (const v of readdirSync(base).sort().reverse()) {
    const p = path.join(base, v, "chrome-headless-shell-mac-arm64/chrome-headless-shell");
    if (existsSync(p)) return p;
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, tries = 100) {
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
  mouse(x, y) { return this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); }
}

const shell = findShell();
if (!shell) { console.error("no chrome-headless-shell under ~/.cache/puppeteer"); process.exit(2); }

const server = spawn("python3", ["-m", "http.server", String(HTTP_PORT), "--bind", "127.0.0.1"], { cwd: SITE_ROOT, stdio: "ignore" });
const chrome = spawn(shell, [
  "--headless", "--use-mock-keychain", "--password-store=basic", "--no-first-run",
  `--remote-debugging-port=${CDP_PORT}`, `--window-size=${W},${H}`, "about:blank",
], { stdio: "ignore" });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} };
process.on("exit", cleanup);

let failures = 0;
function check(cond, label, detail) {
  if (cond) console.log("ok   " + label);
  else { failures++; console.log("FAIL " + label + (detail ? " — " + detail : "")); }
}
const scrollY = (cdp) => cdp.evaluate("Math.round(window.scrollY)");

try {
  await waitFor(() => fetch(`http://127.0.0.1:${HTTP_PORT}/photography.html`).then((r) => r.ok), "static server");
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json()), "devtools");
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/photography.html` });
  await waitFor(() => cdp.evaluate("document.querySelectorAll('.photo-wrap img').length > 10"), "gallery");

  // A pointer parked in the middle of the window, over no picture, and never moved.
  await cdp.mouse(W / 2, H / 2);
  const under = await cdp.evaluate(`(e => e ? e.tagName : 'none')(document.elementFromPoint(${W / 2}, ${H / 2}))`);
  check(under !== "IMG", "the parked pointer is not over a picture at load", "under it: " + under);
  const y0 = await scrollY(cdp);
  await sleep(10000);
  const y1 = await scrollY(cdp);
  check(y1 > y0 + 200, "with a pointer resting on the page, the walk still advances within 10s", `scrollY ${y0} -> ${y1}`);

  // Moving the pointer over the picture nearest the centre holds the walk.
  const target = await cdp.evaluate(`(() => {
    let best = null, d = Infinity;
    for (const img of document.querySelectorAll('.photo-wrap img, .photo-pair img')) {
      const b = img.getBoundingClientRect(); if (b.height < 50) continue;
      const c = Math.abs(b.top + b.height / 2 - innerHeight / 2);
      if (c < d) { d = c; best = { x: b.left + b.width / 2, y: Math.max(20, Math.min(innerHeight - 20, b.top + b.height / 2)), w: b.width }; }
    }
    return best;
  })()`);
  await cdp.mouse(target.x, target.y);
  await sleep(120);
  const held0 = await scrollY(cdp);
  const t0 = Date.now();
  let step = 0;
  while (Date.now() - t0 < 6000) { step++; await cdp.mouse(target.x + ((step % 2) ? 12 : -12), target.y); await sleep(150); }
  const held1 = await scrollY(cdp);
  check(Math.abs(held1 - held0) <= 5, "while the pointer moves over a picture for 6s the walk holds", `scrollY ${held0} -> ${held1}`);

  // Still again, the walk resumes.
  await sleep(7000);
  const resumed = await scrollY(cdp);
  check(Math.abs(resumed - held1) > 50, "once the pointer is still again the walk resumes within 7s", `scrollY ${held1} -> ${resumed}`);
} catch (e) {
  failures++;
  console.log("FAIL " + (e && e.message ? e.message : e));
}

cleanup();
console.log(failures ? `\n${failures} failure(s)` : "\nall passed");
process.exit(failures ? 1 : 0);
