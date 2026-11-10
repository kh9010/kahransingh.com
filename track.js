/* track.js — what people open, sent to the site's Google Analytics as events.
 *
 * Page views come from the gtag snippet every page already carries; this adds
 * the clicks that open something. It listens once on the document and reads the
 * markup, so the page scripts (v2/home.js, v2/flow.js, poems/related.js, the
 * About's word pile) stay as they are. Clicks only: a mouse passing over a
 * tile opens its panel too, and counting that would count the pointer, not a
 * reader. The one exception is the flow view: on a mouse it opens as the
 * pointer reaches its line (and a click there closes it), so it is counted
 * each time it actually opens, from its aria-expanded. Nothing about the
 * visitor goes in an event, only which thing.
 *
 *   idea_open      a tile on the wall            { idea }
 *   idea_link      the page link inside a panel  { idea, link }
 *   flow_open      "how they fit together"       { via: page | link }
 *   note_open      a Right now line's note        { note }
 *   note_link      the link inside that note      { note, link }
 *   quote_pile_tap the About's pile of quotes     { page }
 *   related_poem   a poem's "related" links       { from, to }
 *   photo_open     a photograph opened full size  { photo }
 *                  (by tap, click or keyboard; counted, like the flow view,
 *                  when the photography page's lightbox actually opens)
 *
 * The stone on the home (/v3/stone.js) is drawn on a canvas, so there is no
 * markup to read: it says what opened as a `home:track` event, and only the
 * names below are passed on.
 *   tools_open     one of the six ideas, from its facet        { idea, via: facet | key }
 *   year_open      the year facet: the photograph to its year  { year, via: facet | date }
 *   line_open      the where line opens the chain behind it    { phase }
 *   crossing       a walk into another world                   { via: door | facet | press, depth }
 *   poem_open      the whole poem, from its title or its facet { poem, via: title | facet }
 */
(function () {
  function send(name, params) {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {}
  }
  var HOME_EVENTS = { tools_open: 1, year_open: 1, line_open: 1, crossing: 1, poem_open: 1 };
  document.addEventListener('home:track', function (e) {
    var d = e.detail || {};
    if (HOME_EVENTS[d.name] === 1) send(d.name, d.params);
  });
  function text(node) { return node ? (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100) : ''; }
  function path(href) {
    try { var u = new URL(href, location.href); return u.origin === location.origin ? u.pathname : u.href; }
    catch (e) { return String(href || ''); }
  }
  function slug(p) { return (p || '').replace(/^.*\//, '').replace(/\.html$/, ''); }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var hit;

    if ((hit = t.closest('.idea-trigger'))) {
      send('idea_open', { idea: hit.getAttribute('aria-label') || text(hit.querySelector('.tile-name')) });
    } else if ((hit = t.closest('.idea-detail a[href]'))) {
      var panel = hit.closest('.idea-detail');
      send('idea_link', { idea: text(panel.querySelector('h2, h3, [id$="-title"]')), link: path(hit.href) });
    } else if ((hit = t.closest('.doing-item[data-line] a[href]'))) {
      send('note_link', { note: hit.closest('.doing-item').getAttribute('data-line'), link: path(hit.href) });
    } else if ((hit = t.closest('#word-pile'))) {
      send('quote_pile_tap', { page: location.pathname });
    } else if ((hit = t.closest('.explore-slide a[href]'))) {
      send('related_poem', { from: slug(location.pathname), to: slug(path(hit.href)) });
    }
  }, true);

  // A Right now note: home.js toggles it in its own click handler, so this one
  // listens in the bubble phase, after that, and counts only a tap that left
  // the note open (not the second tap that put it away).
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('.doing-item[data-line] .doing-bullet');
    if (!b) return;
    var item = b.closest('.doing-item');
    if (item.classList.contains('is-open')) send('note_open', { note: item.getAttribute('data-line') });
  });

  var box = document.getElementById('lightbox'), boxImg = document.getElementById('lightbox-img');
  if (box && boxImg && window.MutationObserver) {
    var shown = box.classList.contains('active');
    new MutationObserver(function () {
      var now = box.classList.contains('active');
      if (now && !shown) send('photo_open', { photo: slug(path(boxImg.getAttribute('src') || '')).replace(/\.(jpe?g|png|webp)$/i, '') });
      shown = now;
    }).observe(box, { attributes: true, attributeFilter: ['class'] });
  }

  var door = document.getElementById('doing-tools');
  if (door && window.MutationObserver) {
    var open = function () { return door.getAttribute('aria-expanded') === 'true'; };
    var via = function () { return location.hash === '#flow' ? 'link' : 'page'; };
    var was = open();
    if (was) send('flow_open', { via: via() });   // #flow had already opened it
    new MutationObserver(function () {
      var now = open();
      if (now && !was) send('flow_open', { via: via() });
      was = now;
    }).observe(door, { attributes: true, attributeFilter: ['aria-expanded'] });
  }
})();
