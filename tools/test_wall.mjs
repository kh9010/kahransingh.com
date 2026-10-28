#!/usr/bin/env node
// test_wall.mjs — the wall of ideas says what Kahran decided it says.
//
// Pins (Kahran, 2026-10-27): six ideas, Home the sixth; every idea has parts;
// the <noscript> copy in index.html says the same lines as IDEAS; the system is
// never called "day-flow" anywhere a visitor can read on the wall or the flow
// view; the flow view's tables only name ideas and surfaces that exist. Then it
// renders / with #flow in headless Chrome at 1200x800 and 390x844 and checks
// six tiles land, none overflows its box, and the rendered text is clean.
//
// Run: node tools/test_wall.mjs [--shots DIR]   (exits non-zero on any failure)
// --shots writes wall/flow screenshots at both sizes into DIR.
// Needs: python3 (static server) and Chrome for Testing's headless shell in
// ~/.cache/puppeteer (any version).

import { spawn } from "node:child_process";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HTTP_PORT = 8123, CDP_PORT = 9337;
const BANNED = /day[\s-]?flow/i;
const shotsAt = process.argv.indexOf("--shots");
const SHOTS = shotsAt > 0 ? process.argv[shotsAt + 1] : null;

let failures = 0;
function check(cond, label, detail) {
  if (cond) console.log("ok   " + label);
  else { failures++; console.log("FAIL " + label + (detail ? " — " + detail : "")); }
}

/* ------------------------------------------------------- static tables -- */

// Pull `var NAME = <literal>;` out of a source file and evaluate the literal
// alone, so the check reads the real table rather than a copy of it.
function literal(src, name) {
  const at = src.indexOf("var " + name + " = ");
  if (at < 0) throw new Error(name + " not found");
  const start = at + ("var " + name + " = ").length;
  const open = src[start], close = open === "[" ? "]" : open === "{" ? "}" : null;
  let end;
  if (!close) end = src.indexOf(";\n", start);
  else {
    let depth = 0, q = null;
    for (let i = start; i < src.length; i++) {
      const c = src[i];
      if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
      if (c === "'" || c === '"') { q = c; continue; }
      if (c === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); continue; }
      if (c === open) depth++;
      else if (c === close && --depth === 0) { end = i + 1; break; }
    }
  }
  return vm.runInNewContext("(" + src.slice(start, end) + ")");
}

const homeJs = readFileSync(path.join(ROOT, "v2/home.js"), "utf8");
const flowJs = readFileSync(path.join(ROOT, "v2/flow.js"), "utf8");
const css = readFileSync(path.join(ROOT, "v2/home.css"), "utf8");
const indexHtml = readFileSync(path.join(ROOT, "index.html"), "utf8");
const contextHtml = readFileSync(path.join(ROOT, "context/index.html"), "utf8");

const IDEAS = literal(homeJs, "IDEAS");
const ROWS = literal(homeJs, "WALL_ROWS");
const PLACE = literal(flowJs, "PLACE");
const EDGES = literal(flowJs, "EDGES");
const SURFACES = literal(flowJs, "SURFACES");
const FEEDS = literal(flowJs, "FEEDS");
const READ = literal(flowJs, "READ");
const GROUPS = literal(flowJs, "GROUPS");
const names = IDEAS.map((i) => i.name);

check(IDEAS.length === 6, "six ideas", names.join(", "));
check(names[5] === "Home", "Home is the sixth idea", names[5]);
check(ROWS.reduce((a, b) => a + b, 0) === IDEAS.length && ROWS.join("+") === "3+3", "the wall is 3+3", ROWS.join("+"));
const empty = IDEAS.filter((i) => !Array.isArray(i.parts) || !i.parts.length || i.parts.some((p) => !String(p).trim()));
check(!empty.length, "every idea has parts", empty.map((i) => i.name).join(", "));
const noLine = IDEAS.filter((i) => !i.line || !i.detail || !i.detail.intro || !i.detail.boundary ||
  !Array.isArray(i.detail.tools) || i.detail.tools.length !== i.parts.length);
check(!noLine.length, "every idea has a line and a reading panel with one explanation per part", noLine.map((i) => i.name).join(", "));

const hues = IDEAS.map((i) => i.hue);
check(new Set(hues).size === hues.length, "one hue per idea", hues.join(" "));
const undefinedHue = hues.filter((h) => !new RegExp("\\." + h + "\\s*\\{[^}]*--h:").test(css) || !GROUPS.includes(h));
check(!undefinedHue.length, "every hue is a pigment in home.css and a group in flow.js", undefinedHue.join(" "));

// The noscript copy: same names, same lines, same order.
const nos = (indexHtml.match(/<ul class="wall-plain">([\s\S]*?)<\/ul>/) || [])[1] || "";
const plain = (h) => h.replace(/<[^>]+>/g, "").replace(/&middot;/g, "·").replace(/&rsquo;/g, "’")
  .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const items = [...nos.matchAll(/<li>\s*<b>([\s\S]*?)<\/b>([\s\S]*?)<\/li>/g)].map((m) => [plain(m[1]), plain(m[2])]);
const want = IDEAS.map((i) => [i.name, i.line]);
check(JSON.stringify(items) === JSON.stringify(want), "noscript lines match IDEAS",
  "noscript " + JSON.stringify(items) + " vs IDEAS " + JSON.stringify(want));

// The flow view's tables name only things that exist.
check(names.every((n) => PLACE[n]) && Object.keys(PLACE).length === names.length, "every idea has a place in the flow view",
  names.filter((n) => !PLACE[n]).join(", "));
const cells = Object.values(PLACE).map((p) => p.join(","));
check(new Set(cells).size === cells.length, "no two ideas land on the same cell", cells.join(" "));
const badEdge = EDGES.filter((e) => !names.includes(e[0]) || !names.includes(e[1]));
check(!badEdge.length, "every arrow joins two ideas", JSON.stringify(badEdge));
const surfIds = SURFACES.map((s) => s[0]);
const badFeed = FEEDS.filter((f) => !names.includes(f[0]) || !surfIds.includes(f[1]));
check(!badFeed.length, "every feed leaves an idea and lands on a surface", JSON.stringify(badFeed));
const deadSurf = surfIds.filter((id) => !FEEDS.some((f) => f[1] === id));
check(!deadSurf.length, "no surface without a line into it", deadSurf.join(", "));

// Never the system's working name, anywhere a visitor reads.
const visible = [
  ...IDEAS.flatMap((i) => [i.name, i.line, ...i.parts, i.detail.intro, i.detail.boundary, ...i.detail.tools]),
  ...SURFACES.flatMap((s) => [s[1], s[2]]), READ,
  plain(nos), plain(contextHtml.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)[\s\S]*?<\/\1>/g, "")),
];
const leaks = visible.filter((t) => BANNED.test(t));
check(!leaks.length, "no \"day-flow\" in the wall, the flow view or the Context page", leaks.join(" | "));

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
    await waitFor(() => cdp.evaluate("document.querySelectorAll('#wall-block .tile').length === 6 && document.fonts.status === 'loaded'"), "six tiles " + tag);
    await sleep(600);
    if (mobile) await cdp.evaluate("document.querySelector('.tools-layer').scrollIntoView(); true");
    await sleep(200);
    await shot(cdp, `wall-${tag}.png`);

    await cdp.evaluate("location.hash = 'flow'; true");
    await waitFor(() => cdp.evaluate("document.querySelector('.tools-layer').classList.contains('is-landed')"), "flow landed " + tag);
    await sleep(1800);
    if (mobile) await cdp.evaluate("document.querySelector('.wall-block').scrollIntoView({block: 'center'}); true");
    await sleep(300);
    await shot(cdp, `flow-${tag}.png`);

    const r = await cdp.evaluate(`(() => {
      const block = document.getElementById('wall-block');
      const tiles = [...block.querySelectorAll('.tile')];
      // A flex column centres its content, so text that runs long spills out of
      // the top as well as the bottom and scrollHeight misses half of it. Measure
      // the text boxes against the tile's padding box instead.
      const over = tiles.filter((t) => {
        const box = t.getBoundingClientRect(), cs = getComputedStyle(t);
        const top = box.top + parseFloat(cs.paddingTop) - 1, bottom = box.bottom - parseFloat(cs.paddingBottom) + 1;
        const right = box.right - parseFloat(cs.paddingRight) + 1;
        return [...t.querySelectorAll('.tile-name, .tile-parts')].some((el) => {
          const r = el.getBoundingClientRect();
          return r.top < top || r.bottom > bottom || r.right > right;
        });
      }).map((t) => t.querySelector('.tile-name').textContent);
      const rects = tiles.map((t) => t.getBoundingClientRect());
      let overlap = 0;
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlap++;
      }
      const text = block.textContent + ' ' +
                   [...document.querySelectorAll('.idea-detail')].map((c) => c.textContent).join(' ') +
                   ' ' + (block.querySelector('svg title') || {}).textContent;
      const panels = document.querySelectorAll('.idea-detail').length;
      const lines = block.querySelectorAll('.flow-line').length;
      const wires = block.querySelectorAll('.flow-wire--main, .flow-wire--light').length;
      const watch = block.querySelectorAll('.flow-wire--watch').length;
      const hscroll = document.documentElement.scrollWidth > window.innerWidth + 1;
      return { n: tiles.length, over, overlap, text, lines, wires, watch, hscroll, panels };
    })()`);
    check(r.n === 6, `six tiles in the flow view at ${tag}`, String(r.n));
    check(!r.over.length, `no tile's text overflows its box at ${tag}`, r.over.join(", "));
    check(r.overlap === 0, `no two tiles overlap at ${tag}`, r.overlap + " pairs");
    check(!BANNED.test(r.text), `no "day-flow" in the rendered wall or its reading panels at ${tag}`);
    check(r.panels === 6, `six reading panels at ${tag}`, String(r.panels));
    check(r.wires === EDGES.length && r.lines === FEEDS.length && r.watch === IDEAS.length - 1,
      `every arrow is drawn at ${tag}`, `${r.wires}/${EDGES.length} arrows, ${r.lines}/${FEEDS.length} lines, ${r.watch}/${IDEAS.length - 1} watch`);
    check(!r.hscroll, `no sideways scroll at ${tag}`);

    // Home's reading panel opens, sits inside the window, and lists its four parts.
    const hp = await cdp.evaluate(`(() => {
      const t = [...document.querySelectorAll('#wall-block .tile')].find((x) => x.querySelector('.tile-name').textContent.trim() === 'Home');
      t.querySelector('.idea-trigger').click();
      const c = [...document.querySelectorAll('.idea-detail')].find((x) => !x.hidden);
      if (!c) return null;
      c.scrollIntoView({ block: 'nearest' });
      const r = c.getBoundingClientRect();
      return { title: c.querySelector('h2').textContent, dts: c.querySelectorAll('dt').length,
               inside: r.left >= 0 && r.right <= innerWidth + 1 };
    })()`);
    await sleep(300);
    await shot(cdp, `panel-${tag}.png`);
    check(hp && hp.title === "Home" && hp.dts === 4 && hp.inside, `Home's reading panel opens inside the window at ${tag}`, JSON.stringify(hp));
  }
} catch (e) {
  failures++;
  console.log("FAIL " + e.message);
}

cleanup();
process.exit(failures ? 1 : 0);
