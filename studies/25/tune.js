// Loads defaults.json into CSS variables; on localhost with ?tune, a panel edits them and saves.
(async () => {
  const root = document.documentElement, study = location.pathname.match(/studies\/(\d\d)\//)?.[1];
  let d = {};
  try { d = await (await fetch('defaults.json', { cache: 'no-store' })).json(); } catch {}
  const apply = () => { for (const [k, v] of Object.entries(d)) root.style.setProperty('--' + k, String(v)); };
  apply();
  if (!/[?&]tune\b/.test(location.search) || !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  const panel = document.createElement('form');
  panel.className = 'hs-panel tune';
  panel.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:260px;z-index:99;background:#fff;border-left:1px solid #e0ddd8;padding:16px;font:400 .78rem/1.4 "Space Grotesk",sans-serif;color:#1a1a1a;overflow:auto;display:grid;grid-template-columns:1fr 92px;gap:6px 8px;align-content:start;font-variant-numeric:tabular-nums';
  let t;
  const save = () => { clearTimeout(t); t = setTimeout(() => fetch('/__tune?study=' + study, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }).catch(() => {}), 250); };
  for (const k of Object.keys(d)) {
    const label = document.createElement('label'); label.textContent = k.replace(/-/g, ' ');
    const m = /^(-?[\d.]+)([a-z%]*)$/.exec(String(d[k]));
    const input = document.createElement('input');
    if (m) { input.type = 'number'; input.value = m[1]; input.step = /\./.test(m[1]) ? '0.05' : '1'; }
    else if (/^#[0-9a-f]{3,8}$/i.test(String(d[k]))) { input.type = 'color'; input.value = d[k]; }
    else { input.type = 'text'; input.value = d[k]; }
    input.style.cssText = 'width:100%;font:inherit;border:1px solid #e0ddd8;border-radius:4px;padding:2px 4px;accent-color:#1a1a1a';
    input.oninput = () => { d[k] = m ? input.value + m[2] : input.value; apply(); save(); };
    panel.append(label, input);
  }
  document.body.append(panel);
})();
