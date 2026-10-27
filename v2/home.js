/* kahransingh.com — v2 home.
   One photograph and one poem per calendar day, chosen by hashing the date, so
   a day that has happened never reshuffles.

   The wall is five ideas, built from the IDEAS table below — the one place the
   map from an idea to the tools under it lives. v2/flow.js reads the same five
   names for the drawing. index.html carries a <noscript> copy of the same five
   lines so the wall still says something with this file absent. */

(function () {
  'use strict';

  var LAUNCH = '2026-09-21';          // day one; the walk back stops here
  var ZONE   = 'America/New_York';    // the day turns over where Kahran is

  /* ------------------------------------------------------------ the map ---

     Kahran, 2026-09-22: "we don't need every single box on this home page …
     so maybe there's a big idea of context that subsumes some of these sub
     boxes." Sixteen boxes became five ideas; every one of the sixteen tools
     still has a home, as `parts`. Re-cut the system by editing this table and
     nothing else.

       name   the idea, and what the box is called
       hue    its pigment class — one of the five, same five as before
       parts  the tools under it, canonical names (flow.js quotes these too)
       line   the quiet second line on the tile: the same parts, short
       detail the reading panel: overview, one explanation per part, distinction
       href   null until the idea has a page of its own */
  var IDEAS = [
    {
      name:  'Context',
      hue:   'tile--catching',
      parts: ['Raw store', 'Voice & WhatsApp capture', 'Movement'],
      detail: {
        "intro": "A conversation, a meeting, or a change of city can change what is useful next. Context gives the other tools something to work from without asking for the day to be explained again.",
        "tools": [
          "Keeps mail, chats, meetings, sleep, coding activity and reading in a shared record. Earlier entries remain available, so a tool can look back rather than work from the latest summary alone.",
          "Turns a spoken thought into text and keeps it alongside messages. The miners can return to those words later to look for a commitment or an idea worth keeping.",
          "Weighs explicit updates, calendar events, bookings and timezone clues to estimate where the day is happening. Home or away can change what a useful day plan or workout looks like."
        ],
        "boundary": "Records and inferences are different things. A captured message is evidence; a place inferred from several clues still carries uncertainty."
      },
      line:  'raw store · capture · movement',
      href:  '/context/'
    },
    {
      name:  'Keeping track',
      hue:   'tile--remembering',
      parts: ['The miners', 'The judge', 'The Curator', 'The sparks garden'],
      detail: {
        "intro": "Mentioning something is not the same as committing to it. These tools look for things worth keeping, check them, and give obligations and unfinished ideas different homes.",
        "tools": [
          "Read voice notes, conversations and meetings for possible commitments and ideas. They propose things to keep rather than treating every passing thought as a new task.",
          "Reviews the miners’ proposals before they reach the pending list or sparks garden. Finding a candidate and accepting it are separate steps.",
          "Works with the pending list and prepares check-in questions. Open commitments also feed the now brain, so a suggested next move can come from work already taken on.",
          "Keeps ideas apart from obligations. A thought can be saved and revisited without needing a deadline or pretending to be the next thing to do."
        ],
        "boundary": "Keeping an idea does not make it a task. Keeping a task does not make it urgent. The distinction is what keeps remembering from becoming another source of work."
      },
      line:  'miners · judge · Curator · sparks garden',
      href:  null
    },
    {
      name:  'Staying up to date',
      hue:   'tile--knowing',
      parts: ['Mail triage', 'The weekly record'],
      detail: {
        "intro": "Mail asks what needs attention now; a weekly record asks what actually happened. These tools do different kinds of reading, without making every incoming message another obligation.",
        "tools": [
          "Distinguishes personal correspondence from newsletters, using the record of correspondents as context. The mail card and inbox view make that sorting available to read.",
          "Turns an extract of coding activity into the public /lately page. It is a look back at the work, not a transcript of private conversations or a copy of the inbox."
        ],
        "boundary": "The two outputs serve different moments: sorting what arrived, and looking back at what was made. Neither is meant to be another stream of reminders."
      },
      line:  'mail triage · weekly record',
      href:  null
    },
    {
      name:  'Topically suggesting',
      hue:   'tile--public',
      parts: ['The now brain', 'The workout planner', 'Noticings', 'Travel days'],
      detail: {
        "intro": "The useful suggestion depends on the day. A next step, a workout, an old thought and a flight-day plan need different inputs; putting them together does not make them interchangeable.",
        "tools": [
          "Brings context, calendar information and pending work together to offer a next move. It is there on the page or when asked for help getting unstuck.",
          "Uses the home-or-away reading to help plan a session that fits the day. Today’s workout is available on request; the weekly plan has a separate review path for the coach.",
          "Brings selected material from the past back into view. The brief can carry a short line, with a longer page when the thought is worth staying with.",
          "Uses the flight and bedtime information from daily planning to prepare flight-day messages. The point is a plan for that particular day, not a generic travel checklist."
        ],
        "boundary": "A suggestion is an offer, not another commitment. These tools help choose a next move; they do not turn every available possibility into a list."
      },
      line:  'now brain · workout planner · noticings · travel days',
      href:  null
    },
    {
      name:  'Self-healing',
      hue:   'tile--alive',
      parts: ['Samwise', 'The repairer', 'The health page'],
      detail: {
        "intro": "A quiet system can be working, or it can have stopped. These tools check for missing or unhealthy work, investigate failures, and make the results available to inspect.",
        "tools": [
          "Compares registered jobs with their run records to spot stale or unhealthy work. Those checks give the repairer and health page a shared view of what needs attention.",
          "Reads the health results, investigates broken jobs and attempts repairs. A repair attempt is not itself proof that the job is working again.",
          "Makes the health results visible when opened. It is a place to inspect what the checks found, rather than having to infer system health from silence."
        ],
        "boundary": "Monitoring has limits: a job needs a check and a run record to be visible here. Self-healing is a recovery path, not a promise that nothing breaks."
      },
      line:  'Samwise · repairer · health page',
      href:  null
    }
  ];

  /* The lean: three across, then two. Change these two numbers and the block
     re-cuts itself; home.css shears row 1 and centres it under row 0. */
  var WALL_ROWS = [3, 2];

  /* ------------------------------------------------------------- the day -- */

  function todayISO() {
    var p = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).forEach(function (part) { p[part.type] = part.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }

  function toUTC(iso) {
    var b = iso.split('-');
    return Date.UTC(+b[0], +b[1] - 1, +b[2]);
  }

  function fromUTC(ms) {
    return new Date(ms).toISOString().slice(0, 10);
  }

  function shift(iso, days) { return fromUTC(toUTC(iso) + days * 86400000); }

  function isRealDate(iso) {
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) && fromUTC(toUTC(iso)) === iso;
  }

  /* ISO dates sort as strings, so the clamp is plain comparison. */
  function clampDay(iso, today) {
    if (!iso || !isRealDate(iso)) return today;
    if (iso < LAUNCH) return LAUNCH;
    if (iso > today) return today;
    return iso;
  }

  function longDate(iso) {
    var d = new Date(toUTC(iso)), p = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).formatToParts(d).forEach(function (part) { p[part.type] = part.value; });
    return p.weekday + ', ' + p.day + ' ' + p.month + ' ' + p.year;
  }

  /* ------------------------------------------------------------ the pick -- */

  /* cyrb53 — a small, fast, well-mixed 53-bit string hash. Deterministic, so
     the same date always lands on the same photograph and the same poem. */
  function cyrb53(str, seed) {
    var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed, i, ch;
    for (i = 0; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  function photoFor(iso, n) { return cyrb53(iso, 1) % n; }

  /* Two independent draws from the same date. The poem's salt is not arbitrary:
     of the first 512 salts it is the one that brings all 89 poems into view
     soonest — every poem has had a day within 208 days of launch — while
     staying evenly spread. Change it and poems start waiting years for a turn. */
  function poemFor(iso, n) { return cyrb53(iso + '/poem', 465) % n; }

  /* ----------------------------------------------------------- the poem --- */

  function norm(s) {
    return String(s).replace(/[^0-9a-z]+/gi, ' ').trim().toLowerCase();
  }

  /* data.json was scraped from the poem pages, so every poem carries a trailing
     "← poems" crumb and most repeat their own title as the first line. Neither
     belongs in the poem. */
  function stanzasOf(poem) {
    var st = poem.stanzas.slice(), lines, rest;

    while (st.length && /^[←→\s]*poems?$/i.test(st[st.length - 1].trim())) st.pop();

    if (st.length) {
      lines = st[0].split('\n');
      if (norm(lines[0]) === norm(poem.title)) {
        lines.shift();
        rest = lines.join('\n').trim();
        if (rest) st[0] = rest; else st.shift();
      }
    }

    return st.map(function (s) {
      return s.split('\n').map(function (l) { return l.trim(); })
              .filter(function (l) { return l.length; });
    }).filter(function (lines) { return lines.length; });
  }

  /* ---------------------------------------------------------- the render -- */

  var el = {
    opening: document.getElementById('opening'),
    photo:   document.getElementById('photo'),
    caption: document.getElementById('caption'),
    title:   document.getElementById('poem-link'),
    body:    document.getElementById('poem-body'),
    labelTitle: document.getElementById('poem-label-title'),
    date:    document.getElementById('day-date'),
    back:    document.getElementById('day-back'),
    fwd:     document.getElementById('day-fwd')
  };

  var data = null;
  var days = null;              // v2/days.json — frozen daily picks, may be null/empty
  var today = todayISO();
  var current = null;
  var lastDrawnKey = null;      // iso+poem+photo of what's on screen, so a re-evaluation
                                 // (live weather landing, scores loading) only touches the
                                 // DOM when the chosen pair actually changes — never a flicker.

  /* The frozen pick for iso, if the mini has picked one, else null. A pick
     names a poem slug / photo src; either half being unrecognised (data.json
     changed shape, a stale slug) falls back to the hash exactly as if there
     were no pick at all — never a broken render. */
  function pickFor(iso) {
    var entry = days && days.days && days.days[iso];
    if (!entry) return null;
    var photo = null, poem = null;
    if (entry.photo) {
      photo = data.photos.filter(function (p) { return p.src === entry.photo; })[0] || null;
    }
    if (entry.poem) {
      poem = data.poems.filter(function (p) { return p.slug === entry.poem; })[0] || null;
    }
    if (!photo || !poem) return null;
    return { photo: photo, poem: poem };
  }

  /* The pick for iso, in order: window.kahranPick's live/vector pick (today:
     from the current weather reading; past days: from days.json's stored
     "why" vector), then the frozen days.json pick, then the date hash. Any
     layer that can't answer (weather not landed yet, scores still loading,
     no days.json entry) falls through to the next — the page is never blank
     and never shows a broken pair. */
  function resolvePick(iso) {
    if (window.kahranPick && typeof window.kahranPick.pickFor === "function") {
      var live = null;
      try {
        live = window.kahranPick.pickFor(iso, iso === today);
      } catch (e) {
        live = null;
      }
      if (live && live.photo && live.poem) {
        var photo = data.photos.filter(function (p) { return p.src === live.photo; })[0];
        var poem  = data.poems.filter(function (p) { return p.slug === live.poem; })[0];
        if (photo && poem) return { photo: photo, poem: poem };
      }
    }
    var stored = pickFor(iso);
    if (stored) return stored;
    return {
      photo: data.photos[photoFor(iso, data.photos.length)],
      poem: data.poems[poemFor(iso, data.poems.length)]
    };
  }

  function draw(iso, animate) {
    el.date.textContent = longDate(iso);
    el.back.disabled = iso <= LAUNCH;
    el.fwd.disabled  = iso >= today;

    if (!data) return;

    var picked = resolvePick(iso);
    var photo = picked.photo;
    var poem  = picked.poem;

    var key = iso + '|' + poem.slug + '|' + photo.src;
    if (key === lastDrawnKey) return;   // same day, same pair already on screen
    lastDrawnKey = key;

    el.photo.src = photo.src;
    el.photo.alt = photo.alt || '';
    el.caption.textContent = photo.caption || '';

    el.title.textContent = poem.title;
    el.title.href = '/poems/' + poem.slug + '.html';
    /* the label IS the poem's title, set small — so growing it reads as the
       same thing arriving, not as one thing replacing another */
    if (el.labelTitle) el.labelTitle.textContent = poem.title;

    el.body.textContent = '';
    stanzasOf(poem).forEach(function (lines) {
      var p = document.createElement('p');
      p.className = 'stanza';
      lines.forEach(function (line) {
        var span = document.createElement('span');
        span.className = 'line';
        span.textContent = line;
        p.appendChild(span);
      });
      el.body.appendChild(p);
    });

    if (animate) {
      el.opening.classList.remove('turned');
      void el.opening.offsetWidth;          // restart the fade
      el.opening.classList.add('turned');
    }
  }

  function goTo(iso, animate, writeHash) {
    current = clampDay(iso, today);
    if (writeHash) {
      history.replaceState(null, '', '#' + current);
    }
    draw(current, animate);
  }

  el.back.addEventListener('click', function () { step(-1); });
  el.fwd.addEventListener('click',  function () { step(1); });

  function step(days) {
    var next = clampDay(shift(current, days), today);
    if (next === current) return;
    location.hash = next;                    // linkable, and the back button works
  }

  window.addEventListener('hashchange', function () {
    var asked = location.hash.replace(/^#/, '');
    if (asked === 'flow') return;             /* not a day — v2/flow.js owns it */
    var iso = clampDay(asked, today);
    if (iso === current) {
      /* Asking for a day outside the range lands on one already shown. Still
         rewrite the hash, or the address bar keeps advertising a day the page
         is not showing — and that wrong URL is what gets copied and shared. */
      if (asked !== iso) history.replaceState(null, '', '#' + iso);
      return;
    }
    goTo(iso, true, iso !== asked);
  });

  /* ------------------------------------------------------------- the wall --

     Five boxes, built from IDEAS. An idea with an href is launched: full
     colour, a link, and it lifts on hover. The other four are dim until you
     touch them, which is the whole state model — there is no third thing a
     box can be. */

  (function wall() {
    var block = document.getElementById('wall-block');
    if (!block) return;

    var i = 0;
    WALL_ROWS.forEach(function (n, r) {
      var row = document.createElement('ul');
      row.className = 'wall-row';
      row.style.setProperty('--r', r);
      for (var k = 0; k < n && i < IDEAS.length; k++, i++) {
        row.appendChild(tileFor(IDEAS[i]));
      }
      block.appendChild(row);
    });

    function tileFor(idea) {
      var li = document.createElement('li');
      li.className = 'tile ' + idea.hue + (idea.href ? ' tile--live' : '');
      var trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'idea-trigger';
      trigger.setAttribute('aria-label', idea.name);
      li.appendChild(trigger);

      var name = document.createElement('span');
      name.className = 'tile-name';
      name.textContent = idea.name;
      trigger.appendChild(name);

      /* The parts, so the sixteen are still visible without sixteen tiles. */
      var parts = document.createElement('span');
      parts.className = 'tile-parts';
      parts.textContent = idea.line;
      trigger.appendChild(parts);

      return li;
    }
  })();

  /* ----------------------------------------------------------- the busy -- */

  /* One switch shared by both animations. While anything is moving the frosted
     tiles go solid (see .tools-layer.is-busy in home.css): re-blurring the
     photograph behind five tiles every frame is the most expensive thing here,
     and Safari feels it most. Counted, because the poem and the diagram can
     move at the same time; the frost comes back a beat after the last one
     stops so a quick second pass does not flicker it on and off. */
  (function busy() {
    var layer = document.querySelector('.tools-layer');
    var held = 0, off = null;
    window.kahranBusy = {
      hold: function () {
        if (!layer) return;
        held++;
        clearTimeout(off);
        layer.classList.add('is-busy');
      },
      release: function () {
        if (!layer) return;
        held = Math.max(0, held - 1);
        if (held) return;
        clearTimeout(off);
        off = setTimeout(function () { if (!held) layer.classList.remove('is-busy'); }, 120);
      }
    };
  })();

  /* ------------------------------------------- this moment's poem ------- */

  /* At rest the column carries the label alone. Hover (after a short intent
     delay, so crossing the column does not trigger it), tap, or keyboard focus
     brings the poem forward; moving the pointer off the column sends it back.
     The poem only joins the layout while it is on screen, which is what keeps
     the page one screen tall at rest however long the poem is. */
  (function reveal() {
    var hold  = document.getElementById('poem-hold');
    var label = document.getElementById('poem-label');
    if (!hold || !label) return;

    var IN = 700, OUT = 450, TAP = 180;
    var p = 0, target = 0, raf = null, last = 0, latched = false, downAt = 0;

    /* smooth at both ends, so starting and arriving are both soft */
    function ease(t) { return t * t * (3 - 2 * t); }

    function apply() {
      hold.style.setProperty('--p', ease(p).toFixed(4));
      hold.classList.toggle('is-on', p > 0.92);
      label.setAttribute('aria-expanded', p > 0.5 ? 'true' : 'false');
    }

    function frame(now) {
      var dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      var step = dt / (target > p ? IN : OUT);
      p = target > p ? Math.min(target, p + step) : Math.max(target, p - step);
      apply();
      if (p !== target) { raf = requestAnimationFrame(frame); return; }
      raf = null; last = 0;                       /* idle: nothing is requested */
      if (p === 0) hold.classList.remove('is-live');
      if (window.kahranBusy) window.kahranBusy.release();
    }

    /* One target, one progress. Reversing mid-flight just changes the target;
       the value carries on from where it is rather than snapping. */
    function to(v) {
      if (v === target) return;
      target = v;
      if (v > 0) hold.classList.add('is-live');
      if (!raf) { last = 0; if (window.kahranBusy) window.kahranBusy.hold(); raf = requestAnimationFrame(frame); }
    }

    var canHover = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
    if (canHover) {
      hold.addEventListener('mouseenter', function () { if (!latched) to(1); });
      hold.addEventListener('mouseleave', function () { if (!latched) to(0); });
    }

    /* Press and hold reads it. But holding a phone still long enough to read a
       poem is a genuinely awkward ask, so a quick tap latches it open instead
       and the next tap anywhere closes it. */
    label.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      downAt = Date.now();
      to(1);
    });
    function release(e) {
      if (e && e.pointerType === 'mouse') return;
      if (Date.now() - downAt < TAP) { latched = !latched; to(latched ? 1 : 0); }
      else { latched = false; to(0); }
    }
    label.addEventListener('pointerup', release);
    label.addEventListener('pointercancel', release);

    label.addEventListener('focus', function () {
      if (!label.matches || label.matches(':focus-visible')) to(1);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { latched = false; to(0); }
    });
    document.addEventListener('pointerdown', function (e) {
      if (latched && !hold.contains(e.target)) { latched = false; to(0); }
    });

    apply();
  })();

  /* ---------------------------------------------------------- the details --
     A reading panel, not a tooltip. It lives outside the transformed tiles.
     Hover/focus previews; activation pins. No pointerdown toggle: a touch
     scroll must stay a scroll. The flow controller shares the reading state. */
  (function details() {
    var tiles = Array.prototype.slice.call(document.querySelectorAll('#wall-block .tile'));
    var open = null, pinned = false, timer = null, suppressFocus = false;
    var previewTimer = null, pendingPreview = null, pointer = null;
    var hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    var compact = window.matchMedia('(max-width: 900px)');
    function make(tag, cls, text) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text) node.textContent = text;
      return node;
    }
    function cancel() { clearTimeout(timer); }
    function place() {
      if (!open) return;
      var card = open.card;
      card.style.left = ''; card.style.top = '';
      if (compact.matches) return; // CSS owns the bounded phone sheet.
      var wall = document.getElementById('wall-block').getBoundingClientRect();
      var tile = open.tile.getBoundingClientRect();
      var width = card.offsetWidth, height = card.offsetHeight, edge = 16;
      // Prefer the space beside the whole diagram, not on top of its arrows.
      var left = wall.left - width - 18;
      if (left < edge) left = wall.right + 18;
      left = Math.max(edge, Math.min(left, innerWidth - width - edge));
      card.style.left = left + 'px';
      card.style.top = Math.max(edge, Math.min(tile.top, innerHeight - height - edge)) + 'px';
    }
    function hide(restore) {
      cancel();
      clearTimeout(previewTimer); pendingPreview = null;
      if (!open) return;
      var old = open;
      open = null; pinned = false;
      old.card.hidden = true;
      old.tile.classList.remove('is-noted');
      old.trigger.setAttribute('aria-expanded', 'false');
      if (restore) {
        suppressFocus = true;
        old.trigger.focus({ preventScroll: true });
        suppressFocus = false;
      }
      document.dispatchEvent(new CustomEvent('kahran:detail-close'));
    }
    function show(item, pin) {
      cancel();
      if (pinned && !pin) return;
      if (open !== item) {
        hide(false);
        open = item;
        item.card.hidden = false;
        item.card.scrollTop = 0;
        item.tile.classList.add('is-noted');
        item.trigger.setAttribute('aria-expanded', 'true');
      }
      pinned = pinned || !!pin;
      place();
    }
    // Keep the passage between the tile and its panel traversable, even slowly.
    // A different tile must receive a settled hover, not just a crossing pointer.
    function inPassage() {
      if (!open || !pointer) return false;
      var a = open.trigger.getBoundingClientRect(), b = open.card.getBoundingClientRect();
      return pointer.x >= Math.min(a.left, b.left) && pointer.x <= Math.max(a.right, b.right) &&
        pointer.y >= Math.min(a.top, b.top) && pointer.y <= Math.max(a.bottom, b.bottom);
    }
    function preview(item) {
      clearTimeout(previewTimer);
      pendingPreview = item;
      previewTimer = setTimeout(function () {
        pendingPreview = null;
        show(item, false);
      }, 180);
    }
    function leaveSoon() {
      cancel();
      timer = setTimeout(function () {
        if (!open || pinned || inPassage() || open.card.contains(document.activeElement) ||
            open.trigger === document.activeElement && open.trigger.matches(':focus-visible')) return;
        hide(false);
      }, 450);
    }
    tiles.forEach(function (tile, i) {
      var idea = IDEAS[i], trigger = tile.querySelector('.idea-trigger');
      var card = make('section', 'idea-detail ' + idea.hue);
      card.id = 'idea-detail-' + i;
      card.hidden = true;
      card.setAttribute('role', 'region');
      card.setAttribute('aria-labelledby', card.id + '-title');
      trigger.setAttribute('aria-controls', card.id);
      trigger.setAttribute('aria-expanded', 'false');
      var head = make('header', 'idea-detail-head');
      var title = make('h2', '', idea.name);
      title.id = card.id + '-title';
      var close = make('button', 'idea-close', 'Close');
      close.type = 'button';
      close.setAttribute('aria-label', 'Close ' + idea.name + ' details');
      head.appendChild(title); head.appendChild(close); card.appendChild(head);
      card.appendChild(make('p', 'idea-intro', idea.detail.intro));
      var list = make('dl', 'idea-tools');
      idea.parts.forEach(function (part, n) {
        list.appendChild(make('dt', '', part));
        list.appendChild(make('dd', '', idea.detail.tools[n]));
      });
      card.appendChild(list);
      card.appendChild(make('p', 'idea-boundary', idea.detail.boundary));
      if (idea.href) {
        var link = make('a', 'idea-more', 'More about ' + idea.name + ' →');
        link.href = idea.href;
        card.appendChild(link);
      }
      document.body.appendChild(card);
      var item = { tile: tile, trigger: trigger, card: card, close: close };
      close.addEventListener('click', function () { hide(true); });
      trigger.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || !hover.matches) return;
        cancel(); preview(item);
      });
      trigger.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'mouse' && pendingPreview === item) preview(item);
      });
      trigger.addEventListener('pointerleave', function (e) {
        if (pendingPreview === item) {
          clearTimeout(previewTimer); pendingPreview = null;
        }
        if (e.pointerType === 'mouse') leaveSoon();
      });
      card.addEventListener('pointerenter', cancel);
      card.addEventListener('pointerleave', function (e) {
        if (e.pointerType === 'mouse') leaveSoon();
      });
      trigger.addEventListener('focus', function () {
        if (!suppressFocus && trigger.matches(':focus-visible')) {
          if (open !== item) hide(false);
          show(item, false);
        }
      });
      trigger.addEventListener('click', function () {
        show(item, true);
        close.focus({ preventScroll: true });
      });
      // Portalled panel follows its trigger in the keyboard reading order.
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && !e.shiftKey && open === item) {
          e.preventDefault(); close.focus({ preventScroll: true });
        }
      });
      card.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var controls = card.querySelectorAll('button, a');
        if (e.shiftKey && document.activeElement === controls[0]) {
          e.preventDefault(); trigger.focus({ preventScroll: true });
        } else if (!e.shiftKey && document.activeElement === controls[controls.length - 1]) {
          e.preventDefault(); hide(false);
          var next = tiles[i + 1];
          (next ? next.querySelector('.idea-trigger') : document.querySelector('.flow-surf')).focus();
        }
      });
    });
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      pointer = { x: e.clientX, y: e.clientY };
      if (!open || pinned) return;
      if (inPassage()) cancel(); else leaveSoon();
    });
    document.addEventListener('focusin', function (e) {
      if (open && !open.card.contains(e.target) && e.target !== open.trigger) hide(false);
    });
    document.addEventListener('pointerdown', function (e) {
      if (open && !open.card.contains(e.target) && !tiles.some(function (t) { return t.contains(e.target); })) hide(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) {
        e.preventDefault(); // flow.js must not close the diagram on this Escape.
        hide(true);
      }
    });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', place);
    window.kahranWall = {
      hideNote: function () { hide(false); },
      isReading: function () { return !!open; },
      contains: function (node) { return !!(open && open.card.contains(node)); }
    };
  })();

  /* ------------------------------------------------------------- go ------- */

  var asked = location.hash.replace(/^#/, '');
  var start = clampDay(asked, today);
  goTo(start, false, asked !== '' && asked !== 'flow' && asked !== start);

  /* v2/days.json holds the mini's frozen daily picks. It is optional and
     fetched once, in parallel with data.json: if it's missing, empty, or
     fails to load, `days` just stays null and every day falls back to the
     hash exactly as before — no visible change. */
  fetch('/v2/days.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (json) {
      days = json;
      if (window.kahranPick) window.kahranPick.setDays(days);
      if (data) draw(current, false);   // data.json may have already rendered on the hash
    });

  fetch('/v2/data.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('data.json ' + r.status);
      return r.json();
    })
    .then(function (json) {
      data = json;
      if (window.kahranPick) window.kahranPick.setData(data);
      draw(current, false);
    })
    .catch(function () {
      el.body.innerHTML =
        '<p class="trouble">Today&rsquo;s photograph and poem didn&rsquo;t load. ' +
        'Reload the page, or read the <a href="/poetry.html">poems</a> ' +
        'and see the <a href="/photography.html">photographs</a> on their own pages.</p>';
    });

  /* Two things can make the live pick answer differently after the first
     render: the weather line's reading landing (v2/weather.js fires this on
     document once it has a reading) and v2/pick.js's own scores fetch
     settling. Either one just asks draw() to re-evaluate the current day;
     draw()'s own key check means the DOM only changes if the pair actually
     changed — no flicker when the re-evaluation lands on the same pair. */
  document.addEventListener('kahran:weather', function () {
    if (data) draw(current, false);
  });
  document.addEventListener('kahran:pick-ready', function () {
    if (data) draw(current, false);
  });
})();
