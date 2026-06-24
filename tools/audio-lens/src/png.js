/* ============================================================================
   Audio Lens — zero-dependency PNG encoder.
   Signature + IHDR + IDAT (deflated scanlines, filter byte 0) + IEND.
   Uses Node's built-in zlib.deflateSync. CRC32 via the standard table.
   Replaces the browser's Canvas → toDataURL path.
   ============================================================================ */

import { deflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// standard 256-entry CRC32 table
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/* ---------------------------------------------------------------------------
   Encode an RGBA pixel buffer (Uint8Array/Buffer, length = w*h*4) to PNG bytes.
   colorType 6 = truecolour with alpha, 8-bit.
   --------------------------------------------------------------------------- */
export function encodePng(rgba, width, height) {
  if (rgba.length !== width * height * 4) {
    throw new Error(`encodePng: pixel buffer length ${rgba.length} != ${width}*${height}*4`);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);   // bit depth
  ihdr.writeUInt8(6, 9);   // color type 6 = RGBA
  ihdr.writeUInt8(0, 10);  // compression
  ihdr.writeUInt8(0, 11);  // filter
  ihdr.writeUInt8(0, 12);  // interlace

  // scanlines: each row prefixed with filter byte 0 (None)
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const dst = y * (stride + 1);
    raw[dst] = 0; // filter type: None
    const src = y * stride;
    rgba.copy
      ? rgba.copy(raw, dst + 1, src, src + stride)
      : Buffer.from(rgba.buffer, rgba.byteOffset + src, stride).copy(raw, dst + 1);
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------------------------------------------------------------------------
   A simple mutable RGBA canvas with a few primitives render.js needs.
   --------------------------------------------------------------------------- */
export class Canvas {
  constructor(width, height, bg = [6, 7, 10, 255]) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4);
    this.fill(bg);
  }

  fill([r, g, b, a = 255]) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = a;
    }
  }

  setPixel(x, y, [r, g, b, a = 255]) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.data[idx] = r & 255;
    this.data[idx + 1] = g & 255;
    this.data[idx + 2] = b & 255;
    this.data[idx + 3] = a & 255;
  }

  // vertical line at column x from y0..y1 inclusive
  vline(x, y0, y1, color) {
    if (y0 > y1) { const t = y0; y0 = y1; y1 = t; }
    for (let y = y0; y <= y1; y++) this.setPixel(x, y, color);
  }

  // horizontal line at row y from x0..x1 inclusive
  hline(y, x0, x1, color) {
    if (x0 > x1) { const t = x0; x0 = x1; x1 = t; }
    for (let x = x0; x <= x1; x++) this.setPixel(x, y, color);
  }

  // Bresenham line for polylines (RMS curve)
  line(x0, y0, x1, y1, color) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.setPixel(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  toPng() {
    return encodePng(this.data, this.width, this.height);
  }
}
