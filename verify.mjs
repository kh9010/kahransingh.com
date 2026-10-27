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

check("idea details: coverage, audited graph, public provenance", () => {
  const r = run("node", ["tools/test_idea_details.mjs"], ROOT);
  if (!r.ok) throw new Error(r.out.trim().split("\n").slice(-6).join(" | "));
  return r.out.trim().split("\n").filter((l) => l.startsWith("PASS")).map((l) => l.replace(/^PASS /, "")).join("; ");
});
