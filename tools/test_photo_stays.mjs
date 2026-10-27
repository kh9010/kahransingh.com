#!/usr/bin/env node
// test_photo_stays.mjs — the photograph on the home page never changes its
// crop when the poem comes forward. Loads / in headless Chrome, grows the poem
// so it runs well past one screen, and checks the picture's box is the same
// at rest, the moment the poem joins the flow, and once it has fully arrived.
//
// Run: node tools/test_photo_stays.mjs   (exits non-zero on any failure)
// Needs: python3 (static server) and Chrome for Testing's headless shell in
// ~/.cache/puppeteer (any version).

import { spawn } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, "..");
const HTTP_PORT = 8123, CDP_PORT = 9333;
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
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = [];
    ws.onmessage = (m) => { const msg = JSON.parse(m.data);
      if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
      else this.events.push(msg); }; }
  send(method, params = {}) { const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params })); }); }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page threw: " + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    return r.result.value;
  }
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

try {
  await waitFor(() => fetch(`http://127.0.0.1:${HTTP_PORT}/index.html`).then((r) => r.ok), "static server");
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json()), "devtools");
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/` });

  // home.js fills the picture after fetching data.json; wait for a real one.
  await waitFor(() => cdp.evaluate(`(() => { const i = document.getElementById('photo'); return !!(i && i.src && i.complete && i.naturalWidth > 0); })()`), "photograph");

  const measure = `(() => {
    const b = document.getElementById('photo').getBoundingClientRect();
    return { top: Math.round(b.top), height: Math.round(b.height), width: Math.round(b.width),
             vh: innerHeight, docH: document.documentElement.scrollHeight };
  })()`;

  const rest = await cdp.evaluate(measure);
  check(rest.height === rest.vh && rest.top === 0, "at rest the photograph is one viewport tall", JSON.stringify(rest));

  // Make today's poem long whatever the day picked, then do exactly what
  // home.js does at progress 0: the poem joins the flow.
  await cdp.evaluate(`(() => {
    const body = document.getElementById('poem-body');
    body.innerHTML = Array.from({ length: 80 }, (_, i) => '<span class="line">line ' + i + '</span>').join('');
    document.getElementById('poem-hold').classList.add('is-live');
    return true;
  })()`);
  const live = await cdp.evaluate(measure);
  check(live.docH > rest.docH + rest.vh, "a long poem does lengthen the page (the test is exercising the real case)", `docH ${rest.docH} -> ${live.docH}`);
  check(live.height === rest.height && live.top === rest.top && live.width === rest.width,
        "the photograph's box is unchanged the moment the poem joins the flow", `${JSON.stringify(rest)} -> ${JSON.stringify(live)}`);

  // Fully arrived.
  await cdp.evaluate(`(() => { const h = document.getElementById('poem-hold'); h.style.setProperty('--p', '1'); h.classList.add('is-on'); return true; })()`);
  const on = await cdp.evaluate(measure);
  check(on.height === rest.height && on.top === rest.top && on.width === rest.width,
        "the photograph's box is unchanged once the poem has arrived", `${JSON.stringify(rest)} -> ${JSON.stringify(on)}`);

  // Scrolled to the foot of the long poem, the picture is still in view.
  await cdp.evaluate(`(() => { scrollTo(0, document.documentElement.scrollHeight); return true; })()`);
  await sleep(50);
  const scrolled = await cdp.evaluate(measure);
  check(scrolled.top <= 0 && scrolled.top + scrolled.height > 0, "scrolled down a long poem, the photograph is still on screen", JSON.stringify(scrolled));
} catch (e) {
  failures++;
  console.log("FAIL " + (e && e.message ? e.message : e));
}

cleanup();
console.log(failures ? `\n${failures} failure(s)` : "\nall passed");
process.exit(failures ? 1 : 0);
