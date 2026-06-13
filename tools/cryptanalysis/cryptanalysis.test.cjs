#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   cryptanalysis.test.cjs — the Black Chamber's headless self-test. Requires the
   SAME core the page inlines (tools/cryptanalysis/cryptanalysis.js), so the green
   chip in the browser and this Node run PROVE the identical cryptanalysis. Run:
       node tools/cryptanalysis/cryptanalysis.test.cjs

   The crux this proves — that ciphertext is broken by ANALYSIS ALONE, no key:
     • Caesar — EXACT shift + plaintext recovery on a battery of English texts
       (try every shift; the χ²-minimiser is the key). Trivially correct.
     • Vigenère — EXACT keyword recovery on (nearly) all random keywords len 3–8
       over adequate ciphertext (≥90%), with the IoC identifying the period.
     • Substitution — a seeded hill-climb on a compact bigram model recovers
       ≥90% of letters on long English text (mean accuracy reported).
     • The statistics are correct — IoC(English)≈0.066, IoC(random)≈1/26≈0.0385,
       χ²(English)≪χ²(wrong shift).
     • Determinism — same (ciphertext, seed) ⇒ identical recovery, twice.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const C = require('./cryptanalysis.js');

let pass = 0, total = 0;
const fails = [];
function check(name, cond, note) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (note ? '  — ' + note : '')); }
  else { fails.push(name); console.error('  ✗ FAIL: ' + name + (note ? '  — ' + note : '')); }
}

console.log('Black Chamber self-test\n');

/* ─────────────────────────────────────────────────────────────────────────
   PART A — the shared CORE self-test (the EXACT object the in-page chip runs).
   The green chip must report the same N/N count.
   ───────────────────────────────────────────────────────────────────────── */
const core = C.runSelfTest();
console.log('  [shared core — same code path as the in-page chip: ' + core.n + '/' + core.total + ']');
core.results.forEach((r, i) => {
  check('core #' + (i + 1) + ' ' + r.name, r.pass, r.note);
});

/* ─────────────────────────────────────────────────────────────────────────
   PART B — extra independent assertions + reported metrics (the Node test does
   more than the chip: bigger batteries, explicit numbers).
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [independent assertions + reported metrics]');

/* B1 — Caesar exact recovery rate over a big battery */
(function () {
  let tries = 0, exact = 0;
  for (const text of C.CORPUS) {
    for (let s = 0; s < 26; s++) {
      const br = C.breakCaesar(C.caesarEncrypt(text, s));
      tries++;
      if (br.shift === s && C.clean(br.plaintext) === C.clean(text)) exact++;
    }
  }
  check('Caesar exact-recovery rate = 100%', exact === tries,
    exact + '/' + tries + ' = ' + (100 * exact / tries).toFixed(1) + '%');
})();

/* B2 — Vigenère exact keyword recovery rate + period-ID rate */
(function () {
  const KW = ['THE', 'KEY', 'LEMON', 'CIPHER', 'SECRET', 'SHADOW', 'VICTORY', 'PALIMPSE'];
  let tries = 0, exactKw = 0, lenOk = 0;
  const misses = [];
  for (let ci = 0; ci < C.CORPUS.length; ci++) {
    const plain = C.CORPUS[ci] + ' ' + C.CORPUS[(ci + 1) % C.CORPUS.length]; // adequate length
    for (const kw of KW) {
      const ct = C.vigenereEncrypt(plain, kw);
      const br = C.breakVigenere(ct);
      tries++;
      if (br.keyword === C.clean(kw)) exactKw++;
      else misses.push('corpus#' + ci + ' kw=' + kw + ' got=' + br.keyword + ' (len ' + br.keyLength + ')');
      if (br.keyLength === kw.length || br.keyword === C.clean(kw)) lenOk++;
    }
  }
  const rate = exactKw / tries;
  check('Vigenère exact keyword recovery ≥90%', rate >= 0.90,
    exactKw + '/' + tries + ' = ' + (100 * rate).toFixed(1) + '% exact; period identified ' +
    lenOk + '/' + tries + (misses.length ? ' | misses: ' + misses.slice(0, 4).join('; ') : ''));
})();

/* B3 — IoC correctly identifies the Vigenère period (the period column-IoC jumps
   to English; wrong periods sit near random) */
(function () {
  const ct = C.vigenereEncrypt(C.CORPUS[0] + ' ' + C.CORPUS[1], 'CIPHER'); // period 6
  const est = C.estimateKeyLength(ct, 14);
  const ic6 = est.table[5].ic;   // p=6
  const ic5 = est.table[4].ic;   // p=5 (wrong)
  const ic7 = est.table[6].ic;   // p=7 (wrong)
  check('IoC identifies the true Vigenère period (6) over its neighbours',
    ic6 > 0.058 && ic6 > ic5 + 0.01 && ic6 > ic7 + 0.01,
    'IoC@6=' + ic6.toFixed(4) + '  @5=' + ic5.toFixed(4) + '  @7=' + ic7.toFixed(4) + '  est.best=' + est.best);
})();

/* B4 — Substitution mean letter-accuracy ≥90% over several alphabets */
(function () {
  const rng = C.makeRng('test-subst');
  const accs = [];
  const trials = 6;
  for (let t = 0; t < trials; t++) {
    const plain = C.CORPUS[t % C.CORPUS.length] + ' ' + C.CORPUS[(t + 1) % C.CORPUS.length] +
                  ' ' + C.CORPUS[(t + 2) % C.CORPUS.length];
    const encKey = C.randomAlphabet(rng);
    const ct = C.substEncrypt(plain, encKey);
    const br = C.breakSubstitution(ct, { seed: 'subtest-' + t, restarts: 10, iterations: 5000, progressEvery: 0 });
    accs.push(C.letterAccuracy(br.plaintext, plain));
  }
  const mean = accs.reduce((a, b) => a + b, 0) / accs.length;
  const min = Math.min.apply(null, accs);
  check('Substitution mean letter-accuracy ≥90%', mean >= 0.90,
    'mean ' + (100 * mean).toFixed(1) + '%  (per-alphabet: ' +
    accs.map(a => (100 * a).toFixed(0) + '%').join(', ') + '; min ' + (100 * min).toFixed(1) + '%)');
})();

/* B5 — the statistics, stated as numbers */
(function () {
  const eng = C.CORPUS.join(' ');
  const icE = C.indexOfCoincidence(eng);
  let rnd = '', rr = C.makeRng('reportrand');
  for (let i = 0; i < 8000; i++) rnd += String.fromCharCode(65 + Math.floor(rr() * 26));
  const icR = C.indexOfCoincidence(rnd);
  const chiE = C.chiSquareEnglish(eng);
  const chiWrong = C.chiSquareEnglish(C.caesarEncrypt(eng, 11));
  check('IoC(English) in 0.060–0.075', icE >= 0.060 && icE <= 0.075, 'IoC(English) = ' + icE.toFixed(4));
  check('IoC(random) ≈ 1/26 = 0.0385', icR >= 0.034 && icR <= 0.043, 'IoC(random) = ' + icR.toFixed(4) + ' (1/26 = ' + (1 / 26).toFixed(4) + ')');
  check('χ²(English) ≪ χ²(wrong shift)', chiWrong > chiE * 5,
    'χ²(English) = ' + chiE.toFixed(1) + '   χ²(shift-11) = ' + chiWrong.toFixed(0));
})();

/* B6 — Auto-detect picks the right cipher for each kind */
(function () {
  const base = C.CORPUS[5] + ' ' + C.CORPUS[3];
  const dC = C.detect(C.caesarEncrypt(base, 5));
  const dV = C.detect(C.vigenereEncrypt(base, 'LEMON'));
  const dS = C.detect(C.substEncrypt(base, C.randomAlphabet(C.makeRng('detalpha'))));
  check('Auto-detect classifies Caesar / Vigenère / Substitution',
    dC.type === 'caesar' && dV.type === 'vigenere' && dS.type === 'substitution',
    'caesar→' + dC.type + ', vigenère→' + dV.type + ', subst→' + dS.type);
})();

/* B7 — Determinism end-to-end */
(function () {
  const plain = C.CORPUS[1] + ' ' + C.CORPUS[4];
  const ct = C.substEncrypt(plain, C.randomAlphabet(C.makeRng('det2-alpha')));
  const a = C.breakSubstitution(ct, { seed: 'detX', restarts: 4, iterations: 2000, progressEvery: 0 });
  const b = C.breakSubstitution(ct, { seed: 'detX', restarts: 4, iterations: 2000, progressEvery: 0 });
  check('Determinism — identical plaintext + score across two runs',
    a.plaintext === b.plaintext && a.score === b.score,
    'score ' + a.score.toFixed(2) + ' (both runs)');
})();

/* ───────────────────────────────────────────────────────────────────────── */
console.log('\n' + (fails.length ? '✗ ' : '✓ ') + pass + '/' + total + ' checks passed.');
if (fails.length) { console.error('FAILED: ' + fails.join(', ')); process.exit(1); }
process.exit(0);
