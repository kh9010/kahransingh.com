#!/usr/bin/env python3
"""Build the public weekly coding record for kahransingh.com.

Reads the private coding-days.json extract, aggregates the most recent COMPLETE
Monday-Sunday week, and writes exactly three paths inside the site:

    record/<iso-week>/index.html   the permanent dated issue
    record/index.html              a copy of the newest issue, canonical -> dated
    lately/entries.json            one entry per issue, merged in place

It writes nothing else. It cannot reach index.html, any <nav>, sitemap.xml or
style.css, so the recurring job can never clobber a hand-edited page.

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
    python3 tools/weekly_record.py DATA --week 2026-W32     # rebuild one issue
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
    "Generated once a week from session logs and commit metadata on my own "
    "machines. It carries counts, durations and project names and nothing "
    "else: no commit messages, no file names, no calendar, no message text. "
    "The page is static HTML with no data embedded behind it — what is on "
    "it is all of it."
)

PALETTE = ["#008a7a", "#b8790a", "#414f9e", "#ae3c72"]
NEUTRAL_UNNAMED = "#8d887e"
NEUTRAL_OTHER = "#c6c1b7"
EMBER = "#c8431b"

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
    """Pale paper -> ember, a single-hue sequential step for magnitude."""
    t = max(0.0, min(1.0, t)) ** 0.62
    lo, hi = (0xEC, 0xDF, 0xD8), (0xC8, 0x43, 0x1B)
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

def reading_paragraph(w: dict) -> str:
    t = w["totals"]
    worked = [d for d in w["days"] if d["active_min"] > 0]
    hours = int(round(t["active"] / 60))
    bits = []

    if worked:
        bits.append(
            f"{spell(hours).capitalize()} {plural(hours, 'hour')} at the keyboard across "
            f"{spell(len(worked))} of seven days."
        )
    else:
        bits.append("No sessions at the keyboard this week.")

    claude_share = pct(t["claude"], t["commits"])
    if t["commits"]:
        clause = (f"{commas(t['commits'])} commits landed in "
                  f"{spell(w['repos'])} repositories")
        if claude_share >= 60:
            clause += f", {claude_share:.0f}% of them co-authored with Claude"
        bits.append(clause + ".")

    best = max(w["days"], key=lambda d: d["longest_focus_min"])
    if best["longest_focus_min"] >= 45:
        bits.append(
            f"The longest unbroken stretch was {spoken_duration(best['longest_focus_min'])}, "
            f"on {best['date'].strftime('%A')}."
        )

    rest = [d for d in w["days"] if d["active_min"] == 0]
    if rest:
        r = rest[0]
        extras = []
        if r["commits"] and worked:
            n = sum(d["commits"] for d in rest)
            extras.append(f"{spell(n) if n < 21 else commas(n)} commits still landed")
        if sum(d["mini_msgs"] for d in rest):
            extras.append(
                f"the always-on mini logged {commas(sum(d['mini_msgs'] for d in rest))} "
                "messages of its own"
            )
        if extras:
            if worked:
                names = ", ".join(d["date"].strftime("%A") for d in rest)
                bits.append(f"{names} had no sessions at all; "
                            + " and ".join(extras) + ".")
            else:
                joined = " and ".join(extras)
                bits.append(joined[0].upper() + joined[1:] + ".")

    return " ".join(bits)


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
    legend += (f'<li class="sep"><span class="sw rule" style="background:{EMBER}">'
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
      <p class="note">Every logged event of the week, stacked by the hour it happened in.
      The busiest hour was <b>{peak_hour:02d}:00</b>, with {commas(peak)} events across the seven days.</p>"""


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
      <p class="note">These sum to {esc(hm(t["work"]))} against {esc(hm(t["active"]))} on the
      clock. Two Claude windows running at once make two minutes of work inside one minute of
      the day; both numbers are true.</p>"""


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
            ticks.append(f'<a href="/record/{slug}/" class="tick">{body}</a>')
        else:
            ticks.append(f'<span class="tick">{body}</span>')
    total_hours = sum(b["active"] for b in arc)
    total_commits = sum(b["commits"] for b in arc)
    where = "on the clock so far" if total_hours else "recorded so far"
    note = (f"{spell(len(arc)).capitalize()} {plural(len(arc), 'week')} {where} · "
            f"{commas(total_commits)} commits")
    note += f" · {hm(total_hours)} at the keyboard." if total_hours else "."
    if before:
        earlier = sum(b["commits"] for b in before)
        first = monday_of(before[0]["week"])
        note += (f" The hour-by-hour record starts here, with the session logs. The commits "
                 f"reach further back — {commas(earlier)} of them since "
                 f"{first.strftime('%B')}, worked without a clock running.")
    n = max(1, len(ticks))
    return f"""      <div class="arc" style="--tw:calc((100% - {(n - 1) * 2}px) / {n})">{"".join(ticks)}</div>
      <div class="arc-axis">{esc(arc[0]["week"].lower().replace("-w", " · w"))} &rarr; {esc(w["week_id"].lower().replace("-w", " · w"))}</div>
      <p class="note">{note}</p>"""


CSS = """
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --paper:#fafaf8; --ink:#1a1a1a; --soft:#3d3a35; --muted:#6e6e6e;
  --faint:#9a958c; --rule:#e0ddd8; --hair:#eeebe5; --ember:#c8431b;
}
html{-webkit-text-size-adjust:100%}
body{
  background:var(--paper); color:var(--ink);
  font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,sans-serif;
  font-size:17px; line-height:1.7; -webkit-font-smoothing:antialiased;
}
.wrap{max-width:themax; margin:0 auto; padding:0 1.6rem}
b,strong{font-weight:500}
.mono,.n,.dow,.eyebrow,h2,.ridge-axis,.arc-axis,.legend,.pmin,.dateline{
  font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;
  font-variant-numeric:tabular-nums; font-feature-settings:'tnum' 1;
}

/* masthead */
.mast{border-bottom:1px solid var(--ink); margin-top:2.2rem}
.mast .wrap{display:flex; align-items:baseline; gap:1rem; padding-bottom:.55rem}
.wordmark{font-family:'Fraunces',Georgia,serif; font-style:italic; font-size:1.25rem;
  color:var(--ink); text-decoration:none; letter-spacing:-.01em}
.wordmark:hover{color:var(--ember)}
.mast .issue{margin-left:auto; font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:.68rem; letter-spacing:.14em; text-transform:uppercase; color:var(--muted);
  white-space:nowrap}

/* lede */
.lede{padding:2.6rem 0 1.4rem}
.eyebrow{font-size:.66rem; letter-spacing:.16em; text-transform:uppercase;
  color:var(--ember); margin-bottom:.9rem}
h1{font-family:'Fraunces',Georgia,serif; font-weight:300; letter-spacing:-.025em;
  font-size:clamp(2.15rem,7vw,3.3rem); line-height:1.06}
h1 .yr{color:var(--faint); font-style:italic}

/* the week */
section{padding:0 0 2.9rem}
h2{font-size:.66rem; letter-spacing:.16em; text-transform:uppercase; color:var(--muted);
  font-weight:400; padding-bottom:.5rem; border-bottom:1px solid var(--rule);
  margin-bottom:1.3rem}
.strata{width:100%; border-collapse:collapse; table-layout:fixed}
.strata thead th{font-size:.6rem; letter-spacing:.11em; text-transform:uppercase;
  color:var(--faint); font-weight:400; text-align:left; padding-bottom:.5rem;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.strata thead th:nth-child(3),.strata thead th:nth-child(4){text-align:right;
  padding-left:.7rem}
.strata th:first-child{width:4.4rem}
.strata td.n,.strata th:nth-child(3){width:5.4rem}
.strata td:last-child,.strata th:last-child{width:4.4rem}
.strata tbody tr{border-top:1px solid var(--hair)}
.strata tbody tr:last-child{border-bottom:1px solid var(--hair)}
.strata th[scope=row]{text-align:left; font-weight:400; vertical-align:middle;
  padding:.62rem .5rem .62rem 0; white-space:nowrap}
.dow{font-size:.62rem; letter-spacing:.13em; text-transform:uppercase; color:var(--faint)}
.dom{font-family:'Fraunces',Georgia,serif; font-size:1.02rem; margin-left:.34rem;
  color:var(--soft)}
tr.off .dom{color:var(--faint)}
.track{padding:.62rem 0; vertical-align:middle}
.band{display:flex; height:15px; min-width:2px}
.band span{box-shadow:inset -2px 0 0 var(--paper); min-width:1px}
.band span:last-child{box-shadow:none}
.clock{height:3px; margin-top:3px; background:var(--ember); min-width:2px}
.rest{font-size:.66rem; letter-spacing:.08em; text-transform:uppercase; color:var(--faint);
  border-top:1px dashed var(--rule); padding-top:.36rem;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.strata td.n{text-align:right; font-size:.76rem; color:var(--soft); padding:.62rem 0 .62rem .6rem;
  white-space:nowrap}
.strata td.n:last-child{color:var(--muted)}
.legend{list-style:none; display:flex; flex-wrap:wrap; gap:.35rem 1.05rem; margin-top:1.05rem;
  font-size:.67rem; letter-spacing:.04em; color:var(--muted)}
.sw{display:inline-block; width:9px; height:9px; margin-right:.4rem; vertical-align:baseline}
.sw.rule{height:3px; margin-bottom:2px}

/* dateline */
.dateline{border-top:1px solid var(--ink); border-bottom:1px solid var(--rule);
  padding:.62rem 0; margin:0; display:flex; flex-wrap:wrap; gap:.2rem 1.4rem;
  font-size:.68rem; letter-spacing:.09em; text-transform:uppercase; color:var(--muted)}
.dateline b{color:var(--ink); font-weight:500; letter-spacing:.04em}
.reading{font-family:'Fraunces',Georgia,serif; font-size:1.14rem; line-height:1.66;
  color:var(--soft); max-width:38rem; margin:1.5rem 0 1.9rem}

/* ridge */
.ridge{display:flex; align-items:flex-end; gap:2px; height:88px;
  border-bottom:1px solid var(--rule)}
.hr{flex:1; min-height:1px}
.ridge-axis{display:flex; gap:2px; margin-top:.3rem}
.ridge-axis span{flex:1; font-size:.6rem; color:var(--faint); letter-spacing:.06em}

/* projects */
.projects{list-style:none}
.projects li{display:flex; align-items:center; gap:.85rem; padding:.32rem 0;
  border-bottom:1px solid var(--hair)}
.pname{width:11rem; flex:none; font-size:.85rem; color:var(--soft);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.pbar{flex:1; min-width:0}
.pbar b{display:block; height:9px}
.pmin{width:4.6rem; flex:none; text-align:right; font-size:.74rem; color:var(--muted)}

/* long arc */
.arc{display:flex; align-items:flex-end; gap:2px; height:54px;
  border-bottom:1px solid var(--rule)}
.tick{flex:0 0 auto; width:min(22px,var(--tw)); display:flex; align-items:flex-end;
  height:100%; text-decoration:none}
.wk{width:100%; background:var(--rule); min-height:2px}
.wk.on{background:#b9b2a4}
.wk.now{background:var(--ember)}
a.tick:hover .wk{background:var(--ember)}
.arc-axis{margin-top:.35rem; font-size:.6rem; color:var(--faint);
  letter-spacing:.08em; text-transform:uppercase}

.note{font-size:.79rem; line-height:1.65; color:var(--muted); margin-top:.95rem;
  max-width:36rem}
.note b{color:var(--soft)}

/* colophon */
.colophon{border-top:1px solid var(--ink); padding:1.5rem 0 4.5rem; margin-top:.6rem}
.colophon p{font-size:.82rem; line-height:1.72; color:var(--muted); max-width:36rem}
.colophon p+p{margin-top:.75rem}
.ways{display:flex; flex-wrap:wrap; gap:1.4rem; margin-top:1.5rem}
.ways a{font-size:.82rem; color:var(--muted); text-decoration:none;
  border-bottom:1px solid var(--rule); padding-bottom:1px}
.ways a:hover{color:var(--ink); border-color:var(--ember)}
a:focus-visible,.tick:focus-visible{outline:2px solid var(--ember); outline-offset:3px}

@media (max-width:620px){
  body{font-size:16px}
  .wrap{padding:0 1.15rem}
  .mast{margin-top:1.2rem}
  .mast .issue{font-size:.6rem; letter-spacing:.1em}
  .lede{padding:1.5rem 0 .9rem}
  .strata th:first-child{width:3.1rem}
  .strata td.n,.strata th:nth-child(3){width:3.7rem}
  .strata td:last-child,.strata th:last-child{width:2.8rem}
  .strata td.n{font-size:.7rem}
  .dom{font-size:.94rem}
  .band{height:13px}
  .reading{font-size:1.05rem}
  .legend{gap:.3rem .8rem; font-size:.63rem}
  .pname{width:7.6rem; font-size:.78rem}
  .pmin{width:3.9rem; font-size:.7rem}
  .ridge{height:70px; gap:1px}
  .ridge-axis{gap:1px}
  .arc{gap:1px}
  .dateline{gap:.15rem .9rem; font-size:.63rem}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
"""


def render_page(w: dict, arc: list, issues: set, canonical: str) -> str:
    mon, sun = w["monday"], w["sunday"]
    t = w["totals"]
    span = day_range_phrase(mon, sun)
    title = f"The Record · {span} {sun.year} — Kahran Singh"
    desc = (f"A week of building software with Claude, in numbers: "
            f"{hm(t['active'])} at the keyboard, {commas(t['commits'])} commits, "
            f"{commas(t['sessions'])} sessions.")
    dated = f"https://kahransingh.com/record/{week_slug(w['week_id'])}/"

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
        lines += (f", not counting a bulk import of {commas(w['bulk_lines'])} lines "
                  "that was moved rather than written")

    css = CSS.replace("themax", "812px")

    sections = "\n".join(
        f"  <section>\n    <h2>{head}</h2>\n{fig}\n  </section>\n"
        for head, fig in (("When the work happened", render_ridge(w)),
                          ("Where the hours went", render_projects(w)))
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
<meta property="og:title" content="The Record — {esc(span)} {sun.year}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:image" content="{OG_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="The Record — {esc(span)} {sun.year}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{OG_IMAGE}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&display=swap" rel="stylesheet">
<style>{css}</style>
</head>
<body>
<header class="mast">
  <div class="wrap">
    <a class="wordmark" href="/">kahran</a>
    <span class="issue">the record · {esc(w['week_id'].lower())}</span>
  </div>
</header>

<main class="wrap">
  <div class="lede">
    <p class="eyebrow">a week spent building software with claude</p>
    <h1>Week of {esc(span)} <span class="yr">{sun.year}</span></h1>
  </div>

  <section>
    <h2>The week, layer by layer</h2>
{render_strata(w)}
    <p class="reading">{esc(reading_paragraph(w))}</p>
    <div class="dateline">{''.join(dateline)}</div>
  </section>

{sections}

  <section>
    <h2>The record so far</h2>
{render_arc(w, arc, issues)}
  </section>

  <footer class="colophon">
    <p>{esc(COLOPHON)}</p>
    <p>This week: {esc(lines)}. Model output came from {esc(models or 'no logged model')}.
    Merge commits are set aside throughout. Time on the clock is measured from real
    session activity, not from the first and last events of the day.</p>
    <div class="ways">
      <a href="/lately/">every issue</a>
      <a href="/">kahransingh.com</a>
    </div>
  </footer>
</main>
</body>
</html>
"""


# --------------------------------------------------------------------------
# Writing — archive first, refuse to clobber a hand edit
# --------------------------------------------------------------------------

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
        "link": f"/record/{week_slug(w['week_id'])}/",
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


def existing_issues(record_dir: Path) -> set:
    if not record_dir.exists():
        return set()
    return {p.name for p in record_dir.iterdir()
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
    issues = existing_issues(root / "record") | {week_slug(week_id)}

    slug = week_slug(week_id)
    dated_url = f"https://kahransingh.com/record/{slug}/"
    dated_html = render_page(w, arc, issues, canonical=dated_url)
    latest_html = render_page(w, arc, issues, canonical=dated_url)  # same canonical: /record/ is a door

    writer = Writer(root, archive, args.dry_run, args.force)
    writer.write(f"record/{slug}/index.html", dated_html)
    writer.write("record/index.html", latest_html)

    entries_path = root / "lately" / "entries.json"
    doc = update_entries(entries_path, w, args.dry_run)
    writer.write("lately/entries.json", json.dumps(doc, indent=2) + "\n")
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
