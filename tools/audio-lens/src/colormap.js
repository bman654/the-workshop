/* ============================================================================
   Audio Lens — magma-ish perceptual colormap.
   Lifted verbatim from web/index.html.
   ============================================================================ */

// magma-ish perceptual colormap, t in [0,1] → [r,g,b]
export const MAGMA = [
  [0,0,4],[28,16,68],[79,18,123],[129,37,129],[181,54,122],
  [229,80,100],[251,135,97],[254,194,135],[252,253,191]
];

export function magma(t) {
  t = Math.max(0, Math.min(1, t));
  const x = t * (MAGMA.length - 1);
  const i = Math.floor(x), f = x - i;
  const a = MAGMA[i], b = MAGMA[Math.min(i + 1, MAGMA.length - 1)];
  return [a[0] + (b[0]-a[0])*f, a[1] + (b[1]-a[1])*f, a[2] + (b[2]-a[2])*f];
}
