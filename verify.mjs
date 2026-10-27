#!/usr/bin/env node
// verify.mjs — the checks that pin this site's rulings, one PASS line each.
// The expected block lives in HANDOFF.md under Verification.
//
// Run: node verify.mjs            (exits 1 on the first FAIL, naming it)
// Needs python3 and, for the home-page ruling, Chrome for Testing's headless
// shell under ~/.cache/puppeteer (tools/test_photo_stays.mjs says how).

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = path.join(ROOT, "tools");

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
}

function check(name, fn) {
  let msg;
  try { msg = fn(); } catch (e) { console.log(`FAIL ${name}: ${e.message}`); process.exit(1); }
  console.log(`PASS ${name}: ${msg}`);
}

function unittest(mod) {
  const r = run("python3", ["-m", "unittest", mod], TOOLS);
  const ran = /Ran (\d+) tests?/.exec(r.out);
  if (!r.ok || !ran) throw new Error(r.out.trim().split("\n").slice(-6).join(" | "));
  return `${ran[1]} tests`;
}

check("daily pick follows the weather, then the archive, then the date hash", () => unittest("test_daily_pick"));
check("place feed", () => unittest("test_place_feed"));
check("adding photographs", () => unittest("test_add_photos"));
check("About and Photos entry points", () => unittest("test_about_photos"));
check("Lately feed layer", () => unittest("test_lately_feed"));

check("pick.js agrees with daily_pick.py", () => {
  const r = run("node", ["tools/test_pick_js.mjs"], ROOT);
  if (!r.ok) throw new Error(r.out.trim().split("\n").slice(-6).join(" | "));
  return r.out.trim().split("\n").pop();
});

check("the photograph never re-crops when the poem comes forward", () => {
  const r = run("node", ["tools/test_photo_stays.mjs"], ROOT);
  const oks = (r.out.match(/^ok /gm) || []).length;
  if (!r.ok) throw new Error(r.out.trim().split("\n").filter((l) => l.startsWith("FAIL")).join(" | ") || r.out.trim());
  return `${oks} checks at 1200x800`;
});

// ── About studies (studies/06–08): the rulings of 2026-10-26 ──────────────────
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";

const STUDIES = readdirSync(path.join(ROOT, "studies")).filter((d) => /^\d\d$/.test(d)).sort();
const studyHtml = (n) => readFileSync(path.join(ROOT, "studies", n, "index.html"), "utf8");

check("the rail matches the studies and opens on the newest", () => {
  const rail = readFileSync(path.join(ROOT, "studies", "index.html"), "utf8");
  const listed = [...rail.matchAll(/data-n="(\d\d)"/g)].map((m) => m[1]);
  if (listed.join() !== [...STUDIES].reverse().join()) throw new Error(`rail lists ${listed.join(",")}, studies on disk ${STUDIES.join(",")}`);
  const opens = /<iframe[^>]+src="(\d\d)\/"/.exec(rail)?.[1];
  if (opens !== STUDIES.at(-1)) throw new Error(`opens on ${opens}, newest is ${STUDIES.at(-1)}`);
  if (!/aria-current="page" data-n="(\d\d)"/.test(rail) || /aria-current="page" data-n="(\d\d)"/.exec(rail)[1] !== opens) throw new Error("current entry is not the one that opens");
  for (const n of STUDIES) if (!existsSync(path.join(ROOT, "studies", n, "index.html"))) throw new Error(`studies/${n}/index.html missing`);
  return `${STUDIES.length} studies (${STUDIES.join(", ")}), opens on ${opens}`;
});

check("a study is a site page: noindex, title, description, the site nav with about current, and it reads without JS", () => {
  let words = 0;
  for (const n of STUDIES) {
    const h = studyHtml(n);
    for (const [label, re] of [["noindex", /<meta name="robots" content="noindex, nofollow">/], ["title", /<title>About — Kahran Singh<\/title>/], ["description", /<meta name="description" content="[^"]{20,}">/], ["site stylesheet", /href="\/style\.css"/], ["nav with about current", /<a href="\/about\.html" class="active" aria-current="page">about<\/a>/], ["mobile header", /class="mobile-header"/]])
      if (!re.test(h)) throw new Error(`study ${n} lacks ${label}`);
    const main = /<main>([\s\S]*?)<\/main>/.exec(h)?.[1] || "";
    const text = main.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.split(" ").length < 120) throw new Error(`study ${n}: main holds ${text.split(" ").length} words of static text; the page must read without JS`);
    words += text.split(" ").length;
  }
  return `${STUDIES.length} pages, ${words} words of static copy`;
});

check("no instruction text and nothing a mock would not carry", () => {
  const banned = /\b(click|tap|hover|scroll|swipe|proposed|study|placeholder|lorem|todo|tbd)\b/i;
  for (const n of STUDIES) {
    const main = /<main>([\s\S]*?)<\/main>/.exec(studyHtml(n))?.[1] || "";
    const text = main.replace(/<[^>]+>/g, " ");
    const m = banned.exec(text);
    if (m) throw new Error(`study ${n} says "${m[0]}"`);
  }
  return `${STUDIES.length} pages, 0 hits`;
});

check("every name and year on a study is already on the site", () => {
  // Public-safe by construction: a study may only say what the public pages already say.
  const PUBLIC = ["cv.html", "projects.html", "working-with-me.html", "speaking.html", "archive.html", "poetry.html", "photography.html", "index.html", "v1/index.html", "wedding-celebration.html", "elopement/index.html", "context/index.html", "v2/home.js", "v2/data.json"];
  const corpus = PUBLIC.map((f) => readFileSync(path.join(ROOT, f), "utf8")).join(" ").replace(/<[^>]+>/g, " ").toLowerCase();
  const dict = new Set(readFileSync("/usr/share/dict/words", "utf8").split("\n").map((w) => w.toLowerCase()));
  let names = 0, years = 0;
  for (const n of STUDIES) {
    const main = /<main>([\s\S]*?)<\/main>/.exec(studyHtml(n))?.[1] || "";
    const text = main.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
    for (const m of text.matchAll(/\b([A-Z][A-Za-z]+)\b/g)) {
      const w = m[1];
      if (dict.has(w.toLowerCase())) continue; // plain English, capitalised by position
      if (!corpus.includes(w.toLowerCase())) throw new Error(`study ${n} names "${w}", which no public page does`);
      names++;
    }
    for (const m of text.matchAll(/\b(19|20)\d\d\b/g)) {
      if (!corpus.includes(m[0])) throw new Error(`study ${n} says ${m[0]}, a year no public page carries`);
      years++;
    }
  }
  return `${names} names and ${years} years checked against ${PUBLIC.length} public pages`;
});

check("tune: every dial lives in defaults.json and the CSS fallback equals it", () => {
  let dials = 0;
  for (const n of STUDIES) {
    const f = path.join(ROOT, "studies", n, "defaults.json");
    if (!existsSync(f)) throw new Error(`study ${n} has no defaults.json`);
    const d = JSON.parse(readFileSync(f, "utf8"));
    const h = studyHtml(n);
    const used = new Map([...h.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].map((m) => [m[1], m[2].trim()]));
    for (const [k, v] of Object.entries(d)) {
      if (!used.has(k)) throw new Error(`study ${n}: "${k}" is in defaults.json but the CSS never reads it`);
      if (used.get(k) !== String(v)) throw new Error(`study ${n}: "${k}" falls back to ${used.get(k)} in CSS, defaults.json says ${v}`);
      dials++;
    }
    for (const k of used.keys()) if (!(k in d)) throw new Error(`study ${n}: CSS reads --${k}, not in defaults.json`);
    if (!/<script src="tune\.js"><\/script>/.test(h)) throw new Error(`study ${n} does not load tune.js`);
  }
  return `${dials} dials across ${STUDIES.length} studies, fallbacks match`;
});

check("every link out of a study resolves", () => {
  let n_int = 0, n_ext = 0;
  for (const n of STUDIES) {
    for (const m of studyHtml(n).matchAll(/(?:href|src)="([^"#?]+)/g)) {
      const u = m[1];
      if (/^(https?:|mailto:)/.test(u)) { n_ext++; continue; }
      let p = u.startsWith("/") ? path.join(ROOT, u) : path.join(ROOT, "studies", n, u);
      if (p.endsWith("/")) p = path.join(p, "index.html");
      if (!existsSync(p)) throw new Error(`study ${n}: ${u} does not resolve`);
      n_int++;
    }
  }
  return `${n_int} internal targets exist on disk, ${n_ext} external left to the link audit`;
});
