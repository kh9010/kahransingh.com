// The date a photograph was taken, read out of the JPEG's own EXIF (DateTimeOriginal, else DateTime).
// No dependency: the APP1 segment, the TIFF header, IFD0, then the Exif sub-IFD. build.mjs and check.mjs share it,
// so the check recounts every year from the file itself, never from what build.mjs wrote.
import { readFileSync } from 'node:fs';

export function taken(file) {
  const b = readFileSync(file);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 < b.length) {
    if (b[i] !== 0xff) return null;
    const mark = b[i + 1], len = b.readUInt16BE(i + 2);
    if (mark === 0xe1 && b.toString('latin1', i + 4, i + 10) === 'Exif\0\0') return tiff(b, i + 10);
    if (mark === 0xda) return null;
    i += 2 + len;
  }
  return null;
}

function tiff(b, t) {
  const le = b.toString('latin1', t, t + 2) === 'II';
  const u16 = (o) => (le ? b.readUInt16LE(t + o) : b.readUInt16BE(t + o));
  const u32 = (o) => (le ? b.readUInt32LE(t + o) : b.readUInt32BE(t + o));
  const ifd = (o) => { const n = u16(o), out = new Map(); for (let k = 0; k < n; k++) { const e = o + 2 + k * 12; out.set(u16(e), { type: u16(e + 2), count: u32(e + 4), at: e + 8 }); } return out; };
  const ascii = (e) => { const off = e.count > 4 ? u32(e.at) : e.at; return b.toString('latin1', t + off, t + off + e.count).replace(/\0+$/, ''); };
  const ifd0 = ifd(u32(4));
  let s = null;
  const sub = ifd0.get(0x8769);
  if (sub) { const ex = ifd(u32(sub.at)); const e = ex.get(0x9003) || ex.get(0x9004); if (e) s = ascii(e); }
  if (!s && ifd0.get(0x0132)) s = ascii(ifd0.get(0x0132));
  const m = /^(\d{4}):(\d\d):(\d\d)/.exec(s || '');
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
