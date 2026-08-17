#!/usr/bin/env python3
"""Build the public weekly coding record for kahransingh.com.

Reads the private coding-days.json extract, aggregates the most recent COMPLETE
Monday-Sunday week, and writes exactly three paths inside the site:

    lately/<iso-week>/index.html   the permanent dated issue
    lately/record/index.html       a copy of the newest issue, canonical -> dated
    lately/entries.json            one entry per issue, merged in place

It writes nothing else, and an allowlist in Writer.write enforces that rather
than leaving it to habit. It cannot reach lately/index.html, the site's
index.html, any <nav>, sitemap.xml or style.css, so the recurring job can never
clobber a hand-edited page.

PRIVACY FLOOR (hard law, enforced structurally)
    The generator only ever reads these fields out of a day:
        active_min longest_focus_min sessions user_msgs projects tokens
        models hourly mini_msgs commits[].{repo,ins,del,merge,claude}
    Commit subjects, shas, times, file names, top_files, branch names, meeting
    counts and machine names are never read, so they cannot leak. The rendered
    page is static HTML with no embedded data blob: what you can see on the
    page is the entirety of what the page contains.

Usage
    python3 tools/weekly_record.py ~/Sync/pending-work/coding-record/coding-days.json
    python3 tools/weekly_record.py DATA --week 2026-W33     # rebuild one issue
    python3 tools/weekly_record.py DATA --dry-run           # print, write nothing

Re-running for the same week rewrites that week's files byte-identically and
touches no other week.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
import json
import re
import sys
from collections import Counter, OrderedDict
from pathlib import Path

# --------------------------------------------------------------------------
# Publication policy — the only place naming decisions live.
# --------------------------------------------------------------------------

# Worktree and spike directories roll up into the project they belong to, so
# `day-flow-tome-build` and `day-flow` are one line, not two.
ROLLUP_FAMILIES = (
    "day-flow",
    "hermes-kmini",
    "pending-heartbeat",
    "pending-work",
    "photo-flow",
    "joyus-website",
    "joyus",
    "mail-triage",
    "raw-store",
    "home-net",
)
ROLLUP_PREFIXES = {"dfw": "day-flow"}

# A project whose directory name marks it private publishes as "private" and
# nothing more — Kahran's own instruction. The rule matches the marker rather
# than one spelled-out repo name, so that a worktree or a spike cut from a
# private repo (`…-private-worktrees`, `…-private-wt-x`) can never publish the
# name it came from, and so that this file — which is itself served from a
# public repo — never has to write that name down. Everything that matches
# collapses onto the same single line.
PRIVATE_MARKERS = ("-private", "private-", "_private")
PRIVATE_LABEL = "private"

# Exact project name -> the name printed on the page.
PUBLIC_NAME = {
    "dev-misc": "unnamed sessions",
    "scratchpad": "scratch",
    "retired-20260807-openclaw-dispatcher": "openclaw-dispatcher",
}

# Names that must never be printed. Anything listed here still contributes its
# minutes to the bars, but renders as "a private project". Deliberately empty:
# Kahran's stated floor is that project names are publishable. Adding a line
# here is the whole mechanism for retracting one.
DENY = frozenset()

# Only this many projects are ever named on a page. Everything below the line is
# summed into "N smaller projects", so the long tail of repo names never
# publishes even as the roster changes week to week.
NAMED_PROJECTS = 4

# A single commit larger than this is a bulk import, not typing. Its lines are
# excluded from the week's +/- figures and reported separately.
BULK_IMPORT_LINES = 100_000

# The one paragraph of standing prose on the page. Edit it HERE, never in a
# rendered issue — the weekly job regenerates those.
COLOPHON = (
    "Built weekly from my own session logs and commits. Counts, durations and "
    "project names, nothing else."
)

# The page is drawn in the site's own inks. Projects are told apart by weight
# and texture, not by hue: a four-step grey scale for the named projects, a
# lighter grey for unnamed sessions, and a hatch for the summed tail. Colour
# follows the project across the whole page, never its rank inside a day.
PALETTE = ["#1a1a1a", "#4f4a43", "#867f74", "#b3ada2"]
NEUTRAL_UNNAMED = "#cfc9be"
NEUTRAL_OTHER = ("repeating-linear-gradient(45deg,#dcd7ce 0 2px,#f0ede7 2px 4px)")
INK = "#1a1a1a"
RULE = "#e0ddd8"
ARC_PAST = "#c3bdb1"

# Where the section lives. Every published URL is under /lately/.
SECTION = "lately"

# The site's own navigation, copied verbatim from the hand-written pages. The
# generator renders it into its own pages and reaches no other file: adding a
# link to the site's nav is still a hand edit, made once, everywhere.
NAV_LINKS = (
    ("/poetry.html", "poetry"),
    ("/photography.html", "photography"),
    ("/projects.html", "projects"),
    (f"/{SECTION}/", SECTION),
    ("/working-with-me.html", "work with me"),
    ("/speaking.html", "speaking"),
    ("/archive.html", "archive"),
    ("/about.html", "about"),
)

OG_IMAGE = "https://kahransingh.com/photos/roma-sidewalk.jpg"

ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen",
]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
        "eighty", "ninety"]


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------

def spell(n: int) -> str:
    """Spell a whole number 0-999 for the reading paragraph."""
    n = int(n)
    if n < 0:
        return str(n)
    if n < 20:
        return ONES[n]
    if n < 100:
        t, o = divmod(n, 10)
        return TENS[t] + ("-" + ONES[o] if o else "")
    h, r = divmod(n, 100)
    return ONES[h] + " hundred" + (" and " + spell(r) if r else "")


def hm(minutes: int) -> str:
    """28h 57m / 9h 05m / 47m / none."""
    minutes = int(round(minutes))
    if minutes <= 0:
        return "none"
    h, m = divmod(minutes, 60)
    if not h:
        return f"{m}m"
    return f"{h}h {m:02d}m"


def spoken_duration(minutes: int) -> str:
    """five hours and sixteen minutes"""
    h, m = divmod(int(minutes), 60)
    parts = []
    if h:
        parts.append(f"{spell(h)} hour" + ("s" if h != 1 else ""))
    if m:
        parts.append(f"{spell(m)} minute" + ("s" if m != 1 else ""))
    return " and ".join(parts) if parts else "no time"


def plural(n: int, word: str) -> str:
    return f"{word}" if n == 1 else f"{word}s"


def commas(n: int) -> str:
    return f"{int(n):,}"


def tokens_short(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.0f}k"
    return str(int(n))


def esc(s) -> str:
    return html.escape(str(s), quote=True)


def pct(part: float, whole: float) -> float:
    return 0.0 if whole <= 0 else max(0.0, min(100.0, 100.0 * part / whole))


def fmt_pct(v: float) -> str:
    return f"{v:.4f}".rstrip("0").rstrip(".") or "0"


def ramp(t: float) -> str:
    """Pale paper -> ink. Magnitude reads as weight, not as colour."""
    t = max(0.0, min(1.0, t)) ** 0.62
    lo, hi = (0xE7, 0xE3, 0xDB), (0x1A, 0x1A, 0x1A)
    return "#" + "".join(f"{round(a + (b - a) * t):02x}" for a, b in zip(lo, hi))


def roll_project(name: str) -> str:
    # A denied name is never folded into a family: rolling it up first would
    # rename it out from under DENY and silently stop the retraction firing.
    if name in DENY:
        return name
    if name == PRIVATE_LABEL or any(m in name for m in PRIVATE_MARKERS):
        return PRIVATE_LABEL
    for fam in ROLLUP_FAMILIES:
        if name == fam or name.startswith(fam + "-"):
            return fam
    for pre, fam in ROLLUP_PREFIXES.items():
        if name == pre or name.startswith(pre + "-"):
            return fam
    return name


def public_name(name: str) -> str:
    if name in DENY:
        return "a private project"
    return PUBLIC_NAME.get(name, name)


def iso_week_id(d: dt.date) -> str:
    y, w, _ = d.isocalendar()
    return f"{y}-W{w:02d}"


def week_slug(week_id: str) -> str:
    return week_id.lower()


def monday_of(week_id: str) -> dt.date:
    y, w = week_id.split("-W")
    return dt.date.fromisocalendar(int(y), int(w), 1)


def day_range_phrase(mon: dt.date, sun: dt.date) -> str:
    if mon.month == sun.month:
        return f"{mon.day}–{sun.day} {sun.strftime('%B')}"
    return f"{mon.day} {mon.strftime('%B')} – {sun.day} {sun.strftime('%B')}"


# --------------------------------------------------------------------------
# Aggregation
# --------------------------------------------------------------------------

def pick_week(days: dict, today: dt.date, requested: str | None) -> str:
    """The most recent complete Mon-Sun week, or the one asked for."""
    if requested:
        if not re.fullmatch(r"\d{4}-W\d{2}", requested):
            raise SystemExit(f"--week must look like 2026-W32, got {requested!r}")
        return requested
    dates = sorted(dt.date.fromisoformat(k) for k in days)
    if not dates:
        raise SystemExit("no days in the data file")
    data_max = dates[-1]
    # A week is complete when its Sunday is in the past by both clocks: the
    # data's own last day, and the wall clock. Never publish a partial week.
    horizon = min(data_max, today - dt.timedelta(days=1))
    sunday = horizon - dt.timedelta(days=horizon.isoweekday() % 7)
    while sunday >= dates[0]:
        wk = iso_week_id(sunday)
        mon = monday_of(wk)
        if any(mon <= d <= sunday for d in dates):
            return wk
        sunday -= dt.timedelta(days=7)
    raise SystemExit("no complete week found in the data")


def aggregate_week(days: dict, week_id: str) -> dict:
    mon = monday_of(week_id)
    dates = [mon + dt.timedelta(days=i) for i in range(7)]

    week_projects: Counter = Counter()
    hourly = [0] * 24
    per_day = []
    totals = Counter()
    models: Counter = Counter()
    repos: set = set()
    bulk_lines = 0

    for d in dates:
        v = days.get(d.isoformat()) or {}
        projects: Counter = Counter()
        for name, pv in (v.get("projects") or {}).items():
            projects[roll_project(name)] += int(pv.get("min", 0))
        week_projects.update(projects)

        commits = 0
        ins = dele = claude = 0
        for c in (v.get("commits") or []):
            if c.get("merge"):
                continue
            commits += 1
            repos.add(c.get("repo") or "")
            if int(c.get("ins", 0)) >= BULK_IMPORT_LINES:
                bulk_lines += int(c.get("ins", 0))
            else:
                ins += int(c.get("ins", 0))
                dele += int(c.get("del", 0))
            if c.get("claude"):
                claude += 1

        active = int(v.get("active_min", 0) or 0)
        day = {
            "date": d,
            "active_min": active,
            "work_min": sum(projects.values()),
            "longest_focus_min": int(v.get("longest_focus_min", 0) or 0),
            "sessions": int(v.get("sessions", 0) or 0),
            "commits": commits,
            "mini_msgs": int(v.get("mini_msgs", 0) or 0),
            "projects": projects,
        }
        per_day.append(day)

        totals["active"] += active
        totals["work"] += day["work_min"]
        totals["sessions"] += day["sessions"]
        totals["commits"] += commits
        totals["ins"] += ins
        totals["del"] += dele
        totals["claude"] += claude
        totals["mini"] += day["mini_msgs"]
        totals["user_msgs"] += int(v.get("user_msgs", 0) or 0)
        totals["out_tokens"] += int((v.get("tokens") or {}).get("out", 0) or 0)
        for m, mv in (v.get("models") or {}).items():
            if mv:
                models[m] += int(mv)
        for i, h in enumerate((v.get("hourly") or [])[:24]):
            hourly[i] += int(h or 0)

    # Fixed colour order for the whole page: colour follows the project, never
    # its rank inside a given day.
    named, tail = [], Counter()
    for name, minutes in week_projects.most_common():
        label = public_name(name)
        if label in ("unnamed sessions", "a private project") or len(named) >= NAMED_PROJECTS:
            tail[label] += minutes
        else:
            named.append((name, label, minutes))

    order = []
    for i, (raw, label, minutes) in enumerate(named):
        order.append({"key": raw, "label": label, "min": minutes, "color": PALETTE[i]})
    unnamed_min = tail.pop("unnamed sessions", 0)
    if unnamed_min:
        order.append({"key": "dev-misc", "label": "unnamed sessions",
                      "min": unnamed_min, "color": NEUTRAL_UNNAMED})
    rest_min = sum(tail.values())
    rest_count = len([n for n in week_projects if public_name(n) not in
                      {o["label"] for o in order}])
    if rest_min:
        label = (f"{rest_count} smaller projects" if rest_count != 1
                 else "one smaller project")
        order.append({"key": "__rest__", "label": label, "min": rest_min,
                      "color": NEUTRAL_OTHER})

    named_keys = {o["key"] for o in order}

    for day in per_day:
        split = Counter()
        for name, minutes in day["projects"].items():
            label = public_name(name)
            if name in named_keys:
                split[name] += minutes
            elif label == "unnamed sessions":
                split["dev-misc"] += minutes
            else:
                split["__rest__"] += minutes
        day["split"] = split

    return {
        "week_id": week_id,
        "monday": mon,
        "sunday": mon + dt.timedelta(days=6),
        "days": per_day,
        "totals": totals,
        "projects": order,
        "hourly": hourly,
        "models": models,
        "repos": len([r for r in repos if r]),
        "bulk_lines": bulk_lines,
    }


def long_arc(days: dict, upto_week: str) -> list:
    """Every ISO week the record covers, up to and including this one."""
    buckets: OrderedDict = OrderedDict()
    stop = monday_of(upto_week) + dt.timedelta(days=6)
    for k in sorted(days):
        d = dt.date.fromisoformat(k)
        if d > stop:
            continue
        wk = iso_week_id(d)
        b = buckets.setdefault(wk, {"week": wk, "active": 0, "commits": 0})
        b["active"] += int(days[k].get("active_min", 0) or 0)
        b["commits"] += sum(1 for c in (days[k].get("commits") or [])
                            if not c.get("merge"))
    return list(buckets.values())


# --------------------------------------------------------------------------
# Prose — assembled from the numbers, never from the data's text
# --------------------------------------------------------------------------

def reading_line(w: dict) -> str:
    """One line, and only what the marks cannot say: the longest unbroken
    stretch, how much of the week was co-authored, what still landed on a day
    off. Everything the table already states is left to the table."""
    t = w["totals"]
    bits = []

    best = max(w["days"], key=lambda d: d["longest_focus_min"])
    if best["longest_focus_min"] >= 45:
        bits.append(f'longest stretch {hm(best["longest_focus_min"])}, '
                    f'{best["date"].strftime("%A").lower()}')

    if t["commits"]:
        share = pct(t["claude"], t["commits"])
        if share >= 60:
            bits.append(f"{share:.0f}% of commits with Claude")

    rest = [d for d in w["days"] if d["active_min"] == 0]
    if rest:
        landed = sum(d["commits"] for d in rest)
        mini = sum(d["mini_msgs"] for d in rest)
        off = ", ".join(d["date"].strftime("%a").lower() for d in rest)
        tail = []
        if landed:
            tail.append(f"{commas(landed)} commits")
        if mini:
            tail.append(f"{commas(mini)} mini messages")
        if tail:
            bits.append(f"{off} off — " + " and ".join(tail) + " anyway")

    return " · ".join(bits)


# --------------------------------------------------------------------------
# Rendering
# --------------------------------------------------------------------------

def render_strata(w: dict) -> str:
    scale = max([max(d["work_min"], d["active_min"]) for d in w["days"]] + [1])
    order = w["projects"]
    rows = []
    for d in w["days"]:
        dow = d["date"].strftime("%a").lower()
        dom = d["date"].day
        weekend = d["date"].isoweekday() >= 6
        if d["work_min"] == 0 and d["active_min"] == 0:
            note = "rest"
            if d["commits"]:
                note = f"rest · {d['commits']} commits still landed"
            track = f'<div class="rest">{esc(note)}</div>'
        else:
            segs = []
            for i, o in enumerate(order):
                minutes = d["split"].get(o["key"], 0)
                if minutes <= 0:
                    continue
                segs.append(
                    f'<span style="width:{fmt_pct(pct(minutes, d["work_min"]))}%;'
                    f'background:{o["color"]}" title="{esc(o["label"])} · '
                    f'{esc(hm(minutes))}"></span>'
                )
            track = (
                f'<div class="band" style="width:{fmt_pct(pct(d["work_min"], scale))}%">'
                + "".join(segs) + "</div>"
                + f'<div class="clock" style="width:{fmt_pct(pct(d["active_min"], scale))}%"'
                  f' title="on the clock · {esc(hm(d["active_min"]))}"></div>'
            )
        rows.append(
            f'<tr{" class=off" if weekend else ""}>'
            f'<th scope="row"><span class="dow">{dow}</span>'
            f'<span class="dom">{dom}</span></th>'
            f'<td class="track">{track}</td>'
            f'<td class="n">{esc(hm(d["active_min"]))}</td>'
            f'<td class="n">{d["commits"] or "–"}</td>'
            f"</tr>"
        )

    legend = "".join(
        f'<li><span class="sw" style="background:{o["color"]}"></span>'
        f'{esc(o["label"])}</li>' for o in order
    )
    legend += (f'<li class="sep"><span class="sw rule" style="background:{INK}">'
               f"</span>time on the clock</li>")

    return f"""      <table class="strata">
        <thead><tr><th scope="col">day</th><th scope="col">the work</th>
        <th scope="col">clock</th><th scope="col">commits</th></tr></thead>
        <tbody>
{chr(10).join("          " + r for r in rows)}
        </tbody>
      </table>
      <ul class="legend">{legend}</ul>"""


def render_ridge(w: dict) -> str:
    hourly = w["hourly"]
    peak = max(hourly)
    if not peak:
        return ""
    peak_hour = hourly.index(peak)
    cols = []
    for h, v in enumerate(hourly):
        height = max(1.2, pct(v, peak))
        cols.append(
            f'<span class="hr" style="height:{fmt_pct(height)}%;'
            f'background:{ramp(v / peak)}" '
            f'title="{h:02d}:00 · {commas(v)} events"></span>'
        )
    ticks = "".join(
        f'<span>{h:02d}</span>' if h % 6 == 0 else "<span></span>"
        for h in range(24)
    )
    return f"""      <div class="ridge">{"".join(cols)}</div>
      <div class="ridge-axis">{ticks}</div>
      <p class="fignote">every logged event by hour &middot; peak
      <b>{peak_hour:02d}:00</b>, {commas(peak)}</p>"""


def render_projects(w: dict) -> str:
    order = sorted(w["projects"], key=lambda o: (o["key"] == "__rest__", -o["min"]))
    if not order:
        return ""
    top = max([o["min"] for o in order] + [1])
    rows = []
    for o in order:
        rows.append(
            f'<li><span class="pname">{esc(o["label"])}</span>'
            f'<span class="pbar"><b style="width:{fmt_pct(pct(o["min"], top))}%;'
            f'background:{o["color"]}"></b></span>'
            f'<span class="pmin">{esc(hm(o["min"]))}</span></li>'
        )
    t = w["totals"]
    return f"""      <ul class="projects">{"".join(rows)}</ul>
      <p class="fignote">{esc(hm(t["work"]))} of project time inside
      {esc(hm(t["active"]))} on the clock &middot; parallel sessions overlap</p>"""


def render_arc(w: dict, arc: list, issues: set) -> str:
    # The rail shows hours, so it starts where the hours start: the first week
    # of the unbroken run of weeks that carry a session record. Everything
    # before that is real work with no clock behind it, and is said in words.
    start = len(arc) - 1
    for i in range(len(arc) - 1, -1, -1):
        if arc[i]["active"] >= 60:
            start = i
        else:
            break
    before, arc = arc[:start], arc[start:]
    peak = max([b["active"] for b in arc] + [1])
    ticks = []
    for b in arc:
        current = b["week"] == w["week_id"]
        if b["active"] > 0:
            height = max(3.0, pct(b["active"], peak))
            cls = "wk on" + (" now" if current else "")
            label = f'{b["week"]} · {hm(b["active"])} · {commas(b["commits"])} commits'
        else:
            height = 0
            cls = "wk"
            label = f'{b["week"]} · no session record · {commas(b["commits"])} commits'
        body = (f'<span class="{cls}" style="height:{fmt_pct(height)}%" '
                f'title="{esc(label)}"></span>')
        slug = week_slug(b["week"])
        if slug in issues and not current:
            ticks.append(f'<a href="/{SECTION}/{slug}/" class="tick">{body}</a>')
        else:
            ticks.append(f'<span class="tick">{body}</span>')
    total_hours = sum(b["active"] for b in arc)
    total_commits = sum(b["commits"] for b in arc)
    note = f"{len(arc)} {plural(len(arc), 'week')} on the clock · {commas(total_commits)} commits"
    if total_hours:
        note += f" · {hm(total_hours)}"
    if before:
        earlier = sum(b["commits"] for b in before)
        first = monday_of(before[0]["week"])
        note += (f" · {commas(earlier)} more since {first.strftime('%B')}, "
                 f"before the clock")
    n = max(1, len(ticks))
    return f"""      <div class="arc" style="--tw:calc((100% - {(n - 1) * 2}px) / {n})">{"".join(ticks)}</div>
      <div class="arc-axis"><span>{esc(arc[0]["week"].lower().replace("-w", " · w"))} &rarr; {esc(w["week_id"].lower().replace("-w", " · w"))}</span></div>
      <p class="fignote">{esc(note)}</p>"""


CSS = """
/* The record inherits /style.css: the site's paper, inks, fonts and spacing.
   What follows is only the marks this page adds — the day strata, the hour
   ridge, the project bars and the long arc — drawn in those same inks. */
.strata,.dateline,.legend,.pmin,.n,.ridge-axis,.arc-axis,.dom,.dow{
  font-variant-numeric:tabular-nums; font-feature-settings:'tnum' 1}
/* Each section owns one h2, so style.css's `.section-label:first-of-type`
   would zero every top margin. Space the sections here instead. */
main{padding-top:9vh}
main section{margin-bottom:2rem}
main section .section-label{margin-top:0; margin-bottom:.9rem}
.page-header p .issue{color:#9a958c; letter-spacing:.1em; text-transform:uppercase;
  font-size:.72rem}

/* the week, day by day */
.strata{width:100%; border-collapse:collapse; table-layout:fixed}
.strata thead th{font-size:.62rem; letter-spacing:.1em; text-transform:uppercase;
  color:#9a958c; font-weight:500; text-align:left; padding-bottom:.5rem}
.strata thead th:nth-child(3),.strata thead th:nth-child(4){text-align:right;
  padding-left:.6rem}
.strata th:first-child{width:4.2rem}
.strata td.n,.strata th:nth-child(3){width:4.8rem}
.strata td:last-child,.strata th:last-child{width:3.6rem}
.strata tbody tr{border-top:1px solid #f0ede8}
.strata tbody tr:last-child{border-bottom:1px solid #f0ede8}
.strata th[scope=row]{text-align:left; font-weight:400; vertical-align:middle;
  padding:.6rem .5rem .6rem 0; white-space:nowrap}
.dow{font-size:.62rem; letter-spacing:.12em; text-transform:uppercase; color:#9a958c}
.dom{font-family:'Fraunces',Georgia,serif; font-size:1rem; margin-left:.3rem; color:#3d3a35}
tr.off .dom{color:#9a958c}
.track{padding:.6rem 0; vertical-align:middle}
.band{display:flex; height:14px; min-width:2px}
.band span{box-shadow:inset -1px 0 0 #fafaf8; min-width:1px}
.band span:last-child{box-shadow:none}
.clock{height:2px; margin-top:4px; background:#1a1a1a; min-width:2px}
.rest{font-size:.66rem; letter-spacing:.06em; text-transform:uppercase; color:#9a958c;
  border-top:1px dashed #e0ddd8; padding-top:.35rem}
.strata td.n{text-align:right; font-size:.76rem; color:#3d3a35;
  padding:.6rem 0 .6rem .6rem; white-space:nowrap}
.strata td.n:last-child{color:#6e6e6e}
.legend{list-style:none; display:flex; flex-wrap:wrap; gap:.3rem 1rem; margin-top:1rem;
  font-size:.7rem; color:#6e6e6e}
.sw{display:inline-block; width:9px; height:9px; margin-right:.4rem; vertical-align:baseline}
.sw.rule{height:2px; margin-bottom:3px}

/* the week in a line */
.dateline{display:flex; flex-wrap:wrap; gap:.2rem 1.3rem; border-top:1px solid #1a1a1a;
  border-bottom:1px solid #e0ddd8; padding:.6rem 0; font-size:.7rem; letter-spacing:.06em;
  text-transform:uppercase; color:#6e6e6e}
.dateline b{color:#1a1a1a; font-weight:500}
.reading{font-family:'Fraunces',Georgia,serif; font-size:.98rem; line-height:1.5;
  color:#3d3a35; margin:.7rem 0 0}

/* hours of the day */
.ridge{display:flex; align-items:flex-end; gap:2px; height:72px;
  border-bottom:1px solid #e0ddd8}
.hr{flex:1; min-height:1px}
.ridge-axis{display:flex; gap:2px; margin-top:.3rem}
.ridge-axis span{flex:1; font-size:.6rem; color:#9a958c; letter-spacing:.05em}

/* projects */
.projects{list-style:none}
.projects li{display:flex; align-items:center; gap:.8rem; padding:.22rem 0;
  border-bottom:1px solid #f0ede8}
.pname{width:9.5rem; flex:none; font-size:.85rem; color:#3d3a35; overflow:hidden;
  text-overflow:ellipsis; white-space:nowrap}
.pbar{flex:1; min-width:0}
.pbar b{display:block; height:9px}
.pmin{width:4.4rem; flex:none; text-align:right; font-size:.74rem; color:#6e6e6e}

/* every week so far */
.arc{display:flex; align-items:flex-end; gap:2px; height:54px;
  border-bottom:1px solid #e0ddd8}
.tick{flex:0 0 auto; width:min(22px,var(--tw)); display:flex; align-items:flex-end;
  height:100%; text-decoration:none}
.wk{width:100%; background:#e0ddd8; min-height:2px}
.wk.on{background:#c3bdb1}
.wk.now{background:#1a1a1a}
a.tick:hover .wk{background:#1a1a1a}
.arc-axis{margin-top:.3rem; font-size:.6rem; color:#9a958c; letter-spacing:.08em;
  text-transform:uppercase}

.fignote{font-size:.7rem; line-height:1.5; color:#9a958c; letter-spacing:.04em;
  margin-top:.45rem}
.fignote b{color:#3d3a35; font-weight:500}

/* colophon */
.colophon{border-top:1px solid #e0ddd8; margin-top:1.6rem; padding-top:.9rem;
  display:flex; flex-wrap:wrap; align-items:baseline; gap:.5rem 1.3rem}
.colophon p{font-size:.7rem; line-height:1.6; color:#9a958c; letter-spacing:.03em;
  flex:1 1 20rem}
.ways{display:flex; flex-wrap:wrap; gap:1.2rem}
.ways a{font-size:.75rem; color:#6e6e6e; text-decoration:none}
.ways a:hover{color:#1a1a1a}

@media (max-width:768px){
  main{padding-top:2rem}
  .strata th:first-child{width:3.1rem}
  .strata td.n,.strata th:nth-child(3){width:3.7rem}
  .strata td:last-child,.strata th:last-child{width:2.8rem}
  .strata td.n{font-size:.7rem}
  .dom{font-size:.94rem}
  .band{height:13px}
  .reading{font-size:.94rem}
  .legend{gap:.3rem .8rem; font-size:.66rem}
  .pname{width:7rem; font-size:.78rem}
  .pmin{width:3.8rem; font-size:.7rem}
  .ridge{height:68px; gap:1px}
  .ridge-axis{gap:1px}
  .arc{gap:1px}
  .dateline{gap:.15rem .9rem; font-size:.63rem}
}
"""


def render_page(w: dict, arc: list, issues: set, canonical: str) -> str:
    mon, sun = w["monday"], w["sunday"]
    t = w["totals"]
    span = day_range_phrase(mon, sun)
    title = f"{span} {sun.year} — Kahran Singh"
    desc = (f"A week of building software with Claude, in numbers: "
            f"{hm(t['active'])} at the keyboard, {commas(t['commits'])} commits, "
            f"{commas(t['sessions'])} sessions.")

    models = ", ".join(
        f"{m.replace('claude-', '')} {tokens_short(v)}"
        for m, v in w["models"].most_common() if v
    )

    dateline = [
        f"<span><b>{esc(v)}</b> {label}</span>"
        for v, label, keep in (
            (hm(t["active"]), "on the clock", t["active"]),
            (commas(t["commits"]), "commits", t["commits"]),
            (commas(t["sessions"]), "sessions", t["sessions"]),
            (w["repos"], "repositories", w["repos"]),
            (tokens_short(t["out_tokens"]), "tokens of model output", t["out_tokens"]),
        )
        if keep
    ]

    lines = f"+{commas(t['ins'])} / −{commas(t['del'])} lines"
    if w["bulk_lines"]:
        lines += f" (a bulk import of {commas(w['bulk_lines'])} moved lines set aside)"

    # The section's own link is the active one on every generated page.
    active = f"/{SECTION}/"
    nav = "\n".join(
        '        <a href="{}"{}>{}</a>'.format(
            href, ' class="active"' if href == active else "", esc(label))
        for href, label in NAV_LINKS
    )

    sections = "\n".join(
        f'  <section>\n    <h2 class="section-label">{head}</h2>\n{fig}\n  </section>\n'
        for head, fig in (("By hour", render_ridge(w)),
                          ("By project", render_projects(w)))
        if fig
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{esc(canonical)}">
<meta property="og:title" content="{esc(span)} {sun.year} — Kahran Singh">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:image" content="{OG_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(span)} {sun.year} — Kahran Singh">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{OG_IMAGE}">
<link rel="stylesheet" href="/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400;1,9..144,600&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
    <main>
        <a href="/" class="mobile-header">kahran</a>
        <div class="page-header">
            <h1>{esc(span)} {sun.year}</h1>
            <p><span class="issue">{esc(w['week_id'].lower())}</span> &middot; building software
            with Claude</p>
        </div>

  <section>
    <h2 class="section-label">Day by day</h2>
{render_strata(w)}
    <div class="dateline">{''.join(dateline)}</div>
    <p class="reading">{esc(reading_line(w))}</p>
  </section>

{sections}

  <section>
    <h2 class="section-label">By week</h2>
{render_arc(w, arc, issues)}
  </section>

  <footer class="colophon">
    <p>{esc(lines)} &middot; {esc(models or 'no logged model')} &middot; merge commits set
    aside &middot; {esc(COLOPHON)}</p>
    <div class="ways">
      <a href="/{SECTION}/">every issue</a>
      <a href="/">kahransingh.com</a>
    </div>
  </footer>
    </main>

    <nav>
        <a href="/" class="nav-name">kahran</a>
{nav}
    </nav>
</body>
</html>
"""


# --------------------------------------------------------------------------
# Writing — archive first, refuse to clobber a hand edit
# --------------------------------------------------------------------------

# The complete set of paths this script may write. The issues now live in the
# same directory as a hand-written page (`lately/index.html`) and a hand-written
# note (`lately/README.md`), so the blast radius is asserted here rather than
# left to the calling code being careful.
WRITABLE = re.compile(
    rf"^{SECTION}/(entries\.json|record/index\.html|\d{{4}}-w\d{{2}}/index\.html)$"
)


class Writer:
    def __init__(self, root: Path, archive_dir: Path, dry_run: bool, force: bool):
        self.root = root
        self.archive_dir = archive_dir
        self.dry_run = dry_run
        self.force = force
        self.state_path = archive_dir / "written.json"
        self.state = {}
        if self.state_path.exists():
            try:
                self.state = json.loads(self.state_path.read_text())
            except Exception:
                self.state = {}
        self.touched = []

    @staticmethod
    def _sha(data: str) -> str:
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    def write(self, rel: str, content: str) -> str:
        if not WRITABLE.fullmatch(rel):
            raise SystemExit(f"REFUSING to write {rel}: not one of this script's three paths")
        target = self.root / rel
        verdict = "created"
        if target.exists():
            existing = target.read_text(encoding="utf-8")
            if existing == content:
                verdict = "unchanged"
            else:
                known = self.state.get(rel)
                if known and self._sha(existing) != known and not self.force:
                    raise SystemExit(
                        f"REFUSING to overwrite {rel}: it changed since this script last "
                        f"wrote it, so someone edited it by hand. Reconcile the edit into "
                        f"tools/weekly_record.py, then re-run with --force."
                    )
                verdict = "rewritten" if known else "rewritten (no prior record)"
            if not self.dry_run and verdict != "unchanged":
                self._archive(rel, existing)
        if not self.dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            self.state[rel] = self._sha(content)
        self.touched.append((rel, verdict))
        return verdict

    def _archive(self, rel: str, existing: str) -> None:
        stamp = dt.datetime.now().strftime("%Y%m%dT%H%M%S")
        dest = self.archive_dir / f"{rel.replace('/', '__')}.{stamp}.bak"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(existing, encoding="utf-8")

    def close(self) -> None:
        if self.dry_run:
            return
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        self.state_path.write_text(json.dumps(self.state, indent=1, sort_keys=True) + "\n")


def update_entries(path: Path, w: dict, dry_run: bool) -> dict:
    """Merge one entry into lately/entries.json, leaving every other entry alone."""
    doc = {"schema_version": 1, "generated_at": None, "entries": []}
    if path.exists():
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise SystemExit(f"lately/entries.json is not valid JSON ({exc}); refusing to touch it")
    t = w["totals"]
    entry = {
        "id": f"record-{week_slug(w['week_id'])}",
        "date": w["sunday"].isoformat(),
        "strand": "code",
        "summary": (f"{hm(t['active'])} at the keyboard, {commas(t['commits'])} commits "
                    f"across {w['repos']} repositories, {commas(t['sessions'])} sessions."),
        "link": f"/{SECTION}/{week_slug(w['week_id'])}/",
    }
    entries = [e for e in doc.get("entries", []) if e.get("id") != entry["id"]]
    before = json.dumps(doc.get("entries", []), sort_keys=True)
    entries.append(entry)
    entries.sort(key=lambda e: (e.get("date", ""), e.get("id", "")), reverse=True)
    after = json.dumps(entries, sort_keys=True)
    doc["entries"] = entries
    doc["schema_version"] = doc.get("schema_version", 1)
    if before != after or not doc.get("generated_at"):
        doc["generated_at"] = dt.datetime.now().astimezone().replace(
            microsecond=0).isoformat()
    return doc


def existing_issues(section_dir: Path) -> set:
    """Dated issues already published. `record/` and every hand-written file in
    the section fail the pattern, so only real issues are ever linked."""
    if not section_dir.exists():
        return set()
    return {p.name for p in section_dir.iterdir()
            if p.is_dir() and re.fullmatch(r"\d{4}-w\d{2}", p.name)}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("data", nargs="?",
                    default=str(Path.home() / "Sync/pending-work/coding-record/coding-days.json"),
                    help="path to coding-days.json")
    ap.add_argument("--week", help="ISO week to build, e.g. 2026-W32 (default: newest complete)")
    ap.add_argument("--site-root", help="repo root (default: the parent of tools/)")
    ap.add_argument("--archive-dir", help="where pre-overwrite copies go "
                                          "(default: <data dir>/_archive)")
    ap.add_argument("--dry-run", action="store_true", help="report, write nothing")
    ap.add_argument("--force", action="store_true",
                    help="overwrite even if a target changed since the last run")
    args = ap.parse_args(argv)

    data_path = Path(args.data).expanduser()
    if not data_path.exists():
        raise SystemExit(f"no data file at {data_path}")
    payload = json.loads(data_path.read_text(encoding="utf-8"))
    days = payload.get("days") or {}

    root = Path(args.site_root).expanduser() if args.site_root else Path(__file__).resolve().parent.parent
    archive = (Path(args.archive_dir).expanduser() if args.archive_dir
               else data_path.parent / "_archive")
    if not args.dry_run:
        try:
            archive.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise SystemExit(f"cannot create archive dir {archive}: {exc}")

    week_id = pick_week(days, dt.date.today(), args.week)
    w = aggregate_week(days, week_id)
    if not w["totals"]["active"] and not w["totals"]["commits"]:
        raise SystemExit(f"{week_id} has no recorded activity; refusing to publish an empty issue")
    arc = long_arc(days, week_id)
    issues = existing_issues(root / SECTION) | {week_slug(week_id)}

    slug = week_slug(week_id)
    dated_url = f"https://kahransingh.com/{SECTION}/{slug}/"
    # One canonical for both copies: /lately/record/ is a door, the dated URL is
    # the address. Google sees one page, not two.
    page = render_page(w, arc, issues, canonical=dated_url)

    writer = Writer(root, archive, args.dry_run, args.force)
    writer.write(f"{SECTION}/{slug}/index.html", page)
    writer.write(f"{SECTION}/record/index.html", page)

    entries_path = root / SECTION / "entries.json"
    doc = update_entries(entries_path, w, args.dry_run)
    writer.write(f"{SECTION}/entries.json", json.dumps(doc, indent=2) + "\n")
    writer.close()

    t = w["totals"]
    print(f"week {week_id}  {w['monday']} -> {w['sunday']}")
    print(f"  {hm(t['active'])} on the clock, {hm(t['work'])} of project time, "
          f"{t['commits']} commits in {w['repos']} repos, {t['sessions']} sessions")
    print(f"  named projects: " + ", ".join(o["label"] for o in w["projects"]))
    for rel, verdict in writer.touched:
        print(f"  {verdict:>26}  {rel}")
    if args.dry_run:
        print("  (dry run — nothing written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
