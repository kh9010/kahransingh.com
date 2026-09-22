#!/usr/bin/env node
// test_pick_js.mjs — loads v2/pick.js under stubbed window/document (no browser,
// no network) and checks it against tools/daily_pick.py's behaviour, plus its
// own novelty/weather-sensitivity properties.
//
// Run: node tools/test_pick_js.mjs   (exits non-zero on any failure)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, "..");

function loadJSON(relPath) {
  return JSON.parse(readFileSync(path.join(SITE_ROOT, relPath), "utf8"));
}

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log("ok   - " + name);
  } else {
    failures++;
    console.log("FAIL - " + name + (detail ? " (" + detail + ")" : ""));
  }
}

// ---------------------------------------------------------------- fixtures --

const data = loadJSON("v2/data.json");
const days = loadJSON("v2/days.json"); // real repo archive, used as novelty history
const poemScores = loadJSON("v2/scores-poems.json");
const photoScores = loadJSON("v2/scores-photos.json");

// A clear, hot, calm, dry day. Reproduced with:
//   cd tools && python3 daily_pick.py --date 2026-07-04 \
//     --offline /tmp/pickfixture/weather_clear.json \
//     --presence /tmp/pickfixture/presence.json \
//     --scores-dir ../v2 --data ../v2/data.json --dry
// (weather_clear.json: weather_code 0, tmax 30, precip 0, sunshine==daylight
// 53000s, wind_speed_10m_max 10, cloud_cover_mean 0; presence: high-confidence
// New York.) Against this repo's real v2/scores-*.json + v2/days.json, that
// picks poem=and-now-that-we-walk photo=/photos/buoys-wall.jpg. Both builders
// reduce to the SAME day vector for this fixture (sunshine ratio 1.0 <->
// cloud_cover 0 on a clear day, tmax 30 <-> temperature_2m 30, wind 10 <->
// wind_speed_10m 10, etc.), so with identical scores/novelty/tiebreak logic
// they must agree.
const PYTHON_FIXTURE_DATE = "2026-07-04";
const PYTHON_FIXTURE_PICK = { poem: "and-now-that-we-walk", photo: "/photos/buoys-wall.jpg" };

const clearReading = {
  place: "New York, NY", lat: 40.71, lon: -74.01, tz: "America/New_York", away: false,
  weather_code: 0, is_day: 1, temperature_2m: 30.0, cloud_cover: 0,
  wind_speed_10m: 10.0, precipitation: 0, rain: 0, showers: 0, snowfall: 0
};

// ------------------------------------------------------- test: parity ------

// Each check gets its own fresh sandbox/module instance (pick.js keeps module-
// level state), with a stubbed `window` (== the sandbox itself, so pick.js's
// `root.kahranWeather` resolves) and no `document`/`fetch` — exercising the
// same guards a real page-less environment would hit.
function loadPickJsSandbox() {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const code = readFileSync(path.join(SITE_ROOT, "v2", "pick.js"), "utf8");
  vm.runInContext(code, sandbox, { filename: "v2/pick.js" });
  return sandbox; // sandbox.window === sandbox, sandbox.kahranPick is the API
}

function pickWithReading(reading, dateIso, daysDoc) {
  const sandbox = loadPickJsSandbox();
  sandbox.kahranWeather = { current: reading };
  sandbox.kahranPick.setData(data);
  sandbox.kahranPick.setDays(daysDoc === undefined ? days : daysDoc);
  sandbox.kahranPick.__test.setScores(poemScores, photoScores);
  return sandbox.kahranPick.pickFor(dateIso, true);
}

const parityPick = pickWithReading(clearReading, PYTHON_FIXTURE_DATE);
check(
  "matches daily_pick.py's pick for the clear-day fixture",
  parityPick && parityPick.poem === PYTHON_FIXTURE_PICK.poem && parityPick.photo === PYTHON_FIXTURE_PICK.photo,
  JSON.stringify(parityPick)
);

// ------------------------------------------------- test: weather sensitivity

// Same day, same everything, EXCEPT the weather code + cloud/precip flip from
// clear to storming. Kahran's rule: the pair must change with the reading.
const stormReading = Object.assign({}, clearReading, {
  weather_code: 95, cloud_cover: 100, precipitation: 20, rain: 20, temperature_2m: 5.0
});
const stormPick = pickWithReading(stormReading, PYTHON_FIXTURE_DATE);
check(
  "a changed weather reading changes the pick",
  stormPick && (stormPick.poem !== parityPick.poem || stormPick.photo !== parityPick.photo),
  JSON.stringify({ clear: parityPick, storm: stormPick })
);

// ------------------------------------------------------ test: novelty -----

// Two candidates with identical (neutral) vectors; one was "shown" yesterday.
// pick_best must avoid the recently-shown one, exactly like daily_pick.py's
// pick_best does (mirrors test_daily_pick.py's
// test_pick_best_avoids_recently_shown_when_alternative_is_close).
{
  const sandbox = loadPickJsSandbox();
  const neutralAxes = { light: 0.5, warmth: 0.5, wet: 0.5, stillness: 0.5, season: 0.5, inside: 0.5, mood: 0.5 };
  const day = neutralAxes;
  const candidates = [{ slug: "recent" }, { slug: "fresh" }];
  const scores = { poems: { recent: neutralAxes, fresh: neutralAxes } };
  const daysDoc = { days: { "2026-09-11": { poem: "recent" } } };
  const picked = sandbox.kahranPick.__test.pickBest(candidates, "slug", day, scores, "2026-09-21", "poem", daysDoc, null, null);
  check("novelty avoids a recently-shown item when the alternative is equally close", picked === "fresh", picked);
}

// ------------------------------------------------------ test: sha256 -----

{
  const sandbox = loadPickJsSandbox();
  const digest = sandbox.kahranPick.__test.sha256Hex("abc");
  check(
    "sha256Hex matches the known test vector for 'abc'",
    digest === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    digest
  );
}

// ------------------------------------------------------------- summary ----

if (failures) {
  console.log("\n" + failures + " failure(s)");
  process.exit(1);
} else {
  console.log("\nall checks passed");
}
