// ============================================================================
//  THE SOUND GARDEN — the PITCH CORE (extracted, the sole authority for a note's
//  pitch). Pure, dependency-free. This is the ONE place the equal-temperament
//  anchor literal (MIDDLE_C_HZ) and the semitone→frequency law live.
//
//  WHY IT EXISTS.  The Butterfly's Voice bench (butterfly-voice/) IMPORTS
//  semiToFreq + noteName from HERE, so the pitch that *generates* a note and the
//  pitch the FFT bin *recovers* are computed from ONE function — never two
//  re-typed copies. The bench's page inlines a BYTE-TWIN of the block between the
//  sentinels below, and the Node twin re-extracts that slice and asserts it is
//  char-for-char this module (so "self-test green" can't drift). An
//  anti-circularity grep in the Node twin confirms the digit-literals of the
//  pitch law (261.625565, 1.05946…) appear ONLY in this file.
//
//  NOT YET RETROFITTED into the six instruments (curator touch, out of scope) —
//  this module is the authority the bench imports; the instruments keep their own
//  inline pitch math for now. A future curation pass can single-source them too.
// ============================================================================

// ===== PITCH CORE (inlined byte-twin) BEGIN =====
const MIDDLE_C_HZ = 261.625565;            // the ONE pitch anchor literal
function semiToFreq(semi){ return MIDDLE_C_HZ * Math.pow(2, semi/12); }
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function noteName(semi){ const o=4+Math.floor(semi/12); const i=((semi%12)+12)%12; return NOTE_NAMES[i]+o; }
// ===== PITCH CORE END =====

export { semiToFreq, noteName, MIDDLE_C_HZ };
