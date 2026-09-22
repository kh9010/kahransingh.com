/* weather.js — "Kahran's in New York and it's raining."
 *
 * Plain script, no modules/bundler (matches the rest of this no-build-step site).
 * Exposes window.kahranWeather = { load(el), current }.
 *
 * Reads /v2/place.json (committed by tools/place_feed.py — city-level only, see that
 * file for why coordinates are rounded). If place is null, leaves el empty: the place
 * feed only publishes when presence confidence is high/confirmed, so a null place means
 * "don't say anything", not an error to report.
 *
 * Weather comes live from Open-Meteo (free, no key, CORS-enabled) at request time —
 * never committed, never stale beyond the 30-minute session cache below.
 *
 * Fails silently everywhere: a broken feed or a network hiccup should never show the
 * visitor an error, it should just leave the line out.
 *
 * The SAME reading that renders the sentence is also handed to v2/pick.js (via
 * window.kahranWeather.current and the 'kahran:weather' document event) so the poem
 * and photograph follow whatever weather the line reports — never a second, separate
 * read of the sky. See docs/2026-09-21-daily-pick-design.md.
 */
(function () {
  "use strict";

  var CACHE_KEY = "kahranWeatherCache";
  var CACHE_MS = 30 * 60 * 1000; // 30 minutes

  // WMO weather codes -> a short phrase in Kahran's register. Day/night only changes
  // the "clear" phrasing; every other code reads the same either way.
  function phraseFor(code, isDay) {
    if (code === 0) return isDay ? "it's clear" : "it's a clear night";
    if (code === 1 || code === 2) return "it's mostly clear";
    if (code === 3) return "it's overcast";
    if (code === 45 || code === 48) return "it's foggy";
    if (code >= 51 && code <= 57) return "it's drizzling";
    if ((code >= 61 && code <= 67) || code === 80 || code === 81 || code === 82) return "it's raining";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "it's snowing";
    if (code >= 95 && code <= 99) return "there's a storm";
    return null; // unknown code — say nothing rather than guess
  }

  function readCache(key) {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.key !== key) return null;
      if (typeof parsed.at !== "number" || Date.now() - parsed.at > CACHE_MS) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key: key, at: Date.now(), data: data }));
    } catch (e) {
      // sessionStorage unavailable (private window, quota, etc.) — just skip caching.
    }
  }

  function render(el, reading) {
    var code = reading && reading.weather_code;
    var isDay = !reading || reading.is_day !== 0;
    var phrase = phraseFor(code, isDay);
    if (!phrase) return; // unmapped code — leave el empty rather than guess
    var temp = reading ? reading.temperature_2m : null;
    el.textContent = "We're in " + reading.place + " and " + phrase + ".";
    if (temp !== null && temp !== undefined) {
      el.setAttribute("data-temperature-c", String(temp));
    }
  }

  /* The one place a reading becomes "the current weather" for the rest of the page:
     sets window.kahranWeather.current and tells anyone listening (v2/pick.js) that a
     fresh reading landed, from cache or from the network — either way it's the same
     reading the sentence is built from. */
  function publish(el, reading) {
    window.kahranWeather.current = reading;
    render(el, reading);
    try {
      document.dispatchEvent(new CustomEvent("kahran:weather", { detail: reading }));
    } catch (e) {
      // CustomEvent unavailable (very old browser) — the line still rendered above.
    }
  }

  function fetchWeather(place, cacheKey, el) {
    var fields =
      "cloud_cover,wind_speed_10m,precipitation,rain,showers,snowfall," +
      "temperature_2m,is_day,weather_code";
    var url =
      "https://api.open-meteo.com/v1/forecast?latitude=" + encodeURIComponent(place.lat) +
      "&longitude=" + encodeURIComponent(place.lon) +
      "&current=" + fields +
      "&daily=sunrise,sunset" +
      "&timezone=auto";

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("open-meteo http " + res.status);
        return res.json();
      })
      .then(function (data) {
        var current = data && data.current;
        if (!current) return;
        var daily = data.daily || {};
        var reading = {
          place: place.place,
          lat: place.lat,
          lon: place.lon,
          tz: (data && data.timezone) || place.tz,
          away: !!place.away,
          weather_code: current.weather_code,
          is_day: current.is_day,
          temperature_2m: current.temperature_2m,
          cloud_cover: current.cloud_cover,
          wind_speed_10m: current.wind_speed_10m,
          precipitation: current.precipitation,
          rain: current.rain,
          showers: current.showers,
          snowfall: current.snowfall,
          sunrise: daily.sunrise && daily.sunrise[0],
          sunset: daily.sunset && daily.sunset[0]
        };
        writeCache(cacheKey, reading);
        publish(el, reading);
      })
      .catch(function () {
        /* network error — fail silently, el stays empty, kahranWeather.current stays unset */
      });
  }

  function load(el) {
    if (!el) return;
    try {
      el.textContent = "";
    } catch (e) {
      return;
    }

    fetch("/v2/place.json")
      .then(function (res) {
        if (!res.ok) throw new Error("place.json http " + res.status);
        return res.json();
      })
      .then(function (place) {
        if (!place || !place.place || place.lat == null || place.lon == null) return;

        var cacheKey = place.place + "|" + place.lat + "|" + place.lon;
        var cached = readCache(cacheKey);
        if (cached) {
          publish(el, cached);
          return;
        }
        fetchWeather(place, cacheKey, el);
      })
      .catch(function () {
        /* no place.json, bad JSON, or offline — fail silently, el stays empty */
      });
  }

  window.kahranWeather = { load: load, current: null };
})();
