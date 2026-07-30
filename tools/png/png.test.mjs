/* tools/png — the Node twin.   node tools/png/png.test.mjs
   A PNG writer nobody checks is a PNG writer that silently emits a file no
   viewer will open. This decodes what it just wrote, all the way back to the
   pixels, without using the encoder to do it. */

import { inflateSync } from 'node:zlib';
import { encodePNG, gray, contactSheet } from './png.mjs';

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { c ? (pass++, console.log('  ✓ ' + n + (d ? '  ' + d : '')))
                                 : (fail++, console.log('  ✗ ' + n + '  ' + d)); };

/* an independent chunk reader — deliberately not sharing code with the writer */
function chunks(buf) {
  const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const sigOK = sig.every((b, i) => buf[i] === b);
  const out = []; let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    const crc = buf.readUInt32BE(p + 8 + len);
    out.push({ type, data, crc, body: buf.subarray(p + 4, p + 8 + len) });
    p += 12 + len;
  }
  return { sigOK, out };
}
function crc32(b) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) {
    c ^= b[i];
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

console.log('\ntools/png — writing a PNG and reading it back');
{
  const w = 7, h = 5, rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = (i * 7) & 255; rgba[i * 4 + 1] = (i * 13) & 255;
    rgba[i * 4 + 2] = (255 - i * 3) & 255; rgba[i * 4 + 3] = 255;
  }
  const png = encodePNG({ w, h, rgba });
  const { sigOK, out } = chunks(png);
  ok('the eight-byte PNG signature is right', sigOK);
  ok('the chunks are IHDR, IDAT, IEND in order',
    out.map(c => c.type).join(',') === 'IHDR,IDAT,IEND', out.map(c => c.type).join(','));
  ok('every chunk CRC checks out', out.every(c => crc32(c.body) === c.crc));

  const ih = out[0].data;
  ok('IHDR reports the size we asked for', ih.readUInt32BE(0) === w && ih.readUInt32BE(4) === h);
  ok('8-bit RGBA, no interlace', ih[8] === 8 && ih[9] === 6 && ih[12] === 0);

  const raw = inflateSync(out[1].data);
  ok('the inflated scanlines are the right length', raw.length === h * (w * 4 + 1),
    raw.length + ' bytes');
  let same = true, filters = true;
  for (let y = 0; y < h; y++) {
    if (raw[y * (w * 4 + 1)] !== 0) filters = false;
    for (let x = 0; x < w * 4; x++) {
      if (raw[y * (w * 4 + 1) + 1 + x] !== rgba[y * w * 4 + x]) same = false;
    }
  }
  ok('every scanline uses filter 0', filters);
  ok('every pixel round-trips byte for byte', same);
}

console.log('\nthe field helpers');
{
  const f = new Float32Array(16); for (let i = 0; i < 16; i++) f[i] = i;
  const img = gray(4, 4, f);
  ok('gray() returns a full RGBA buffer', img.w === 4 && img.h === 4 && img.rgba.length === 64);
  ok('gray() is opaque everywhere', [...Array(16).keys()].every(i => img.rgba[i * 4 + 3] === 255));
  const lo = img.rgba[1 * 4] + img.rgba[1 * 4 + 1] + img.rgba[1 * 4 + 2];
  const hi = img.rgba[15 * 4] + img.rgba[15 * 4 + 1] + img.rgba[15 * 4 + 2];
  ok('a bigger value is a brighter pixel', hi > lo, hi + ' vs ' + lo);
  ok('gray() survives an all-zero field', gray(2, 2, new Float32Array(4)).rgba.length === 16);

  const t = { w: 4, h: 4, rgba: new Uint8Array(64).fill(200) };
  const sheet = contactSheet([t, t, t, t, t], 3, 2);
  ok('contactSheet lays out rows and columns',
    sheet.w === 3 * 4 + 4 * 2 && sheet.h === 2 * 4 + 3 * 2, sheet.w + 'x' + sheet.h);
  ok('a tile landed where the grid says', sheet.rgba[(2 * sheet.w + 2) * 4] === 200);
  ok('the gutter is background', sheet.rgba[(0 * sheet.w + 0) * 4] === 10);
  ok('a sheet encodes', encodePNG(sheet).length > 60);
}

{
  let threw = false;
  try { encodePNG({ w: 3, h: 3, rgba: new Uint8Array(10) }); } catch { threw = true; }
  ok('a mis-sized buffer is a loud error, not a corrupt file', threw);
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'FAILURES') + ' — ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail === 0 ? 0 : 1);
