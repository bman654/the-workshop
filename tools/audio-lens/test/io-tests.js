/* ============================================================================
   Audio Lens — I/O tests (node:test). Covers wav.js read paths
   (16/24-bit PCM, float32, stereo downmix, error handling), the WAV
   round-trip, and the PNG encoder signature/structure.
   Run via: node --test
   ============================================================================ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeWav, encodeWav16 } from "../src/wav.js";
import { encodePng } from "../src/png.js";
import { spectrogramPng } from "../src/render.js";
import { analyze } from "../src/analyzers.js";
import { genSine, SR } from "../src/generators.js";

const TEST_SR = 48000; // deliberately not 44100, to prove native-rate passthrough
const DUR = 0.2;
const FREQ = 440;

function refSine(sr, dur, freq) {
  const N = Math.floor(sr * dur);
  const f = new Float64Array(N);
  for (let i = 0; i < N; i++) f[i] = 0.5 * Math.sin(2 * Math.PI * freq * i / sr);
  return f;
}

function wavHeader(buf, audioFormat, numChannels, sampleRate, bitsPerSample, dataLen) {
  buf.write("RIFF", 0, "ascii"); buf.writeUInt32LE(36 + dataLen, 4); buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii"); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(audioFormat, 20); buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  const bytesPer = bitsPerSample / 8;
  buf.writeUInt32LE(sampleRate * bytesPer * numChannels, 28);
  buf.writeUInt16LE(bytesPer * numChannels, 32); buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36, "ascii"); buf.writeUInt32LE(dataLen, 40);
}

test("wav: 16-bit PCM round-trip recovers a 440 sine as A4", () => {
  const samples = genSine(FREQ); // 44100, 4s
  const buf = encodeWav16(samples, SR);
  const r = decodeWav(buf);
  assert.equal(r.sampleRate, SR);
  assert.equal(r.bitsPerSample, 16);
  const a = analyze(r.samples, r.sampleRate, 2048, 512);
  assert.ok(a.monoNote && a.monoNote.name === "A4", `expected A4, got ${a.monoNote && a.monoNote.name}`);
});

test("wav: 24-bit PCM sign-extends and reads at native rate", () => {
  const f = refSine(TEST_SR, DUR, FREQ);
  const N = f.length;
  const dataLen = N * 3;
  const buf = Buffer.alloc(44 + dataLen);
  wavHeader(buf, 1, 1, TEST_SR, 24, dataLen);
  let off = 44;
  for (let i = 0; i < N; i++) {
    let v = Math.round(f[i] * 8388607);
    if (v < 0) v += 0x1000000;
    buf[off] = v & 0xFF; buf[off + 1] = (v >> 8) & 0xFF; buf[off + 2] = (v >> 16) & 0xFF;
    off += 3;
  }
  const r = decodeWav(buf);
  assert.equal(r.sampleRate, TEST_SR);
  assert.equal(r.bitsPerSample, 24);
  let maxErr = 0; for (let i = 0; i < N; i++) maxErr = Math.max(maxErr, Math.abs(r.samples[i] - f[i]));
  assert.ok(maxErr < 1e-4, `24-bit decode error ${maxErr}`);
});

test("wav: IEEE float32 reads raw [-1,1] at native rate", () => {
  const f = refSine(TEST_SR, DUR, FREQ);
  const N = f.length;
  const dataLen = N * 4;
  const buf = Buffer.alloc(44 + dataLen);
  wavHeader(buf, 3, 1, TEST_SR, 32, dataLen);
  let off = 44;
  for (let i = 0; i < N; i++) { buf.writeFloatLE(f[i], off); off += 4; }
  const r = decodeWav(buf);
  assert.equal(r.audioFormat, 3);
  let maxErr = 0; for (let i = 0; i < N; i++) maxErr = Math.max(maxErr, Math.abs(r.samples[i] - f[i]));
  assert.ok(maxErr < 1e-6, `float32 decode error ${maxErr}`);
});

test("wav: stereo downmix averages channels (opposite phase cancels)", () => {
  const f = refSine(TEST_SR, DUR, FREQ);
  const N = f.length;
  const dataLen = N * 2 * 2;
  const buf = Buffer.alloc(44 + dataLen);
  wavHeader(buf, 1, 2, TEST_SR, 16, dataLen);
  let off = 44;
  for (let i = 0; i < N; i++) {
    const s = Math.round(f[i] * 32767);
    buf.writeInt16LE(s, off); buf.writeInt16LE(-s, off + 2); off += 4;
  }
  const r = decodeWav(buf);
  assert.equal(r.numChannels, 2);
  let maxAbs = 0; for (let i = 0; i < N; i++) maxAbs = Math.max(maxAbs, Math.abs(r.samples[i]));
  assert.ok(maxAbs < 1e-3, `opposite-phase downmix should cancel, got ${maxAbs}`);
});

test("wav: rejects non-RIFF input", () => {
  assert.throws(() => decodeWav(Buffer.from("definitely not a wav file here padding")), /RIFF/);
});

test("wav: rejects compressed/ADPCM (audioFormat 2)", () => {
  const buf = Buffer.alloc(44);
  wavHeader(buf, 2, 1, TEST_SR, 16, 0);
  buf.writeUInt32LE(0, 40);
  assert.throws(() => decodeWav(buf), /Unsupported WAV audioFormat/);
});

test("png: encoder emits valid signature + IHDR/IDAT/IEND", () => {
  const w = 4, h = 3;
  const rgba = Buffer.alloc(w * h * 4, 200);
  const png = encodePng(rgba, w, h);
  // 8-byte PNG signature
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  // IHDR chunk type right after the 8-byte sig + 4-byte length
  assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR");
  // IHDR width/height
  assert.equal(png.readUInt32BE(16), w);
  assert.equal(png.readUInt32BE(20), h);
  // contains IDAT and ends with IEND
  assert.ok(png.includes(Buffer.from("IDAT", "ascii")));
  assert.equal(png.subarray(png.length - 8, png.length - 4).toString("ascii"), "IEND");
});

test("render: spectrogramPng produces a valid PNG of expected dimensions", () => {
  const a = analyze(genSine(440), SR, 2048, 512);
  const png = spectrogramPng(a.frames, SR, 2048);
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  assert.equal(png.readUInt32BE(16), 1040); // width
  assert.equal(png.readUInt32BE(20), 300);  // height
});
