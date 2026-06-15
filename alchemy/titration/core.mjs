/* ============================================================================
   ALCHEMY LAB · TITRATION — core.mjs   (the SOLE pH authority for the bench)

   A titration is a CHARGE-BALANCE statement. Pour a strong base (NaOH, conc Cb)
   into a strong acid (HCl, conc Ca, volume Va). At 25 °C water self-ionizes with
   Kw = [H⁺][OH⁻] = 1e-14. The solution stays electrically neutral at every drop:

        [Na⁺] + [H⁺]  =  [Cl⁻] + [OH⁻]
        Cb·V/(Va+V) + h  =  Ca·Va/(Va+V) + Kw/h

   Let  d = (Ca·Va − Cb·V)/(Va+V)   — the EXCESS strong-acid concentration
   (d > 0 before equivalence, d = 0 exactly at it, d < 0 past it). Then

        h − Kw/h = d        ⇒        h² − d·h − Kw = 0
        h = (d + √(d² + 4·Kw)) / 2          (the positive root is [H⁺])
        pH = −log10(h)

   This is EXACT — no "neglect Kw", no "the acid dominates" approximation. The
   curve passes through pH = 7.000000000 at the equivalence volume because there
   d = 0 ⇒ h = √Kw = 1e-7. One drop before, d > 0 and pH < 7; one drop after,
   d < 0 and the [OH⁻] root takes over and pH leaps. Everything the bench paints
   is read FROM this module; the bench recomputes no pH of its own.

   (Sign convention note: the /tmp check scripts used d=(Ca·Va−Cb·V) → h=(d+√…)/2;
    a textbook that writes d=(Cb·V−Ca·Va) gets the SAME pH off the OTHER root
    h=(−d+√…)/2. We pick the FORMER and keep it consistent everywhere below.)

   index.html INLINES this file byte-identical between sentinels; core.test.mjs
   runs it in Node. If the page's inline ever drifts from this file, the page's
   re-extraction parity check fails.
   ============================================================================ */

// ── physical + display constants (labeled; the bench reads these, never hardcodes) ──
export const KW = 1e-14;          // water ion product at 25 °C
export const DROP_ML = 0.05;      // one drop ≈ 0.05 mL (20 drops / mL) — the visible grain
export const INDICATOR_PH = 8.2;  // phenolphthalein's first-blush threshold (a DISPLAY rule,
                                  // deliberately ≠ the pH=7 equivalence point — that gap is the lesson)

// ── the exact charge-balance hydrogen-ion concentration at added volume V ──
// d>0 before eq, =0 at eq, <0 past it. h solves h² − d·h − Kw = 0 (positive root).
export function hPlus(V, { Ca, Va, Cb, Kw = KW } = {}){
  const d = (Ca * Va - Cb * V) / (Va + V);
  return (d + Math.sqrt(d * d + 4 * Kw)) / 2;
}

// ── pH(V): the headline number everything else is painted from ──
export function pH(V, opts){ return -Math.log10(hPlus(V, opts)); }

// ── the EXACT hydroxide from the SAME quadratic, via the OTHER root.
// past equivalence d<0 and h=(d+√…)/2 is tiny; [OH⁻]=(−d+√(d²+4Kw))/2 is its
// reciprocal partner (h·OH = Kw exactly). The honest 1e-12-class overshoot claim
// is pH(V) == 14 + log10(hydroxideExact(V)), NOT the neglect-Kw simplification. ──
export function hydroxideExact(V, { Ca, Va, Cb, Kw = KW } = {}){
  const d = (Ca * Va - Cb * V) / (Va + V);
  return (-d + Math.sqrt(d * d + 4 * Kw)) / 2;
}

// ── the equivalence volume: moles of base == moles of acid. Va·Ca = V·Cb. ──
export function Veq({ Ca, Va, Cb }){ return Ca * Va / Cb; }

// ── the indicator's display color from pH ALONE (computed wholly separately from
// any pH=7 test; the threshold is INDICATOR_PH=8.2, the real phenolphthalein turn).
// colorless < 8.0 → blush 8.0–8.4 → magenta > 9. Returns {name, css, t} where t∈[0,1]
// is the magenta fraction, so the flask tint and this function can NEVER disagree. ──
export function indicatorColor(p){
  if(p < 8.0)  return { name: 'colorless', t: 0,
    css: 'rgba(214,38,110,0.00)' };
  if(p > 9.0)  return { name: 'magenta', t: 1,
    css: 'rgba(214,38,110,0.62)' };
  // a smooth blush ramp across the phenolphthalein turn (8.0 → 9.0)
  const t = (p - 8.0) / 1.0;
  return { name: 'blush', t, css: 'rgba(214,38,110,' + (0.62 * t).toFixed(4) + ')' };
}

// ── endpointV: invert pH(V) = INDICATOR_PH by bisection. This is the VISIBLE
// endpoint — the volume at which the eye sees pink — computed INDEPENDENTLY of
// Veq (no acid/base bookkeeping, only the pH curve and the 8.2 threshold). It
// lands a hair PAST Veq, and that titration-error gap is honestly the whole point. ──
export function endpointV(opts, target = INDICATOR_PH){
  const ve = Veq(opts);
  let lo = ve, hi = ve + Math.max(2, ve);     // the endpoint is always past Veq for a base titrant
  // ensure the bracket straddles the target
  for(let i = 0; i < 60 && pH(hi, opts) < target; i++){ hi += Math.max(2, ve); }
  for(let i = 0; i < 200; i++){
    const m = (lo + hi) / 2;
    if(pH(m, opts) < target) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

// ── backSolveCa: from a recorded endpoint volume Vend (the analyst's measurement)
// recover the unknown acid concentration. The textbook formula assumes Vend == Veq:
// Ca = Cb·Vend/Va. So an endpoint read a hair past true Veq over-estimates Ca by
// exactly the titration error — and at a TRUE Veq it recovers Ca to machine ε. ──
export function backSolveCa({ Vend, Cb, Va }){ return Cb * Vend / Va; }

/* ============================================================================
   THE PRESET LIBRARY — three concentration regimes (the dilution dial) plus the
   default. Each carries assertions the self-test (both Node and in-page) checks,
   so the dilution lesson is underwritten, not asserted by hand. The default 0.1 M
   is dramatic: a sub-drop endpoint gap. Diluting to 0.001 M opens a multi-drop gap.
   ============================================================================ */
export const LIBRARY = [
  { id: 'M01',   name: '0.1 M',   Ca: 0.1,   Va: 25.0, Cb: 0.1,   sharp: 'sharp cliff · sub-drop gap' },
  { id: 'M001',  name: '0.01 M',  Ca: 0.01,  Va: 25.0, Cb: 0.01,  sharp: 'softer · ~⅓-drop gap'      },
  { id: 'M0001', name: '0.001 M', Ca: 0.001, Va: 25.0, Cb: 0.001, sharp: 'flat · multi-drop gap'      },
];
export const DEFAULT_PRESET = 'M01';
export function preset(id){ return LIBRARY.find(p => p.id === id) || LIBRARY[0]; }
