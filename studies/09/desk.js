// The desk's one job on the client: send a pick to studies/server.cjs, which
// writes picks.json and rebuilds this page. Without the server (or JS) the page
// still shows the picks as they were at the last build.
(() => {
  const send = async (line, pick) => {
    const r = await fetch('/api/study-09/pick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ line, pick }) });
    if (r.status === 204) location.reload();
  };
  document.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => send(b.dataset.line, { from: b.dataset.from, i: +b.dataset.i })));
  document.querySelectorAll('.none').forEach((b) => b.addEventListener('click', () => send(b.dataset.line, null)));
  document.querySelectorAll('form.edit').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); send(f.dataset.line, { edit: f.elements.edit.value }); }));
})();
