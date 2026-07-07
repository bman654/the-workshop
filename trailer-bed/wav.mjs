// 16-bit PCM stereo WAV writer (same encoding as tools/audio-lens/src/wav.js;
// re-stated here because the prototype lives outside the repo — the in-repo
// port should import encodeWav16 from tools/audio-lens/src/wav.js instead).
import { writeFileSync } from 'node:fs';

export function writeWav16Stereo(path, L, R, sr){
  const N = L.length;
  const pcm = new Int16Array(N * 2);
  for (let i = 0; i < N; i++){
    pcm[2 * i]     = Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767)));
    pcm[2 * i + 1] = Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767)));
  }
  const dataLen = pcm.length * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataLen, 40);
  Buffer.from(pcm.buffer).copy(buf, 44);
  writeFileSync(path, buf);
  return buf.length;
}
