/* ═══════════════════════════════════════════════════════════════════════════
   tools/png — write a PNG from Node, with no dependencies.

   Why this exists: a maker who is growing a field, a crystal, a terrain or a
   texture in a Node twin cannot SEE it. `console.log` of a Float32Array is not
   a look. This writes a real PNG that the Read tool renders, so you can grow a
   thing in a loop, dump a contact sheet, and actually look at all nine of them
   before you spend an hour tuning the wrong knob.

   Zero dependencies: node:zlib for the deflate, a 256-entry CRC table for the
   chunks. Nothing here is estate-specific and nothing here ships to a browser.

     import { writePNG, gray, contactSheet } from '../tools/png/png.mjs';
     writePNG('out.png', { w, h, rgba });          // rgba = Uint8Array w*h*4
     writePNG('out.png', gray(w, h, floats, max)); // a scalar field, viridis-ish
     writePNG('sheet.png', contactSheet(tiles, cols, pad));

   ═══════════════════════════════════════════════════════════════════════════ */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Encode an RGBA8 image to a PNG Buffer. `img` = {w, h, rgba}. */
export function encodePNG({ w, h, rgba }) {
  if (rgba.length !== w * h * 4) throw new Error(`rgba is ${rgba.length}, expected ${w * h * 4}`);
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;                       // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4)
      .copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Write a PNG to disk. Returns the path. */
export function writePNG(path, img) { writeFileSync(path, encodePNG(img)); return path; }

/* ── field → image helpers ──────────────────────────────────────────────── */

/** A scalar field as a cold→hot ramp. `max` defaults to the field's own max. */
export function gray(w, h, field, max = null) {
  let m = max;
  if (m == null) { m = 0; for (let i = 0; i < field.length; i++) if (field[i] > m) m = field[i]; }
  if (!(m > 0)) m = 1;
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = Math.max(0, Math.min(1, field[i] / m));
    // a simple perceptual-ish ramp: black → indigo → cyan → white
    const r = Math.round(255 * Math.min(1, Math.max(0, 1.6 * v - 0.6)) ** 0.9);
    const g = Math.round(255 * Math.min(1, Math.max(0, 1.35 * v - 0.15)) ** 0.85);
    const b = Math.round(255 * Math.min(1, 0.35 + 1.1 * v - 0.45 * v * v));
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b * (v > 0.002 ? 1 : 0); rgba[i * 4 + 3] = 255;
  }
  return { w, h, rgba };
}

/** Lay images out in a grid. `tiles` = [{w,h,rgba}], all the same size. */
export function contactSheet(tiles, cols = 3, pad = 6, bg = [10, 12, 18]) {
  if (!tiles.length) throw new Error('no tiles');
  const tw = tiles[0].w, th = tiles[0].h;
  const rows = Math.ceil(tiles.length / cols);
  const w = cols * tw + (cols + 1) * pad, h = rows * th + (rows + 1) * pad;
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = bg[0]; rgba[i * 4 + 1] = bg[1]; rgba[i * 4 + 2] = bg[2]; rgba[i * 4 + 3] = 255;
  }
  tiles.forEach((t, i) => {
    const cx = pad + (i % cols) * (tw + pad), cy = pad + Math.floor(i / cols) * (th + pad);
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
      const s = (y * tw + x) * 4, d = ((cy + y) * w + (cx + x)) * 4;
      rgba[d] = t.rgba[s]; rgba[d + 1] = t.rgba[s + 1]; rgba[d + 2] = t.rgba[s + 2]; rgba[d + 3] = 255;
    }
  });
  return { w, h, rgba };
}
