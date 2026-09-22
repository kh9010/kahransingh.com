/* pick.js — chooses today's poem and photograph from the SAME weather reading
 * the line under the date shows (window.kahranWeather.current / 'kahran:weather').
 *
 * Kahran's rule: "The photo/poem should change if we change the weather listed,
 * is the only thing." So this file is a faithful port of tools/daily_pick.py's
 * scoring (weights, place bonus, novelty, tiebreak) — see that file's docstring
 * and docs/2026-09-21-daily-pick-design.md for the formula reference — adapted
 * to build its day-vector from a live, instantaneous Open-Meteo `current` read
 * instead of a whole-day aggregate (there is no "today's sunshine_duration" yet
 * at 9am). tools/daily_pick.py still runs once, at 23:50, to freeze the day's
 * *archive* entry (with its own daily-aggregate vector) in v2/days.json.
 *
 * Plain script, no modules/bundler. Exposes window.kahranPick:
 *   setData(dataDoc)   — v2/data.json (poem/photo catalog), called once it loads
 *   setDays(daysDoc)   — v2/days.json (frozen archive + past "why" vectors)
 *   pickFor(iso, isLive) -> { poem, photo } | null
 *     isLive true  -> build the day vector from window.kahranWeather.current
 *     isLive false -> build the day vector from the stored days.json "why" for iso
 *   Fires 'kahran:pick-ready' on document once its own scores fetch has settled
 *   (succeeded or failed) so callers know pickFor's answer will no longer flip
 *   from null to something just because a fetch was still in flight.
 *
 * Never throws: any missing/malformed input degrades toward pickFor returning
 * null, exactly like daily_pick.py degrades toward a neutral vector rather than
 * crashing a morning.
 */
(function (root) {
  "use strict";

  var AXES = ["light", "warmth", "wet", "stillness", "season", "inside", "mood"];
  var WEIGHTS = {
    light: 1.0, warmth: 1.0, wet: 1.2, stillness: 0.6,
    season: 0.8, inside: 0.6, mood: 0.3
  };
  var FOG_OR_OVERCAST_CODES = { 3: true, 45: true, 48: true };
  var WET_CODE_FLOORS = {
    45: 0.4, 48: 0.4,
    51: 0.3, 53: 0.35, 55: 0.4, 56: 0.35, 57: 0.4,
    61: 0.5, 63: 0.6, 65: 0.75, 66: 0.5, 67: 0.65,
    80: 0.5, 81: 0.6, 82: 0.8,
    71: 0.6, 73: 0.65, 75: 0.75, 77: 0.6, 85: 0.6, 86: 0.75,
    95: 0.8, 96: 0.85, 99: 0.9
  };
  var NOVELTY_DAYS = { poem: 60, photo: 30 };
  var PLACE_BONUS_NEAR_KM = 50;
  var PLACE_BONUS_FAR_KM = 500;
  var PLACE_BONUS_NEAR = 0.35;
  var PLACE_BONUS_FAR = 0.15;
  var NOVELTY_PENALTY = -1.0;
  var SEASON_PEAK_DOY = 172; // 21 June

  function clamp(x, lo, hi) {
    lo = lo === undefined ? 0 : lo;
    hi = hi === undefined ? 1 : hi;
    return Math.max(lo, Math.min(hi, x));
  }

  /* ------------------------------------------------------------- dates -- */

  function toUTCms(iso) {
    var b = iso.split("-");
    return Date.UTC(+b[0], +b[1] - 1, +b[2]);
  }

  function fromUTCms(ms) {
    return new Date(ms).toISOString().slice(0, 10);
  }

  function shiftISO(iso, days) {
    return fromUTCms(toUTCms(iso) + days * 86400000);
  }

  function isRealISO(iso) {
    return typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso);
  }

  function dayOfYear(iso) {
    var b = iso.split("-").map(Number);
    var start = Date.UTC(b[0], 0, 1);
    var cur = Date.UTC(b[0], b[1] - 1, b[2]);
    return Math.round((cur - start) / 86400000) + 1;
  }

  /* --------------------------------------------------------- sha256 tie -- */
  /* A pure, synchronous SHA-256 (no Web Crypto — pickFor must be synchronous),
     bit-for-bit the same digest hashlib.sha256 would produce, so the tiebreak
     matches daily_pick.py's tiebreak() exactly. */

  function utf8Bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.codePointAt(i);
      if (code > 0xffff) i++; // consumed a surrogate pair
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        bytes.push(
          0xf0 | (code >> 18),
          0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      }
    }
    return bytes;
  }

  var SHA256_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  function sha256Hex(message) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = utf8Bytes(message);
    var bitLen = bytes.length * 8;

    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var z = 0; z < 4; z++) bytes.push(0); // high 32 bits of the 64-bit length: always 0 here
    bytes.push((bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);

    var w = new Array(64);
    for (var chunk = 0; chunk < bytes.length; chunk += 64) {
      for (var t = 0; t < 16; t++) {
        var o = chunk + t * 4;
        w[t] = ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }

      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var temp1 = (h + S1 + ch + SHA256_K[t] + w[t]) >>> 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }

      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }

    return H.map(function (x) { return ("00000000" + x.toString(16)).slice(-8); }).join("");
  }

  function tiebreak(dateIso, key) {
    var digest = sha256Hex(dateIso + "|" + key);
    return (parseInt(digest.slice(0, 8), 16) / 0xffffffff) * 1e-6;
  }

  /* -------------------------------------------------------- day vector -- */

  /* Live vector from an instantaneous Open-Meteo `current` reading (the same
     one the "We're in ... and it's raining" line renders from). daily_pick.py's
     `light` uses a whole day's sunshine/daylight ratio, which isn't available
     mid-day; a live read only has is_day + cloud_cover, so: night reads low
     regardless of cloud, day reads (1 - cloud_cover/100) — then the same fog/
     overcast 0.7x damping daily_pick.py applies. */
  function dayVectorFromCurrent(iso, reading, lat) {
    var isDay = reading.is_day !== 0;
    var cloud = reading.cloud_cover;
    if (cloud === null || cloud === undefined) cloud = 50;
    var light = isDay ? clamp(1 - cloud / 100) : clamp(0.15 * (1 - cloud / 100));
    var code = reading.weather_code;
    if (FOG_OR_OVERCAST_CODES[code]) light *= 0.7;

    var warmth = clamp(((reading.temperature_2m || 0) - -5) / 35);

    var wetSourceMm = Math.max(
      reading.precipitation || 0, reading.rain || 0, reading.showers || 0, reading.snowfall || 0
    );
    var wet = Math.max(clamp(wetSourceMm / 10), WET_CODE_FLOORS[code] || 0);

    var windKmh = reading.wind_speed_10m;
    if (windKmh === null || windKmh === undefined) windKmh = 0;
    var stillness = clamp(1 - windKmh / 40);
    if (reading.away) stillness = clamp(stillness + 0.3);

    var doy = dayOfYear(iso);
    var season = (1 + Math.cos((2 * Math.PI * (doy - SEASON_PEAK_DOY)) / 365.25)) / 2;
    if (lat !== null && lat !== undefined && lat < 0) season = 1 - season;

    var inside = 1 - (wet + (1 - warmth)) / 2;

    return { light: light, warmth: warmth, wet: wet, stillness: stillness, season: season, inside: inside, mood: 0.5 };
  }

  /* Past-day vector: days.json already stores the seven axes it was picked
     from (daily_pick.py's own day_vector output, written verbatim into
     entry.why). Missing axes default neutral, exactly like item_vector below. */
  function dayVectorFromWhy(why) {
    var vec = {};
    AXES.forEach(function (axis) {
      vec[axis] = why && why[axis] !== undefined ? clamp(Number(why[axis])) : 0.5;
    });
    return vec;
  }

  /* ----------------------------------------------------------- scoring -- */

  function itemVector(scoresDoc, key) {
    var vec = {};
    AXES.forEach(function (axis) { vec[axis] = 0.5; });
    if (!scoresDoc) return vec;
    var entry = (scoresDoc.poems && scoresDoc.poems[key]) || (scoresDoc.photos && scoresDoc.photos[key]);
    if (entry) {
      AXES.forEach(function (axis) {
        if (entry[axis] !== undefined && entry[axis] !== null) vec[axis] = clamp(Number(entry[axis]));
      });
    }
    return vec;
  }

  function weightedDistance(day, item) {
    var total = 0;
    AXES.forEach(function (axis) {
      var d = day[axis] - item[axis];
      total += WEIGHTS[axis] * d * d;
    });
    return Math.sqrt(total);
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    var r = 6371.0;
    var p1 = (lat1 * Math.PI) / 180, p2 = (lat2 * Math.PI) / 180;
    var dphi = ((lat2 - lat1) * Math.PI) / 180;
    var dlmb = ((lon2 - lon1) * Math.PI) / 180;
    var a = Math.sin(dphi / 2) * Math.sin(dphi / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dlmb / 2) * Math.sin(dlmb / 2);
    return 2 * r * Math.asin(Math.sqrt(a));
  }

  function placeBonus(photoPlace, lat, lon) {
    if (!photoPlace || lat === null || lat === undefined || lon === null || lon === undefined) return 0;
    var plat = photoPlace.lat, plon = photoPlace.lon;
    if (plat === undefined || plat === null || plon === undefined || plon === null) return 0;
    var km = haversineKm(lat, lon, plat, plon);
    if (km <= PLACE_BONUS_NEAR_KM) return PLACE_BONUS_NEAR;
    if (km <= PLACE_BONUS_FAR_KM) return PLACE_BONUS_FAR;
    return 0;
  }

  /* The set of slugs/srcs shown for `kind` in the window before beforeIso,
     read directly from the accumulated v2/days.json — the "sequence of past
     picks" is exactly that file, built up one frozen day at a time by
     tools/daily_pick.py since launch. */
  function recentlyShown(daysDoc, kind, beforeIso, windowDays) {
    var shown = {};
    if (!daysDoc || !daysDoc.days) return shown;
    var cutoff = shiftISO(beforeIso, -windowDays);
    Object.keys(daysDoc.days).forEach(function (dateIso) {
      if (!isRealISO(dateIso)) return;
      if (dateIso >= cutoff && dateIso < beforeIso) {
        var entry = daysDoc.days[dateIso];
        if (entry && entry[kind]) shown[entry[kind]] = true;
      }
    });
    return shown;
  }

  function pickBest(candidates, keyField, day, scoresDoc, dateIso, kind, daysDoc, lat, lon) {
    var recent = recentlyShown(daysDoc, kind, dateIso, NOVELTY_DAYS[kind]);
    var bestKey = null, bestScore = null;
    candidates.forEach(function (item) {
      var key = item[keyField];
      var vec = itemVector(scoresDoc, key);
      var score = -weightedDistance(day, vec);
      if (kind === "photo") {
        var scoredEntry = (scoresDoc && scoresDoc.photos && scoresDoc.photos[key]) || {};
        score += placeBonus(scoredEntry.place, lat, lon);
      }
      if (recent[key]) score += NOVELTY_PENALTY;
      score += tiebreak(dateIso, key);
      if (bestScore === null || score > bestScore) {
        bestKey = key;
        bestScore = score;
      }
    });
    return bestKey;
  }

  /* -------------------------------------------------------------- state -- */

  var state = {
    data: null,
    days: null,
    poemScores: null,
    photoScores: null,
    poemsAttempted: false,
    photosAttempted: false
  };

  function fireReadyIfSettled() {
    if (state.poemsAttempted && state.photosAttempted) {
      try {
        if (typeof document !== "undefined" && document.dispatchEvent) {
          document.dispatchEvent(new CustomEvent("kahran:pick-ready"));
        }
      } catch (e) {
        // no CustomEvent / no document (e.g. a plain Node require) — fine, callers
        // that care poll pickFor() again on their own triggers.
      }
    }
  }

  function loadScores() {
    if (typeof fetch !== "function") {
      state.poemsAttempted = true;
      state.photosAttempted = true;
      return;
    }
    fetch("/v2/scores-poems.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (json) {
        state.poemScores = json;
        state.poemsAttempted = true;
        fireReadyIfSettled();
      });
    fetch("/v2/scores-photos.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (json) {
        state.photoScores = json;
        state.photosAttempted = true;
        fireReadyIfSettled();
      });
  }

  function setData(dataDoc) { state.data = dataDoc; }
  function setDays(daysDoc) { state.days = daysDoc; }

  function pickFor(iso, isLive) {
    if (!state.data || !state.data.poems || !state.data.photos) return null;
    if (!state.poemsAttempted || !state.photosAttempted) return null; // scores fetch still in flight

    var day, lat = null, lon = null;

    if (isLive) {
      var reading = root.kahranWeather && root.kahranWeather.current;
      if (!reading || reading.weather_code === undefined || reading.weather_code === null) return null;
      if (reading.temperature_2m === undefined || reading.temperature_2m === null) return null;
      lat = reading.lat !== undefined ? reading.lat : null;
      lon = reading.lon !== undefined ? reading.lon : null;
      day = dayVectorFromCurrent(iso, reading, lat);
    } else {
      var entry = state.days && state.days.days && state.days.days[iso];
      if (!entry || !entry.why) return null;
      day = dayVectorFromWhy(entry.why);
      // Past days' frozen entries don't carry the presence lat/lon they were
      // picked with, so the photo place bonus is not recomputed for them —
      // the archive is a fallback path, not a second live pick.
    }

    var poemSlug = pickBest(state.data.poems, "slug", day, state.poemScores, iso, "poem", state.days, null, null);
    var photoSrc = pickBest(state.data.photos, "src", day, state.photoScores, iso, "photo", state.days, lat, lon);
    if (!poemSlug || !photoSrc) return null;
    return { poem: poemSlug, photo: photoSrc };
  }

  loadScores();

  root.kahranPick = {
    setData: setData,
    setDays: setDays,
    pickFor: pickFor,
    /* Test-only surface (tools/test_pick_js.mjs): lets a fixture-driven test
       inject scores/data synchronously and reach the pure scoring functions
       without needing a real fetch or DOM. Not used by home.js. */
    __test: {
      dayVectorFromCurrent: dayVectorFromCurrent,
      dayVectorFromWhy: dayVectorFromWhy,
      itemVector: itemVector,
      weightedDistance: weightedDistance,
      placeBonus: placeBonus,
      haversineKm: haversineKm,
      tiebreak: tiebreak,
      pickBest: pickBest,
      sha256Hex: sha256Hex,
      setScores: function (poemScores, photoScores) {
        state.poemScores = poemScores;
        state.photoScores = photoScores;
        state.poemsAttempted = true;
        state.photosAttempted = true;
      },
      state: state
    }
  };
})(typeof window !== "undefined" ? window : this);
