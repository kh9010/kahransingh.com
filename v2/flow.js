/* kahransingh.com — v2 home, the flow view.

   The wall is a picture of what exists. This is a picture of how it runs: the
   same sixteen tiles fly out of the lean into three columns — what comes in,
   what gets made of it, what reads it — with the watcher on its own row
   beneath, and the connectors drawn in behind the glass.

   Two things live here and nowhere else: PLACE, where each tool lands, and
   EDGES, what feeds what. Both are read off day-flow's own README, glossary,
   contracts and module docstrings, and every edge below was checked against
   the code that implements it. When a lane changes, change it here.

   The flight is FLIP: measure every tile, switch the layout, measure again,
   then animate the difference away with a stagger, so ingest lands before
   transform, transform before consume, and the watcher last. Nothing is
   persisted — a click never writes the hash, #flow opens the view directly,
   Escape closes it. */

(function () {
  'use strict';

  var layer = document.querySelector('.tools-layer');
  var wall  = document.querySelector('.wall');
  var block = document.getElementById('wall-block');
  var btn   = document.getElementById('wall-toggle');
  if (!layer || !wall || !block || !btn) return;

  var SVGNS = 'http://www.w3.org/2000/svg';

  function still() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* -------------------------------------------------- where each one lands -- */

  /* [column, row]. Columns are ingest, transform, consume. Row 7 is the
     watcher's own row beneath the three, where the column is its place in it.
     Ingest holds rows 2–4 so the raw store sits at the exact middle of the
     five, and its fan into everything downstream leaves from the centre. */
  var PLACE = {
    'Voice & WhatsApp capture': [1, 2],
    'Raw store':                [1, 3],
    'Mail triage':              [1, 4],
    'The miners':               [2, 1],
    'The judge':                [2, 2],
    'The Curator':              [2, 3],
    'The sparks garden':        [2, 4],
    'Noticings':                [2, 5],
    'Movement':                 [3, 1],
    'The now brain':            [3, 2],
    'The workout planner':      [3, 3],
    'Travel days':              [3, 4],
    'The weekly record':        [3, 5],
    'Samwise':                  [1, 7],
    'The repairer':             [2, 7],
    'The health page':          [3, 7]
  };

  var HEADS = [[1, 'ingest'], [2, 'transform'], [3, 'consume']];

  /* The five pigments, named. Colour is the only grouping the wall has, and
     this is the one view where naming it pays for the line it costs. */
  var KEYS = [
    ['tile--catching',    'catching'],
    ['tile--remembering', 'not forgetting'],
    ['tile--knowing',     'knowing'],
    ['tile--alive',       'staying alive'],
    ['tile--public',      'in public']
  ];

  /* source, target, weight. Every arrow was traced to the line where the TARGET
     reads what the source wrote; the table is in docs/2026-09-22-flow-edges.md,
     and nothing goes in here that the table cannot support. Three things it
     settled: mail triage reads the store rather than writing to it; the store
     does not feed movement at all, so the arrow into movement comes from the
     thing that does — what Kahran tells the assistant; and the weekly record
     really is published off the store, one hop through the record extractor. */
  var EDGES = [
    ['Voice & WhatsApp capture', 'Raw store'],
    ['Raw store',                'Mail triage'],
    ['Raw store',                'The miners'],
    ['The miners',               'The judge'],
    ['The judge',                'The Curator'],
    ['The judge',                'The sparks garden'],
    ['Raw store',                'Noticings'],
    ['Voice & WhatsApp capture', 'Movement'],
    ['Raw store',                'The now brain'],
    ['The Curator',              'The now brain'],
    ['Movement',                 'The now brain'],
    ['Movement',                 'The workout planner'],
    ['The workout planner',      'Travel days', 'light'],
    ['Raw store',                'The weekly record', 'light'],
    ['Samwise',                  'The repairer'],
    ['Samwise',                  'The health page']
  ];

  /* Samwise has a registered lane for all of these but one: the Monday publish
     behind the weekly record writes no envelope, so nothing watches it. No
     thread is drawn there rather than one claiming a watch that isn't kept. */
  var UNWATCHED = { 'The weekly record': 1 };

  var WATCHER = 'Samwise';
  var WATCHED_ROW = 7;

  /* ------------------------------------------------------- and then me ---- */

  /* Which tools' output actually reaches Kahran, and what it reaches him by.
     Verified the same way as EDGES — by the sending call, not by intent — and
     written up in the "reaches Kahran" section of docs/2026-09-22-flow-edges.md.
     A tool is in here only if a person hears from it: the miners, the judge and
     the store never do, which is most of the point of them. */
  var REACH = [
    ['Mail triage',         'the mail card at 06:30, and when he asks'],
    ['The miners',          'his own words, quoted back at 06:30'],
    ['The Curator',         'three questions a morning, no more'],
    ['The sparks garden',   'never pushed \u2014 only when he asks'],
    ['Noticings',           'one line at 06:30, and the pages'],
    ['Movement',            'one question, only when it cannot tell'],
    ['The now brain',       'the now page, and asking it to unstick him'],
    ['The workout planner', 'today\u2019s session, when he asks'],
    ['Travel days',         'the flight-day messages'],
    ['Samwise',             'a count at 06:30, not a push'],
    ['The repairer',        'waiting on the health page, landed or rolled back'],
    ['The health page',     'the page, when he opens it'],
    ['The weekly record',   'published \u2014 the audience is everyone', 'everyone']
  ];

  /* Two ways of drawing the same fact, both built, one shipped.
       'edge' (default) — each line leaves its tile and ends on a lane at the
                right, the caps lining up so the edge of the drawing is the
                boundary of the system and the outside of it is him.
       'node' — every line converges on one mark that he is.
     Open /?me=node#flow to see the other one; it is here so the choice can be
     looked at rather than argued about. */
  var ME_STYLE = /[?&]me=node\b/.test(location.search) ? 'node' : 'edge';

  var READ = 'How the tools fit together. On the left, what comes in: voice and ' +
    'WhatsApp capture lands in the raw store, and mail triage reads the store to ' +
    'tell a person from a newsletter. In the middle, what gets made of it: the ' +
    'miners read the store, the judge reads the miners, the Curator tends what the ' +
    'judge keeps and the sparks garden catches what it files as an idea; noticings ' +
    'grows over the same store. On the right, what reads it: movement is worked out ' +
    'from what Kahran tells the assistant, and it feeds the now brain and the ' +
    'workout planner, which hands the day’s shape on to travel days; the now ' +
    'brain also reads the store and the Curator’s ' +
    'backlog, and the weekly record is published off the store. Beneath, Samwise ' +
    'watches every lane, wakes the repairer when one goes red, and renders the ' +
    'health page.';

  /* --------------------------------------------------------------- setup -- */

  var GROUPS = ['tile--catching', 'tile--remembering', 'tile--knowing', 'tile--alive', 'tile--public'];

  function groupOf(tile) {
    for (var i = 0; i < GROUPS.length; i++) if (tile.classList.contains(GROUPS[i])) return GROUPS[i];
    return GROUPS[0];
  }

  var tiles = {};     // name -> element
  var flock = [];     // every placed tile, in document order

  Array.prototype.forEach.call(block.querySelectorAll('.tile'), function (tile) {
    var nameEl = tile.querySelector('.tile-name');
    var name = nameEl ? nameEl.textContent.trim() : '';
    var at = PLACE[name];
    if (!at) return;
    tile.style.setProperty('--fc', at[0]);
    tile.style.setProperty('--fr', at[1]);
    tiles[name] = tile;
    flock.push(tile);
  });
  if (flock.length < 2) return;

  function colOf(t) { return +t.style.getPropertyValue('--fc'); }
  function rowOf(t) { return +t.style.getPropertyValue('--fr'); }

  /* Layer first, then place within it: ingest lands, then transform, then
     consume, then the watcher. */
  function delayOf(tile) {
    var c = colOf(tile), r = rowOf(tile);
    var lay = (r === WATCHED_ROW) ? 3 : c - 1;
    var idx = (r === WATCHED_ROW) ? c - 1 : r - 1;
    return lay * 84 + idx * 18;
  }

  var FLIGHT = 640;
  var MAX_DELAY = flock.reduce(function (m, t) { return Math.max(m, delayOf(t)); }, 0);

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  HEADS.forEach(function (h) {
    var p = make('p', 'flow-head', h[1]);
    p.style.setProperty('--fc', h[0]);
    block.appendChild(p);
  });
  block.appendChild(make('p', 'flow-head flow-head--watch', 'watching'));

  var keys = make('ul', 'flow-keys');
  KEYS.forEach(function (k) {
    var li = document.createElement('li');
    li.className = k[0];
    li.appendChild(document.createElement('i'));
    li.appendChild(document.createTextNode(k[1]));
    keys.appendChild(li);
  });
  block.appendChild(keys);

  /* The channel belongs on the card the tile already opens — the lane at the
     right is 48 pixels wide and the wall cannot grow into the poem, so there is
     nowhere out there to write it. The line to the lane lights at the same
     moment, which is what ties the words to the arrow. */
  REACH.forEach(function (r) {
    var tile = tiles[r[0]];
    if (!tile) return;
    var card = tile.querySelector('.note');
    if (!card) return;
    var line = make('span', 'note-reach', r[1]);
    card.appendChild(line);
  });

  var svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'flow-wires');
  svg.setAttribute('role', 'img');
  svg.setAttribute('focusable', 'false');
  var title = document.createElementNS(SVGNS, 'title');
  title.textContent = READ;
  svg.appendChild(title);
  block.insertBefore(svg, block.firstChild);

  /* ------------------------------------------------------------- the wires -- */

  function svgEl(tag, cls) {
    var n = document.createElementNS(SVGNS, tag);
    if (cls) n.setAttribute('class', cls);
    return n;
  }
  function r1(n) { return Math.round(n * 10) / 10; }

  var wires = [];     // { path, tip, dot, len, delay }
  var reachers = [];  // { name, label, path, cap, text }
  var meHit = null;
  var TIP = 6;        // how far short of the tile a connector stops

  function litAll()   { svg.classList.add('is-me'); }
  function unlitAll() { svg.classList.remove('is-me'); }

  function drawWires() {
    while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild);
    wires = [];

    var br = block.getBoundingClientRect();
    if (!br.width) return;

    function boxOf(name) {
      var t = tiles[name];
      if (!t) return null;
      var r = t.getBoundingClientRect();
      return { x: r.left - br.left, y: r.top - br.top, w: r.width, h: r.height,
               col: colOf(t), row: rowOf(t), tile: t };
    }

    var rights = {};
    flock.forEach(function (t) {
      var c = colOf(t), r = t.getBoundingClientRect();
      rights[c] = Math.max(rights[c] || 0, r.right - br.left);
    });
    function prevRight(col) { return rights[col - 1] || 0; }

    function pathFor(a, b) {
      if (a.col !== b.col) {
        var dir = b.x > a.x ? 1 : -1;
        var x1 = dir > 0 ? a.x + a.w + 1 : a.x - 1;
        var x2 = dir > 0 ? b.x - TIP : b.x + b.w + TIP;
        var y1 = a.y + a.h / 2, y2 = b.y + b.h / 2;
        var k = Math.max(22, Math.abs(x2 - x1) * 0.46);
        return 'M' + r1(x1) + ' ' + r1(y1) + ' C' + r1(x1 + dir * k) + ' ' + r1(y1) +
               ' ' + r1(x2 - dir * k) + ' ' + r1(y2) + ' ' + r1(x2) + ' ' + r1(y2);
      }
      /* Down its own column. The rows are eight pixels apart, which is no room
         for a line at all, so every one of these bows out into the gutter on
         its left and comes back in: the further it reaches, the wider it goes,
         and the lower on its tile it leaves from. Three arrows out of one tile
         read as a fan instead of a smudge. */
      var span = Math.min(3, Math.abs(b.row - a.row));
      var room = a.col > 1 ? Math.max(16, a.x - prevRight(a.col)) : Math.max(14, a.x);
      var lane = a.x - Math.min(room - 6, room * (0.34 + 0.2 * span));
      var sy = a.y + a.h * (0.45 + 0.13 * span);
      var ty = b.y + b.h / 2;
      return 'M' + r1(a.x - 1) + ' ' + r1(sy) + ' C' + r1(lane) + ' ' + r1(sy) +
             ' ' + r1(lane) + ' ' + r1(ty) + ' ' + r1(b.x - TIP) + ' ' + r1(ty);
    }

    /* The watcher's own edge to every lane it watches: one faint curve each,
       from the top of its tile to the underside of theirs. */
    function watchPath(s, b) {
      var x1 = s.x + s.w / 2, y1 = s.y - 1;
      var x2 = b.x + b.w / 2, y2 = b.y + b.h + 2;
      var my = y1 - (y1 - y2) * 0.55;
      return 'M' + r1(x1) + ' ' + r1(y1) + ' C' + r1(x1) + ' ' + r1(my) +
             ' ' + r1(x2) + ' ' + r1(my) + ' ' + r1(x2) + ' ' + r1(y2);
    }

    function add(d, cls, target, withDot) {
      var path = svgEl('path', 'flow-wire ' + cls + ' ' + groupOf(target.tile));
      path.setAttribute('d', d);
      svg.appendChild(path);
      var len = 0;
      try { len = path.getTotalLength(); } catch (e) { len = 0; }
      var tip = null, dot = null;
      if (cls !== 'flow-wire--watch' && len > 8) {
        var p0 = path.getPointAtLength(len);
        var p1 = path.getPointAtLength(len - 1.5);
        var ang = Math.atan2(p0.y - p1.y, p0.x - p1.x) * 180 / Math.PI;
        tip = svgEl('path', 'flow-tip ' + groupOf(target.tile));
        tip.setAttribute('d', 'M0 0 L-5.6 -3.1 L-5.6 3.1 Z');
        tip.setAttribute('transform', 'translate(' + r1(p0.x) + ',' + r1(p0.y) + ') rotate(' + r1(ang) + ')');
        svg.appendChild(tip);
        if (withDot) {
          dot = svgEl('circle', 'flow-dot ' + groupOf(target.tile));
          dot.setAttribute('r', '2.5');
          dot.setAttribute('opacity', '0');
          svg.appendChild(dot);
        }
      }
      wires.push({ path: path, tip: tip, dot: dot, len: len, watch: cls === 'flow-wire--watch' });
    }

    var ordered = EDGES.slice().sort(function (p, q) {
      var a = tiles[p[0]], b = tiles[q[0]];
      return (a ? delayOf(a) : 0) - (b ? delayOf(b) : 0);
    });

    ordered.forEach(function (e) {
      var a = boxOf(e[0]), b = boxOf(e[1]);
      if (!a || !b) return;
      add(pathFor(a, b), e[2] === 'light' ? 'flow-wire--light' : 'flow-wire--main', b, true);
    });

    /* ------------------------------------------------ the lines that leave -- */

    /* The lane reserved at the right of the block, where the system stops. */
    var fme = parseFloat(getComputedStyle(block).paddingRight) -
              parseFloat(getComputedStyle(block).paddingLeft);
    if (!(fme > 8)) fme = 40;
    var edgeX = br.width - fme * 0.44;          /* where every cap sits */

    reachers = [];
    REACH.forEach(function (r) {
      var a = boxOf(r[0]);
      if (!a) return;
      reachers.push({ name: r[0], label: r[1], dest: r[2] || 'me', a: a, y: a.y + a.h / 2 });
    });

    /* Tiles on the same row would otherwise land on the same cap, and two
       channels sharing one circle says something untrue. Walk them in order and
       hold them apart, then recentre the run on where it wanted to be. */
    var CAP_GAP = 14;
    reachers.sort(function (p, q) { return p.y - q.y; });
    var want = reachers.map(function (w) { return w.y; });
    var run = 0;
    reachers.forEach(function (w, i) {
      run = (i === 0) ? w.y : Math.max(w.y, run + CAP_GAP);
      w.capY = run;
    });
    if (reachers.length) {
      var drift = ((reachers[0].capY + reachers[reachers.length - 1].capY) / 2) -
                  ((want[0] + want[want.length - 1]) / 2);
      reachers.forEach(function (w) { w.capY -= drift; });
    }

    var lows = reachers.map(function (w) { return w.capY; });
    var midY = reachers.length
      ? (lows[0] + lows[lows.length - 1]) / 2
      : br.height / 2;

    reachers.forEach(function (w) {
      var a = w.a;
      var ty = (ME_STYLE === 'node') ? midY : w.capY;
      var x1 = a.x + a.w + 1, y1 = w.y;
      var x2 = edgeX - 5;
      var k = Math.max(30, (x2 - x1) * 0.42);
      var d = 'M' + r1(x1) + ' ' + r1(y1) +
              ' C' + r1(x1 + k) + ' ' + r1(y1) + ' ' + r1(x2 - k) + ' ' + r1(ty) +
              ' ' + r1(x2) + ' ' + r1(ty);
      var path = svgEl('path', 'flow-reach');
      path.setAttribute('d', d);
      svg.appendChild(path);

      var cap = svgEl('circle', 'flow-cap');
      cap.setAttribute('cx', r1(edgeX));
      cap.setAttribute('cy', r1(ty));
      cap.setAttribute('r', '2.6');
      svg.appendChild(cap);

      w.path = path; w.cap = cap; w.ty = ty;
    });

    /* The word, once, outside everything the system drew. */
    if (reachers.length) {
      var me = svgEl('text', 'flow-me');
      me.setAttribute('x', r1(edgeX));
      me.setAttribute('text-anchor', 'middle');
      if (ME_STYLE === 'node') {
        me.setAttribute('y', r1(midY + 20));
        var ring = svgEl('circle', 'flow-cap');
        ring.setAttribute('cx', r1(edgeX));
        ring.setAttribute('cy', r1(midY));
        ring.setAttribute('r', '6');
        svg.appendChild(ring);
      } else {
        var mine = reachers.filter(function (w) { return w.dest === 'me'; });
        me.setAttribute('y', r1((mine.length ? mine[mine.length - 1].capY : lows[lows.length - 1]) + 26));
      }
      me.textContent = 'me';
      svg.appendChild(me);

      /* One line does not end at him. The weekly record goes past him to the
         public, and saying so is half of what this lane is for. */
      reachers.forEach(function (w) {
        if (w.dest === 'me') return;
        var out = svgEl('text', 'flow-me flow-me--other');
        out.setAttribute('x', r1(edgeX));
        out.setAttribute('y', r1(w.ty + 15));
        out.setAttribute('text-anchor', 'middle');
        out.textContent = w.dest;
        svg.appendChild(out);
      });
      meHit = svgEl('rect', 'flow-me-hit');
      meHit.setAttribute('x', r1(edgeX - fme * 0.5));
      meHit.setAttribute('y', r1(lows[0] - 14));
      meHit.setAttribute('width', r1(fme));
      meHit.setAttribute('height', r1(lows[lows.length - 1] - lows[0] + 46));
      svg.appendChild(meHit);
      meHit.style.pointerEvents = 'auto';
      meHit.addEventListener('mouseenter', litAll);
      meHit.addEventListener('mouseleave', unlitAll);
    }

    var s = boxOf(WATCHER);
    if (s) {
      flock.forEach(function (t) {
        if (rowOf(t) === WATCHED_ROW) return;
        var nm = t.querySelector('.tile-name').textContent.trim();
        if (UNWATCHED[nm]) return;
        var b = boxOf(nm);
        if (b) add(watchPath(s, b), 'flow-wire--watch', b, false);
      });
    }

    /* A carrying edge draws itself, tip first at the end. The watcher's edges
       do not draw: they are dashed and they fade up, because what runs along
       them is attention, not data. */
    var quiet = still(), n = 0;
    wires.forEach(function (w) {
      if (w.watch) {
        w.delay = 300;
        w.path.style.strokeDasharray = '2 3.5';
        if (!quiet) w.path.style.opacity = '0';
        return;
      }
      w.delay = quiet ? 0 : (n++) * 24;
      w.path.style.strokeDasharray = w.len ? w.len + 'px' : 'none';
      w.path.style.strokeDashoffset = quiet ? '0' : (w.len ? w.len + 'px' : '0');
      if (w.tip) w.tip.style.opacity = quiet ? '' : '0';
    });
  }

  function runWires() {
    if (still()) return;
    wires.forEach(function (w) {
      if (w.watch) {
        w.path.style.transition = 'opacity 900ms ease ' + w.delay + 'ms';
        w.path.style.opacity = '';
        /* Hand the line back to the stylesheet once it has faded up. Leave this
           slow transition in place and it also governs the hover, and Samwise
           answers a second and a half late. */
        later((function (path) {
          return function () { path.style.transition = ''; };
        })(w.path), w.delay + 960);
        return;
      }
      w.path.style.transition = 'stroke-dashoffset 520ms cubic-bezier(.3,.72,.28,1) ' + w.delay + 'ms';
      w.path.style.strokeDashoffset = '0';
      if (w.tip) {
        w.tip.style.transition = 'opacity 260ms ease ' + (w.delay + 360) + 'ms';
        w.tip.style.opacity = '';
      }
    });
  }

  /* ---------------------------------------------------------- the travellers -- */

  var raf = null, t0 = 0, CYCLE = 3000, TRAVEL = 0.62;

  function tick(now) {
    if (!open) { raf = null; return; }
    for (var i = 0; i < wires.length; i++) {
      var w = wires[i];
      if (!w.dot || !w.len) continue;
      var u = (((now - t0) / CYCLE) + (i * 0.17)) % 1;
      if (u > TRAVEL) { w.dot.setAttribute('opacity', '0'); continue; }
      var v = u / TRAVEL;
      var p = w.path.getPointAtLength(v * w.len);
      w.dot.setAttribute('transform', 'translate(' + r1(p.x) + ',' + r1(p.y) + ')');
      w.dot.setAttribute('opacity', (Math.min(1, Math.min(v, 1 - v) * 7) * 0.92).toFixed(2));
    }
    raf = requestAnimationFrame(tick);
  }

  function startDots() {
    if (still() || raf) return;
    t0 = (window.performance && performance.now()) ? performance.now() : Date.now();
    raf = requestAnimationFrame(tick);
  }
  function stopDots() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    wires.forEach(function (w) { if (w.dot) w.dot.setAttribute('opacity', '0'); });
  }

  /* ------------------------------------------------------------- the flight -- */

  var open = false;
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearLater() { timers.forEach(clearTimeout); timers = []; }

  function settle(movers) {
    movers.forEach(function (m) { m.style.transition = ''; m.style.transform = ''; });
  }

  var head = document.querySelector('.wall-head');

  function setFlow(on, animate) {
    if (on === open) return;
    if (window.kahranWall && window.kahranWall.hideNote) window.kahranWall.hideNote();
    clearLater();
    stopDots();

    var movers = head ? flock.concat([head]) : flock.slice();
    var quiet = still() || !animate;
    var first = quiet ? null : movers.map(function (m) { return m.getBoundingClientRect(); });

    settle(movers);
    layer.classList.toggle('is-flow', on);
    layer.classList.remove('is-landed');
    open = on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'back to the wall' : 'how they fit together';

    if (on) drawWires(); else unlitAll();

    if (quiet) {
      if (on) { layer.classList.add('is-landed'); runWires(); startDots(); }
      return;
    }

    var last = movers.map(function (m) { return m.getBoundingClientRect(); });
    movers.forEach(function (m, i) {
      var dx = first[i].left - last[i].left;
      var dy = first[i].top - last[i].top;
      m.style.transition = 'none';
      m.style.transform = 'translate(' + r1(dx) + 'px,' + r1(dy) + 'px)';
    });
    void block.offsetWidth;

    layer.classList.add('is-flying');
    movers.forEach(function (m, i) {
      var d = (m === head) ? 0 : (on ? delayOf(m) : MAX_DELAY - delayOf(m));
      m.style.transition = 'transform ' + FLIGHT + 'ms cubic-bezier(.2,.8,.2,1) ' + d + 'ms';
      m.style.transform = '';
    });

    var done = FLIGHT + MAX_DELAY;
    later(function () { layer.classList.remove('is-flying'); settle(movers); }, done + 60);
    if (on) {
      later(function () { layer.classList.add('is-landed'); runWires(); }, done - 180);
      later(startDots, done + 420);
    }
  }

  /* ------------------------------------------------------------- the door -- */

  btn.hidden = false;
  btn.addEventListener('click', function () { setFlow(!open, true); });

  function isFlowHash() { return location.hash.replace(/^#/, '') === 'flow'; }

  window.addEventListener('hashchange', function () {
    if (isFlowHash()) setFlow(true, true);
    else if (open) setFlow(false, true);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !open) return;
    if (block.querySelector('.tile.is-noted')) return;   /* a note closes first */
    setFlow(false, true);
    if (isFlowHash()) history.replaceState(null, '', location.pathname + location.search);
    btn.focus();
  });

  /* Touching a tile that reaches him lights its own line and names the channel;
     touching the word "me" lights all of them at once and steps the data
     connectors back, so the two layers are never read at the same time. */
  (function reachHover() {
    function find(name) {
      for (var i = 0; i < reachers.length; i++) if (reachers[i].name === name) return reachers[i];
      return null;
    }
    function set(name, on) {
      var w = find(name);
      if (!w) return;
      [w.path, w.cap].forEach(function (n) {
        if (n) n.classList[on ? 'add' : 'remove']('is-lit');
      });
    }
    REACH.forEach(function (r) {
      var tile = tiles[r[0]];
      if (!tile) return;
      tile.addEventListener('mouseenter', function () { set(r[0], true); });
      tile.addEventListener('mouseleave', function () { set(r[0], false); });
      tile.addEventListener('focus', function () { set(r[0], true); });
      tile.addEventListener('blur', function () { set(r[0], false); });
    });
  })();

  /* The watcher's fan is faint on purpose; touching Samwise brings it up. */
  (function watchHover() {
    var s = tiles[WATCHER];
    if (!s) return;
    function on()  { svg.classList.add('is-watched'); }
    function off() { svg.classList.remove('is-watched'); }
    s.addEventListener('mouseenter', on);
    s.addEventListener('mouseleave', off);
    s.addEventListener('focus', on);
    s.addEventListener('blur', off);
  })();

  var redraw = null;
  function replot() {
    if (!open) return;
    clearTimeout(redraw);
    redraw = setTimeout(function () {
      var quiet = still();
      drawWires();
      if (!quiet) wires.forEach(function (w) {
        w.path.style.strokeDashoffset = '0';
        w.path.style.opacity = '';
        if (w.tip) w.tip.style.opacity = '';
      });
      startDots();
    }, 140);
  }
  window.addEventListener('resize', replot);
  window.addEventListener('orientationchange', replot);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(replot);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopDots(); else if (open) startDots();
  });

  if (isFlowHash()) {
    var go = function () { later(function () { setFlow(true, true); }, 260); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  }
})();
