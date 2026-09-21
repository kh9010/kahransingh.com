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
  var today = todayISO();
  var current = null;

  function draw(iso, animate) {
    el.date.textContent = longDate(iso);
    el.back.disabled = iso <= LAUNCH;
    el.fwd.disabled  = iso >= today;

    if (!data) return;

    var photo = data.photos[photoFor(iso, data.photos.length)];
    var poem  = data.poems[poemFor(iso, data.poems.length)];

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
    var boxes = document.querySelectorAll('.tool-name');
    Array.prototype.forEach.call(boxes, function (node) {
      if (node.textContent.trim() !== name || node.tagName === 'A') return;
      var a = document.createElement('a');
      a.className = node.className;
      a.href = TOOL_LINKS[name];
      a.textContent = node.textContent;
      node.parentNode.replaceChild(a, node);
      var box = a.closest('.tool');
      if (box) box.classList.add('tool--live');
      var soon = a.parentNode.querySelector('.soon');
      if (soon) soon.remove();
    });
  });

  /* ------------------------------------------------------------- go ------- */

  var asked = location.hash.replace(/^#/, '');
  var start = clampDay(asked, today);
  goTo(start, false, asked !== '' && asked !== start);

  fetch('/v2/data.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('data.json ' + r.status);
      return r.json();
    })
    .then(function (json) {
      data = json;
      draw(current, false);
    })
    .catch(function () {
      el.body.innerHTML =
        '<p class="trouble">Today&rsquo;s photograph and poem didn&rsquo;t load. ' +
        'Reload the page, or read the <a href="/poetry.html">poems</a> ' +
        'and see the <a href="/photography.html">photographs</a> on their own pages.</p>';
    });
})();
