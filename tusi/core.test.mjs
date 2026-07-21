#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tusi/core.test.mjs — the Node twin of the Tusi couple's geometry core.

   The room's page no longer keeps its own copy of pen(): tusi/index.src.html
   carries `<!-- forge:include core.mjs -->`, so `forge --check` is the parity
   gate (page core === module core, byte-for-byte, by construction). What THIS
   twin proves is the geometry itself, headlessly, on the SAME module the page
   inlines and the Spin Cabinet imports:

     (1) THE EXACT LINE — at R = 2r with the pen on the rim (d=1, inside), every
         sampled pen point lies on ONE straight diameter: the perpendicular
         deviation from the best-fit line is < 1e-12 of the segment's own half-
         length. Not "looks straight" — measured.
     (2) THE DIAMETER — that segment has half-length exactly R (the pen sweeps
         the full diameter 2R), to machine precision.
     (3) THE NEG-CONTROL — step OFF 2:1 and the line OPENS. At R = 2.1r the
         perpendicular deviation is no longer negligible; straightness is a
         knife-edge, not a range.
     (4) d-CONTROL — with the pen at the wheel centre (d=0) the path is a
         PERFECT CIRCLE of radius R−r, so d genuinely runs circle → line.
     (5) ROLLING WITHOUT SLIPPING — wheelCentre() sits at radius R−r and the pen
         is exactly r from it, for every t and every ratio. The mechanism the
         page draws is the mechanism the formula describes.
     (6) WIRING — index.src.html really does forge:include core.mjs (so the
         shipped page cannot silently fork this file).

   Run: node tusi/core.test.mjs   → exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pen, wheelCentre, lineFit } from './core.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const TAU = 2 * Math.PI;

const checks = [];
const ok = (name, cond, note = '') => checks.push({ name, ok: !!cond, note });

/* ── (1) THE EXACT LINE, and (2) its length ─────────────────────────────────── */
{
  let worstRel = 0, worstSpan = 0;
  for (const r of [0.5, 1, 1.7, 3.25]) {
    const R = 2 * r;
    const f = lineFit(R, r, 6000);
    const rel = f.maxPerp / f.maxAlong;              // deviation as a fraction of half-length
    if (rel > worstRel) worstRel = rel;
    // the SPAN, measured straight off the pen (lineFit's maxAlong is mean-centred,
    // and an endpoint-inclusive sample's mean is not exactly the segment midpoint).
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k <= 6000; k++) {
      const p = pen(R, r, 1, TAU * k / 6000, true);
      if (p.x < lo) lo = p.x; if (p.x > hi) hi = p.x;
    }
    worstSpan = Math.max(worstSpan, Math.abs((hi - lo) - 2 * R) / (2 * R));
  }
  ok('(1) R=2r, pen on the rim → the path is ONE straight line (max perpendicular / half-length)',
     worstRel < 1e-12, `worst ratio ${worstRel.toExponential(2)}`);
  ok('(2) that line is the FULL DIAMETER — the pen sweeps exactly 2R end to end',
     worstSpan < 1e-12, `worst relative error ${worstSpan.toExponential(2)}`);
}

/* ── (3) THE NEG-CONTROL — off 2:1 the line opens into an ellipse ───────────── */
{
  const near = lineFit(2.1 * 1, 1, 6000);
  const far  = lineFit(2.6 * 1, 1, 6000);
  ok('(3) neg-control: R=2.1r is NOT straight — the figure opens (aspect ≫ the 1e-12 floor)',
     near.aspect > 1e-3, `aspect ${near.aspect.toExponential(2)}`);
  ok('(3b) and it opens FURTHER at R=2.6r — straightness is a knife-edge at 2:1, not a range',
     far.aspect > near.aspect, `${near.aspect.toFixed(4)} → ${far.aspect.toFixed(4)}`);
}

/* ── (4) d-CONTROL — d=0 is a perfect circle of radius R−r ──────────────────── */
{
  const R = 2, r = 1;
  let maxDev = 0;
  for (let k = 0; k <= 4000; k++) {
    const p = pen(R, r, 0, TAU * k / 4000, true);
    maxDev = Math.max(maxDev, Math.abs(Math.hypot(p.x, p.y) - (R - r)));
  }
  ok('(4) d=0 → an exact CIRCLE of radius R−r (so d really runs circle → line)',
     maxDev < 1e-12, `max |·|−(R−r) = ${maxDev.toExponential(2)}`);
}

/* ── (5) ROLLING WITHOUT SLIPPING — the drawn mechanism IS the formula ──────── */
{
  let worstC = 0, worstPin = 0;
  for (const [R, r] of [[2, 1], [2.1, 1], [3, 1.2], [5, 0.8]]) {
    for (let k = 0; k <= 720; k++) {
      const t = TAU * k / 720;
      const c = wheelCentre(R, r, t, true);
      worstC = Math.max(worstC, Math.abs(Math.hypot(c.x, c.y) - (R - r)));
      const p = pen(R, r, 1, t, true);
      worstPin = Math.max(worstPin, Math.abs(Math.hypot(p.x - c.x, p.y - c.y) - r));
    }
  }
  ok('(5) the wheel centre rides at radius R−r for every t and every ratio',
     worstC < 1e-12, `max error ${worstC.toExponential(2)}`);
  ok('(5b) the rim pen stays exactly r from that centre — it is PINNED to the rim',
     worstPin < 1e-12, `max error ${worstPin.toExponential(2)}`);
}

/* ── (6) WIRING — the shipped page inlines THIS file ────────────────────────── */
{
  const src = readFileSync(join(__dir, 'index.src.html'), 'utf8');
  ok('(6) tusi/index.src.html carries `forge:include core.mjs` (the page cannot fork this core)',
     /^[ \t]*<!--[ \t]*forge:include[ \t]+core\.mjs[ \t]*-->[ \t]*$/m.test(src));
  const built = readFileSync(join(__dir, 'index.html'), 'utf8');
  ok('(6b) and the built page really carries pen() + wheelCentre() + lineFit()',
     built.includes('function pen(R, r, d, t, inside)') &&
     built.includes('function wheelCentre(R, r, t, inside)') &&
     built.includes('function lineFit(R, r, N)'));
}

/* ── report ────────────────────────────────────────────────────────────────── */
for (const c of checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.note ? '  ·  ' + c.note : ''));
const pass = checks.filter((c) => c.ok).length;
console.log(`\n${pass}/${checks.length} ${pass === checks.length ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === checks.length ? 0 : 1);
