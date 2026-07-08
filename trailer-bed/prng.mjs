// Seeded mulberry32 — the estate's standard deterministic PRNG (same recipe as
// the-gate/audio-*.js builders). The composition path NEVER touches
// Math.random or Date.now; every random decision flows from the manifest seed.

export function mulberry32(seed){
  let s = (seed >>> 0) || 1;
  return function(){
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// stable integer mixer for deriving per-event sub-seeds from (seed, index)
export function hash2(a, b){
  let h = (a | 0) ^ 0x9E3779B9;
  h = Math.imul(h ^ (b | 0), 0x85EBCA6B);
  h ^= h >>> 13;
  h = Math.imul(h, 0xC2B2AE35);
  h ^= h >>> 16;
  return h >>> 0;
}
