#!/usr/bin/env python3
"""test_place_feed.py — stdlib unittest for place_feed.py's pure logic.

Covers: confidence gating, place_key override map, ", ST"/", Country" suffix
stripping, and coordinate rounding. No filesystem writes — build_output() and
short_name()/round_coord() are pure functions.
"""
import unittest

import place_feed


class ShortNameTests(unittest.TestCase):
    def test_override_map_wins_over_free_text(self):
        self.assertEqual(place_feed.short_name("nyc", "New York, NY"), "New York")
        self.assertEqual(place_feed.short_name("ptown", "Provincetown, MA"), "Provincetown")
        self.assertEqual(place_feed.short_name("sitges", "Sitges, Spain"), "Sitges")
        self.assertEqual(place_feed.short_name("enchantments", "The Enchantments, WA"), "the Enchantments")

    def test_strips_state_suffix_when_key_unknown(self):
        self.assertEqual(place_feed.short_name(None, "Austin, TX"), "Austin")
        self.assertEqual(place_feed.short_name("some-unlisted-key", "Chicago, IL"), "Chicago")

    def test_strips_country_suffix(self):
        self.assertEqual(place_feed.short_name(None, "Sitges, Spain"), "Sitges")

    def test_no_suffix_passes_through(self):
        self.assertEqual(place_feed.short_name(None, "Leavenworth"), "Leavenworth")

    def test_empty_input(self):
        self.assertIsNone(place_feed.short_name(None, None))
        self.assertIsNone(place_feed.short_name(None, ""))


class RoundCoordTests(unittest.TestCase):
    def test_rounds_to_two_decimals(self):
        self.assertEqual(place_feed.round_coord(40.712800), 40.71)
        self.assertEqual(place_feed.round_coord(-74.006000), -74.01)

    def test_none_stays_none(self):
        self.assertIsNone(place_feed.round_coord(None))


class BuildOutputTests(unittest.TestCase):
    def test_high_confidence_publishes(self):
        out = place_feed.build_output({
            "day": "2026-09-21", "confidence": "high",
            "place_key": "nyc", "place": "New York, NY",
            "lat": 40.7128, "lon": -74.0060, "tz": "America/New_York",
        })
        self.assertEqual(out, {
            "place": "New York", "lat": 40.71, "lon": -74.01,
            "tz": "America/New_York", "updated": "2026-09-21",
        })

    def test_confirmed_confidence_publishes(self):
        out = place_feed.build_output({
            "day": "2026-09-21", "confidence": "confirmed",
            "place_key": "boston", "place": "Boston, MA",
            "lat": 42.3601, "lon": -71.0589, "tz": "America/New_York",
        })
        self.assertEqual(out["place"], "Boston")

    def test_medium_confidence_withholds_place(self):
        out = place_feed.build_output({
            "day": "2026-09-21", "confidence": "medium",
            "place_key": "nyc", "place": "New York, NY",
            "lat": 40.7128, "lon": -74.0060, "tz": "America/New_York",
        })
        self.assertEqual(out, {
            "place": None, "lat": None, "lon": None, "tz": None,
            "updated": "2026-09-21",
        })

    def test_low_confidence_withholds_place(self):
        out = place_feed.build_output({
            "day": "2026-09-21", "confidence": "low",
            "place_key": "nyc", "place": "New York, NY",
            "lat": 40.7128, "lon": -74.0060, "tz": "America/New_York",
        })
        self.assertIsNone(out["place"])
        self.assertIsNone(out["lat"])

    def test_missing_confidence_withholds_place(self):
        out = place_feed.build_output({"day": "2026-09-21", "place": "New York, NY"})
        self.assertIsNone(out["place"])

    def test_falls_back_to_generated_for_day(self):
        out = place_feed.build_output({
            "generated": "2026-09-21T21:28:19-04:00", "confidence": "low",
        })
        self.assertEqual(out["updated"], "2026-09-21")


if __name__ == "__main__":
    unittest.main()
