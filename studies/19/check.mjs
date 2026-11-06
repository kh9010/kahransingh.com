#!/usr/bin/env node
// Study 19, the volume: every fact verbatim from a public source, every 06 sentence kept or
// knowingly left out, no poem count, no camera line, and each of a–d shows every fact exactly
// once, readable, at 1440x900 and 390x844. Screenshots into studies/19/shots/.
// Run: node studies/19/check.mjs   (exits 1 on any failure)
import { spawn } from "node:child_process";
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SHOTS = path.join(HERE, "shots");
let failures = 0;
const check = (ok, label, detail) => { console.log((ok ? "ok   " : "FAIL ") + label + (ok || !detail ? "" : " — " + detail)); if (!ok) failures++; };

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", rarr: "→", larr: "←", middot: "·", hellip: "…" };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] ?? m));
const plain = (html) => decode(html.replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ");

const data = JSON.parse(readFileSync(path.join(HERE, "facts.json"), "utf8"));
const F = data.facts, N = F.length;
const srcText = new Map();
const src = (f) => { if (!srcText.has(f)) srcText.set(f, plain(readFileSync(path.join(ROOT, f), "utf8"))); return srcText.get(f); };

// 1. verbatim
const notVerbatim = [];
for (const [i, f] of F.entries()) {
  if (!src(f.src).includes(f.text)) notVerbatim.push(`#${i} "${f.text.slice(0, 40)}" not in ${f.src}`);
  if (f.sub && !src(f.src).includes(f.sub)) notVerbatim.push(`#${i} sub "${f.sub}" not in ${f.src}`);
  if (f.a && !f.text.includes(f.a[0])) notVerbatim.push(`#${i} link text "${f.a[0]}" not in its fact`);
}
if (!src(data.lede.src).includes(data.lede.text)) notVerbatim.push("lede");
check(!notVerbatim.length, `every fact verbatim from its source: ${N} facts, ${new Set(F.map((f) => f.src)).size} sources`, notVerbatim.join("; "));

// 2. nothing silently dropped from 06: every sentence of its ledger is in a fact or named in `omitted`
const h06 = readFileSync(path.join(ROOT, "studies/06/index.html"), "utf8");
const sentences = [...h06.matchAll(/<span class="t">([\s\S]*?)<\/span><\/li>/g)].flatMap((m) => plain(m[1]).trim().split(/(?<=\.)\s+(?=[A-Z0-9])/));
const omitted = data.omitted.map((o) => o.text);
const lost = sentences.filter((s) => !F.some((f) => f.text.includes(s)) && !omitted.includes(s));
const stale = omitted.filter((o) => !sentences.includes(o));
check(!lost.length && !stale.length, `06's ledger kept whole: ${sentences.length} sentences, ${sentences.filter((s) => F.some((f) => f.text.includes(s))).length} in facts, ${omitted.length} left out by name`, [...lost.map((s) => "dropped: " + s), ...stale.map((s) => "omitted but not in 06: " + s)].join("; "));

// 3. rulings: no poem count, no camera line
const POEMCOUNT = /\b\d+\s+poems\b/i, CAMERA = /leica|q2 monochrome/i;
const allText = JSON.stringify(F) + JSON.stringify(data.lede) + plain(readFileSync(path.join(HERE, "index.html"), "utf8"));
check(!POEMCOUNT.test(allText) && !CAMERA.test(allText), "no poem count, no camera line in the facts or the page", (POEMCOUNT.exec(allText) || CAMERA.exec(allText) || [""])[0]);
const stated = /(\d+) lines from 06/.exec(readFileSync(path.join(HERE, "index.html"), "utf8"))?.[1];
check(+stated === N, `the index's count says ${stated}, facts.json holds ${N}`);

// 4. rendered
function findShell() {
  const base = path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
  for (const v of existsSync(base) ? readdirSync(base).sort().reverse() : []) {
    const p = path.join(base, v, "chrome-headless-shell-mac-arm64/chrome-headless-shell");
    if (existsSync(p)) return p;
  }
}
const freePort = () => new Promise((r) => { const s = net.createServer().listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, tries = 150) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v; } catch {} await sleep(100); } throw new Error("timed out: " + label); }
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.p = new Map(); ws.onmessage = (m) => { const x = JSON.parse(m.data); if (x.id) { const q = this.p.get(x.id); this.p.delete(x.id); x.error ? q.reject(new Error(x.error.message)) : q.resolve(x.result); } }; }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.p.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async eval(expression) { const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception?.description)); return r.result.value; }
}
const shell = findShell();
if (!shell) { console.log("FAIL no chrome-headless-shell under ~/.cache/puppeteer"); process.exit(1); }
const [HP, CP] = [await freePort(), await freePort()];
const server = spawn("python3", ["-m", "http.server", String(HP), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
const chrome = spawn(shell, ["--headless", "--use-mock-keychain", "--password-store=basic", "--no-first-run", "--hide-scrollbars", `--remote-debugging-port=${CP}`, "about:blank"], { stdio: "ignore" });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} };
process.on("exit", cleanup);
mkdirSync(SHOTS, { recursive: true });

try {
  await waitFor(() => fetch(`http://127.0.0.1:${HP}/studies/19/`).then((r) => r.ok), "server");
  const t = await waitFor(() => fetch(`http://127.0.0.1:${CP}/json`).then((r) => r.json()), "devtools");
  const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  const texts = JSON.stringify(F.map((f) => f.text));
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    for (const v of ["", "a", "b", "c", "d"]) {
      await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HP}/studies/19/${v ? "?v=" + v : ""}` });
      await waitFor(() => cdp.eval(`document.readyState === 'complete' && document.fonts.status === 'loaded' && (${!v} || document.documentElement.dataset.rendered === '${v}')`), `render ${v} ${w}`);
      await sleep(300);
      const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(path.join(SHOTS, `${v || "index"}-${w}x${h}.png`), Buffer.from(shot.data, "base64"));
      if (!v) continue;
      const r = await cdp.eval(`(() => {
        const want = ${texts};
        const els = [...document.querySelectorAll('#volume .f')];
        const idx = els.map((e) => +e.dataset.i);
        const wrong = els.filter((e) => e.querySelector('.t').textContent !== want[+e.dataset.i]).map((e) => e.dataset.i);
        const sizes = els.map((e) => parseFloat(getComputedStyle(e.querySelector('.t')).fontSize));
        const lastBottom = Math.max(...els.map((e) => e.getBoundingClientRect().bottom));
        return { n: els.length, uniq: new Set(idx).size, missing: want.map((_, i) => i).filter((i) => !idx.includes(i)), wrong, minPx: Math.min(...sizes),
          hscroll: document.documentElement.scrollWidth > innerWidth + 1, lastBottom, text: document.body.innerText };
      })()`);
      const tag = `${v} at ${w}x${h}`;
      check(r.n === N && r.uniq === N && !r.missing.length, `${tag}: shows ${r.n} of ${N} facts, each once`, `missing #${r.missing.join(",#")}`);
      check(!r.wrong.length, `${tag}: every shown fact reads exactly as its source`, `#${r.wrong.join(",#")}`);
      check(r.minPx >= 12, `${tag}: smallest fact type ${r.minPx}px (floor 12)`);
      check(!r.hscroll, `${tag}: no sideways overflow`);
      check(!POEMCOUNT.test(r.text) && !CAMERA.test(r.text), `${tag}: no poem count, no camera line on screen`);
      if (v === "a" && !mobile) check(r.lastBottom <= h, `a at ${w}x${h}: the whole wall fits one screen (last fact ends at ${Math.round(r.lastBottom)}px)`);
    }
  }
} catch (e) { check(false, "render", e.message); }
cleanup();
console.log(failures ? `FAIL study 19: ${failures} failing` : `PASS study 19: ${N} facts verbatim, 06 kept whole, a–d each show all ${N} at 1440x900 and 390x844; shots in studies/19/shots/`);
process.exit(failures ? 1 : 0);
