#!/usr/bin/env python3
"""test_lately_feed.py — stdlib unittest for the Lately feed layer.

Covers the entry contract, the merge, the Atom consumer, and that
weekly_record.py writes its entry through the shared layer (and the feed
alongside it) without changing what it wrote before. Every write goes to a
temp dir.

    python3 -m unittest discover -s tools -p 'test_lately_feed.py' -v
"""
import datetime as dt
import json
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lately_feed as lf  # noqa: E402
import weekly_record as wr  # noqa: E402

ATOM = "{http://www.w3.org/2005/Atom}"
REPO = Path(__file__).resolve().parent.parent


def entry(**over):
    e = {"id": "record-2026-w41", "date": "2026-10-11", "strand": "code",
         "title": "october 5 to 11", "summary": "21h at the keyboard.",
         "stats": ["21h 50m", "163 commits"],
         "mark": {"shape": "bars", "values": [1, 2, 3], "label": "minutes"},
         "link": "/lately/2026-w41/"}
    e.update(over)
    return e


class ContractTests(unittest.TestCase):
    def test_valid_entry_passes_unchanged(self):
        e = entry()
        self.assertIs(lf.validate_entry(e), e)

    def test_minimal_entry_without_stats_or_mark(self):
        lf.validate_entry({"id": "x", "date": "2026-01-01", "strand": "photo",
                           "summary": "s", "link": "/lately/x/"})

    def test_rejections(self):
        bad = [
            entry(id=""),
            entry(date="2026-10-11T00:00"),
            entry(strand="Code"),
            entry(link="https://evil.example/"),
            entry(link="//evil.example/"),
            entry(title="", summary=""),
            entry(stats="21h"),
            entry(mark={"shape": "pie", "values": [1]}),
            entry(mark={"shape": "bars", "values": ["1"]}),
            entry(mark={"shape": "bars", "values": [True]}),
        ]
        for e in bad:
            with self.subTest(e=e), self.assertRaises(lf.EntryError):
                lf.validate_entry(e)


class MergeTests(unittest.TestCase):
    def test_merge_replaces_by_id_and_sorts_newest_first(self):
        doc = {"schema_version": 1, "generated_at": "old",
               "entries": [entry(id="record-2026-w40", date="2026-10-04"),
                           entry(summary="stale")]}
        out = lf.merge(doc, entry(), "now")
        self.assertEqual([e["id"] for e in out["entries"]], ["record-2026-w41", "record-2026-w40"])
        self.assertEqual(out["entries"][0]["summary"], "21h at the keyboard.")
        self.assertEqual(out["schema_version"], 2)
        self.assertEqual(out["generated_at"], "now")

    def test_remerge_same_entry_keeps_generated_at(self):
        doc = lf.merge({"entries": []}, entry(), "first")
        again = lf.merge(doc, entry(), "second")
        self.assertEqual(again["generated_at"], "first")
        self.assertEqual(again, doc)

    def test_merge_refuses_bad_entry(self):
        with self.assertRaises(lf.EntryError):
            lf.merge({"entries": []}, entry(date="soon"), "now")


class AtomTests(unittest.TestCase):
    def parse(self, doc):
        return ET.fromstring(lf.render_atom(doc).encode("utf-8"))

    def test_feed_is_valid_atom_with_entries_newest_first(self):
        doc = {"entries": [entry(id="a", date="2026-10-04", link="/lately/a/"),
                           entry(id="b", date="2026-10-11", link="/lately/b/")]}
        root = self.parse(doc)
        self.assertEqual(root.tag, ATOM + "feed")
        self.assertEqual(root.find(ATOM + "updated").text, "2026-10-11T00:00:00Z")
        ids = [e.find(ATOM + "id").text for e in root.findall(ATOM + "entry")]
        self.assertEqual(ids, ["tag:kahransingh.com,2026:lately/b", "tag:kahransingh.com,2026:lately/a"])
        first = root.find(ATOM + "entry")
        self.assertEqual(first.find(ATOM + "link").get("href"), "https://kahransingh.com/lately/b/")
        self.assertEqual(first.find(ATOM + "category").get("term"), "code")
        self.assertIn("21h 50m · 163 commits", first.find(ATOM + "summary").text)

    def test_escapes_markup(self):
        root = self.parse({"entries": [entry(title='<b>"x" & y</b>')]})
        self.assertEqual(root.find(ATOM + "entry").find(ATOM + "title").text, '<b>"x" & y</b>')

    def test_deterministic_and_limited(self):
        doc = {"entries": [entry(id=f"e{i:02d}", date=f"2026-01-{i:02d}") for i in range(1, 29)]}
        self.assertEqual(lf.render_atom(doc), lf.render_atom(json.loads(json.dumps(doc))))
        self.assertEqual(len(self.parse(doc).findall(ATOM + "entry")), lf.FEED_LIMIT)

    def test_empty_feed_still_valid(self):
        root = self.parse({"entries": []})
        self.assertEqual(root.findall(ATOM + "entry"), [])

    def test_bad_entry_fails_the_build(self):
        with self.assertRaises(lf.EntryError):
            lf.render_atom({"entries": [entry(link="https://x/")]})

    def test_live_entries_json_meets_contract_and_feed_matches_committed(self):
        doc = lf.load(REPO / lf.ENTRIES_PATH)
        for e in doc["entries"]:
            lf.validate_entry(e)
        committed = REPO / lf.FEED_PATH
        self.assertTrue(committed.exists(), "lately/feed.xml should be committed")
        self.assertEqual(committed.read_text(encoding="utf-8"), lf.render_atom(doc),
                         "lately/feed.xml is stale; run python3 tools/lately_feed.py")


class ProducerTests(unittest.TestCase):
    """weekly_record.py goes through the shared layer and writes the feed too."""

    def synthetic_days(self):
        days = {}
        mon = dt.date(2026, 10, 5)
        for i in range(7):
            d = mon + dt.timedelta(days=i)
            # Same shape as one real day in coding-days.json; every value is fake.
            days[d.isoformat()] = {
                "active_min": 60 + i, "longest_focus_min": 30,
                "first": "09:00", "last": "18:00",
                "sessions": 2, "user_msgs": 5, "asst_msgs": 9,
                "tools": {"Edit": 3}, "files_touched": 4, "top_files": [],
                "projects": {"day-flow": {"min": 50 + i, "events": 12}},
                "tokens": {"in": 100, "out": 1000, "cache_read": 0, "cache_create": 0},
                "models": {"model-a": 7}, "hourly": [0] * 9 + [10] + [0] * 14,
                "commits": [{"repo": "day-flow", "sha": "abc1234", "subject": "fake change",
                             "t": "10:00", "ins": 10, "del": 2, "files": 1,
                             "machine": "box", "merge": False, "claude": True}],
                "mini_msgs": 0, "meetings": 0,
            }
        return days

    def test_producer_writes_entry_and_feed_byte_identically_on_rerun(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            data = tmp / "coding-days.json"
            data.write_text(json.dumps({"days": self.synthetic_days()}))
            site = tmp / "site"
            (site / "lately").mkdir(parents=True)
            argv = [str(data), "--week", "2026-W41", "--site-root", str(site),
                    "--archive-dir", str(tmp / "arch")]
            self.assertEqual(wr.main(argv), 0)
            doc = json.loads((site / "lately/entries.json").read_text())
            self.assertEqual([e["id"] for e in doc["entries"]], ["record-2026-w41"])
            feed = (site / "lately/feed.xml").read_text()
            self.assertEqual(feed, lf.render_atom(doc))
            before = {p: p.read_bytes() for p in (site / "lately").rglob("*") if p.is_file()}
            self.assertEqual(wr.main(argv), 0)
            after = {p: p.read_bytes() for p in (site / "lately").rglob("*") if p.is_file()}
            self.assertEqual(before, after)

    def test_writer_allowlist_admits_feed_and_nothing_new_else(self):
        self.assertTrue(wr.WRITABLE.fullmatch("lately/feed.xml"))
        for rel in ("lately/index.html", "lately/README.md", "feed.xml", "lately/feed.json"):
            self.assertIsNone(wr.WRITABLE.fullmatch(rel), rel)


if __name__ == "__main__":
    unittest.main()
