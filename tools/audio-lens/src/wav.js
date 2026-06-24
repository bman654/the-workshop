/* ============================================================================
   Audio Lens — zero-dependency WAV I/O.
   readWav(path|Buffer) -> { samples: Float32Array (mono), sampleRate }
   writeWav(path, samples, sampleRate) -> writes 16-bit PCM mono WAV.
   Replaces the browser's decodeAudioData + downmix path.
   ============================================================================ */

import { readFileSync, writeFileSync } from "node:fs";

const WAVE_FORMAT_PCM = 1;
const WAVE_FORMAT_IEEE_FLOAT = 3;
const WAVE_FORMAT_EXTENSIBLE = 0xFFFE;

function fourcc(buf, off) {
  return String.fromCharCode(buf[off], buf[off + 1], buf[off + 2], buf[off + 3]);
}

/* ---------------------------------------------------------------------------
   Parse a RIFF/WAVE buffer into mono Float32Array at the file's native rate.
   --------------------------------------------------------------------------- */
export function decodeWav(buf) {
  if (buf.length < 12) throw new Error("WAV too short: not a RIFF file");
  if (fourcc(buf, 0) !== "RIFF") {
    throw new Error("Not a RIFF/WAV file (missing 'RIFF' magic). For other formats, convert first: ffmpeg -i in.mp3 out.wav");
  }
  if (fourcc(buf, 8) !== "WAVE") {
    throw new Error("Not a WAVE file (RIFF type is not 'WAVE')");
  }

  let fmt = null;
  let dataOffset = -1, dataLength = 0;

  // walk chunks starting at byte 12
  let p = 12;
  while (p + 8 <= buf.length) {
    const id = fourcc(buf, p);
    const size = buf.readUInt32LE(p + 4);
    const body = p + 8;
    if (id === "fmt ") {
      if (body + 16 > buf.length) throw new Error("Truncated 'fmt ' chunk");
      let audioFormat = buf.readUInt16LE(body);
      const numChannels = buf.readUInt16LE(body + 2);
      const sampleRate = buf.readUInt32LE(body + 4);
      const bitsPerSample = buf.readUInt16LE(body + 14);
      // WAVE_FORMAT_EXTENSIBLE: real format is in the sub-format GUID's first 2 bytes
      if (audioFormat === WAVE_FORMAT_EXTENSIBLE && size >= 26 && body + 26 <= buf.length) {
        audioFormat = buf.readUInt16LE(body + 24);
      }
      fmt = { audioFormat, numChannels, sampleRate, bitsPerSample };
    } else if (id === "data") {
      dataOffset = body;
      // clamp declared size to what's actually present (tolerate slight over-declaration)
      dataLength = Math.min(size, buf.length - body);
    }
    // chunks are word-aligned (padded to even length)
    p = body + size + (size & 1);
  }

  if (!fmt) throw new Error("WAV missing 'fmt ' chunk");
  if (dataOffset < 0) throw new Error("WAV missing 'data' chunk");

  const { audioFormat, numChannels, sampleRate, bitsPerSample } = fmt;
  if (numChannels < 1) throw new Error("WAV has zero channels");

  if (audioFormat !== WAVE_FORMAT_PCM && audioFormat !== WAVE_FORMAT_IEEE_FLOAT) {
    throw new Error(
      `Unsupported WAV audioFormat ${audioFormat} (only PCM int and IEEE float are supported; ` +
      `compressed/ADPCM not handled). Convert first: ffmpeg -i in.wav -c:a pcm_s16le out.wav`
    );
  }

  const bytesPerSample = bitsPerSample / 8;
  const frameSize = bytesPerSample * numChannels;
  if (frameSize === 0) throw new Error("WAV has invalid block alignment (0 bytes per frame)");
  const numFrames = Math.floor(dataLength / frameSize);
  if (numFrames === 0) throw new Error("WAV 'data' chunk contains no complete sample frames");

  const mono = new Float32Array(numFrames);

  // per-sample reader → [-1, 1]
  let readSample;
  if (audioFormat === WAVE_FORMAT_IEEE_FLOAT) {
    if (bitsPerSample === 32) {
      readSample = (off) => buf.readFloatLE(off);
    } else if (bitsPerSample === 64) {
      readSample = (off) => buf.readDoubleLE(off);
    } else {
      throw new Error(`Unsupported IEEE float bit depth: ${bitsPerSample} (expected 32 or 64)`);
    }
  } else {
    // PCM int
    if (bitsPerSample === 16) {
      readSample = (off) => buf.readInt16LE(off) / 32768;
    } else if (bitsPerSample === 24) {
      // 3-byte little-endian, sign-extend, /8388608
      readSample = (off) => {
        let v = buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16);
        if (v & 0x800000) v |= ~0xFFFFFF; // sign-extend bit 23
        return v / 8388608;
      };
    } else if (bitsPerSample === 32) {
      readSample = (off) => buf.readInt32LE(off) / 2147483648;
    } else if (bitsPerSample === 8) {
      // 8-bit PCM WAV is unsigned (0..255), centered at 128
      readSample = (off) => (buf[off] - 128) / 128;
    } else {
      throw new Error(`Unsupported PCM bit depth: ${bitsPerSample} (expected 8/16/24/32)`);
    }
  }

  // downmix to mono by averaging channels (mirror the browser tool)
  for (let f = 0; f < numFrames; f++) {
    const base = dataOffset + f * frameSize;
    let sum = 0;
    for (let c = 0; c < numChannels; c++) {
      sum += readSample(base + c * bytesPerSample);
    }
    mono[f] = sum / numChannels;
  }

  return { samples: mono, sampleRate, numChannels, bitsPerSample, audioFormat };
}

export function readWav(path) {
  const buf = readFileSync(path);
  return decodeWav(buf);
}

/* ---------------------------------------------------------------------------
   Encode mono Float32Array → 16-bit PCM WAV Buffer (proves wav.js reads what
   we write). Clamps to [-1, 1].
   --------------------------------------------------------------------------- */
export function encodeWav16(samples, sampleRate) {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const dataLength = numSamples * bytesPerSample;
  const buf = Buffer.alloc(44 + dataLength);

  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataLength, 4);
  buf.write("WAVE", 8, "ascii");

  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);                 // fmt chunk size
  buf.writeUInt16LE(WAVE_FORMAT_PCM, 20);    // audioFormat = PCM
  buf.writeUInt16LE(1, 22);                  // numChannels = mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * bytesPerSample, 28); // byteRate
  buf.writeUInt16LE(bytesPerSample, 32);     // blockAlign
  buf.writeUInt16LE(16, 34);                 // bitsPerSample

  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataLength, 40);

  let off = 44;
  for (let i = 0; i < numSamples; i++) {
    let v = samples[i];
    if (v > 1) v = 1; else if (v < -1) v = -1;
    // round-trip-safe 16-bit conversion
    const s = v < 0 ? Math.max(-32768, Math.round(v * 32768)) : Math.min(32767, Math.round(v * 32767));
    buf.writeInt16LE(s, off);
    off += 2;
  }
  return buf;
}

export function writeWav(path, samples, sampleRate) {
  writeFileSync(path, encodeWav16(samples, sampleRate));
}
