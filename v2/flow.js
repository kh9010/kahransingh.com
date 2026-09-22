/* kahransingh.com — v2 home, the flow view.

   The wall is a picture of what the five ideas are. This is a picture of how
   they run: the same five tiles fly out of the lean into two columns — what
   the system knows, and what it does with it — with the watcher on a row
   beneath, and the connectors drawn in behind the glass.

   Two things live here and nowhere else: PLACE, where each idea lands, and
   EDGES, what feeds what. Every idea-level edge here is a collapse of the
   part-level edges audited in docs/2026-09-22-flow-edges.md, which names the
   line in the TARGET's code where it reads what the source wrote. The parts
   under each idea live in IDEAS in v2/home.js. Change a lane, change both.

   The flight is FLIP: measure every tile, switch the layout, measure again,
   then animate the difference away with a stagger, so context lands first and
   the watcher last. Nothing is persisted — a click never writes the hash,
   #flow opens the view directly, Escape closes it. */

(function () {
  'use strict';

  var layer = document.querySelector('.tools-layer');
  var wall  = document.querySelector('.wall');
  var block = document.getElementById('wall-block');
  var bullet = document.getElementById('doing-tools');   /* the door, now */
  var region = document.querySelector('.doing');         /* bullet + diagram */
  if (!layer || !wall || !block) return;

  var SVGNS = 'http://www.w3.org/2000/svg';

  function still() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* -------------------------------------------------- where each one lands -- */

  /* [column, row]. Column 1 is what the system knows; column 2 is what it does
     with it. Context sits at the middle of the three rows on the left, so its
     fan into all three leaves from the centre. Row 4 is the watcher's own row
     beneath; its label goes in the empty column beside it. */
  var PLACE = {
    'Context':              [1, 2],
    'Keeping track':        [2, 1],
    'Staying up to date':   [2, 2],
    'Topically suggesting': [2, 3],
    'Self-healing':         [1, 4]
  };

  /* Five boxes name themselves, so the stage headings and the colour legend the
     sixteen tiles needed are both gone. One head is left, over the column of
     things that are not part of the system at all. */
  var HEADS = [[3, 'how it reaches me', 'flow-head--surf']];

  /* source, target, weight. Each of these collapses part-level arrows that were
     traced to the line where the TARGET reads what the source wrote — the table
     is docs/2026-09-22-flow-edges.md, and nothing goes in here that the table
     cannot support. The parts behind each one, in that file's Ideas section:

       Context -> Keeping track          store -> miners
       Context -> Staying up to date     store -> mail triage; store -> weekly record
       Context -> Topically suggesting   store -> now brain, -> noticings;
                                         movement -> now brain, -> workout planner
       Keeping track -> Topically ...    Curator -> now brain

     Two lanes that were arrows on the sixteen-tile version are now INSIDE an
     idea and draw nothing: miners -> judge -> Curator, and judge -> sparks
     garden, all four of which are Keeping track. */
  var EDGES = [
    ['Context',       'Keeping track'],
    ['Context',       'Staying up to date'],
    ['Context',       'Topically suggesting'],
    ['Keeping track', 'Topically suggesting']
  ];

  /* Every idea has at least one watched lane under it, so unlike the sixteen —
     where the Monday publish behind the weekly record had no envelope — there
     is nothing to leave out here. Kept as the seam: if an idea ever has no
     watched lane at all, name it here rather than draw a watch that isn't kept. */
  var UNWATCHED = {};

  var READ = 'How the five ideas fit together, and how they reach me. On the ' +
    'left is context: the raw store, what I say out loud, and where I am. It ' +
    'feeds the other three. Keeping track reads what I said and holds onto what ' +
    'I took on; staying up to date sorts what came in and publishes the week; ' +
    'topically suggesting offers one next move, a session, a thing from my own ' +
    'past, and the flight-day routine. Keeping track feeds topically suggesting ' +
    'too. Self-healing watches all four, on the dashed lines. The right-hand ' +
    'column is what I actually get: four of the five come out as one 06:30 ' +
    'message, context asks a question on WhatsApp only when it cannot tell where ' +
    'I am, several wait until I ask, and the weekly record goes past me to ' +
    'everyone.';

  var WATCHER = 'Self-healing';
  var WATCHED_ROW = 4;

  /* --------------------------------------------- and then it reaches him -- */

  /* The third column: not parts of the system, but the things he actually
     gets. Audited from the sending side — the call that puts something on a
     surface a person looks at — in the "Reaches Kahran" section of
     docs/2026-09-22-flow-edges.md. id, what it is called, what kind of thing. */
  var SURFACES = [
    ['ask',    'when I ask for it',     'on request'],
    ['page',   'a page I open',         'page'],
    ['question', 'a question on WhatsApp', 'question'],
    ['morning', 'the 06:30 message',    'message'],
    ['flight', 'the flight-day messages', 'message'],
    ['public', 'everyone',              'public']
  ];

  /* Which idea comes out where, and which of its parts does it. Four of the
     five land in the one 06:30 message, which is the only scheduled outbound
     in the whole system — everything else waits to be asked. Context is the
     single thing allowed to interrupt him with a question, and the weekly
     record, under staying up to date, is the one that goes past him. */
  var FEEDS = [
    ['Keeping track',        'morning'],     // the miners, the Curator
    ['Staying up to date',   'morning'],     // mail triage
    ['Topically suggesting', 'morning'],     // noticings
    ['Self-healing',         'morning'],     // Samwise, the repairer
    ['Context',              'question'],    // movement
    ['Topically suggesting', 'flight'],      // travel days
    ['Topically suggesting', 'page'],        // the now brain
    ['Self-healing',         'page'],        // the health page
    ['Staying up to date',   'ask'],         // the mail commands
    ['Keeping track',        'ask'],         // the Curator's list, the sparks garden
    ['Topically suggesting', 'ask'],         // the workout card, unstick
    ['Staying up to date',   'public']       // the weekly record
  ];

  /* The line on the tile's own card, so the words and the arrows agree. */
  var CHANNEL = {
    'Context':              'one question, only when it cannot tell where he is',
    'Keeping track':        'his own words and three questions at 06:30; the list when he asks',
    'Staying up to date':   'the mail card at 06:30, /inbox when he asks, /lately in public',
    'Topically suggesting': 'a line at 06:30, the flight-day messages, the page, when he asks',
    'Self-healing':         'a count at 06:30, and the health page'
  };

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

  /* Layer first, then place within it: context lands, then the three that read
     it, then the watcher. */
  function delayOf(tile) {
    var c = colOf(tile), r = rowOf(tile);
    var lay = (r === WATCHED_ROW) ? 2 : c - 1;
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
    var p = make('p', 'flow-head' + (h[2] ? ' ' + h[2] : ''), h[1]);
    p.style.setProperty('--fc', h[0]);
    block.appendChild(p);
  });
  /* Beside the watcher, in the column it leaves empty — a label that costs no
     height, which is what keeps the drawing above the fold. */
  block.appendChild(make('p', 'flow-head flow-head--watch', 'watching'));

  /* The channel, as a second line on the tile's own card, naming the surface
     its arrow points at so the words and the arrow always agree. */
  Object.keys(CHANNEL).forEach(function (name) {
    var tile = tiles[name];
    if (!tile) return;
    var card = tile.querySelector('.note');
    if (!card) return;
    card.appendChild(make('span', 'note-reach', CHANNEL[name]));
  });

  /* The fourth column. Ordered so each one sits near the tiles that feed it,
     and spread down the whole height of the drawing by the flex column. */
  var surfBox = make('div', 'flow-surfs');
  var surfEl = {};
  var busiest = SURFACES.map(function (sf) {
    return FEEDS.filter(function (f) { return f[1] === sf[0]; }).length;
  }).reduce(function (a, b) { return Math.max(a, b); }, 0);
  SURFACES.forEach(function (sf) {
    var n = make('div', 'flow-surf');
    var count = FEEDS.filter(function (f) { return f[1] === sf[0]; }).length;
    if (count === busiest) n.classList.add('flow-surf--busy');
    n.appendChild(make('b', '', sf[1]));
    n.appendChild(make('i', '', sf[2]));
    surfBox.appendChild(n);
    surfEl[sf[0]] = n;
  });
  block.appendChild(surfBox);

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
  var lines = [];     // { tile, surf, path, tip, pulse }
  var TIP = 6;        // how far short of the tile a connector stops

  function unlitAll() {
    svg.classList.remove('is-surf');
    lines.forEach(function (l) {
      l.path.classList.remove('is-lit', 'is-dim');
      if (l.tip) l.tip.classList.remove('is-lit', 'is-dim');
    });
    Object.keys(surfEl).forEach(function (k) { surfEl[k].classList.remove('is-lit', 'is-dim'); });
  }

  function drawWires() {
    while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild);
    wires = [];

    /* Measure first, attach after. A path's length and points come from its own
       data, so they can be read while it is still detached — reading them back
       after appending made the document flush layout once per wire, and there
       are three dozen wires plus the surface lines. Same drawing, one flush. */
    var pending = document.createDocumentFragment();

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
        if (withDot) {
          dot = svgEl('circle', 'flow-dot ' + groupOf(target.tile));
          dot.setAttribute('r', '2.5');
          dot.setAttribute('opacity', '0');
        }
      }
      pending.appendChild(path);
      if (tip) pending.appendChild(tip);
      if (dot) pending.appendChild(dot);
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

    /* --------------------------------------------- and out to the surfaces -- */

    /* Warm ink, arrowheads, and drawn last \u2014 so the picture assembles in the
       order the story happens: what comes in, what is made of it, what reads
       it, and only then what he actually gets. */
    lines = [];
    FEEDS.forEach(function (f) {
      var a = boxOf(f[0]);
      var node = surfEl[f[1]];
      if (!a || !node) return;
      var nr = node.getBoundingClientRect();
      var sx = a.x + a.w + 1, sy = a.y + a.h / 2;
      var ex = nr.left - br.left - 6, ey = nr.top - br.top + nr.height / 2;
      var k = Math.max(26, (ex - sx) * 0.44);
      var d = 'M' + r1(sx) + ' ' + r1(sy) +
              ' C' + r1(sx + k) + ' ' + r1(sy) + ' ' + r1(ex - k) + ' ' + r1(ey) +
              ' ' + r1(ex) + ' ' + r1(ey);
      var path = svgEl('path', 'flow-line');
      path.setAttribute('d', d);
      var len = 0;
      try { len = path.getTotalLength(); } catch (e) { len = 0; }
      var tip = svgEl('path', 'flow-line-tip');
      tip.setAttribute('d', 'M0 0 L-5 -2.8 L-5 2.8 Z');
      tip.setAttribute('transform', 'translate(' + r1(ex) + ',' + r1(ey) + ')');
      var pulse = null;
      if (f[1] === 'morning' && len > 8) {
        pulse = svgEl('circle', 'flow-pulse');
        pulse.setAttribute('r', '2.2');
      }
      pending.appendChild(path);
      pending.appendChild(tip);
      if (pulse) pending.appendChild(pulse);
      lines.push({ tile: f[0], surf: f[1], path: path, tip: tip, pulse: pulse, len: len });
    });

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

    svg.appendChild(pending);            /* the single flush */

    /* A carrying edge draws itself, tip first at the end. The watcher's edges
       do not draw: they are dashed and they fade up, because what runs along
       them is attention, not data. */
    var quiet = still(), n = 0;
    lines.forEach(function (l, i) {
      l.delay = quiet ? 0 : 420 + i * 22;
      l.path.style.strokeDasharray = l.len ? l.len + 'px' : 'none';
      l.path.style.strokeDashoffset = quiet ? '0' : (l.len ? l.len + 'px' : '0');
      if (l.tip) l.tip.style.opacity = quiet ? '' : '0';
    });
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
    lines.forEach(function (l) {
      l.path.style.transition = 'stroke-dashoffset 500ms cubic-bezier(.3,.72,.28,1) ' + l.delay + 'ms';
      l.path.style.strokeDashoffset = '0';
      if (l.tip) {
        l.tip.style.transition = 'opacity 240ms ease ' + (l.delay + 340) + 'ms';
        l.tip.style.opacity = '';
      }
    });
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

  var PULSE = 5200;

  function tick(now) {
    if (!open) { raf = null; return; }
    /* One slow pulse down each strand of the rope into the 06:30 message \u2014
       about as often as it deserves. */
    for (var j = 0; j < lines.length; j++) {
      var l = lines[j];
      if (!l.pulse || !l.len) continue;
      var pu = (((now - t0) / PULSE) + j * 0.06) % 1;
      if (pu > 0.5) { l.pulse.setAttribute('opacity', '0'); continue; }
      var pv = pu / 0.5;
      var pp = l.path.getPointAtLength(pv * l.len);
      l.pulse.setAttribute('transform', 'translate(' + r1(pp.x) + ',' + r1(pp.y) + ')');
      l.pulse.setAttribute('opacity', (Math.min(1, Math.min(pv, 1 - pv) * 5) * 0.8).toFixed(2));
    }
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
    lines.forEach(function (l) { if (l.pulse) l.pulse.setAttribute('opacity', '0'); });
  }

  /* ------------------------------------------------------------- the flight -- */

  var open = false;
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearLater() { timers.forEach(clearTimeout); timers = []; }

  function settle(movers) {
    movers.forEach(function (m) {
      m.style.transition = ''; m.style.transform = ''; m.style.opacity = '';
    });
  }

  /* There is no wall to fly out of any more. The tiles arrive out of the
     depth: converged on the middle of where the diagram will be and scaled
     back, then out to their places with the same stagger as before - context
     first, the watcher last - and they leave the same way. */
  var FAR = 0.52;

  function farFrom(rects, i, cx, cy) {
    var r = rects[i];
    var dx = (r.left + r.width / 2 - cx) * (FAR - 1);
    var dy = (r.top + r.height / 2 - cy) * (FAR - 1);
    return 'translate(' + r1(dx) + 'px,' + r1(dy) + 'px) scale(' + FAR + ')';
  }

  function measureFar() {
    var rects = flock.map(function (m) { return m.getBoundingClientRect(); });
    var br = block.getBoundingClientRect();
    return { rects: rects, cx: br.left + br.width / 2, cy: br.top + br.height / 2 };
  }

  function setFlow(on, animate) {
    if (on === open) return;
    if (window.kahranWall && window.kahranWall.hideNote) window.kahranWall.hideNote();
    clearLater();
    stopDots();
    open = on;

    if (bullet) bullet.setAttribute('aria-expanded', on ? 'true' : 'false');

    var quiet = still() || !animate;
    var done = FLIGHT + MAX_DELAY;
    if (!quiet && window.kahranBusy) {
      window.kahranBusy.hold();                       /* solid tint while it flies */
      later(function () { window.kahranBusy.release(); }, done + 80);
    }

    if (on) {
      settle(flock);
      layer.classList.add('is-flow');
      layer.classList.remove('is-landed');
      drawWires();

      if (quiet) { layer.classList.add('is-landed'); runWires(); startDots(); return; }

      var m0 = measureFar();
      flock.forEach(function (m, i) {
        m.style.transition = 'none';
        m.style.transform = farFrom(m0.rects, i, m0.cx, m0.cy);
        m.style.opacity = '0';
      });
      void block.offsetWidth;

      layer.classList.add('is-flying');
      flock.forEach(function (m) {
        var d = delayOf(m);
        m.style.transition = 'transform ' + FLIGHT + 'ms cubic-bezier(.2,.8,.2,1) ' + d + 'ms, ' +
                             'opacity ' + Math.round(FLIGHT * 0.62) + 'ms ease ' + d + 'ms';
        m.style.transform = '';
        m.style.opacity = '';
      });
      later(function () { layer.classList.remove('is-flying'); settle(flock); }, done + 60);
      later(function () { layer.classList.add('is-landed'); runWires(); }, done - 180);
      later(startDots, done + 420);
      return;
    }

    unlitAll();
    /* the layout only drops once they have gone, or there would be nothing
       left on screen to animate away */
    if (quiet) {
      layer.classList.remove('is-flow', 'is-landed', 'is-flying');
      settle(flock);
      return;
    }
    var m1 = measureFar();
    layer.classList.add('is-flying');
    layer.classList.remove('is-landed');
    flock.forEach(function (m, i) {
      var d = MAX_DELAY - delayOf(m);
      m.style.transition = 'transform ' + FLIGHT + 'ms cubic-bezier(.2,.8,.2,1) ' + d + 'ms, ' +
                           'opacity ' + Math.round(FLIGHT * 0.62) + 'ms ease ' + d + 'ms';
      m.style.transform = farFrom(m1.rects, i, m1.cx, m1.cy);
      m.style.opacity = '0';
    });
    later(function () {
      layer.classList.remove('is-flow', 'is-flying', 'is-landed');
      settle(flock);
    }, done + 60);
  }

  /* ------------------------------------------------------------- the door -- */

  /* The first line of "Right now I am:" is the door. Hovering it brings the
     diagram in; leaving the line AND the diagram takes it away, after a grace
     so that crossing the gap between them does not close it. */
  var GRACE = 250;
  var graceTimer = null;
  function holdOpen() { clearTimeout(graceTimer); }
  function leaveSoon() {
    clearTimeout(graceTimer);
    graceTimer = setTimeout(function () { setFlow(false, true); }, GRACE);
  }

  if (bullet) {
    var canHover = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
    if (canHover) {
      bullet.addEventListener('mouseenter', function () { holdOpen(); setFlow(true, true); });
      if (region) {
        region.addEventListener('mouseenter', holdOpen);
        region.addEventListener('mouseleave', leaveSoon);
      }
    }
    bullet.addEventListener('focus', function () {
      if (!bullet.matches || bullet.matches(':focus-visible')) { holdOpen(); setFlow(true, true); }
    });
    /* touch: the line is a toggle, and a tap anywhere else puts it away */
    bullet.addEventListener('click', function (e) {
      e.preventDefault();
      holdOpen();
      setFlow(!open, true);
    });
    document.addEventListener('pointerdown', function (e) {
      if (open && region && !region.contains(e.target)) { holdOpen(); setFlow(false, true); }
    });
  }

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
    if (bullet) bullet.focus();
  });

  /* Touch a tile and the lines out of it light; touch a surface and everything
     that lands there lights while the rest steps back \u2014 which is how you see,
     in one gesture, that six separate jobs all come out as one message. */
  (function surfaceHover() {
    function mark(pick) {
      if (!pick) { unlitAll(); return; }
      svg.classList.add('is-surf');
      lines.forEach(function (l) {
        var on = pick(l);
        l.path.classList.toggle('is-lit', on);
        l.path.classList.toggle('is-dim', !on);
        if (l.tip) { l.tip.classList.toggle('is-lit', on); l.tip.classList.toggle('is-dim', !on); }
      });
    }
    Object.keys(surfEl).forEach(function (id) {
      var node = surfEl[id];
      function on() {
        mark(function (l) { return l.surf === id; });
        Object.keys(surfEl).forEach(function (k) {
          surfEl[k].classList.toggle('is-lit', k === id);
          surfEl[k].classList.toggle('is-dim', k !== id);
        });
      }
      node.addEventListener('mouseenter', on);
      node.addEventListener('mouseleave', unlitAll);
      node.setAttribute('tabindex', '0');
      node.addEventListener('focus', on);
      node.addEventListener('blur', unlitAll);
    });
    Object.keys(tiles).forEach(function (name) {
      var tile = tiles[name];
      function on() {
        if (!lines.some(function (l) { return l.tile === name; })) return;
        mark(function (l) { return l.tile === name; });
        var hit = {};
        lines.forEach(function (l) { if (l.tile === name) hit[l.surf] = 1; });
        Object.keys(surfEl).forEach(function (k) {
          surfEl[k].classList.toggle('is-lit', !!hit[k]);
          surfEl[k].classList.toggle('is-dim', !hit[k]);
        });
      }
      tile.addEventListener('mouseenter', on);
      tile.addEventListener('mouseleave', unlitAll);
      tile.addEventListener('focus', on);
      tile.addEventListener('blur', unlitAll);
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
      if (!quiet) {
        wires.forEach(function (w) {
          w.path.style.strokeDashoffset = '0';
          w.path.style.opacity = '';
          if (w.tip) w.tip.style.opacity = '';
        });
        lines.forEach(function (l) {
          l.path.style.strokeDashoffset = '0';
          if (l.tip) l.tip.style.opacity = '';
        });
      }
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
