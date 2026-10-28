#!/usr/bin/env node
// test_right_now.mjs — the "Right now I'm:" block says what Kahran asked it to.
//
// Pins (Kahran, 2026-10-28: "end in some hints of what we are working on now"):
// the first line is still the tools line and still the door to the wall; under
// it sit the other things on the bench, as plain lines that open nothing. Then
// it renders / in headless Chrome at 1200x800 and 390x844: every line is in the
// window, the column clears the poem on a wide screen, a click on the tools
// line opens the wall and a second click puts it away, a click on another line
// opens nothing.
//
// Run: node tools/test_right_now.mjs [--shots DIR]   (exits non-zero on any failure)
// Needs: python3 (static server) and Chrome for Testing's headless shell in
// ~/.cache/puppeteer (any version).

import { spawn } from "node:child_process";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TOOLS_LINE = "building tools to support myself";
const shotsAt = process.argv.indexOf("--shots");
const SHOTS = shotsAt > 0 ? process.argv[shotsAt + 1] : null;

let failures = 0;
function check(cond, label, detail) {
  if (cond) console.log("ok   " + label);
  else { failures++; console.log("FAIL " + label + (detail ? " — " + detail : "")); }
}

/* --------------------------------------------------------------- source -- */

const html = readFileSync(path.join(ROOT, "index.html"), "utf8");
const list = (html.match(/<ul class="doing-list">([\s\S]*?)<\/ul>/) || [])[1] || "";
const items = [...list.matchAll(/<li class="doing-item">([\s\S]*?)<\/li>/g)].map((m) => m[1]);
const text = (h) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const first = items[0] || "";
check(/<button[^>]*id="doing-tools"/.test(first) && /aria-controls="wall-block"/.test(first) && text(first) === TOOLS_LINE,
  "the first line is the tools line and controls the wall", text(first));
const rest = items.slice(1);
check(rest.length >= 2 && rest.length <= 3, "two or three lines follow it", String(rest.length));
check(rest.every((h) => /class="doing-bullet doing-bullet--still"/.test(h) && !/<button|<a |id=|aria-controls/.test(h)),
  "the lines after it open nothing", rest.map(text).join(" | "));
check(rest.every((h) => /^[a-z]+ing /.test(text(h))), "each says what he is doing, lowercase, present tense", rest.map(text).join(" | "));
check(![...items.map(text)].some((t) => /day[\s-]?flow/i.test(t)), "no \"day-flow\" under Right now");

/* ------------------------------------------------------------- rendered -- */

function findShell() {
  const base = path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
  if (!existsSync(base)) return null;
  for (const v of readdirSync(base).sort().reverse()) {
    const p = path.join(base, v, "chrome-headless-shell-mac-arm64/chrome-headless-shell");
    if (existsSync(p)) return p;
  }
  return null;
}
function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.once("error", rej);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); });
  });
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
}

const shell = findShell();
if (!shell) { console.error("no chrome-headless-shell under ~/.cache/puppeteer"); process.exit(2); }
const HTTP_PORT = await freePort(), CDP_PORT = await freePort();
const server = spawn("python3", ["-m", "http.server", String(HTTP_PORT), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
const chrome = spawn(shell, [
  "--headless", "--use-mock-keychain", "--password-store=basic", "--no-first-run",
  "--hide-scrollbars", `--remote-debugging-port=${CDP_PORT}`, "about:blank",
], { stdio: "ignore" });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} };
process.on("exit", cleanup);

async function shot(cdp, file) {
  if (!SHOTS) return;
  const r = await cdp.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(SHOTS, file), Buffer.from(r.data, "base64"));
}

try {
  await waitFor(() => fetch(`http://127.0.0.1:${HTTP_PORT}/index.html`).then((r) => r.ok), "static server");
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json()), "devtools");
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");

  for (const [w, h, mobile, tag] of [[1200, 800, false, "1200"], [390, 844, true, "390"]]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/` });
    await waitFor(() => cdp.evaluate("document.querySelectorAll('#wall-block .tile').length === 6 && document.fonts.status === 'loaded' && document.getElementById('photo').complete && document.getElementById('photo').naturalWidth > 0"), "six tiles and the photograph " + tag, 200);
    await sleep(700);
    await shot(cdp, `now-${tag}.png`);
    if (mobile) { await cdp.evaluate("document.querySelector('.doing').scrollIntoView({block: 'start'}); true"); await sleep(250); await shot(cdp, `now-${tag}-band.png`); }

    const r = await cdp.evaluate(`(() => {
      const lines = [...document.querySelectorAll('.doing-list .doing-bullet')];
      const rects = lines.map((b) => b.getBoundingClientRect());
      const col = document.querySelector('.doing-list').getBoundingClientRect();
      const poem = document.getElementById('poem-hold').getBoundingClientRect();
      const clear = !(col.left < poem.right && poem.left < col.right && col.top < poem.bottom && poem.top < col.bottom);
      return { n: lines.length, texts: lines.map((b) => b.textContent.trim()),
               inside: rects.every((r) => r.left >= 0 && r.right <= innerWidth + 1 && r.width > 0),
               visible: lines.every((b) => getComputedStyle(b).visibility !== 'hidden' && getComputedStyle(b).opacity !== '0'),
               clear, hscroll: document.documentElement.scrollWidth > innerWidth + 1 };
    })()`);
    check(r.n === items.length && r.texts[0] === TOOLS_LINE, `every line renders, the tools line first, at ${tag}`, r.texts.join(" | "));
    check(r.inside && r.visible, `every line is in the window at ${tag}`);
    if (!mobile) check(r.clear, `the column clears the poem at ${tag}`);
    check(!r.hscroll, `no sideways scroll at ${tag}`);

    // a click on another line opens nothing
    const still = await cdp.evaluate(`(() => {
      document.querySelectorAll('.doing-bullet--still').forEach((b) => b.click());
      return document.querySelector('.tools-layer').classList.contains('is-flow');
    })()`);
    check(still === false, `a click on another line opens nothing at ${tag}`);

    // the tools line opens the wall, and a second click puts it away
    await cdp.evaluate("document.getElementById('doing-tools').click(); true");
    const opened = await waitFor(() => cdp.evaluate(`(() => {
      const b = document.getElementById('doing-tools');
      return document.querySelector('.tools-layer').classList.contains('is-landed') && b.getAttribute('aria-expanded') === 'true';
    })()`), "wall opens " + tag).catch(() => false);
    check(opened === true, `the tools line opens the wall at ${tag}`);
    await sleep(1500);
    if (mobile) await cdp.evaluate("document.querySelector('.doing').scrollIntoView({block: 'start'}); true");
    await sleep(250);
    await shot(cdp, `now-${tag}-open.png`);
    await cdp.evaluate("document.getElementById('doing-tools').click(); true");
    const closed = await waitFor(() => cdp.evaluate(
      "!document.querySelector('.tools-layer').classList.contains('is-flow') && document.getElementById('doing-tools').getAttribute('aria-expanded') === 'false'"),
      "wall closes " + tag).catch(() => false);
    check(closed === true, `a second click puts it away at ${tag}`);
  }
} catch (e) {
  failures++;
  console.log("FAIL " + e.message);
}

cleanup();
process.exit(failures ? 1 : 0);
