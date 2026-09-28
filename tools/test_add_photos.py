#!/usr/bin/env python3
"""test_add_photos.py — stdlib unittest for add_photos.py: who gets in, who is held, and
that a run leaves data.json and scores-photos.json agreeing with each other."""
import json
import tempfile
import unittest
from pathlib import Path

import add_photos as ap


def score(**over):
    s = {"light": 0.5, "warmth": 0.5, "wet": 0.5, "stillness": 0.5, "season": 0.5,
         "inside": 0.5, "mood": 0.5, "hour": "day", "alt": "Gull on an empty beach",
         "notes": "gull, sand", "people_identifiable": False}
    s.update(over)
    return s


def entry(name, **over):
    m = {"file": name, "caption": "Casper, Wyoming — Leica Q2", "place": "Casper, Wyoming",
         "lat": 42.8501, "lon": -106.3252}
    m.update(over)
    return m


class PlanTests(unittest.TestCase):
    def test_a_scored_photograph_is_added_with_rounded_coordinates(self):
        p = ap.plan([entry("a.jpg")], {"a.jpg": score()}, set(), set())
        self.assertEqual([a["file"] for a in p["add"]], ["a.jpg"])
        self.assertEqual(p["add"][0]["score"]["place"], {"name": "Casper, Wyoming", "lat": 42.85, "lon": -106.33})
        self.assertEqual(p["add"][0]["entry"]["alt"], "Gull on an empty beach")

    def test_the_scorer_seeing_a_face_holds_the_photograph(self):
        p = ap.plan([entry("a.jpg")], {"a.jpg": score(people_identifiable=True)}, set(), set())
        self.assertEqual((p["add"], p["held"]), ([], ["a.jpg"]))

    def test_the_hold_list_holds_it_even_when_the_scorer_saw_nobody(self):
        p = ap.plan([entry("a.jpg")], {"a.jpg": score()}, {"a.jpg"}, set())
        self.assertEqual((p["add"], p["held"]), ([], ["a.jpg"]))

    def test_unscored_out_of_range_and_placeless_are_skipped_not_added(self):
        man = [entry("none.jpg"), entry("bad.jpg"), entry("hour.jpg"), entry("noplace.jpg", place="")]
        sc = {"bad.jpg": score(wet=1.4), "hour.jpg": score(hour="noon"), "noplace.jpg": score()}
        p = ap.plan(man, sc, set(), set())
        self.assertEqual(p["add"], [])
        self.assertEqual({s["file"] for s in p["skipped"]}, {"none.jpg", "bad.jpg", "hour.jpg", "noplace.jpg"})

    def test_a_photograph_already_in_the_rotation_is_left_alone(self):
        p = ap.plan([entry("a.jpg")], {"a.jpg": score()}, set(), {"/photos/a.jpg"})
        self.assertEqual((p["add"], p["already"]), ([], ["a.jpg"]))


class RunTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.repo, self.export, self.scores = root / "repo", root / "export", root / "scores"
        for d in (self.repo / "v2", self.repo / "photos", self.export, self.scores):
            d.mkdir(parents=True)
        (self.repo / "v2" / "data.json").write_text(json.dumps({"poems": [], "photos": []}, indent=1))
        (self.repo / "v2" / "scores-photos.json").write_text(json.dumps({"version": 1, "photos": {}}, indent=1) + "\n")
        (self.export / "manifest.json").write_text(json.dumps([entry("a.jpg"), entry("b.jpg")]))
        for n in ("a.jpg", "b.jpg"):
            (self.export / n).write_bytes(b"jpeg")
        (self.scores / "x.json").write_text(json.dumps({"a.jpg": score(), "b.jpg": score(people_identifiable=True)}))
        self.argv = ["--export", str(self.export), "--scores", str(self.scores), "--repo", str(self.repo)]

    def tearDown(self):
        self.tmp.cleanup()

    def read(self):
        return (json.loads((self.repo / "v2" / "data.json").read_text()),
                json.loads((self.repo / "v2" / "scores-photos.json").read_text()))

    def test_a_run_writes_the_catalog_the_scores_and_the_file_together(self):
        self.assertEqual(ap.main(self.argv), 0)
        data, scores = self.read()
        self.assertEqual([p["src"] for p in data["photos"]], ["/photos/a.jpg"])
        self.assertEqual(list(scores["photos"]), ["/photos/a.jpg"])
        self.assertTrue((self.repo / "photos" / "a.jpg").is_file())
        self.assertFalse((self.repo / "photos" / "b.jpg").exists())

    def test_a_second_run_adds_nothing(self):
        ap.main(self.argv)
        ap.main(self.argv)
        self.assertEqual(len(self.read()[0]["photos"]), 1)

    def test_dry_writes_nothing(self):
        ap.main(self.argv + ["--dry"])
        self.assertEqual(self.read()[0]["photos"], [])
        self.assertFalse((self.repo / "photos" / "a.jpg").exists())


if __name__ == "__main__":
    unittest.main()
