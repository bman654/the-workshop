/* ═══════════════════════════════════════════════════════════════════════════
   THE RELIQUARY — harness/extract.mjs

   Reusable, dependency-free (node:fs / node:path only) string-extraction of the
   live pages' pure CORES, so the mystery chain's derivation (bake.mjs) and the
   anti-drift selftest (selftest.mjs) both test the REAL shipped code, not a copy.

   Follows the loadScytaleCore() pattern in the-reliquary/selftest.mjs: locate a
   page's core block by literal landmark strings, slice the exact bytes, and eval
   them in a minimal sandbox. Every loader throws a clear, landmark-named error if
   its landmark moves under it, so a silent forge/refactor drift fails loudly.

   Exports:
     loadVolvelleCore()     → the volvelle CORE IIFE (encipher/decipher/cleanText…)
     loadScriptoriumCore()  → { buildScript, normalizeInput, readBack,
                                tokenizeWords, clusterWord, strokePaths, nibWeight,
                                cubic, quad } from the seeded-script press
     loadAstrolabeCore()    → the astrolabe CORE IIFE (STARS/decHToAltAz/lstDeg/
                                julianDate/sunPosition/…) PLUS the page-scope
                                time helpers needed to turn (lat,lon,doy,min) into
                                the readout's exact above-horizon count.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '..', '..'); // creative-space repo root

/* ── generic IIFE slicer (the scytale recipe, parameterised) ────────────────
   Find the line containing `startMark`, then the first subsequent line whose
   trimmed content is exactly `endMark`, and eval the inclusive slice, returning
   the named binding. */
function sliceIife(absPath, startMark, endMark, bindingName, label) {
  const src = readFileSync(absPath, 'utf8').split('\n');
  const s = src.findIndex((l) => l.indexOf(startMark) >= 0);
  if (s < 0) throw new Error(`${label}: start landmark not found ("${startMark}") in ${absPath}`);
  let e = -1;
  for (let i = s; i < src.length; i++) { if (src[i].trim() === endMark) { e = i; break; } }
  if (e < 0) throw new Error(`${label}: end landmark not found ("${endMark}") after line ${s + 1} in ${absPath}`);
  const block = src.slice(s, e + 1).join('\n');
  try {
    // eslint-disable-next-line no-eval
    return eval('(function(){ ' + block + ' return ' + bindingName + '; })()');
  } catch (err) {
    throw new Error(`${label}: eval of extracted block failed — ${err.message}`);
  }
}

/* ── VOLVELLE ── hand-edited single file; CORE IIFE at :323–:458 (recon §1.3).
   `const CORE = (function(){ … })();` — the real Caesar/Vigenère/Alberti engine. */
export function loadVolvelleCore() {
  const p = resolve(ROOT, 'volvelle', 'index.html');
  return sliceIife(p, 'const CORE = (function(){', '})();', 'CORE', 'loadVolvelleCore');
}

/* ── ASTROLABE ── forge-split; CORE IIFE at :244–:523 (recon §2, scytale-shape).
   The above-horizon COUNT the readout shows is NOT inside CORE — it is an inline
   loop in updateReadout() over CORE.STARS at the page-computed (lstHours, phi).
   To let the derivation replicate that loop honestly we return the extracted CORE
   plus the tiny page-scope time transform (stateToDate/julianDate) so a caller can
   turn (latDeg, lonDeg, dayOfYear, minutesOfDay, year) into the same (jd, lst, phi)
   the live page feeds the loop — using the CORE's own math, no re-implementation.

   `aboveHorizonCount(state)` here mirrors the shipped readout loop EXACTLY
   (astrolabe/index.src.html:1108-1114 → the T4 host extracts an identically-bodied
   helper); it is provided so bake.mjs derives STAR_COUNT from live geometry. */
export function loadAstrolabeCore() {
  const p = resolve(ROOT, 'astrolabe', 'index.src.html');
  const CORE = sliceIife(p, 'const CORE = (function(){', '})();', 'CORE', 'loadAstrolabeCore');
  for (const fn of ['STARS', 'decHToAltAz', 'lstDeg', 'julianDate', 'sunPosition', 'D2R']) {
    if (CORE[fn] == null) throw new Error(`loadAstrolabeCore: extracted CORE is missing "${fn}"`);
  }

  // The page's stateToDate() (astrolabe/index.src.html:695-701), verbatim logic:
  // a UTC Date from STATE's local civil date/time + longitude (mean-local-time zone).
  function stateToDate(state) {
    const base = Date.UTC(state.year, 0, 1, 0, 0, 0);
    const localMs = base + state.dayOfYear * 86400000 + state.minutesOfDay * 60000;
    const utcMs = localMs - (state.lonDeg / 15) * 3600000;
    return new Date(utcMs);
  }
  const stateJD = (state) => CORE.julianDate(stateToDate(state));

  // The readout's exact above-horizon loop (updateReadout, :1108-1114):
  //   lstHours = lstDeg(jd, lonDeg)/15 ; phi = latDeg*D2R ;
  //   for st of STARS: H = (lstHours - st.ra)*15*D2R ; if decHToAltAz(st.dec*D2R,H,phi).alt>0 visible++
  // year defaults to the live page's STATE.year (astrolabe/index.src.html:688) —
  // the sidereal count is year-sensitive, so the derivation must match the page.
  function aboveHorizonCount(state) {
    const s = Object.assign({ year: 2026 }, state);
    const jd = stateJD(s);
    const lstHours = CORE.lstDeg(jd, s.lonDeg) / 15;
    const phi = s.latDeg * CORE.D2R;
    let visible = 0;
    for (const st of CORE.STARS) {
      const H = (lstHours - st.ra) * 15 * CORE.D2R;
      const a = CORE.decHToAltAz(st.dec * CORE.D2R, H, phi);
      if (a.alt > 0) visible++;
    }
    return visible;
  }

  return { CORE, stateToDate, stateJD, aboveHorizonCount };
}

/* ── SCRIPTORIUM ── forge-split; the seeded-script generator is ALL inline in the
   single top-level <script> (built file, ws.js already inlined). It has no clean
   CORE IIFE and no module.exports; buildScript() reaches many free helpers at
   module scope, so we eval the WHOLE script body in a DOM/window/WS sandbox and
   harvest the functions we need. The trailing `init()` is deferred by pinning
   document.readyState==='loading' (its DOMContentLoaded listener never fires under
   our stub), so no rendering runs. */
export function loadScriptoriumCore() {
  const p = resolve(ROOT, 'scriptorium', 'index.html');
  const src = readFileSync(p, 'utf8');
  const open = src.indexOf('<script>');
  if (open < 0) throw new Error('loadScriptoriumCore: <script> open tag not found');
  const bodyStart = open + '<script>'.length;
  const close = src.indexOf('</script>', bodyStart);
  if (close < 0) throw new Error('loadScriptoriumCore: </script> close tag not found');
  let body = src.slice(bodyStart, close);
  if (body.indexOf('function buildScript(') < 0)
    throw new Error('loadScriptoriumCore: extracted <script> does not contain buildScript()');

  // Minimal inert stubs for the page's boot-time DOM/window/WS touches. readyState
  // 'loading' → init() is registered on DOMContentLoaded (never fired here).
  const noopEl = new Proxy({}, {
    get(_t, k) {
      if (k === 'style') return { setProperty() {} };
      if (k === 'classList') return { add() {}, remove() {}, toggle() {} };
      if (k === 'getContext') return () => null;
      if (k === 'addEventListener') return () => {};
      return () => {};
    },
    set() { return true; },
  });
  const documentStub = {
    readyState: 'loading',
    getElementById: () => noopEl,
    querySelector: () => noopEl,
    createElement: () => noopEl,
    addEventListener: () => {},
  };
  const windowStub = { devicePixelRatio: 1, addEventListener: () => {} };
  const locationStub = { hash: '' };
  const WSStub = { seen() {}, flag() {}, store() { return { ok: false, has: () => false }; } };

  let captured;
  const factory = new Function(
    'document', 'window', 'location', 'WS', 'navigator', 'requestAnimationFrame',
    body + '\n;return {' +
      'buildScript:buildScript, normalizeInput:normalizeInput, readBack:readBack,' +
      'tokenize:tokenize, tokenizeWords:tokenizeWords, clusterWord:clusterWord,' +
      'strokePaths:strokePaths, nibWeight:nibWeight, cubic:cubic, quad:quad,' +
      'glyphFingerprint:glyphFingerprint};'
  );
  try {
    captured = factory(documentStub, windowStub, locationStub, WSStub, {}, (cb) => 0);
  } catch (err) {
    throw new Error('loadScriptoriumCore: eval of <script> body failed — ' + err.message);
  }
  for (const fn of ['buildScript', 'normalizeInput', 'readBack', 'strokePaths', 'clusterWord']) {
    if (typeof captured[fn] !== 'function')
      throw new Error(`loadScriptoriumCore: expected function "${fn}" not captured`);
  }
  return captured;
}
