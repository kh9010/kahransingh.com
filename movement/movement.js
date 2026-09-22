/* kahransingh.com — /movement/
   One job: turn the three worked days into a tab strip.

   The three panels are complete, static HTML and all three are readable with
   this file absent or broken — that is the point of doing it this way rather
   than rendering them from data. Here we only hide two of them at a time and
   put the ARIA that a real tab strip needs on top, which is why the tab row
   starts hidden in the markup: a tablist that JavaScript never wired would be
   a lie told to a screen reader. */

(function () {
  'use strict';

  var tabRow = document.querySelector('.day-tabs');
  if (!tabRow) return;

  var buttons = Array.prototype.slice.call(tabRow.querySelectorAll('button[data-target]'));
  var panels = buttons.map(function (b) { return document.getElementById(b.dataset.target); });
  if (!buttons.length || panels.indexOf(null) !== -1) return;

  tabRow.setAttribute('role', 'tablist');
  tabRow.setAttribute('aria-label', 'Example days');
  tabRow.hidden = false;

  buttons.forEach(function (b, i) {
    var panel = panels[i];
    b.id = b.dataset.target + '-tab';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', b.id);
    /* Each panel's own heading is now the tab's label, so it would be read twice. */
    var h = panel.querySelector('h3');
    if (h) h.hidden = true;
  });

  function select(i, moveFocus) {
    buttons.forEach(function (b, j) {
      var on = i === j;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (moveFocus) buttons[i].focus();
  }

  buttons.forEach(function (b, i) {
    b.addEventListener('click', function () { select(i, false); });
    b.addEventListener('keydown', function (e) {
      var to = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % buttons.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i - 1 + buttons.length) % buttons.length;
      if (e.key === 'Home') to = 0;
      if (e.key === 'End') to = buttons.length - 1;
      if (to === null) return;
      e.preventDefault();
      select(to, true);
    });
  });

  select(0, false);
})();
