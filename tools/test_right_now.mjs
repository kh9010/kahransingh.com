#!/usr/bin/env node
// test_right_now.mjs — the "Right now I'm:" block says what Kahran asked it to.
//
// Pins (Kahran, 2026-10-28: "end in some hints of what we are working on now"):
// the first line is still the tools line and still the door to the wall; under
// it sit the other things on the bench. Each of those opens a short note
// (Kahran, 2026-10-28: "a small note on each one not as long as context"),
// whose link lives only in v2/right-now.json (the weekly drift check reads the
// same file): an empty href shows "coming soon" and no link, a filled one shows
// the link and no "coming soon". Then it renders / in headless Chrome at
// 1200x800 and 390x844: every line is in the window, the column clears the poem
// on a wide screen, hover (wide) or a tap (phone) shows the note inside the
// window and off the poem, a click on the tools line opens the wall and a second
// click puts it away, a tap on a note line never opens the wall. Network: every
// filled href answers 200, and the mirror's link is the newest version the
// piece's deployed rail lists.
//
// Run: node tools/test_right_now.mjs [--shots DIR]   (exits non-zero on any failure)
// Every wait is on a condition with one deadline (WAIT_MS, default 60000), never
// a fixed sleep, so it holds under load (several runs at once, a busy verify).
// Ports come from the server and Chrome themselves (port 0), Chrome gets its own
// profile, and analytics is blocked so a test run is never counted as a visit.
// Needs: Chrome for Testing's headless shell in
// ~/.cache/puppeteer (any version).

import { spawn } from "node:child_process";
import http from "node:http";
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdtempSync, rmSync, statSync, readFile } from "node:fs";
import { fileURLToPath } from "node:url";
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

const html = readFileSync(path.join(ROOT, "v2/index.html"), "utf8"); // the Right now lines live on /v2/ only since the stone took / (2026-11-09)
const list = (html.match(/<ul class="doing-list">([\s\S]*?)<\/ul>/) || [])[1] || "";
const items = [...list.matchAll(/<li class="doing-item"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[0]);
const text = (h) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const first = items[0] || "";
check(/<button[^>]*id="doing-tools"/.test(first) && /aria-controls="wall-block"/.test(first) && text(first) === TOOLS_LINE,
  "the first line is the tools line and controls the wall", text(first));
const rest = items.slice(1);
check(rest.length >= 2 && rest.length <= 3, "two or three lines follow it", String(rest.length));
const lineText = (h) => text((h.match(/<button[^>]*>([\s\S]*?)<\/button>/) || [])[1] || "");
const noteOf = (h) => (h.match(/<p class="doing-note"[^>]*>([\s\S]*?)<\/p>/) || [])[1] || "";
const noteText = (h) => text(noteOf(h).replace(/<a class="doing-play"[\s\S]*?<\/a>|<span class="doing-soon"[\s\S]*?<\/span>/g, ""));
const ids = rest.map((h) => (h.match(/data-line="([a-z-]+)"/) || [])[1]);
check(rest.every((h, i) => ids[i]
    && new RegExp(`<button type="button" class="doing-bullet doing-bullet--note"\\s+aria-expanded="false" aria-controls="doing-note-${ids[i]}">`).test(h)
    && new RegExp(`<p class="doing-note" id="doing-note-${ids[i]}">`).test(h)),
  "each line after it is a button that controls its own note", ids.join(" | "));
check(rest.every((h) => noteText(h).length >= 20 && noteText(h).length <= 170 && (noteText(h).match(/[.!?](\s|$)/g) || []).length <= 2),
  "each note is a sentence or two, not a panel", rest.map((h) => noteText(h).length).join(", ") + " chars");
check(rest.every((h) => /<a class="doing-play" hidden>[^<]+<\/a>/.test(noteOf(h)) && /<span class="doing-soon" hidden>coming soon<\/span>/.test(noteOf(h)) && !/href=/.test(h)),
  "the link slot is in the note, its href is not in the page");
check(rest.every((h) => /^[a-z]+ing /.test(lineText(h))), "each says what he is doing, lowercase, present tense", rest.map(lineText).join(" | "));
const words = [...items.map(text), ...rest.map(noteText)].join(" ");
check(!/day[\s-]?flow/i.test(words), "no \"day-flow\" under Right now");
// Proper nouns allowed under Right now; any other capital is someone's name until said otherwise.
const ALLOWED_CAPS = new Set(["Delhi", "Metro", "I"]);
const caps = (rest.map(noteText).join(" ").match(/\b[A-Z][a-z]+\b/g) || []).filter((w) => !ALLOWED_CAPS.has(w));
check(caps.length === 0, "no one else's name in the notes", caps.join(", "));

/* --- v2/right-now.json: the one home of the links, read by the drift check -- */
const KINDS = new Set(["ypf-latest-version", "head-200"]);
let rn = null;
const SLOTS = `(() => { const o = {}; document.querySelectorAll('.doing-item[data-line]').forEach((li) => {
  const a = li.querySelector('.doing-play'), s = li.querySelector('.doing-soon');
  const on = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none';
  o[li.dataset.line] = { link: on(a) && a.getAttribute('href') ? a.href : null, soon: on(s) && s.textContent.trim() === 'coming soon' };
}); return o; })()`;
const NOTE = (id) => `(() => {
  const li = document.querySelector('[data-line="${id}"]'), note = li.querySelector('.doing-note');
  const r = note.getBoundingClientRect();
  const hit = (el) => { if (!el) return false; const q = el.getBoundingClientRect();
    if (q.width === 0 || q.height === 0 || getComputedStyle(el).visibility === 'hidden') return false;
    return r.left < q.right && q.left < r.right && r.top < q.bottom && q.top < r.bottom; };
  return { shown: getComputedStyle(note).display !== 'none' && r.width > 0,
           expanded: li.querySelector('.doing-bullet').getAttribute('aria-expanded') === 'true',
           rect: { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: innerWidth, h: innerHeight },
           inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1,
           offPoem: !hit(document.getElementById('poem-body')) && !hit(document.getElementById('poem-label')),
           wall: document.querySelector('.tools-layer').classList.contains('is-flow') };
})()`;

try { rn = JSON.parse(readFileSync(path.join(ROOT, "v2/right-now.json"), "utf8")); } catch (e) { check(false, "v2/right-now.json parses", e.message); }
const rnLines = (rn && Array.isArray(rn.lines)) ? rn.lines : [];
check(rn && typeof rn._about === "string" && rnLines.length > 0, "right-now.json has _about and lines");
check(JSON.stringify(rnLines.map((l) => l.id).sort()) === JSON.stringify([...ids].sort()),
  "right-now.json names the same lines as the page", rnLines.map((l) => l.id).join(" | "));
check(rnLines.every((l) => typeof l.href === "string" && (l.href === "" || /^https:\/\/[^\s]+$/.test(l.href))),
  "every href is absolute or empty");
check(rnLines.every((l) => l.current && KINDS.has(l.current.kind) && (l.current.kind !== "ypf-latest-version" || /^https:\/\/\S+$/.test(l.current.source || ""))),
  "every line says how \"most current\" is judged", rnLines.map((l) => l.current && l.current.kind).join(" | "));
// Both hrefs stay empty until each piece has been submitted to an open call
// (Kahran, 2026-10-28); the note then says "coming soon". The checks below
// still run the moment one is filled.
check(rnLines.some((l) => l.id === "mirror") && rnLines.some((l) => l.id === "metro"), "the mirror and metro lines are both listed");

/* ------------------------------------------------------------- network -- */
for (const l of rnLines.filter((l) => l.href)) {
  const st = await fetch(l.href, { method: "HEAD", redirect: "follow" }).then((r) => r.status).catch((e) => e.message);
  check(st === 200, `${l.id} link answers 200`, `${l.href} → ${st}`);
  if (l.current.kind === "ypf-latest-version") {
    const rail = await fetch(l.current.source).then((r) => r.text()).catch(() => "");
    const ns = [...rail.matchAll(/href="v\/(\d+)\/"/g)].map((m) => Number(m[1]));
    const newest = ns.length ? Math.max(...ns) : null;
    const linked = Number((l.href.match(/\/v\/(\d+)\/$/) || [])[1]);
    check(newest !== null && linked === newest, `${l.id} links the newest version the rail lists`, `linked ${linked}, newest ${newest}`);
  }
}

/* ------------------------------------------------------------- rendered -- */

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
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
      else if (this.onEvent) this.onEvent(msg); }; }
  send(method, params = {}) { const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params })); }); }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page threw: " + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    return r.result.value;
  }
}
// Navigate and wait for the NEW document's load event: the old page is marked
// first, so a check can never pass on the page that was there before.
async function go(cdp, url) {
  await cdp.evaluate("window.__harnessOld = true").catch(() => {});
  await cdp.send("Page.navigate", { url });
  await waitFor(() => cdp.evaluate("!window.__harnessOld && document.readyState === 'complete'"), "load " + url);
}
// Wait until a layout snapshot (a JSON string from the page) reads the same three times running.
async function settled(cdp, expr, label) {
  let prev = null, same = 0;
  await waitFor(async () => { const v = await cdp.evaluate(expr); same = v === prev ? same + 1 : 0; prev = v; return same >= 2; }, label);
}

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
const profile = mkdtempSync(path.join(os.tmpdir(), "ks-right-now-"));
const server = await serve(ROOT);
const chrome = spawn(shell, [
  "--headless", "--use-mock-keychain", "--password-store=basic", "--no-first-run",
  `--user-data-dir=${profile}`, "--hide-scrollbars", "--remote-debugging-port=0", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.close(); server.closeAllConnections(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} };
process.on("exit", cleanup);

async function shot(cdp, file) {
  if (!SHOTS) return;
  const r = await cdp.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(SHOTS, file), Buffer.from(r.data, "base64"));
}

try {
  const HTTP_PORT = server.address().port;
  const CDP_PORT = await portFrom(chrome, "stderr", /DevTools listening on ws:\/\/[^:]+:(\d+)\//, "Chrome");
  await waitFor(() => fetch(`http://127.0.0.1:${HTTP_PORT}/v2/index.html`).then((r) => r.ok), "static server");
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json()).then((t) => t.find((x) => x.type === "page") && t), "devtools");
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.setBlockedURLs", { urls: ["*googletagmanager.com*", "*google-analytics.com*"] });
  // what the checks read; once it stops moving, the page has drawn
  const LAYOUT = `JSON.stringify(['.doing-list', '#poem-hold', '#poem-body', '#poem-label', '#photo'].map((q) => {
    const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map(Math.round); }).concat([scrollY, innerWidth, innerHeight]))`;
  const NOTE_STILL = (id) => `(() => { const n = document.querySelector('[data-line="${id}"] .doing-note');
    return n.getAnimations().every((a) => a.playState === 'finished'); })()`;

  for (const [w, h, mobile, tag] of [[1200, 800, false, "1200"], [390, 844, true, "390"]]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await go(cdp, `http://127.0.0.1:${HTTP_PORT}/v2/`);
    await waitFor(() => cdp.evaluate("document.querySelectorAll('#wall-block .tile').length === 6 && document.fonts.status === 'loaded' && document.getElementById('photo').complete && document.getElementById('photo').naturalWidth > 0 && document.getElementById('poem-body').children.length > 0"), "six tiles, the photograph and the poem " + tag);
    await settled(cdp, LAYOUT, "the page to stop moving " + tag);
    await shot(cdp, `now-${tag}.png`);
    if (mobile) { await cdp.evaluate("document.querySelector('.doing').scrollIntoView({block: 'start'}); true"); await settled(cdp, LAYOUT, "the scroll " + tag); await shot(cdp, `now-${tag}-band.png`); }

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

    // the link slot follows right-now.json: empty → coming soon, filled → the link
    await waitFor(() => cdp.evaluate("document.documentElement.getAttribute('data-right-now') === 'ready'"), "right-now.json " + tag);
    const slots = await cdp.evaluate(SLOTS);
    check(rnLines.every((l) => { const s = slots[l.id]; return s && (l.href
        ? s.link === l.href && !s.soon
        : s.link === null && s.soon); }),
      `each note shows its link, or "coming soon" when there is none, at ${tag}`, JSON.stringify(slots));

    // the note: hover on a wide screen, a tap on a phone; inside the window, off the poem
    for (const id of ids) {
      if (mobile) {
        await cdp.evaluate(`document.querySelector('.doing').scrollIntoView({block: 'start'}); document.querySelector('[data-line="${id}"] .doing-bullet').click(); true`);
      } else {
        const c = await cdp.evaluate(`(() => { const r = document.querySelector('[data-line="${id}"] .doing-bullet').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
        await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x, y: c.y, pointerType: "mouse" });
      }
      // the note opens on the event; wait for it (and its short fade-in) rather than a fixed time
      await waitFor(() => cdp.evaluate(`(() => { const n = ${NOTE(id)}; return n.shown && n.expanded; })() && ${NOTE_STILL(id)}`), `${id} note to open at ${tag}`).catch(() => null);
      const n = await cdp.evaluate(NOTE(id));
      check(n.shown && n.expanded, `${id}: ${mobile ? "a tap" : "hover"} shows the note at ${tag}`);
      check(n.inside, `${id}: the note stays in the window at ${tag}`, JSON.stringify(n.rect));
      check(n.offPoem, `${id}: the note covers neither the poem nor its label at ${tag}`);
      check(!n.wall, `${id}: opening the note leaves the wall shut at ${tag}`);
      await shot(cdp, id === ids[0] ? `notes-${tag}.png` : `notes-${tag}-${id}.png`);
      if (mobile) await cdp.evaluate(`document.querySelector('[data-line="${id}"] .doing-bullet').click(); true`);
      else await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: h - 5, pointerType: "mouse" });
      await waitFor(() => cdp.evaluate(`(() => { const n = ${NOTE(id)}; return !n.shown && !n.expanded; })()`), `${id} note to close at ${tag}`).catch(() => null);
      const gone = await cdp.evaluate(NOTE(id));
      check(!gone.shown && !gone.expanded, `${id}: ${mobile ? "a second tap" : "moving off"} puts it away at ${tag}`);
    }

    // the tools line opens the wall, and a second click puts it away
    await cdp.evaluate("document.getElementById('doing-tools').click(); true");
    const opened = await waitFor(() => cdp.evaluate(`(() => {
      const b = document.getElementById('doing-tools'), l = document.querySelector('.tools-layer').classList;
      return l.contains('is-landed') && !l.contains('is-flying') && b.getAttribute('aria-expanded') === 'true';
    })()`), "wall opens " + tag).catch(() => false);
    check(opened === true, `the tools line opens the wall at ${tag}`);
    if (mobile) await cdp.evaluate("document.querySelector('.doing').scrollIntoView({block: 'start'}); true");
    if (SHOTS) await settled(cdp, LAYOUT, "the open wall " + tag);
    await shot(cdp, `now-${tag}-open.png`);
    await cdp.evaluate("document.getElementById('doing-tools').click(); true");
    const closed = await waitFor(() => cdp.evaluate(
      "!document.querySelector('.tools-layer').classList.contains('is-flow') && document.getElementById('doing-tools').getAttribute('aria-expanded') === 'false'"),
      "wall closes " + tag).catch(() => false);
    check(closed === true, `a second click puts it away at ${tag}`);
  }

  // the swap: fill the empty href and empty the filled one, served in place of
  // right-now.json; the page must follow the file with no other edit
  const swapped = { ...rn, lines: rnLines.map((l) => ({ ...l, href: l.href ? "" : "https://example.com/" + l.id + "/" })) };
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*right-now.json*", requestStage: "Request" }] });
  cdp.onEvent = (msg) => { if (msg.method === "Fetch.requestPaused") cdp.send("Fetch.fulfillRequest", {
    requestId: msg.params.requestId, responseCode: 200,
    responseHeaders: [{ name: "Content-Type", value: "application/json" }],
    body: Buffer.from(JSON.stringify(swapped)).toString("base64") }); };
  await go(cdp, `http://127.0.0.1:${HTTP_PORT}/v2/`);
  await waitFor(() => cdp.evaluate("document.documentElement.getAttribute('data-right-now') === 'ready'"), "swapped right-now.json");
  const sw = await cdp.evaluate(SLOTS);
  check(swapped.lines.every((l) => { const s = sw[l.id]; return s && (l.href ? s.link === l.href && !s.soon : s.link === null && s.soon); }),
    "filling an href swaps \"coming soon\" for the link, and emptying it swaps back", JSON.stringify(sw));
  await cdp.send("Fetch.disable");
} catch (e) {
  failures++;
  console.log("FAIL " + e.message);
}

cleanup();
process.exit(failures ? 1 : 0);
