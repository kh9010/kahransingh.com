#!/usr/bin/env node
// studies/09/build.mjs — the About desk.
//
// The lines an About page needs, each with every variant that exists across
// Studies 06, 07 and 08, read from those pages at build time so an option is
// always a verbatim string of one of them. Picks live in picks.json (written by
// studies/server.cjs); this script renders index.html (the desk: lines on the
// left, the assembled About on the right, readable without JS) and, with
// --about, about-draft.html (the same About in about.html's own frame).
//
//   node studies/09/build.mjs            → studies/09/index.html + lines.json
//   node studies/09/build.mjs --about    → studies/09/about-draft.html too

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STUDIES = path.resolve(HERE, "..");
const ROOT = path.resolve(STUDIES, "..");
const PICKS = process.env.PICKS || path.join(HERE, "picks.json");

const page = (n) => readFileSync(path.join(STUDIES, n, "index.html"), "utf8");
const main = (n) => /<main>([\s\S]*?)<\/main>/.exec(page(n))[1];
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ").trim();
const inner = (html, re) => [...html.matchAll(re)].map((m) => m[1].trim());

// ---- the sources, element by element -------------------------------------
const m06 = main("06"), m07 = main("07"), m08 = main("08");
const lede06 = inner(m06, /<p class="lede">([\s\S]*?)<\/p>/g)[0];
const rows06 = inner(m06, /<li><span class="y">([\s\S]*?)<\/li>/g).map((r) => "<span class=\"y\">" + r + "</li>".slice(0, 0));
const ledger06 = [...m06.matchAll(/<li>(<span class="y">[\s\S]*?<\/span><span class="t">[\s\S]*?<\/span>)<\/li>/g)].map((m) => m[1]);
const lede07 = inner(m07, /<p class="lede">([\s\S]*?)<\/p>/g)[0];
const sections07 = [...m07.matchAll(/<section class="make">\s*<h2>([^<]+)<\/h2>([\s\S]*?)<\/section>/g)].map((m) => ({ name: m[1], body: m[2] }));
const textPs07 = Object.fromEntries(sections07.map((s) => [s.name, inner(s.body, /<div class="text">[\s\S]*?<p>([\s\S]*?)<\/p>/g)[0]]));
const letter08 = inner(/<div class="letter">([\s\S]*?)<\/div>/.exec(m08)[1], /<p(?: class="sign")?>([\s\S]*?)<\/p>/g);
const years08 = [...m08.matchAll(/<li>(<b>[\s\S]*?<\/b><span>[\s\S]*?<\/span>)<\/li>/g)].map((m) => m[1]);
const row06 = (start) => ledger06.find((r) => text(r).includes(start));

// ---- the lines ------------------------------------------------------------
// id, label, kind (p = a paragraph, ledger = a list of rows), options [{from, html}]
const LINES = [
  { id: "opening", label: "opening", kind: "p", options: [
    { from: "08", html: letter08[0] }, { from: "06", html: lede06 }, { from: "07", html: lede07 } ] },
  { id: "tools", label: "the tools", kind: "p", options: [
    { from: "08", html: letter08[1] }, { from: "07", html: textPs07.tools }, { from: "06", html: row06("Building software") } ] },
  { id: "companies", label: "the companies", kind: "p", options: [
    { from: "08", html: letter08[2] }, { from: "07", html: textPs07.companies } ] },
  { id: "poems", label: "the poems", kind: "p", options: [
    { from: "07", html: textPs07.poems }, { from: "06", html: row06("How the World Works") } ] },
  { id: "photographs", label: "the photographs", kind: "p", options: [
    { from: "07", html: textPs07.photographs }, { from: "06", html: row06("Photographs on a Leica") } ] },
  { id: "making", label: "the camera, the dance, the marriage", kind: "p", options: [
    { from: "08", html: letter08[3] }, { from: "06", html: row06("Learning Kathak") }, { from: "06", html: row06("Married Gourav") }, { from: "06", html: row06("Eloped with Gourav") } ] },
  { id: "close", label: "the close", kind: "p", options: [
    { from: "08", html: letter08[4] + " " + "<span class=\"sign\">" + letter08[5] + "</span>" } ] },
  { id: "years", label: "the years", kind: "ledger", options: [
    { from: "08", rows: years08, row: (r) => r.replace(/<b>/, "<span class=\"y\">").replace(/<\/b>/, "</span>").replace(/<span>/, "<span class=\"t\">") },
    { from: "06", rows: ledger06, row: (r) => r } ] },
];
for (const l of LINES) for (const o of l.options) if (!(o.html || (o.rows && o.rows.length))) throw new Error(`line ${l.id}: an option from ${o.from} came back empty`);

const lines = LINES.map((l) => ({ id: l.id, label: l.label, kind: l.kind, options: l.options.map((o) => ({ from: o.from, html: o.html ?? o.rows.map(o.row).map((r) => "<li>" + r + "</li>").join("\n") })) }));
writeFileSync(path.join(HERE, "lines.json"), JSON.stringify(lines, null, 1) + "\n");

// ---- picks ----------------------------------------------------------------
let picks = {};
try { picks = JSON.parse(readFileSync(PICKS, "utf8")); } catch {}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pickedHtml = (l) => {
  const p = picks[l.id];
  if (!p) return null;
  if (typeof p.edit === "string") return l.kind === "ledger" ? null : esc(p.edit);
  const o = l.options[p.i];
  if (!o || o.from !== p.from) return null;
  // a ledger row read as a paragraph drops its year
  return l.kind === "ledger" ? o.html : o.html.replace(/^<span class="y">[\s\S]*?<\/span><span class="t">([\s\S]*)<\/span>$/, "$1");
};

// ---- the About, assembled ------------------------------------------------
const about = lines.map((l) => {
  const h = pickedHtml(l);
  if (!h) return "";
  if (l.kind === "ledger") return `<ol class="years">\n${h}\n</ol>`;
  return `<p class="${l.id === "opening" ? "lede" : l.id === "close" ? "close" : "para"}">${h}</p>`;
}).join("\n");
const picked = lines.filter((l) => pickedHtml(l)).length;

const FOOT = `<div class="foot">
  <a class="cv" href="/cv.html">Full CV &rarr;</a>
  <div class="contact-row">
    <a href="mailto:hello@joyus.studio">hello@joyus.studio</a>
    <a href="https://instagram.com/kahran">Instagram</a>
    <a href="https://medium.com/@kahrans">Medium</a>
  </div>
</div>`;

const ABOUT_CSS = `
.about { font-family: 'Fraunces', Georgia, serif; }
.about .lede { font-size: var(--lede-size, 1.3rem); line-height: 1.5; margin: 0 0 var(--para-gap, 1.4rem); }
.about .para, .about .close { font-size: var(--letter-size, 1.05rem); line-height: var(--letter-lh, 1.75); margin: 0 0 var(--para-gap, 1.4rem); }
.about .close .sign { display: block; font-style: italic; margin-top: .6em; }
.about a { color: #1a1a1a; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #ccc; }
.about a:hover { text-decoration-color: #1a1a1a; }
.about .years { list-style: none; margin: var(--years-gap, 2.2rem) 0 0; padding: 0; font-family: 'Space Grotesk', sans-serif; }
.about .years li { display: grid; grid-template-columns: var(--year-w, 70px) 1fr; gap: 0 1rem; padding: var(--row-gap, 0.45rem) 0; border-top: 1px solid var(--rule, #f0ede8); font-size: var(--line-size, 0.9rem); line-height: 1.5; }
.about .years li:last-child { border-bottom: 1px solid var(--rule, #f0ede8); }
.about .years .y { font-weight: 500; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: #6e6e6e; padding-top: 0.2em; white-space: nowrap; }
.about .years .t a { color: #1a1a1a; text-decoration: none; }
.about .years .t em { font-style: normal; color: #6e6e6e; }
.about .foot { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #e0ddd8; }
.about .foot .cv { font-size: 1.15rem; color: #1a1a1a; text-decoration: none; }
.about .foot .contact-row { margin-top: 1.25rem; padding-top: 0; border-top: 0; font-family: 'Space Grotesk', sans-serif; }
@media (max-width: 480px) { .about .years li { grid-template-columns: 1fr; gap: 0; } }`;

// ---- the desk --------------------------------------------------------------
const deskLines = lines.map((l) => {
  const p = picks[l.id] || null;
  const opts = l.options.map((o, i) => {
    const on = p && p.from === o.from && p.i === i;
    const body = l.kind === "ledger" ? `<ol class="years mini">${o.html}</ol>` : o.html;
    return `<button type="button" class="opt" data-line="${l.id}" data-from="${o.from}" data-i="${i}"${on ? ' aria-current="true"' : ""}><span class="from">${o.from}</span><span class="body">${body}</span></button>`;
  }).join("\n");
  const edit = l.kind === "ledger" ? "" : `<form class="edit" data-line="${l.id}"><textarea name="edit" rows="3" placeholder=" ">${p && typeof p.edit === "string" ? esc(p.edit) : ""}</textarea><button type="submit"${p && typeof p.edit === "string" ? ' aria-current="true"' : ""}>edit</button></form>`;
  const none = `<button type="button" class="none" data-line="${l.id}"${p ? "" : ' aria-current="true"'}>none</button>`;
  return `<section class="line${p ? " done" : ""}" id="line-${l.id}">
  <h2><span class="n">${String(lines.indexOf(l) + 1).padStart(2, "0")}</span> ${l.label} <span class="state">${p ? "picked" : "open"}</span></h2>
  <div class="opts">
${opts}
${none}
  </div>
${edit}
</section>`;
}).join("\n");

const DESK_CSS = `
:root { --hs-paper: #fafaf8; --hs-surface: #fff; --hs-ink: #1a1a1a; --hs-ink-2: #6e6e6e; --hs-ink-3: #9a958c; --hs-line: #e0ddd8; --hs-line-2: #f0ede8; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--hs-paper); color: var(--hs-ink); font: 400 .78rem/1.45 'Space Grotesk', -apple-system, sans-serif; }
.desk { display: grid; grid-template-columns: minmax(0, var(--desk-w, 520px)) minmax(0, 1fr); gap: 0 var(--gutter, 48px); max-width: var(--measure, 1180px); margin: 0 auto; padding: var(--pad, 32px) 16px 6rem; }
.desk-head { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; padding-bottom: 1rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--hs-line); font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; color: var(--hs-ink-2); }
.desk-head b { font-weight: 500; color: var(--hs-ink); }
.lines { min-width: 0; }
.line { padding: 1rem 0 1.25rem; border-top: 1px solid var(--hs-line-2); }
.line h2 { margin: 0 0 .6rem; font: 500 .72rem/1.4 'Space Grotesk', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: var(--hs-ink-2); display: flex; gap: .6rem; align-items: baseline; }
.line h2 .n { color: var(--hs-ink-3); font-variant-numeric: tabular-nums; }
.line h2 .state { margin-left: auto; color: var(--hs-ink-3); }
.line.done h2 .state { color: var(--hs-ink); }
.opts { display: grid; gap: .4rem; }
.opt, .none, .edit button { text-align: left; font: inherit; color: var(--hs-ink); background: var(--hs-surface); border: 1px solid var(--hs-line); border-left: 3px solid transparent; border-radius: 6px; padding: .6rem .75rem; cursor: pointer; }
.opt[aria-current], .none[aria-current], .edit button[aria-current] { border-left-color: var(--hs-ink); }
.opt { display: grid; grid-template-columns: 1.6rem 1fr; gap: .5rem; }
.opt .from { font-size: .66rem; color: var(--hs-ink-3); font-variant-numeric: tabular-nums; padding-top: .15em; }
.opt .body { font-family: 'Fraunces', Georgia, serif; font-size: var(--opt-size, 0.92rem); line-height: 1.55; }
.opt .body a { color: inherit; text-decoration: none; pointer-events: none; }
.opt .body .y { font-family: 'Space Grotesk', sans-serif; font-size: .62rem; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--hs-ink-2); margin-right: .55rem; vertical-align: .15em; }
.opt .years.mini { list-style: none; margin: 0; padding: 0; font-family: 'Space Grotesk', sans-serif; font-size: .74rem; line-height: 1.45; max-height: var(--mini-h, 9.5rem); overflow: auto; }
.opt .years.mini li { display: grid; grid-template-columns: 56px 1fr; gap: 0 .6rem; padding: .15rem 0; border-top: 1px solid var(--hs-line-2); }
.opt .years.mini .y, .opt .years.mini b { font-weight: 500; font-size: .62rem; letter-spacing: .08em; text-transform: uppercase; color: var(--hs-ink-2); }
.none { color: var(--hs-ink-2); }
.edit { display: grid; grid-template-columns: 1fr auto; gap: .4rem; margin-top: .4rem; align-items: start; }
.edit textarea { width: 100%; font: inherit; font-family: 'Fraunces', Georgia, serif; font-size: var(--opt-size, 0.92rem); line-height: 1.55; border: 1px solid var(--hs-line); border-radius: 6px; padding: .55rem .7rem; background: var(--hs-surface); color: var(--hs-ink); resize: vertical; }
.edit button { align-self: stretch; }
.preview { position: sticky; top: 0; align-self: start; max-height: 100vh; overflow: auto; padding: var(--pad, 32px) 0 2rem 0; }
.preview-inner { max-width: var(--about-measure, 560px); }
.preview .page-header h1 { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 400; font-size: 2rem; margin: 0 0 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--hs-line); }
@media (max-width: 900px) { .desk { grid-template-columns: 1fr; } .preview { position: static; max-height: none; order: -1; border-bottom: 1px solid var(--hs-line); margin-bottom: 1rem; } }
@media (prefers-color-scheme: dark) { :root { --hs-paper: #141210; --hs-surface: #1c1a15; --hs-ink: #ede7d9; --hs-ink-2: #9a9385; --hs-ink-3: #6e6a5e; --hs-line: #332e26; --hs-line-2: #26221c; } .about a, .about .years .t a, .about .foot .cv, .about .years .t, .about .years li { color: var(--hs-ink); } .about .lede, .about .para, .about .close { color: var(--hs-ink); } }`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <title>About desk — Kahran Singh</title>
    <meta name="description" content="The lines an About page needs, every variant drafted so far, and the page they make as they are picked.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400;1,9..144,600&display=swap" rel="stylesheet">
    <style>${DESK_CSS}${ABOUT_CSS}</style>
</head>
<body>
<div class="desk">
  <div class="desk-head"><span><b>about</b> desk</span><span>${picked} of ${lines.length} picked</span></div>
  <div class="lines">
${deskLines}
  </div>
  <aside class="preview">
    <div class="preview-inner about">
      <div class="page-header"><h1>about</h1></div>
${about}
${FOOT}
    </div>
  </aside>
</div>
<script src="desk.js"></script>
<script src="tune.js"></script>
</body>
</html>
`;
writeFileSync(path.join(HERE, "index.html"), html);

if (process.argv.includes("--about")) {
  // The same About in about.html's own frame: head and nav from the live page, the picked lines as the main.
  const live = readFileSync(path.join(ROOT, "about.html"), "utf8");
  const head = /<head>([\s\S]*?)<\/head>/.exec(live)[1].replace(/<style>[\s\S]*?<\/style>/, `<style>${ABOUT_CSS}</style>`).replace(/<script[^>]*gsap[^>]*><\/script>\s*/, "");
  const nav = /<nav>[\s\S]*?<\/nav>/.exec(live)[0];
  const draft = `<!DOCTYPE html>\n<html lang="en">\n<head>${head}</head>\n<body>\n    <main class="about">\n        <a href="/" class="mobile-header">kahran</a>\n        <div class="page-header">\n            <h1>about</h1>\n        </div>\n${about}\n${FOOT}\n    </main>\n    ${nav}\n</body>\n</html>\n`;
  writeFileSync(path.join(HERE, "about-draft.html"), draft);
}
console.log(`desk: ${lines.length} lines, ${lines.reduce((a, l) => a + l.options.length, 0)} options, ${picked} picked`);
