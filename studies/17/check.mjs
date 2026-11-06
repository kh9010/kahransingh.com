#!/usr/bin/env node
// Study 17 check — the poem, deeper in. For each behaviour (?p=a…d) travels
// five worlds in headless Chrome, desktop then phone, and asserts the
// behaviour's own rule:
//   a  the poem opens on arrival and stays longer each world; a pointer
//      resting on it holds it; it folds after the pointer leaves
//   b  as a, until settle-after; from there it never folds
//   c  it never folds; the poem gains weight and the photograph gives it up
//   d  lines arrive one by one with every door after every other line; folded,
//      the doors are still there and clickable
// and for all: a door is the topmost element under its own centre (so a click
// lands) the moment the poem is open; a tap on a phone crosses; no element
// with a timer / progress role exists; no console errors.
// Timings come from defaults.json, scaled by SCALE (default 0.2) so it runs
// in about a minute; the ratios are the rule, not the absolute numbers.
//
// Run: node studies/17/check.mjs   (non-zero exit on any failure)

import { spawn } from "node:child_process";
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SHOTS = path.join(HERE, "shots");
const SCALE = +(process.env.SCALE || 0.2);
const ONLY = process.env.P || "abcd";
const D = JSON.parse(readFileSync(path.join(HERE, "defaults.json"), "utf8"));
const T = {}; for (const [k, v] of Object.entries(D)) T[k] = /-ms$/.test(k) ? +v * SCALE : +v;
const holdFor = (k) => Math.min(T["hold-cap-ms"], T["hold-ms"] * Math.pow(T["hold-growth"], k));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
async function waitFor(fn, label, ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch {} await sleep(20); }
  throw new Error("timed out waiting for " + label);
}
function findShell() {
  const base = path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
  if (!existsSync(base)) return null;
  for (const v of readdirSync(base).sort().reverse()) {
    const p = path.join(base, v, "chrome-headless-shell-mac-arm64/chrome-headless-shell");
    if (existsSync(p)) return p;
  }
  return null;
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = [];
    ws.onmessage = (m) => { const msg = JSON.parse(m.data);
      if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
      else for (const h of this.handlers) h(msg); }; }
  on(h) { this.handlers.push(h); }
  send(method, params = {}) { const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params })); }); }
  async ev(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page threw: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
    return r.result.value;
  }
}

const shell = findShell();
if (!shell) { console.error("no chrome-headless-shell under ~/.cache/puppeteer"); process.exit(2); }
const HTTP = await freePort(), DBG = await freePort();
const server = spawn("python3", ["-m", "http.server", String(HTTP), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
const chrome = spawn(shell, ["--headless", "--use-mock-keychain", "--password-store=basic", "--no-first-run",
  `--remote-debugging-port=${DBG}`, "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} };
process.on("exit", cleanup);

let failures = 0;
function check(cond, label, detail) {
  if (cond) console.log("ok   " + label);
  else { failures++; console.log("FAIL " + label + (detail ? " — " + detail : "")); }
}

// Every state change and every line arriving, stamped, per world (1-based, in order of arrival).
const PROBE = `(() => {
  window.__log = []; const seq = new WeakMap(); let c = 0;
  const id = (w) => { if (!seq.has(w)) seq.set(w, ++c); return seq.get(w); };
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver((ms) => { for (const m of ms) {
      const el = m.target, w = el.closest && el.closest('.world'); if (!w) continue;
      const t = performance.now();
      if (m.type === 'childList') continue;
      if (m.attributeName === 'data-state' && el.classList.contains('poem')) __log.push({ t, w: id(w), s: el.dataset.state });
      if (m.attributeName === 'class' && el.classList.contains('line') && el.classList.contains('shown') && !(m.oldValue || '').includes('shown'))
        __log.push({ t, w: id(w), line: [...w.querySelectorAll('.line')].indexOf(el), door: el.classList.contains('has-door') });
    } }).observe(document.body, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['data-state', 'class'] });
    new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('world')) id(n); })
      .observe(document.getElementById('stage') || document.body, { childList: true });
  });
})()`;

const CUR = `document.querySelector('.world:not(.leaving)')`;
const seen = (w, s) => `__log.find((e) => e.w === ${w} && e.s === '${s}')?.t ?? null`;

async function open(page) {
  const t = await (await fetch(`http://127.0.0.1:${DBG}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws); cdp.target = t.id;
  cdp.errors = [];
  cdp.on((m) => {
    if (m.method === "Runtime.exceptionThrown") cdp.errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") cdp.errors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") cdp.errors.push(m.params.entry.text + " " + (m.params.entry.url || ""));
    if (m.method === "Fetch.requestPaused") {
      const body = Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(D).map(([k, v]) => [k, /-ms$/.test(k) ? String(+v * SCALE) : v])))).toString("base64");
      cdp.send("Fetch.fulfillRequest", { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: "content-type", value: "application/json" }], body });
    }
  });
  await Promise.all(["Page.enable", "Runtime.enable", "Log.enable"].map((x) => cdp.send(x)));
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*/studies/17/defaults.json*" }] });
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE });
  return cdp;
}
async function closeTab(cdp) { cdp.ws.close(); await fetch(`http://127.0.0.1:${DBG}/json/close/${cdp.target}`); }

const mouse = (cdp, type, x, y, extra = {}) => cdp.send("Input.dispatchMouseEvent", { type, x, y, button: "none", ...extra });
const park = (cdp, W, H) => mouse(cdp, "mouseMoved", W - 6, H - 6);
async function click(cdp, x, y) {
  await mouse(cdp, "mouseMoved", x, y);
  await mouse(cdp, "mousePressed", x, y, { button: "left", clickCount: 1 });
  await mouse(cdp, "mouseReleased", x, y, { button: "left", clickCount: 1 });
}
async function shot(cdp, file) {
  const r = await cdp.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(SHOTS, file), Buffer.from(r.data, "base64"));
}
// A door of the current world (the k-th, wrapping), and whether a click at its centre lands on it.
// Crossing by door (i+1) walks A → B → D → F → B, so world 5 is not world 1 again.
const DOOR_K = (k) => `(() => { const w = ${CUR}; const ds = w && w.querySelectorAll('a.door'); if (!ds || !ds.length) return null; const a = ds[${k} % ds.length];
  const r = a.getClientRects()[0]; const x = r.left + Math.min(r.width / 2, 60), y = r.top + r.height / 2;
  const hit = document.elementFromPoint(x, y); const op = +getComputedStyle(a.closest('.line')).opacity * +getComputedStyle(a.closest('.poem')).opacity;
  return { x, y, to: a.dataset.to, hits: !!(hit && hit.closest('a.door') === a), visible: op > .3 && getComputedStyle(a).visibility === 'visible' }; })()`;
const DOOR = DOOR_K(0);
const TITLE = `(() => { const r = ${CUR}.querySelector('.title').getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2 }; })()`;
const LINE = `(() => { const l = ${CUR}.querySelectorAll('.line')[1]; const r = l.getClientRects()[0]; return { x: r.left + 30, y: r.top + r.height / 2 }; })()`;
const STATE = `${CUR}.querySelector('.poem').dataset.state`;
const NO_TIMER = `document.querySelectorAll('[role=progressbar],[role=timer],[role=meter],progress,meter,[class*=timer],[class*=progress],[class*=countdown],[id*=timer],[id*=progress],[id*=countdown]').length`;

async function desktop(p) {
  const W = 1280, H = 800;
  const cdp = await open();
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP}/studies/17/deeper.html?p=${p}` });
  await waitFor(() => cdp.ev(`!!${CUR}`), "first world");
  await park(cdp, W, H);
  const holds = [], weights = [];
  for (let i = 1; i <= 5; i++) {
    const tOpen = await waitFor(() => cdp.ev(seen(i, "open")), `world ${i} open`);
    await sleep(T["open-ms"] + 40);
    const door = await cdp.ev(DOOR);
    check(door && door.hits && door.visible, `${p} desktop world ${i}: a door is clickable the moment the poem is open`, JSON.stringify(door));
    check((await cdp.ev(NO_TIMER)) === 0, `${p} desktop world ${i}: no timer or progress element`);
    if (i === 1 || i === 5) await shot(cdp, `${p}-desktop-world${i}.png`);

    if (p === "d") {
      const ls = await cdp.ev(`__log.filter((e) => e.w === ${i} && e.line != null)`);
      const lastPlain = Math.max(...ls.filter((e) => !e.door).map((e) => e.t)), firstDoor = Math.min(...ls.filter((e) => e.door).map((e) => e.t));
      check(ls.length > 3 && lastPlain < firstDoor, `d world ${i}: every door arrives after every other line`, `${ls.length} lines`);
    }

    const settled = p === "b" && i >= T["settle-after"];
    if (p === "c" || settled) {
      await sleep(holdFor(i - 1) * 1.5 + T["fold-ms"]);
      check((await cdp.ev(STATE)) === "open", `${p} world ${i}: never folds`);
      if (p === "c") weights.push(await cdp.ev(`(() => { const w = ${CUR}; return { poem: +getComputedStyle(w.querySelector('.poem')).opacity,
        photo: +/brightness\\(([\\d.]+)\\)/.exec(getComputedStyle(w.querySelector('.photo')).filter)[1] }; })()`));
    } else if (p === "a" && i === 5) {
      // the pointer rests on a line through the whole hold: nothing folds under it
      const l = await cdp.ev(LINE); await mouse(cdp, "mouseMoved", l.x, l.y);
      await sleep(holdFor(i - 1) * 1.4 + T["fold-ms"]);
      check((await cdp.ev(STATE)) === "open", "a world 5: a pointer resting on a line holds the poem open past its hold");
      const tLeave = performance.now(); await park(cdp, W, H);
      await waitFor(() => cdp.ev(`${STATE} === 'folding'`), "fold after leaving", holdFor(5) * 3);
      const after = performance.now() - tLeave;
      check(after >= T["leave-grace-ms"] * .8, "a world 5: once the pointer leaves, it folds only after the grace", `${Math.round(after)}ms vs grace ${T["leave-grace-ms"]}`);
    } else {
      const tFold = await waitFor(() => cdp.ev(seen(i, "folding")), `world ${i} folding`, holdFor(i - 1) * 3 + 5000);
      holds.push(tFold - tOpen);
      if (p === "d") {
        await waitFor(() => cdp.ev(seen(i, "folded")), `world ${i} folded`);
        const d2 = await cdp.ev(DOOR);
        check(d2 && d2.hits && d2.visible, `d world ${i}: folded, the doors are still there and clickable`, JSON.stringify(d2));
      }
    }
    if (i === 5) break;
    // reopen if it folded (hover the title), then cross by the first door
    if ((await cdp.ev(STATE)) !== "open") {
      const t = await cdp.ev(TITLE); await mouse(cdp, "mouseMoved", t.x, t.y);
      await waitFor(() => cdp.ev(`${STATE} === 'open'`), `world ${i} reopens on hover`);
      await sleep(T["open-ms"] + 40);
    }
    const d = await cdp.ev(DOOR_K(i + 1));
    check(d && d.hits, `${p} desktop world ${i}: the door it crosses by is clickable`, JSON.stringify(d));
    await click(cdp, d.x, d.y);
    await park(cdp, W, H);
    await waitFor(() => cdp.ev(`${CUR} && ${CUR}.dataset.key === '${d.to}' && document.querySelectorAll('.world').length === 1`), `cross to ${d.to}`);
  }

  if (p === "a" || p === "d") {
    const ratios = holds.slice(1).map((h, k) => h / holds[k]);
    check(holds.length >= 4 && ratios.every((r) => r > 1 + (T["hold-growth"] - 1) * .6),
      `${p}: each world the poem stays open longer`, holds.map((h) => Math.round(h)).join(" → ") + " ms");
  }
  if (p === "b") {
    const ratios = holds.slice(1).map((h, k) => h / holds[k]);
    check(holds.length === T["settle-after"] - 1 && ratios.every((r) => r > 1 + (T["hold-growth"] - 1) * .6),
      "b: before it settles each world stays open longer", holds.map((h) => Math.round(h)).join(" → ") + " ms");
  }
  if (p === "c") {
    const up = weights.slice(1).every((w, k) => w.poem > weights[k].poem - 1e-6) && weights.at(-1).poem > weights[0].poem;
    const down = weights.slice(1).every((w, k) => w.photo < weights[k].photo + 1e-6) && weights.at(-1).photo < weights[0].photo;
    check(up && down, "c: deeper, the poem comes forward and the photograph recedes", JSON.stringify(weights));
  }
  check(cdp.errors.length === 0, `${p} desktop: no console errors`, cdp.errors.join(" | "));
  await closeTab(cdp);
}

async function phone(p) {
  const W = 390, H = 844;
  const cdp = await open();
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP}/studies/17/deeper.html?p=${p}` });
  await waitFor(() => cdp.ev(`!!${CUR}`), "first world");
  for (let i = 1; i <= 5; i++) {
    await waitFor(() => cdp.ev(seen(i, "open")), `phone world ${i} open`);
    await sleep(T["open-ms"] + 40);
    const d = await cdp.ev(DOOR_K(i + 1));
    check(d && d.hits && d.visible, `${p} phone world ${i}: a door is tappable the moment the poem is open`, JSON.stringify(d));
    if (i === 1 || i === 5) await shot(cdp, `${p}-phone-world${i}.png`);
    if (i === 5) break;
    await cdp.send("Input.synthesizeTapGesture", { x: d.x, y: d.y, gestureSourceType: "touch" });
    await waitFor(() => cdp.ev(`${CUR} && ${CUR}.dataset.key === '${d.to}' && document.querySelectorAll('.world').length === 1`), `phone tap crosses to ${d.to}`);
  }
  if (p === "a") {
    await waitFor(() => cdp.ev(`${STATE} === 'folded'`), "phone world 5 folds", holdFor(4) * 2 + 5000);
    const t = await cdp.ev(TITLE);
    await cdp.send("Input.synthesizeTapGesture", { x: t.x, y: t.y, gestureSourceType: "touch" });
    await waitFor(() => cdp.ev(`${STATE} === 'open'`), "tap reopen").catch(() => false);
    check((await cdp.ev(STATE)) === "open", "a phone: a tap on the title opens it again");
  }
  check(cdp.errors.length === 0, `${p} phone: no console errors`, cdp.errors.join(" | "));
  await closeTab(cdp);
}

try {
  mkdirSync(SHOTS, { recursive: true });
  await waitFor(() => fetch(`http://127.0.0.1:${HTTP}/studies/17/deeper.html`).then((r) => r.ok), "static server");
  await waitFor(() => fetch(`http://127.0.0.1:${DBG}/json/version`).then((r) => r.ok), "devtools");
  for (const p of ONLY) { await desktop(p); await phone(p); }
} catch (e) {
  failures++;
  console.log("FAIL " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" ") : e));
}
cleanup();
console.log(failures ? `\n${failures} failure(s)` : "\nall passed");
process.exit(failures ? 1 : 0);
