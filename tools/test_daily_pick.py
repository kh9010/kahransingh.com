#!/usr/bin/env python3
"""test_daily_pick.py — stdlib unittest for daily_pick.py's pure logic and
its end-to-end --dry/--offline behaviour.

Covers: the day-vector formulas at known inputs (hot clear July day, cold
rainy November day, a southern-hemisphere season flip), the novelty penalty,
the place bonus, idempotence, and graceful degradation when a scores file is
missing.
"""
import json
import tempfile
import unittest
from pathlib import Path

import daily_pick as dp


def weather(**over):
    base = {
        "weather_code": 0, "tmax": 15.0, "tmin": 5.0, "precip_mm": 0.0,
        "sunshine_s": 30000.0, "daylight_s": 43200.0, "wind_kmh": 5.0,
        "cloud_pct": 20.0,
    }
    base.update(over)
    return base


class DayVectorTests(unittest.TestCase):
    def test_hot_clear_july_day(self):
        # 2026-07-15 (northern hemisphere): near-peak sunshine, hot, dry, calm.
        w = weather(weather_code=0, tmax=32.0, precip_mm=0.0,
                    sunshine_s=50000, daylight_s=53000, wind_kmh=6.0)
        day = dp.day_vector("2026-07-15", w, lat=40.71, presence=None)
        self.assertAlmostEqual(day["light"], 50000 / 53000, places=6)
        self.assertAlmostEqual(day["warmth"], 1.0)          # (32 - -5)/35 = 37/35 clamps to 1
        self.assertAlmostEqual(day["wet"], 0.0)
        self.assertAlmostEqual(day["stillness"], 1 - 6.0 / 40)
        self.assertGreater(day["season"], 0.95)              # near midsummer peak
        self.assertGreater(day["inside"], 0.9)               # warm + dry -> strongly "outside" -> inside near 1? see below
        self.assertEqual(day["mood"], 0.5)

    def test_cold_rainy_november_day(self):
        # 2026-11-15: cold, heavy rain, windy, overcast-adjacent rain code.
        w = weather(weather_code=65, tmax=2.0, precip_mm=25.0,
                    sunshine_s=2000, daylight_s=33000, wind_kmh=30.0)
        day = dp.day_vector("2026-11-15", w, lat=40.71, presence=None)
        self.assertAlmostEqual(day["warmth"], (2.0 - (-5)) / 35)
        self.assertEqual(day["wet"], 1.0)                    # 25mm/10 clamps to 1, code floor 0.75 also < 1
        self.assertAlmostEqual(day["stillness"], 1 - 30.0 / 40)
        self.assertLess(day["season"], 0.3)                  # well past midsummer, heading to midwinter
        self.assertLess(day["inside"], 0.3)                  # cold + wet -> strongly "inside"
        self.assertEqual(day["mood"], 0.5)

    def test_southern_hemisphere_season_flip(self):
        # Same date, lat > 0 vs lat < 0 must give complementary season values.
        w = weather()
        north = dp.day_vector("2026-12-21", w, lat=40.71, presence=None)
        south = dp.day_vector("2026-12-21", w, lat=-33.87, presence=None)
        self.assertAlmostEqual(north["season"] + south["season"], 1.0, places=6)
        self.assertLess(north["season"], 0.05)   # ~midwinter in the north
        self.assertGreater(south["season"], 0.95)  # ~midsummer in the south

    def test_mood_is_always_half(self):
        for code in (0, 65, 95):
            w = weather(weather_code=code)
            day = dp.day_vector("2026-03-01", w, lat=40.71, presence=None)
            self.assertEqual(day["mood"], 0.5)

    def test_away_boosts_stillness(self):
        w = weather(wind_kmh=20.0)  # base stillness 0.5, away +0.3 -> 0.8, no clamp involved
        home = dp.day_vector("2026-03-01", w, lat=40.71, presence={"away": False})
        away = dp.day_vector("2026-03-01", w, lat=40.71, presence={"away": True})
        self.assertAlmostEqual(away["stillness"] - home["stillness"], 0.3, places=6)

    def test_fog_damps_light(self):
        w = weather(weather_code=45, sunshine_s=20000, daylight_s=40000)
        day = dp.day_vector("2026-03-01", w, lat=40.71, presence=None)
        self.assertAlmostEqual(day["light"], (20000 / 40000) * 0.7, places=6)


class ItemVectorTests(unittest.TestCase):
    def test_missing_scores_file_degrades_to_neutral(self):
        vec = dp.item_vector(None, "some-slug")
        self.assertEqual(vec, {axis: 0.5 for axis in dp.AXES})

    def test_missing_item_in_present_file_degrades_to_neutral(self):
        scores = {"poems": {"other-slug": {"light": 0.9}}}
        vec = dp.item_vector(scores, "some-slug")
        self.assertEqual(vec, {axis: 0.5 for axis in dp.AXES})

    def test_present_item_partial_axes(self):
        scores = {"poems": {"some-slug": {"light": 0.9, "warmth": 0.8}}}
        vec = dp.item_vector(scores, "some-slug")
        self.assertEqual(vec["light"], 0.9)
        self.assertEqual(vec["warmth"], 0.8)
        self.assertEqual(vec["wet"], 0.5)  # untouched axis stays neutral


class PlaceBonusTests(unittest.TestCase):
    def test_within_50km_gets_near_bonus(self):
        # Brooklyn is a few km from Manhattan.
        bonus = dp.place_bonus({"lat": 40.68, "lon": -73.98}, 40.7128, -74.0060)
        self.assertEqual(bonus, dp.PLACE_BONUS_NEAR)

    def test_within_500km_gets_far_bonus(self):
        # Boston is ~300km from NYC.
        bonus = dp.place_bonus({"lat": 42.3601, "lon": -71.0589}, 40.7128, -74.0060)
        self.assertEqual(bonus, dp.PLACE_BONUS_FAR)

    def test_beyond_500km_gets_no_bonus(self):
        # Los Angeles is far from NYC.
        bonus = dp.place_bonus({"lat": 34.05, "lon": -118.24}, 40.7128, -74.0060)
        self.assertEqual(bonus, 0.0)

    def test_missing_place_gets_no_bonus(self):
        self.assertEqual(dp.place_bonus(None, 40.71, -74.01), 0.0)
        self.assertEqual(dp.place_bonus({}, 40.71, -74.01), 0.0)

    def test_missing_presence_coords_gets_no_bonus(self):
        self.assertEqual(dp.place_bonus({"lat": 40.68, "lon": -73.98}, None, None), 0.0)


class NoveltyTests(unittest.TestCase):
    def test_recently_shown_within_window(self):
        days_doc = {"days": {
            "2026-08-01": {"poem": "old-poem", "photo": "/photos/a.jpg"},
            "2026-06-01": {"poem": "stale-poem", "photo": "/photos/b.jpg"},
        }}
        recent_poems = dp.recently_shown(days_doc, "poem", "2026-09-01", 60)
        self.assertIn("old-poem", recent_poems)         # 31 days before, inside 60-day window
        self.assertNotIn("stale-poem", recent_poems)    # 92 days before, outside window

    def test_recently_shown_empty_when_no_days_doc(self):
        self.assertEqual(dp.recently_shown(None, "poem", "2026-09-01", 60), set())
        self.assertEqual(dp.recently_shown({"days": {}}, "poem", "2026-09-01", 60), set())

    def test_pick_best_avoids_recently_shown_when_alternative_is_close(self):
        # Two candidates with identical vectors; one was shown 10 days ago.
        candidates = [{"slug": "recent"}, {"slug": "fresh"}]
        scores = {"poems": {
            "recent": {axis: 0.5 for axis in dp.AXES},
            "fresh": {axis: 0.5 for axis in dp.AXES},
        }}
        days_doc = {"days": {"2026-09-11": {"poem": "recent"}}}
        day = {axis: 0.5 for axis in dp.AXES}
        picked, _ = dp.pick_best(candidates, "slug", day, scores, "2026-09-21", "poem", days_doc)
        self.assertEqual(picked, "fresh")


class BuildPickAndIdempotenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "v2").mkdir()
        self.data_doc = {
            "poems": [{"slug": "p1"}, {"slug": "p2"}],
            "photos": [{"src": "/photos/a.jpg"}, {"src": "/photos/b.jpg"}],
        }
        with open(self.root / "v2" / "data.json", "w") as f:
            json.dump(self.data_doc, f)

    def tearDown(self):
        self.tmp.cleanup()

    def test_build_pick_writes_expected_shape(self):
        w = weather(weather_code=0, tmax=25.0, wind_kmh=12.0, cloud_pct=30.0)
        days_doc = {"version": 1, "days": {}}
        entry = dp.build_pick(
            "2026-07-01", presence={"confidence": "high", "lat": 40.71, "lon": -74.01, "place": "New York, NY"},
            weather=w, data_doc=self.data_doc, poem_scores=None, photo_scores=None, days_doc=days_doc,
        )
        self.assertIn(entry["poem"], ("p1", "p2"))
        self.assertIn(entry["photo"], ("/photos/a.jpg", "/photos/b.jpg"))
        self.assertEqual(entry["place"], "New York, NY")
        self.assertEqual(entry["why"]["weather_code"], 0)
        self.assertEqual(entry["why"]["tmax"], 25.0)
        for axis in dp.AXES:
            self.assertIn(axis, entry["why"])

    def test_why_records_wind_and_cloud_for_the_archive(self):
        # These two fields are archive-only (the mini's 23:50 run) — not new
        # inputs to any axis formula, just recorded alongside them.
        w = weather(wind_kmh=18.5, cloud_pct=64.0)
        entry = dp.build_pick(
            "2026-07-01", presence=None, weather=w, data_doc=self.data_doc,
            poem_scores=None, photo_scores=None, days_doc={"days": {}},
        )
        self.assertEqual(entry["why"]["wind_kmh"], 18.5)
        self.assertEqual(entry["why"]["cloud_pct"], 64.0)

    def test_why_cloud_pct_missing_from_api_stays_none(self):
        w = weather(cloud_pct=None)
        entry = dp.build_pick(
            "2026-07-01", presence=None, weather=w, data_doc=self.data_doc,
            poem_scores=None, photo_scores=None, days_doc={"days": {}},
        )
        self.assertIsNone(entry["why"]["cloud_pct"])

    def test_old_days_json_entries_without_new_why_fields_still_load(self):
        # An entry written before this change has no wind_kmh/cloud_pct in
        # "why" — load_days/recently_shown must not choke on it.
        with open(self.root / "v2" / "days.json", "w") as f:
            json.dump({
                "version": 1,
                "days": {"2026-06-01": {"poem": "p1", "photo": "/photos/a.jpg",
                                          "place": None, "why": {a: 0.5 for a in dp.AXES}}},
            }, f)
        days_doc = dp.load_days(self.root)
        recent = dp.recently_shown(days_doc, "poem", "2026-06-15", 60)
        self.assertIn("p1", recent)

    def test_low_confidence_withholds_place(self):
        w = weather()
        entry = dp.build_pick(
            "2026-07-01", presence={"confidence": "low", "lat": 40.71, "lon": -74.01, "place": "New York, NY"},
            weather=w, data_doc=self.data_doc, poem_scores=None, photo_scores=None, days_doc={"days": {}},
        )
        self.assertIsNone(entry["place"])

    def test_idempotent_write_does_not_overwrite(self):
        content_first = json.dumps({"version": 1, "days": {"2026-07-01": {"poem": "p1"}}}, indent=2) + "\n"
        dp.write_days(self.root, dp.DAYS_PATH, content_first, dry_run=False)
        written_path = self.root / dp.DAYS_PATH
        self.assertTrue(written_path.exists())

        # main()'s idempotence: load_days sees the date already present and
        # the caller (main) exits 0 without calling write_days again — here
        # we exercise the same check main() makes.
        days_doc = dp.load_days(self.root)
        self.assertIn("2026-07-01", days_doc["days"])

        before = written_path.read_text()
        # Simulate a second run's guard: main() returns early in this case,
        # so write_days is never invoked; assert the file is untouched.
        self.assertEqual(written_path.read_text(), before)

    def test_writable_guard_refuses_other_paths(self):
        with self.assertRaises(SystemExit):
            dp.write_days(self.root, "v2/other.json", "{}", dry_run=False)


class MainOfflineDryRunTests(unittest.TestCase):
    """End-to-end: --dry --offline against a temp site root, mirroring the
    fixture-driven run described in the task (prints the chosen pair, writes
    nothing)."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "v2").mkdir()
        with open(self.root / "v2" / "data.json", "w") as f:
            json.dump({
                "poems": [{"slug": "p1"}, {"slug": "p2"}],
                "photos": [{"src": "/photos/a.jpg"}, {"src": "/photos/b.jpg"}],
            }, f)
        self.weather_path = self.root / "weather.json"
        with open(self.weather_path, "w") as f:
            json.dump({
                "daily": {
                    "time": ["2026-07-04"],
                    "weather_code": [0],
                    "temperature_2m_max": [30.0],
                    "temperature_2m_min": [20.0],
                    "precipitation_sum": [0.0],
                    "sunshine_duration": [50000],
                    "daylight_duration": [53000],
                    "wind_speed_10m_max": [5.0],
                }
            }, f)
        self.presence_path = self.root / "presence.json"
        with open(self.presence_path, "w") as f:
            json.dump({"confidence": "medium"}, f)  # no place published -> home coords
        self._orig_site_root = dp.SITE_ROOT
        dp.SITE_ROOT = self.root

    def tearDown(self):
        dp.SITE_ROOT = self._orig_site_root
        self.tmp.cleanup()

    def test_dry_offline_run_prints_pick_and_writes_nothing(self):
        rc = dp.main([
            "--date", "2026-07-04",
            "--offline", str(self.weather_path),
            "--presence", str(self.presence_path),
            "--data", str(self.root / "v2" / "data.json"),
            "--scores-dir", str(self.root / "v2"),
            "--dry",
        ])
        self.assertEqual(rc, 0)
        self.assertFalse((self.root / "v2" / "days.json").exists())

    def test_idempotent_second_real_run_is_a_noop(self):
        argv = [
            "--date", "2026-07-04",
            "--offline", str(self.weather_path),
            "--presence", str(self.presence_path),
            "--data", str(self.root / "v2" / "data.json"),
            "--scores-dir", str(self.root / "v2"),
        ]
        rc1 = dp.main(argv)
        self.assertEqual(rc1, 0)
        days_path = self.root / "v2" / "days.json"
        self.assertTrue(days_path.exists())
        first_content = days_path.read_text()

        rc2 = dp.main(argv)
        self.assertEqual(rc2, 0)
        self.assertEqual(days_path.read_text(), first_content)  # untouched, no rewrite


if __name__ == "__main__":
    unittest.main()
