/* kahransingh.com — v2 home.
   One photograph and one poem per calendar day, chosen by hashing the date, so
   a day that has happened never reshuffles. Everything else on the page (the
   wall of tools) is static markup in index.html and works without this file.

   To give a tool on the wall a page, add it to TOOL_LINKS below. */

(function () {
  'use strict';

  var LAUNCH = '2026-09-21';          // day one; the walk back stops here
  var ZONE   = 'America/New_York';    // the day turns over where Kahran is

  /* Add "Tool name": "/path/" here when a box on the wall gets a page. The box
     loses its "soon" mark and becomes a link. (The weekly record is already a
     link in index.html so that it works with JavaScript off.) */
  var TOOL_LINKS = {
    'The weekly record': '/lately/'
  };

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

  /* ------------------------------------------------------------- the wall -- */

  Object.keys(TOOL_LINKS).forEach(function (name) {
    var boxes = document.querySelectorAll('.tile-name');
    Array.prototype.forEach.call(boxes, function (node) {
      if (node.textContent.trim() !== name || node.tagName === 'A') return;
      var a = document.createElement('a');
      a.className = node.className;
      a.href = TOOL_LINKS[name];
      a.textContent = node.textContent;
      node.parentNode.replaceChild(a, node);
      var box = a.closest('.tile');
      if (box) box.classList.add('tile--live');
      var soon = a.parentNode.querySelector('.soon');
      if (soon) soon.remove();
    });
  });

  /* ---------------------------------------------------------- the notes -- */

  /* One line per tool, on hover, on tap, and on keyboard focus. Built from each
     tile's data-note so the markup stays plain, and positioned from here so the
     card can flip above/below and left/right to stay inside the tools column
     and inside the viewport. The tile never resizes, so the block never moves. */
  (function notes() {
    var tiles = [];
    Array.prototype.forEach.call(document.querySelectorAll('.tile[data-note]'), function (tile) {
      var text = (tile.getAttribute('data-note') || '').trim();
      if (!text) return;                        /* the live tile carries no note */
      var card = document.createElement('span');
      card.className = 'note';
      card.id = 'tool-note-' + (tiles.length + 1);
      card.setAttribute('role', 'tooltip');
      card.textContent = text;
      tile.appendChild(card);
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('aria-describedby', card.id);
      tile.noteCard = card;
      tiles.push(tile);
    });
    if (!tiles.length) return;

    var open = null, timer = null;
    var GAP = 10, EDGE = 16, DELAY = 140;

    /* Keep the card inside the tools column as well as the window. */
    function bounds() {
      var wall = document.querySelector('.wall');
      var r = wall ? wall.getBoundingClientRect() : null;
      return {
        lo: Math.max(EDGE, r ? r.left : EDGE),
        hi: Math.min(window.innerWidth - EDGE, r ? r.right : window.innerWidth - EDGE)
      };
    }

    function place(tile) {
      var card = tile.noteCard;
      card.style.left = '0px'; card.style.top = '0px'; card.style.maxWidth = '';
      var b = bounds();
      card.style.maxWidth = Math.min(248, b.hi - b.lo) + 'px';
      var t = tile.getBoundingClientRect();
      var c = card.getBoundingClientRect();
      var left = t.left;
      if (left + c.width > b.hi) left = b.hi - c.width;   /* flip to the right edge */
      if (left < b.lo) left = b.lo;
      card.style.left = (left - t.left) + 'px';
      /* above by preference, below when there is no room up there */
      card.style.top = (t.top - c.height - GAP >= EDGE)
        ? (-(c.height + GAP)) + 'px'
        : (t.height + GAP) + 'px';
    }

    function show(tile) {
      if (open === tile) return;
      hide();
      tile.classList.add('is-noted');
      place(tile);
      open = tile;
    }

    function hide() {
      if (!open) return;
      open.classList.remove('is-noted');
      open.noteCard.removeAttribute('style');
      open = null;
    }

    tiles.forEach(function (tile) {
      tile.addEventListener('mouseenter', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { show(tile); }, DELAY);  /* no flicker when sweeping */
      });
      tile.addEventListener('mouseleave', function () { clearTimeout(timer); hide(); });
      /* only a keyboard focus opens it; a tap's focus is handled by the click */
      tile.addEventListener('focus', function () {
        if (!tile.matches || tile.matches(':focus-visible')) show(tile);
      });
      tile.addEventListener('blur', hide);
      tile.addEventListener('click', function (e) {
        e.stopPropagation();
        clearTimeout(timer);
        if (open === tile) hide(); else show(tile);
      });
      tile.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (open === tile) hide(); else show(tile);
        }
      });
    });

    document.addEventListener('click', hide);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
    window.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('resize', hide);
  })();

  /* ------------------------------------------------------------- go ------- */

  var asked = location.hash.replace(/^#/, '');
  var start = clampDay(asked, today);
  goTo(start, false, asked !== '' && asked !== start);

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
