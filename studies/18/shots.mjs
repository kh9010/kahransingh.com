#!/usr/bin/env node
// Screenshots of each variant at 1440x900 and 390x844, first screen and full page, into studies/18/shots/.
// node studies/18/shots.mjs [port]   (serves the site root with python3 -m http.server, stops it after)
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..'), OUT = path.join(HERE, 'shots');
const PORT = +process.argv[2] || 8818, CDP_PORT = PORT + 1000;
const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell');
const shell = readdirSync(base).sort().reverse().map((v) => path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')).find(existsSync);
if (!shell) { console.error('no chrome-headless-shell'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', '--hide-scrollbars', `--remote-debugging-port=${CDP_PORT}`, 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} };
process.on('exit', cleanup);

let tabs;
for (let i = 0; i < 100 && !tabs; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json(); } catch { await sleep(100); } }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (e) => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result.value;
await send('Page.enable');

const files = [];
for (const v of ['', 'a', 'b', 'c', 'd']) {
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/studies/18/${v ? '?v=' + v : ''}` });
    await sleep(400);
    await evaluate('document.fonts.ready.then(() => Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete || new Promise(r => { i.onload = i.onerror = r }))))');
    await sleep(300);
    const name = `${v || 'ask'}-${tag}`;
    const overflow = await evaluate('document.documentElement.scrollWidth > innerWidth');
    if (overflow) console.log(`WARN ${name}: horizontal scroll`);
    writeFileSync(path.join(OUT, `${name}.png`), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    files.push(`${name}.png`);
    if (!v) continue;
    const full = await evaluate('Math.ceil(document.documentElement.scrollHeight)');
    writeFileSync(path.join(OUT, `${name}-full.png`), Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: full, scale: 1 } })).data, 'base64'));
    files.push(`${name}-full.png (${full}px)`);
  }
}
console.log(files.join('\n'));
ws.close(); cleanup(); process.exit(0);
