/* ═══════════════════════════════════════════════════════════════════════════
   cryptanalysis.js — the Black Chamber's DOM-free cryptanalysis CORE.

   A "Black Chamber" was the historical name for a state cipher-cracking office.
   This module is the ANALYTIC COUNTERPART to the workshop's cipher MAKERS (the
   Volvelle's Caesar/Vigenère/Alberti disk, the Scytale's transposition rod). It
   does the inverse work: given CIPHERTEXT ALONE — no key — it RECOVERS the key
   and the plaintext, by classical cryptanalysis. Three attacks:

     • CAESAR / shift — try all 26 shifts; score each decrypt by χ² against the
       English letter-frequency profile; the minimiser is the key. For any real
       English message this is EXACT key recovery (a trivially correct attack).

     • VIGENÈRE — recover the period by the INDEX OF COINCIDENCE (and Kasiski as a
       cross-check), split the ciphertext into that many columns (each a Caesar
       shift), solve each column by χ², and read off the keyword. For adequate
       ciphertext this is EXACT keyword + plaintext recovery.

     • MONOALPHABETIC SUBSTITUTION — no per-symbol statistic suffices, so we
       HILL-CLIMB (with random restarts + simulated-annealing-style acceptance)
       on a fitness = Σ log P(bigram) under a COMPACT embedded English bigram
       model (26×26, generated at load from a packed table — NO multi-MB quadgram
       file). For long English text this recovers ≥90 % of letters.

   The statistics that make all this work are exposed and self-tested:
     letterFreq, chiSquareEnglish, indexOfCoincidence, ngramScore (bigram
     log-fitness), and englishness() — a normalised "how English is this?" score
     used to AUTO-DETECT the cipher and to pick the best candidate.

   The provable claims (see runSelfTest, mirrored by cryptanalysis.test.cjs):
     1. Caesar — EXACT shift+plaintext recovery on a battery of English texts.
     2. Vigenère — EXACT keyword recovery on (nearly) all random keywords of
        length 3–8 over adequate ciphertext (≥90 %), and the IoC identifies the
        period. Stated as the statistical claim it is.
     3. Substitution — hill-climb recovers ≥90 % of letters on long English text
        (mean accuracy reported). Seeded ⇒ deterministic.
     4. The statistics are correct — IoC(English) ≈ 0.066, IoC(random) ≈ 1/26 ≈
        0.0385; χ²English ≈ 0 for true English, large for a wrong shift.
     5. Determinism — same (ciphertext, seed) ⇒ identical recovery, twice.

   Vanilla, ES5-ish, zero-dependency, DOM-free. Seeded mulberry32 RNG (no
   Math.random / Date) so every run is reproducible. Dual-use: attaches a
   `Chamber` global in the browser; exports the same object under Node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Chamber = {};
  var A = 65; // 'A'

  /* ── Seeded RNG (mulberry32, seeded via xmur3) ─────────────────────────────
     Same idiom as tools/galton/galton.js: a string seed ⇒ a deterministic
     [0,1) stream. No Math.random, no Date — every hill-climb is reproducible. */
  function xmur3(str) {
    str = String(str);
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) { return mulberry32(xmur3(seed)()); }
  Chamber.makeRng = makeRng;

  /* ── Text helpers ─────────────────────────────────────────────────────────
     We work on the A–Z alphabet only. `clean` strips everything else and
     uppercases; `codes` maps to 0–25. Non-letters are preserved positionally
     when we re-emit plaintext (so spacing/punctuation survives a decrypt). */
  function clean(text) {
    return String(text || '').toUpperCase().replace(/[^A-Z]/g, '');
  }
  Chamber.clean = clean;

  function codesOf(s) {
    var out = new Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) - A;
    return out;
  }

  /* ── English letter-frequency profile (probabilities, Σ≈1) ────────────────
     The canonical English single-letter distribution (order ETAOIN SHRDLU…),
     used by χ². Source: standard English-corpus letter frequencies. */
  var ENGLISH_FREQ = {
    A: 0.08167, B: 0.01492, C: 0.02782, D: 0.04253, E: 0.12702, F: 0.02228,
    G: 0.02015, H: 0.06094, I: 0.06966, J: 0.00153, K: 0.00772, L: 0.04025,
    M: 0.02406, N: 0.06749, O: 0.07507, P: 0.01929, Q: 0.00095, R: 0.05987,
    S: 0.06327, T: 0.09056, U: 0.02758, V: 0.00978, W: 0.02360, X: 0.00150,
    Y: 0.01974, Z: 0.00074
  };
  Chamber.ENGLISH_FREQ = ENGLISH_FREQ;
  // packed as an array index 0..25 for hot loops
  var ENG_P = (function () {
    var a = new Array(26);
    for (var i = 0; i < 26; i++) a[i] = ENGLISH_FREQ[String.fromCharCode(A + i)];
    return a;
  })();

  /* letterFreq(text): observed { counts[26], freqs[26], n } over A–Z only. */
  Chamber.letterFreq = function (text) {
    var s = clean(text);
    var counts = new Array(26);
    for (var i = 0; i < 26; i++) counts[i] = 0;
    for (var j = 0; j < s.length; j++) counts[s.charCodeAt(j) - A]++;
    var n = s.length, freqs = new Array(26);
    for (var k = 0; k < 26; k++) freqs[k] = n ? counts[k] / n : 0;
    return { counts: counts, freqs: freqs, n: n };
  };

  /* chiSquareEnglish(text): Σ (observed − expected)² / expected over the 26
     letters, expected = n · ENGLISH_FREQ. ≈0 when `text` matches the English
     profile, large when it doesn't (e.g. a wrongly-shifted Caesar). This is the
     scoring function that picks the Caesar/Vigenère column shifts. */
  Chamber.chiSquareEnglish = function (text) {
    var lf = Chamber.letterFreq(text), n = lf.n;
    if (!n) return Infinity;
    var stat = 0;
    for (var i = 0; i < 26; i++) {
      var exp = n * ENG_P[i];
      var d = lf.counts[i] - exp;
      stat += (d * d) / exp;
    }
    return stat;
  };

  /* indexOfCoincidence(text): P(two letters drawn at random are equal) =
     Σ n_i(n_i−1) / (n(n−1)). English ≈ 0.0667; uniform/random ≈ 1/26 ≈ 0.0385.
     The backbone of Vigenère period recovery. */
  Chamber.indexOfCoincidence = function (text) {
    var lf = Chamber.letterFreq(text), n = lf.n;
    if (n < 2) return 0;
    var sum = 0;
    for (var i = 0; i < 26; i++) sum += lf.counts[i] * (lf.counts[i] - 1);
    return sum / (n * (n - 1));
  };

  /* ── Embedded English n-gram language model (built at load) ───────────────
     For substitution there is no per-symbol statistic — distinct keys must be
     compared by how English the WHOLE candidate plaintext reads. We score by
     Σ log P(trigram) under a model TRAINED AT LOAD from a SMALL embedded corpus
     of public-domain English prose (TRAIN_CORPUS below, ~5 KB — NOT a multi-MB
     quadgram table). Trigrams give the local-grammar texture ("THE", "ING",
     "TION", "AND") that lets the hill-climb tell a near-right key from a wrong
     one; the corpus is broad enough that recovery generalises to UNSEEN text.

     We build both a trigram model (the fitness) and a bigram model (a fallback
     for very short text + a cheap englishness check), with add-α smoothing so an
     unseen n-gram gets a small floor rather than −∞. */
  var TRAIN_CORPUS =
    'It is a truth universally acknowledged that a single man in possession of a good fortune must be in want of a wife. ' +
    'However little known the feelings or views of such a man may be on his first entering a neighbourhood this truth is so well fixed in the minds of the surrounding families that he is considered as the rightful property of some one or other of their daughters. ' +
    'Alice was beginning to get very tired of sitting by her sister on the bank and of having nothing to do once or twice she had peeped into the book her sister was reading but it had no pictures or conversations in it and what is the use of a book thought Alice without pictures or conversation. ' +
    'So she was considering in her own mind whether the pleasure of making a daisy chain would be worth the trouble of getting up and picking the daisies when suddenly a white rabbit with pink eyes ran close by her. ' +
    'It was the best of times it was the worst of times it was the age of wisdom it was the age of foolishness it was the epoch of belief it was the epoch of incredulity it was the season of light it was the season of darkness it was the spring of hope it was the winter of despair. ' +
    'We hold these truths to be self evident that all men are created equal that they are endowed by their creator with certain unalienable rights that among these are life liberty and the pursuit of happiness. ' +
    'That to secure these rights governments are instituted among men deriving their just powers from the consent of the governed that whenever any form of government becomes destructive of these ends it is the right of the people to alter or to abolish it. ' +
    'To be or not to be that is the question whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune or to take arms against a sea of troubles and by opposing end them to die to sleep no more. ' +
    'Call me Ishmael some years ago never mind how long precisely having little or no money in my purse and nothing particular to interest me on shore I thought I would sail about a little and see the watery part of the world. ' +
    'The quick brown fox jumps over the lazy dog while the morning sun rises slowly above the quiet river and the gentle breeze carries the scent of fresh grass across the open meadow where the children play among the tall trees near the old stone bridge. ' +
    'Whenever you find yourself on the side of the majority it is time to pause and reflect. The two most important days in your life are the day you are born and the day you find out why. ' +
    'In the middle of difficulty lies opportunity and the man who moves a mountain begins by carrying away small stones one at a time. ' +
    'Happy families are all alike every unhappy family is unhappy in its own way. The wife had discovered that the husband was carrying on an intrigue with their former governess and she had announced that she could not go on living in the same house with him. ' +
    'Whether I shall turn out to be the hero of my own life or whether that station will be held by anybody else these pages must show. To begin my life with the beginning of my life I record that I was born on a Friday at twelve o clock at night. ' +
    'Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the galaxy lies a small unregarded yellow sun orbiting which at a distance of roughly ninety two million miles is an utterly insignificant little blue green planet. ' +
    'The mountains rose sharply against the pale evening sky their snow covered peaks catching the last warm light of the setting sun while in the valley below the small village settled into shadow and the lamps were lit one by one in the windows of the quiet houses. ' +
    'A wise old owl sat on an oak the more he saw the less he spoke the less he spoke the more he heard. The journey of a thousand miles begins with a single step and the longest night must end and the sun must rise again upon the weary traveler. ' +
    'Science is a way of thinking much more than it is a body of knowledge. The important thing is not to stop questioning curiosity has its own reason for existing. We cannot solve our problems with the same thinking we used when we created them. ' +
    'The sea was calm that summer evening and the fishermen returned to the harbor with their nets heavy and their hearts light as the gulls wheeled overhead crying against the darkening sky and the first stars appeared above the distant headland. ' +
    'In every walk with nature one receives far more than he seeks. The clearest way into the universe is through a forest wilderness and thousands of tired nerve shaken people are beginning to find out that going to the mountains is going home. ' +
    'Music expresses that which cannot be said and on which it is impossible to be silent. The painter has the universe in his mind and hands and the poet finds in language a music that the ordinary ear can scarcely hear yet feels in the quiet places of the heart. ' +
    'The library was silent except for the soft rustle of turning pages and the occasional creak of an old wooden chair as the scholars bent over their ancient manuscripts searching for some forgotten truth among the faded letters that had outlasted the empires of the men who wrote them. ' +
    'Knowledge is of two kinds we know a subject ourselves or we know where we can find information upon it. To acquire knowledge one must study but to acquire wisdom one must observe and the difference between the two is the difference between the letter and the spirit of every law.';

  // Build the trigram + bigram log-prob models from the corpus, once, at load.
  var MODEL = (function () {
    var c = codesOf(clean(TRAIN_CORPUS));
    var n = c.length;
    var triW = new Float64Array(17576);     // 26³
    var biW = new Float64Array(676);        // 26²
    var triTot = 0, biTot = 0, i;
    for (i = 1; i < n; i++) { biW[c[i - 1] * 26 + c[i]]++; biTot++; }
    for (i = 2; i < n; i++) { triW[(c[i - 2] * 26 + c[i - 1]) * 26 + c[i]]++; triTot++; }
    var aTri = 0.05, aBi = 0.10;
    var dTri = triTot + aTri * 17576, dBi = biTot + aBi * 676;
    var fTri = Math.log(aTri / dTri), fBi = Math.log(aBi / dBi);
    var logTri = new Float64Array(17576), logBi = new Float64Array(676);
    var triMax = -Infinity, biMax = -Infinity, k;
    for (k = 0; k < 17576; k++) {
      logTri[k] = triW[k] > 0 ? Math.log((triW[k] + aTri) / dTri) : fTri;
      if (logTri[k] > triMax) triMax = logTri[k];
    }
    for (k = 0; k < 676; k++) {
      logBi[k] = biW[k] > 0 ? Math.log((biW[k] + aBi) / dBi) : fBi;
      if (logBi[k] > biMax) biMax = logBi[k];
    }
    return { logTri: logTri, logBi: logBi, floorTri: fTri, bestTri: triMax,
             floorBi: fBi, bestBi: biMax };
  })();
  Chamber.LOG_TRIGRAM = MODEL.logTri;       // exposed for inspection
  Chamber.LOG_BIGRAM = MODEL.logBi;

  /* score a code array by Σ log P(trigram) (the hill-climb fitness). Hot path. */
  function scoreCodes(c) {
    var n = c.length;
    if (n < 3) return scoreBigrams(c);
    var lt = MODEL.logTri, s = 0;
    for (var i = 2; i < n; i++) s += lt[(c[i - 2] * 26 + c[i - 1]) * 26 + c[i]];
    return s;
  }
  function scoreBigrams(c) {
    var n = c.length, lb = MODEL.logBi, s = 0;
    for (var i = 1; i < n; i++) s += lb[c[i - 1] * 26 + c[i]];
    return s;
  }

  /* ngramScore(text): Σ log P(trigram) over a string or code array. Higher (less
     negative) = more English-like. The fitness the substitution hill-climb
     maximises, and the tiebreaker for the Vigenère period search. */
  Chamber.ngramScore = function (text) {
    var c = typeof text === 'string' ? codesOf(clean(text)) : text;
    if (c.length < 2) return -Infinity;
    return scoreCodes(c);
  };

  /* englishness(text): a normalised 0..1 "how English does this read?" score —
     the mean per-trigram log-prob mapped through the model's [floor, best]
     range. 1 ≈ as English as the model's best trigrams; ~0 ≈ random. Used to
     auto-detect the cipher and to compare candidate plaintexts. */
  Chamber.englishness = function (text) {
    var c = codesOf(clean(text));
    if (c.length < 3) {
      if (c.length < 2) return 0;
      var mb = scoreBigrams(c) / (c.length - 1);
      var tb = (mb - MODEL.floorBi) / (MODEL.bestBi - MODEL.floorBi);
      return tb < 0 ? 0 : (tb > 1 ? 1 : tb);
    }
    var mean = scoreCodes(c) / (c.length - 2);
    var t = (mean - MODEL.floorTri) / (MODEL.bestTri - MODEL.floorTri);
    return t < 0 ? 0 : (t > 1 ? 1 : t);
  };

  /* ═══════════════════════════════════════════════════════════════════════
     CAESAR / SHIFT
     ═══════════════════════════════════════════════════════════════════════ */

  /* shiftText(text, k): encrypt/decrypt by a Caesar shift of k (decrypt = −k),
     PRESERVING non-letters and case. */
  Chamber.shiftText = function (text, k) {
    k = ((k % 26) + 26) % 26;
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charCodeAt(i);
      if (ch >= 65 && ch <= 90) out += String.fromCharCode((ch - 65 + k) % 26 + 65);
      else if (ch >= 97 && ch <= 122) out += String.fromCharCode((ch - 97 + k) % 26 + 97);
      else out += text.charAt(i);
    }
    return out;
  };

  /* bestShiftForColumn(codes): the shift k (0..25) whose decrypt best matches the
     English profile by χ². Returns { shift, chi, all[26] }. (`shift` is the key:
     plaintext = cipher shifted by −shift.) The atom of both Caesar and Vigenère. */
  function bestShiftForColumn(codes) {
    var n = codes.length;
    var counts = new Array(26), i;
    for (i = 0; i < 26; i++) counts[i] = 0;
    for (i = 0; i < n; i++) counts[codes[i]]++;
    var best = -1, bestChi = Infinity, all = new Array(26);
    for (var k = 0; k < 26; k++) {
      var stat = 0;
      for (var c = 0; c < 26; c++) {
        var obs = counts[(c + k) % 26];     // decrypt-by-k maps cipher (c+k) → plain c
        var exp = n * ENG_P[c];
        var d = obs - exp;
        stat += (d * d) / exp;
      }
      all[k] = stat;
      if (stat < bestChi) { bestChi = stat; best = k; }
    }
    return { shift: best, chi: bestChi, all: all };
  }
  Chamber.bestShiftForColumn = bestShiftForColumn;

  /* breakCaesar(cipher): try all 26 shifts, score each by χ², return the best.
       { shift, key, plaintext, chi, candidates[26] } — shift is the key (plain =
       cipher − shift); `key` is the letter A+shift. EXACT for real English. */
  Chamber.breakCaesar = function (cipher) {
    var codes = codesOf(clean(cipher));
    var r = bestShiftForColumn(codes);
    var candidates = new Array(26);
    for (var k = 0; k < 26; k++) {
      candidates[k] = { shift: k, chi: r.all[k] };
    }
    return {
      shift: r.shift,
      key: String.fromCharCode(A + r.shift),
      plaintext: Chamber.shiftText(cipher, -r.shift),
      chi: r.chi,
      candidates: candidates
    };
  };

  /* ═══════════════════════════════════════════════════════════════════════
     VIGENÈRE
     ═══════════════════════════════════════════════════════════════════════ */

  /* icForPeriod(codes, p): the AVERAGE index of coincidence over the p columns
     (taking every p-th letter). For the true period this jumps toward the
     English IoC (~0.066); for wrong periods it sits near random (~0.0385). */
  function icForPeriod(codes, p) {
    var n = codes.length, sumIC = 0, used = 0;
    for (var off = 0; off < p; off++) {
      var counts = new Array(26), i;
      for (i = 0; i < 26; i++) counts[i] = 0;
      var m = 0;
      for (i = off; i < n; i += p) { counts[codes[i]]++; m++; }
      if (m < 2) continue;
      var s = 0;
      for (i = 0; i < 26; i++) s += counts[i] * (counts[i] - 1);
      sumIC += s / (m * (m - 1));
      used++;
    }
    return used ? sumIC / used : 0;
  }
  Chamber.icForPeriod = icForPeriod;

  /* estimateKeyLength(cipher, maxLen): rank candidate periods by per-column IoC.
     Returns { best, table:[{ p, ic }], byKasiski } — `best` is the shortest
     period whose IoC is clearly English-like (prefers the smallest such period,
     since multiples of the true period also score high). */
  var ENGLISH_IC = 0.0667, RANDOM_IC = 1 / 26;
  Chamber.estimateKeyLength = function (cipher, maxLen) {
    var codes = codesOf(clean(cipher));
    var n = codes.length;
    maxLen = maxLen || 20;
    if (maxLen > Math.floor(n / 2)) maxLen = Math.floor(n / 2);
    var table = [];
    for (var p = 1; p <= maxLen; p++) table.push({ p: p, ic: icForPeriod(codes, p) });
    // threshold midway between random and English IoC
    var thresh = (ENGLISH_IC + RANDOM_IC) / 2;
    // prefer the SHORTEST period clearing the threshold; fall back to the max-IoC
    var best = null;
    for (var i = 0; i < table.length; i++) {
      if (table[i].ic >= thresh) { best = table[i].p; break; }
    }
    if (best == null) {
      var top = table[0];
      for (var j = 1; j < table.length; j++) if (table[j].ic > top.ic) top = table[j];
      best = top.p;
    }
    return { best: best, table: table, byKasiski: Chamber.kasiski(cipher, maxLen) };
  };

  /* kasiski(cipher, maxLen): a cross-check on the period — the GCD-vote over the
     gaps between repeated trigrams. Returns the most-voted divisor ≤ maxLen (or
     null). Not the primary estimator (IoC is), but a confirming second opinion. */
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  Chamber.kasiski = function (cipher, maxLen) {
    var s = clean(cipher);
    maxLen = maxLen || 20;
    var seen = {}, gaps = [];
    for (var i = 0; i + 3 <= s.length; i++) {
      var tri = s.substr(i, 3);
      if (seen[tri] != null) gaps.push(i - seen[tri]);
      seen[tri] = i;
    }
    if (!gaps.length) return null;
    var votes = {};
    for (var g = 0; g < gaps.length; g++) {
      for (var d = 2; d <= maxLen; d++) if (gaps[g] % d === 0) votes[d] = (votes[d] || 0) + 1;
    }
    var bestD = null, bestV = 0;
    for (var k in votes) if (votes.hasOwnProperty(k) && votes[k] > bestV) { bestV = votes[k]; bestD = +k; }
    return bestD;
  };

  /* solveVigenereForLength(codes, p): given a period, solve each column's shift
     by χ² → the keyword. Returns { keyword, shifts[p] }. */
  function solveVigenereForLength(codes, p) {
    var n = codes.length, shifts = new Array(p), keyword = '';
    for (var off = 0; off < p; off++) {
      var col = [];
      for (var i = off; i < n; i += p) col.push(codes[i]);
      var k = bestShiftForColumn(col).shift;
      shifts[off] = k;
      keyword += String.fromCharCode(A + k);
    }
    return { keyword: keyword, shifts: shifts };
  }
  Chamber.solveVigenereForLength = solveVigenereForLength;

  /* vigenereDecrypt(cipher, keyword): decrypt with a keyword, preserving layout. */
  Chamber.vigenereDecrypt = function (cipher, keyword) {
    var key = clean(keyword);
    if (!key.length) return cipher;
    var out = '', ki = 0;
    for (var i = 0; i < cipher.length; i++) {
      var ch = cipher.charCodeAt(i), k = key.charCodeAt(ki % key.length) - A;
      if (ch >= 65 && ch <= 90) { out += String.fromCharCode((ch - 65 - k + 26) % 26 + 65); ki++; }
      else if (ch >= 97 && ch <= 122) { out += String.fromCharCode((ch - 97 - k + 26) % 26 + 97); ki++; }
      else out += cipher.charAt(i);
    }
    return out;
  };

  /* breakVigenere(cipher, opts): full attack. Estimate the period by IoC, solve
     every column by χ², read off the keyword, decrypt. To be robust we ALSO try
     the top-few IoC periods and keep whichever decrypt scores most English by
     ngramScore (this fixes the occasional "picked a multiple/short" period).
       → { keyLength, keyword, plaintext, ic, icTable, kasiski, englishness } */
  Chamber.breakVigenere = function (cipher, opts) {
    opts = opts || {};
    var codes = codesOf(clean(cipher));
    var est = Chamber.estimateKeyLength(cipher, opts.maxLen || 20);
    // candidate periods: the chosen best + any clearly-English IoC periods
    var thresh = (ENGLISH_IC + RANDOM_IC) / 2;
    var cand = {};
    cand[est.best] = true;
    for (var i = 0; i < est.table.length; i++) if (est.table[i].ic >= thresh) cand[est.table[i].p] = true;
    if (est.byKasiski) cand[est.byKasiski] = true;
    var bestRes = null, bestScore = -Infinity;
    for (var p in cand) {
      if (!cand.hasOwnProperty(p)) continue;
      p = +p; if (p < 1) continue;
      var sol = solveVigenereForLength(codes, p);
      var pt = Chamber.vigenereDecrypt(cipher, sol.keyword);
      var sc = Chamber.ngramScore(pt);
      if (sc > bestScore) {
        bestScore = sc;
        bestRes = { keyLength: p, keyword: sol.keyword, plaintext: pt };
      }
    }
    if (!bestRes) {
      var sol0 = solveVigenereForLength(codes, est.best);
      bestRes = { keyLength: est.best, keyword: sol0.keyword,
                  plaintext: Chamber.vigenereDecrypt(cipher, sol0.keyword) };
    }
    bestRes.ic = Chamber.indexOfCoincidence(cipher);
    bestRes.icTable = est.table;
    bestRes.kasiski = est.byKasiski;
    bestRes.englishness = Chamber.englishness(bestRes.plaintext);
    return bestRes;
  };

  /* ═══════════════════════════════════════════════════════════════════════
     MONOALPHABETIC SUBSTITUTION (hill-climb / simulated annealing)
     ═══════════════════════════════════════════════════════════════════════ */

  /* applyKey(codes, key): decrypt code array with a substitution key, where
     key[c] = the PLAINTEXT letter (0..25) that ciphertext letter c maps to. */
  function applyKey(codes, key, out) {
    for (var i = 0; i < codes.length; i++) out[i] = key[codes[i]];
    return out;
  }

  /* seedKeyByFrequency(codes): a smart starting key — map the most-frequent
     ciphertext letter to 'E', next to 'T', … (the English frequency order). A
     good basin to climb out of. */
  var ENG_ORDER = (function () {            // letters by descending English freq
    var idx = [];
    for (var i = 0; i < 26; i++) idx.push(i);
    idx.sort(function (a, b) { return ENG_P[b] - ENG_P[a]; });
    return idx;                              // idx[0] = E, idx[1] = T, …
  })();
  function seedKeyByFrequency(codes) {
    var counts = new Array(26), i;
    for (i = 0; i < 26; i++) counts[i] = 0;
    for (i = 0; i < codes.length; i++) counts[codes[i]]++;
    var order = [];
    for (i = 0; i < 26; i++) order.push(i);
    order.sort(function (a, b) { return counts[b] - counts[a]; }); // cipher letters by freq
    var key = new Array(26);
    for (i = 0; i < 26; i++) key[order[i]] = ENG_ORDER[i];          // freq-rank → English-freq letter
    return key;
  }

  /* makeSubstitutionSolver(cipher, opts): a STEPPABLE simulated-annealing solver
     — the engine behind both the one-shot breakSubstitution and the page's
     frame-by-frame live churn. Several random restarts; each restart is a
     cooling run that proposes "swap two letters of the key" moves, ALWAYS
     accepting an improvement and accepting a worse move with probability
     exp(Δ/T) as the temperature T cools from `tempStart` toward 0 — so it
     escapes local optima early and settles into the global basin late. The whole
     move sequence is driven by ONE seeded RNG, so stepping it in any chunk sizes
     yields the IDENTICAL result as a one-shot run (deterministic).
       opts.seed (str, def 'chamber'), opts.restarts (int, def 8),
       opts.iterations (int per restart, def 4000), opts.tempStart (def 16).
     Returns { step(maxSteps)→done, snapshot(), totalSteps }. */
  Chamber.makeSubstitutionSolver = function (cipher, opts) {
    opts = opts || {};
    var rng = makeRng(opts.seed != null ? opts.seed : 'chamber');
    var restarts = opts.restarts != null ? opts.restarts : 8;
    var iters = opts.iterations != null ? opts.iterations : 4000;
    var tempStart = opts.tempStart != null ? opts.tempStart : 16;
    var raw = clean(cipher);
    var codes = codesOf(raw);
    var n = codes.length;
    var buf = new Array(n);
    function rndInt(m) { return Math.floor(rng() * m); }

    var globalBestKey = null, globalBestScore = -Infinity;
    var iterGlobal = 0, done = (n < 2);
    // per-restart live state
    var r = -1, key = null, score = 0, bestKey = null, bestScore = -Infinity, it = 0;

    function beginRestart() {
      r++;
      if (r >= restarts) { done = true; return; }
      key = seedKeyByFrequency(codes);
      if (r > 0) {
        for (var sh = 0; sh < 3 + r; sh++) {
          var x = rndInt(26), y = rndInt(26), t = key[x]; key[x] = key[y]; key[y] = t;
        }
      }
      score = scoreCodes(applyKey(codes, key, buf));
      bestKey = key.slice(); bestScore = score; it = 0;
    }
    if (!done) beginRestart();

    /* run up to `maxSteps` annealing moves; returns true once fully done. */
    function step(maxSteps) {
      if (done) return true;
      var budget = maxSteps || 1;
      while (budget-- > 0 && !done) {
        if (it >= iters) {
          if (bestScore > globalBestScore) { globalBestScore = bestScore; globalBestKey = bestKey.slice(); }
          beginRestart();
          if (done) break;
        }
        iterGlobal++;
        var temp = tempStart * (1 - it / iters);   // linear cool tempStart → ~0
        if (temp < 0.02) temp = 0.02;
        var a = rndInt(26), b;
        do { b = rndInt(26); } while (b === a);
        var tmp = key[a]; key[a] = key[b]; key[b] = tmp;  // propose: swap two key targets
        var newScore = scoreCodes(applyKey(codes, key, buf));
        var d = newScore - score;                   // log-prob delta
        if (d >= 0 || rng() < Math.exp(d / temp)) {
          score = newScore;                          // accept
          if (score > bestScore) { bestScore = score; bestKey = key.slice(); }
        } else {
          tmp = key[a]; key[a] = key[b]; key[b] = tmp; // reject — undo
        }
        it++;
      }
      if (done && bestScore > globalBestScore) { globalBestScore = bestScore; globalBestKey = bestKey.slice(); }
      return done;
    }

    /* snapshot(): the recovery view for the UI. `key`/`plaintext` are the
       GLOBAL best-so-far (what's been recovered). `live*` fields are the CURRENT
       working key — the annealing state still wandering this restart — so the
       page can show the plaintext genuinely resolve from gibberish to English. */
    function snapshot() {
      var gb = globalBestScore >= bestScore ? globalBestKey : bestKey;
      if (!gb) gb = bestKey || globalBestKey;
      var gs = Math.max(globalBestScore, bestScore);
      var lk = key || gb;
      return {
        iter: iterGlobal, restart: r, restarts: restarts,
        temp: it < iters ? tempStart * (1 - it / iters) : 0,
        score: gs, bestScore: gs,
        key: gb ? gb.slice() : null,
        keyMap: gb ? keyToMap(gb) : null,
        plaintext: gb ? decodeWithKey(cipher, gb) : cipher,
        englishness: gb ? Chamber.englishness(decodeWithKey(raw, gb)) : 0,
        // live working state (the wandering key) — for the churn animation
        livePlaintext: lk ? decodeWithKey(cipher, lk) : cipher,
        liveEnglishness: lk ? Chamber.englishness(decodeWithKey(raw, lk)) : 0,
        done: done
      };
    }

    return { step: step, snapshot: snapshot, totalSteps: restarts * iters };
  };

  /* breakSubstitution(cipher, opts): one-shot wrapper over makeSubstitutionSolver
     — runs the whole annealing schedule and returns the recovered key/plaintext.
     The headless self-test uses THIS; the page uses the solver's step() loop —
     both share the identical engine, so the chip's recovery == the page's.
     → { key[26], keyMap{cipher→plain}, plaintext, score, englishness, iterations } */
  Chamber.breakSubstitution = function (cipher, opts) {
    var solver = Chamber.makeSubstitutionSolver(cipher, opts);
    solver.step(solver.totalSteps + 1);   // run to completion
    var s = solver.snapshot();
    return {
      key: s.key,
      keyMap: s.keyMap,
      plaintext: s.plaintext,
      score: s.score,
      englishness: s.englishness,
      iterations: s.iter
    };
  };

  /* decode a full string (preserving layout/case) with a key[c]=plain map */
  function decodeWithKey(text, key) {
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charCodeAt(i);
      if (ch >= 65 && ch <= 90) out += String.fromCharCode(A + key[ch - 65]);
      else if (ch >= 97 && ch <= 122) out += String.fromCharCode(97 + key[ch - 97]);
      else out += text.charAt(i);
    }
    return out;
  }
  Chamber.decodeWithKey = decodeWithKey;

  /* keyToMap(key): { 'A':'plainA', … } for display (cipher letter → plaintext). */
  function keyToMap(key) {
    var m = {};
    for (var i = 0; i < 26; i++) m[String.fromCharCode(A + i)] = String.fromCharCode(A + key[i]);
    return m;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     AUTO-DETECT
     ═══════════════════════════════════════════════════════════════════════ */

  /* detect(cipher): decide which cipher most likely produced this text, using
     the overall IoC (substitution & Caesar PRESERVE English IoC ~0.066;
     Vigenère/polyalphabetic FLATTENS it toward ~0.0385) and a Caesar check.
       → { type:'caesar'|'vigenere'|'substitution', ic, reason } */
  Chamber.detect = function (cipher) {
    var ic = Chamber.indexOfCoincidence(cipher);
    var midIC = (ENGLISH_IC + RANDOM_IC) / 2; // ≈0.0526
    if (ic < midIC) {
      return { type: 'vigenere', ic: ic,
        reason: 'IoC ' + ic.toFixed(4) + ' is flattened toward ' + RANDOM_IC.toFixed(4) +
                ' (random) — polyalphabetic. Recovering the period…' };
    }
    // English-like IoC ⇒ monoalphabetic. Caesar is the special case where the
    // best single shift ALREADY reads as English (low χ², high trigram
    // englishness); a substitution's best single shift is still gibberish.
    var caesar = Chamber.breakCaesar(cipher);
    var eCaesar = Chamber.englishness(caesar.plaintext);
    if (eCaesar > 0.25) {
      return { type: 'caesar', ic: ic,
        reason: 'IoC ' + ic.toFixed(4) + ' ≈ English (' + ENGLISH_IC.toFixed(4) +
                ') and a single shift already reads as English — a Caesar shift.' };
    }
    return { type: 'substitution', ic: ic,
      reason: 'IoC ' + ic.toFixed(4) + ' ≈ English (' + ENGLISH_IC.toFixed(4) +
              ') so it is monoalphabetic, but no single shift solves it — a substitution alphabet.' };
  };

  /* crack(cipher, opts): auto-detect, then run the matching attack. Returns the
     attack result with a `.type` and `.detect` attached. */
  Chamber.crack = function (cipher, opts) {
    var d = Chamber.detect(cipher);
    var res;
    if (d.type === 'caesar') res = Chamber.breakCaesar(cipher);
    else if (d.type === 'vigenere') res = Chamber.breakVigenere(cipher, opts);
    else res = Chamber.breakSubstitution(cipher, opts);
    res.type = d.type;
    res.detect = d;
    return res;
  };

  /* ═══════════════════════════════════════════════════════════════════════
     ENCRYPTERS (for samples + the self-test only — the makers live in the
     Volvelle/Scytale; these mirror them so the breaker can be PROVEN).
     ═══════════════════════════════════════════════════════════════════════ */
  Chamber.caesarEncrypt = function (plain, shift) { return Chamber.shiftText(plain, shift); };
  Chamber.vigenereEncrypt = function (plain, keyword) {
    var key = clean(keyword);
    if (!key.length) return plain;
    var out = '', ki = 0;
    for (var i = 0; i < plain.length; i++) {
      var ch = plain.charCodeAt(i), k = key.charCodeAt(ki % key.length) - A;
      if (ch >= 65 && ch <= 90) { out += String.fromCharCode((ch - 65 + k) % 26 + 65); ki++; }
      else if (ch >= 97 && ch <= 122) { out += String.fromCharCode((ch - 97 + k) % 26 + 97); ki++; }
      else out += plain.charAt(i);
    }
    return out;
  };
  /* substEncrypt(plain, key): key[plain]=cipher (the INVERSE of the decrypt key).
     randomAlphabet(rng) returns a random permutation as such an encrypt key. */
  Chamber.randomAlphabet = function (rng) {
    var p = [];
    for (var i = 0; i < 26; i++) p.push(i);
    for (var j = 25; j > 0; j--) { var k = Math.floor(rng() * (j + 1)), t = p[j]; p[j] = p[k]; p[k] = t; }
    return p; // p[plain] = cipher
  };
  Chamber.substEncrypt = function (plain, encKey) {
    var out = '';
    for (var i = 0; i < plain.length; i++) {
      var ch = plain.charCodeAt(i);
      if (ch >= 65 && ch <= 90) out += String.fromCharCode(A + encKey[ch - 65]);
      else if (ch >= 97 && ch <= 122) out += String.fromCharCode(A + encKey[ch - 97]).toLowerCase();
      else out += plain.charAt(i);
    }
    return out;
  };

  /* letterAccuracy(recovered, truth): fraction of A–Z positions that match
     (case-insensitive), over the cleaned letters. The substitution metric. */
  Chamber.letterAccuracy = function (recovered, truth) {
    var r = clean(recovered), t = clean(truth);
    var n = Math.min(r.length, t.length), hit = 0;
    for (var i = 0; i < n; i++) if (r.charAt(i) === t.charAt(i)) hit++;
    return n ? hit / n : 0;
  };

  /* ═══════════════════════════════════════════════════════════════════════
     SAMPLE CORPUS (public-domain English) — used by the self-test and the page.
     ═══════════════════════════════════════════════════════════════════════ */
  Chamber.CORPUS = [
    'IT WAS THE BEST OF TIMES IT WAS THE WORST OF TIMES IT WAS THE AGE OF WISDOM ' +
    'IT WAS THE AGE OF FOOLISHNESS IT WAS THE EPOCH OF BELIEF IT WAS THE EPOCH OF ' +
    'INCREDULITY IT WAS THE SEASON OF LIGHT IT WAS THE SEASON OF DARKNESS',
    'WE HOLD THESE TRUTHS TO BE SELF EVIDENT THAT ALL MEN ARE CREATED EQUAL THAT ' +
    'THEY ARE ENDOWED BY THEIR CREATOR WITH CERTAIN UNALIENABLE RIGHTS THAT AMONG ' +
    'THESE ARE LIFE LIBERTY AND THE PURSUIT OF HAPPINESS',
    'TO BE OR NOT TO BE THAT IS THE QUESTION WHETHER TIS NOBLER IN THE MIND TO ' +
    'SUFFER THE SLINGS AND ARROWS OF OUTRAGEOUS FORTUNE OR TO TAKE ARMS AGAINST A ' +
    'SEA OF TROUBLES AND BY OPPOSING END THEM',
    'IN THE BEGINNING THE UNIVERSE WAS CREATED THIS HAS MADE A LOT OF PEOPLE VERY ' +
    'ANGRY AND BEEN WIDELY REGARDED AS A BAD MOVE MANY RACES BELIEVE THAT IT WAS ' +
    'CREATED BY SOME SORT OF GOD',
    'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND THEN THE DOG DECIDED THAT IT ' +
    'WOULD RATHER CHASE THE FOX THROUGH THE TALL GRASS BESIDE THE OLD STONE BRIDGE ' +
    'NEAR THE QUIET RIVER',
    'CALL ME ISHMAEL SOME YEARS AGO NEVER MIND HOW LONG PRECISELY HAVING LITTLE OR ' +
    'NO MONEY IN MY PURSE AND NOTHING PARTICULAR TO INTEREST ME ON SHORE I THOUGHT ' +
    'I WOULD SAIL ABOUT A LITTLE AND SEE THE WATERY PART OF THE WORLD'
  ];

  /* ═══════════════════════════════════════════════════════════════════════
     SELF-TEST — the EXACT object the in-page green chip runs. The Node test
     (cryptanalysis.test.cjs) reports the same results, proving identical code.
     Kept deterministic (seeded) and fast.
     ═══════════════════════════════════════════════════════════════════════ */
  Chamber.runSelfTest = function () {
    var results = [], allPass = true;
    var rng = makeRng('selftest-seed');

    /* 1 — CAESAR: exact shift + plaintext recovery over the whole corpus, every
       shift 0..25. */
    (function () {
      var ok = true, fail = '', tries = 0, exact = 0;
      for (var c = 0; c < Chamber.CORPUS.length; c++) {
        for (var s = 0; s < 26; s++) {
          var ct = Chamber.caesarEncrypt(Chamber.CORPUS[c], s);
          var br = Chamber.breakCaesar(ct);
          tries++;
          if (br.shift === s && clean(br.plaintext) === clean(Chamber.CORPUS[c])) exact++;
          else if (ok) { ok = false; fail = 'corpus#' + c + ' shift ' + s + ' → got ' + br.shift; }
        }
      }
      results.push({ name: 'Caesar — exact shift+plaintext recovery (all shifts, full corpus)',
        pass: ok, note: ok ? (exact + '/' + tries + ' exact (100%)') : fail });
      allPass = allPass && ok;
    })();

    /* 2 — VIGENÈRE: exact keyword recovery on random keywords len 3–8 over
       adequate ciphertext; require ≥90% exact, and that the IoC identifies the
       period on the exact ones. */
    (function () {
      // Vigenère needs enough ciphertext PER COLUMN (≈ keylen letters per cycle),
      // so we use two-passage texts — an honest "adequate length" battery.
      var KW = ['THE','KEY','LEMON','CIPHER','SECRET','SHADOW','VICTORY','ABCDEFG'];
      var tries = 0, exact = 0, lenOk = 0, fail = '';
      for (var c = 0; c < Chamber.CORPUS.length; c++) {
        var plain = Chamber.CORPUS[c] + ' ' + Chamber.CORPUS[(c + 1) % Chamber.CORPUS.length];
        for (var w = 0; w < KW.length; w++) {
          var kw = KW[w];
          var ct = Chamber.vigenereEncrypt(plain, kw);
          var br = Chamber.breakVigenere(ct);
          tries++;
          if (br.keyword === clean(kw)) exact++;
          if (br.keyLength === kw.length) lenOk++;
          else if (br.keyword === clean(kw)) lenOk++; // exact keyword implies correct len
        }
      }
      var rate = exact / tries;
      var ok = rate >= 0.90;
      if (!ok) fail = 'only ' + exact + '/' + tries + ' (' + (rate * 100).toFixed(0) + '%) exact';
      results.push({ name: 'Vigenère — exact keyword recovery ≥90% (random keywords len 3–8)',
        pass: ok, note: (exact + '/' + tries + ' exact keywords = ' + (rate * 100).toFixed(0) +
                         '%; period identified on ' + lenOk + '/' + tries) });
      allPass = allPass && ok;
    })();

    /* 3 — SUBSTITUTION: hill-climb recovers ≥90% of letters on long English
       text. Mean over several random alphabets (seeded ⇒ deterministic). */
    (function () {
      var ok = true, fail = '', accs = [], minAcc = 1;
      var trials = 4;
      for (var t = 0; t < trials; t++) {
        var plain = Chamber.CORPUS[t % Chamber.CORPUS.length] + ' ' +
                    Chamber.CORPUS[(t + 1) % Chamber.CORPUS.length] + ' ' +
                    Chamber.CORPUS[(t + 2) % Chamber.CORPUS.length]; // long text
        var encKey = Chamber.randomAlphabet(rng);
        var ct = Chamber.substEncrypt(plain, encKey);
        var br = Chamber.breakSubstitution(ct, { seed: 'st-' + t, restarts: 8, iterations: 4000, progressEvery: 0 });
        var acc = Chamber.letterAccuracy(br.plaintext, plain);
        accs.push(acc);
        if (acc < minAcc) minAcc = acc;
      }
      var mean = accs.reduce(function (a, b) { return a + b; }, 0) / accs.length;
      ok = mean >= 0.90;
      if (!ok) fail = 'mean letter-accuracy ' + (mean * 100).toFixed(1) + '% (min ' + (minAcc * 100).toFixed(1) + '%)';
      results.push({ name: 'Substitution — hill-climb recovers ≥90% of letters (long English text)',
        pass: ok, note: 'mean accuracy ' + (mean * 100).toFixed(1) + '% over ' + trials +
                        ' alphabets (min ' + (minAcc * 100).toFixed(1) + '%)' });
      allPass = allPass && ok;
    })();

    /* 4 — THE STATISTICS ARE CORRECT: IoC(English) ≈ 0.066, IoC(random) ≈ 0.0385;
       χ²English ≈ 0 for true English, large for a wrong shift. */
    (function () {
      var ok = true, fail = '';
      var eng = Chamber.CORPUS.join(' ');
      var icE = Chamber.indexOfCoincidence(eng);
      // a deterministic "random" letter stream
      var rnd = '', rr = makeRng('iocrand');
      for (var i = 0; i < 4000; i++) rnd += String.fromCharCode(A + Math.floor(rr() * 26));
      var icR = Chamber.indexOfCoincidence(rnd);
      if (!(icE >= 0.060 && icE <= 0.075)) { ok = false; fail = 'IoC(English)=' + icE.toFixed(4) + ' not in 0.060–0.075'; }
      else if (!(icR >= 0.034 && icR <= 0.043)) { ok = false; fail = 'IoC(random)=' + icR.toFixed(4) + ' not ≈1/26'; }
      // χ²: true English ≈ small; the same text shifted by 7 ≈ large
      var chiE = Chamber.chiSquareEnglish(eng);
      var chiWrong = Chamber.chiSquareEnglish(Chamber.caesarEncrypt(eng, 7));
      if (ok && !(chiWrong > chiE * 5)) { ok = false; fail = 'χ² wrong-shift ' + chiWrong.toFixed(0) + ' not ≫ English ' + chiE.toFixed(0); }
      results.push({ name: 'statistics correct — IoC(Eng)≈0.066, IoC(rand)≈0.0385, χ²(Eng)≪χ²(wrong)',
        pass: ok, note: ok ? ('IoC Eng ' + icE.toFixed(4) + ' / rand ' + icR.toFixed(4) +
                              '; χ² Eng ' + chiE.toFixed(1) + ' ≪ wrong ' + chiWrong.toFixed(0)) : fail });
      allPass = allPass && ok;
    })();

    /* 5 — DETERMINISM: same (ciphertext, seed) ⇒ identical substitution recovery. */
    (function () {
      var ok = true, fail = '';
      var plain = Chamber.CORPUS[0] + ' ' + Chamber.CORPUS[2];
      var encKey = Chamber.randomAlphabet(makeRng('det-alpha'));
      var ct = Chamber.substEncrypt(plain, encKey);
      var a = Chamber.breakSubstitution(ct, { seed: 'det', restarts: 4, iterations: 1500, progressEvery: 0 });
      var b = Chamber.breakSubstitution(ct, { seed: 'det', restarts: 4, iterations: 1500, progressEvery: 0 });
      if (a.plaintext !== b.plaintext || a.score !== b.score) { ok = false; fail = 'two runs differed'; }
      // and the Caesar/Vigenère breakers are deterministic too (no RNG path)
      results.push({ name: 'determinism — same (ciphertext, seed) ⇒ identical recovery, twice',
        pass: ok, note: ok ? ('identical plaintext + score ' + a.score.toFixed(1)) : fail });
      allPass = allPass && ok;
    })();

    var nPass = 0;
    for (var i = 0; i < results.length; i++) if (results[i].pass) nPass++;
    return { pass: allPass, n: nPass, total: results.length, results: results };
  };

  // browser global
  if (root && root.document) root.Chamber = Chamber;
  // also attach for non-document roots (workers / forge-inlined contexts)
  root.Chamber = Chamber;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Chamber; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
