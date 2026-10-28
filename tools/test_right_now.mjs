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
      await sleep(250);
      const n = await cdp.evaluate(NOTE(id));
      check(n.shown && n.expanded, `${id}: ${mobile ? "a tap" : "hover"} shows the note at ${tag}`);
      check(n.inside, `${id}: the note stays in the window at ${tag}`, JSON.stringify(n.rect));
      check(n.offPoem, `${id}: the note covers neither the poem nor its label at ${tag}`);
      check(!n.wall, `${id}: opening the note leaves the wall shut at ${tag}`);
      await shot(cdp, id === ids[0] ? `notes-${tag}.png` : `notes-${tag}-${id}.png`);
      if (mobile) await cdp.evaluate(`document.querySelector('[data-line="${id}"] .doing-bullet').click(); true`);
      else await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: h - 5, pointerType: "mouse" });
      await sleep(200);
      const gone = await cdp.evaluate(NOTE(id));
      check(!gone.shown && !gone.expanded, `${id}: ${mobile ? "a second tap" : "moving off"} puts it away at ${tag}`);
    }

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

  // the swap: fill the empty href and empty the filled one, served in place of
  // right-now.json; the page must follow the file with no other edit
  const swapped = { ...rn, lines: rnLines.map((l) => ({ ...l, href: l.href ? "" : "https://example.com/" + l.id + "/" })) };
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*right-now.json*", requestStage: "Request" }] });
  cdp.onEvent = (msg) => { if (msg.method === "Fetch.requestPaused") cdp.send("Fetch.fulfillRequest", {
    requestId: msg.params.requestId, responseCode: 200,
    responseHeaders: [{ name: "Content-Type", value: "application/json" }],
    body: Buffer.from(JSON.stringify(swapped)).toString("base64") }); };
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/` });
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
