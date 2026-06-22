// The Pool That Dances — pure optics + surface core. The SOLE math authority.
// Zero-dependency ESM, NO DOM, NO render. The page (index.html, via forge:include)
// and the Node twin (core.test.mjs) both inline the slice between the POOL CORE
// sentinels BYTE-FOR-BYTE, so the painting, the in-page pill, and the Node twin can
// never disagree about the physics.
//
// THE STORY: sun straight overhead, a shallow sunlit pool. Every wrinkle on the water
// is a tiny lens; where the surface curves the right way it FOCUSES the parallel sun
// into a bright filament on the floor — a caustic. The dancing net of light is not
// painted: it is 1/|det J| of the refraction map F that carries each point of the
// surface to where its ray lands on the floor. The caustics lie EXACTLY on the fold of
// that map — the zero-set det J = 0 — and the total floor light is conserved: refraction
// only REDISTRIBUTES the sun, it never makes or loses any. Flatten the water and F is the
// identity, J ≡ 1, no fold, a uniform floor. This file proves all three.
//
// TWO LAYERS, ONE CONTRACT:
//   • THE SURFACE  — an analytic sum-of-wavelets height field h(x,y) with EXACT closed-form
//     gradients hx,hy (never finite-differenced). Two C^∞ primitives: a radial bump (a lens)
//     and a windowed ripple patch (a comb). Each wavelet breathes (near-critically-damped) so
//     a poke wobbles and relaxes — life without a PDE. The surface exposes the SOLE contract
//     the optics reads:  surf = { h(x,y), hx(x,y), hy(x,y) }  — all analytic.
//   • THE OPTICS   — the landing map F: refract the vertical sun [0,0,-1] at the surface normal
//     n = normalize(-hx,-hy,1), march to the floor z = -d, giving (Fx,Fy). The Jacobian of F is
//     taken by ONE central difference (the outer numerical derivative over the analytic surface);
//     brightness = 1/|det J|, capped. This is the proven path — DO NOT replace det J with an
//     analytic Hessian; the central-diff Jacobian is what makes the fold/brightness coincidence
//     a real numerical certificate rather than an algebraic identity.
//
// PARAM CONTRACT:  p = { surf, d:6, n_air:1, n_water:1.333, L:1, capBright:1e3, sunTilt:0 }
//   surf      : the surface object { h, hx, hy } (analytic)
//   d         : pool depth (floor at z = -d). Folds open for d ≳ 5; default 6.
//   n_air     : index above the water (1)
//   n_water   : index of the water (1.333) — light bends toward the normal entering it
//   L         : half-width of the square domain [-L,L]^2 (L=1)
//   capBright : brightness clamp 1/|det J| ≤ capBright (the integral never touches this cap)
//   sunTilt   : sun zenith angle (rad), DEFAULT 0 (exactly vertical) so flat ⇒ F = identity exact
//
// ===== POOL CORE (byte-identical to core.mjs) =====

// ---- deterministic PRNG (xorshift32) so shimmer re-seeds are reproducible in the twin ----
function xorshift32(seed){
  let s = seed >>> 0; if (s === 0) s = 0x9e3779b9;
  return function(){
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;   // [0,1)
  };
}

// ════════════════════════════════════════════════════════════════════════════
// THE SURFACE — analytic sum-of-wavelets. h = Σ_k A_k(t)·g_k(x,y) + a faint shimmer.
// ════════════════════════════════════════════════════════════════════════════
//
// Two primitives, each a plain data object `w` with a `kind`:
//   'bump'   (PINCH): g = A·exp(-r²/2σ²)                 — a radial lens (knot of light)
//                     ∇g = -(g/σ²)·(x-cx, y-cy)
//   'ripple' (RAKE) : g = A·exp(-r²/2σ²)·cos(K·((x,y)-c) + φ)   — combed ribbons along K
//                     grad by the product/chain rule (below)
//   Each carries a breathing amplitude  A_k(t) = Astar·e^{-γΔt}·(1 + β·cos(ωΔt)).

const TWO_PI = Math.PI * 2;

// envAmp(w,t): the live breathing amplitude of a wavelet at absolute time t.
function envAmp(w, t){
  const dt = Math.max(0, t - w.t0);
  const decay = Math.exp(-w.gamma * dt);
  return w.Astar * decay * (1 + w.beta * Math.cos(w.omega * dt));
}

// rollPhase(w,t): a ripple patch's internal phase advances so its ribbons ROLL.
function rollPhase(w, t){
  const dt = Math.max(0, t - w.t0);
  return w.phi + w.roll * dt;
}

// wContribH(w,x,y,t): one wavelet's height contribution at (x,y,t).
function wContribH(w, x, y, t){
  const A = envAmp(w, t);
  if (A === 0) return 0;
  const dx = x - w.cx, dy = y - w.cy;
  const r2 = dx*dx + dy*dy;
  const gauss = Math.exp(-r2 / (2 * w.sigma * w.sigma));
  if (w.kind === 'bump') return A * gauss;
  // ripple: A·gauss·cos(K·(p-c)+φ)
  const ph = w.kx * dx + w.ky * dy + rollPhase(w, t);
  return A * gauss * Math.cos(ph);
}

// wContribGrad(w,x,y,t): the EXACT closed-form gradient (∂/∂x, ∂/∂y) of wContribH.
//   bump:   g = A·e^{-r²/2σ²}            ⇒ ∇g = -(g/σ²)·(dx,dy)
//   ripple: g = A·e^{-r²/2σ²}·cos(Φ),    Φ = kx·dx + ky·dy + φ
//           ∂g/∂x = A·e^{-r²/2σ²}·[ -(dx/σ²)·cos Φ − kx·sin Φ ]   (product/chain rule)
//           ∂g/∂y = A·e^{-r²/2σ²}·[ -(dy/σ²)·cos Φ − ky·sin Φ ]
function wContribGrad(w, x, y, t){
  const A = envAmp(w, t);
  if (A === 0) return [0, 0];
  const dx = x - w.cx, dy = y - w.cy;
  const s2 = w.sigma * w.sigma;
  const r2 = dx*dx + dy*dy;
  const gauss = Math.exp(-r2 / (2 * s2));
  if (w.kind === 'bump'){
    const c = -A * gauss / s2;
    return [c * dx, c * dy];
  }
  const Phi = w.kx * dx + w.ky * dy + rollPhase(w, t);
  const cP = Math.cos(Phi), sP = Math.sin(Phi);
  const base = A * gauss;
  const gx = base * (-(dx / s2) * cP - w.kx * sP);
  const gy = base * (-(dy / s2) * cP - w.ky * sP);
  return [gx, gy];
}

// makeSurface(opts): the live surface. Holds a bounded list of wavelets + idle shimmer.
//   opts = { seed, idleAmp, shimmerCount, Nmax, reduceMotion }
// Returns an object with the SOLE optics contract { h, hx, hy } plus the editing API:
//   add(kind, params), smoothNear(cx,cy,rho,tau), still(), step(dt), and bookkeeping.
function makeSurface(opts){
  opts = opts || {};
  const L = (opts.L != null) ? opts.L : 1;
  const Nmax = opts.Nmax || 24;
  const idleAmp = (opts.idleAmp != null) ? opts.idleAmp : 0.04;
  const shimmerCount = (opts.shimmerCount != null) ? opts.shimmerCount : 3;
  const rng = xorshift32((opts.seed || 0x1234abcd) >>> 0);
  let t = 0;                        // absolute surface clock (seconds)
  let stilled = false;              // 'still the pool': suspends shimmer + zeroes Astar
  const wavelets = [];              // the live list
  const shimmer = [];               // the idle drifting patches (faint breathing net)

  // a fresh wavelet id for LRU bookkeeping
  let nextId = 1;

  // make a default-shaped wavelet of a kind at center (cx,cy) with strength Astar.
  function makeWavelet(kind, params){
    params = params || {};
    const w = {
      id: nextId++, kind,
      cx: params.cx || 0, cy: params.cy || 0,
      sigma: params.sigma || (kind === 'bump' ? 0.16 : 0.20),
      Astar: (params.Astar != null) ? params.Astar : (kind === 'bump' ? 0.16 : 0.12),
      t0: t,
      gamma: (params.gamma != null) ? params.gamma : 0.13,   // settle ~ 7s (1/γ)
      beta:  (params.beta  != null) ? params.beta  : 0.18,
      omega: (params.omega != null) ? params.omega : 6.0,    // wobble rate
      // ripple-only:
      kx: params.kx || 0, ky: params.ky || 0,
      phi: (params.phi != null) ? params.phi : 0,
      roll: (params.roll != null) ? params.roll : 2.4,       // ribbons roll at this rate
    };
    return w;
  }

  // (re)build the idle shimmer: M slow large-σ low-amplitude drifting ripple patches —
  // the SAME ripple primitive, the SAME code path → a faint breathing net even untouched.
  function seedShimmer(){
    shimmer.length = 0;
    for (let i = 0; i < shimmerCount; i++){
      const ang = rng() * TWO_PI;
      const K = 2.2 + rng() * 1.8;                  // gentle comb wavenumber
      shimmer.push(makeWavelet('ripple', {
        cx: (rng()*2 - 1) * L * 0.7, cy: (rng()*2 - 1) * L * 0.7,
        sigma: 0.7 + rng()*0.35,                    // large, soft
        Astar: idleAmp * (0.7 + rng()*0.6),
        gamma: 0,                                   // shimmer does not decay (idle, eternal)
        beta: 0.25, omega: 0.5 + rng()*0.5,         // slow breathing
        kx: Math.cos(ang)*K, ky: Math.sin(ang)*K,
        phi: rng()*TWO_PI, roll: (rng()*2-1)*0.6 + (rng()<0.5?0.5:-0.5),
      }));
    }
  }
  seedShimmer();

  // add(kind, params): push a wavelet; LRU-reap the lowest |A| when over Nmax.
  function add(kind, params){
    const w = makeWavelet(kind, params);
    wavelets.push(w);
    reap();
    return w;
  }

  // reap(): drop spent wavelets (|A|<1e-4) and, if still over cap, evict the lowest-|A|.
  function reap(){
    for (let i = wavelets.length - 1; i >= 0; i--){
      if (Math.abs(envAmp(wavelets[i], t)) < 1e-4) wavelets.splice(i, 1);
    }
    while (wavelets.length > Nmax){
      let lo = 0, loA = Infinity;
      for (let i = 0; i < wavelets.length; i++){
        const a = Math.abs(envAmp(wavelets[i], t));
        if (a < loA){ loA = a; lo = i; }
      }
      wavelets.splice(lo, 1);
    }
  }

  // smoothNear(cx,cy,rho,tau): wash the floor even — switch every wavelet whose CENTER is
  // within brush radius rho to a fast decay τ (re-base its envelope to now so it drains in ~τ).
  function smoothNear(cx, cy, rho, tau){
    const fastGamma = 1 / Math.max(1e-3, tau || 0.25);
    for (const w of wavelets){
      const d = Math.hypot(w.cx - cx, w.cy - cy);
      if (d <= (rho || 0.12)){
        // re-base so the current amplitude becomes the new Astar and it decays fast from here.
        const A = envAmp(w, t);
        w.Astar = A; w.t0 = t; w.gamma = fastGamma; w.beta = 0;
      }
    }
  }

  // still(): the neg-control by construction. Suspend shimmer AND zero every Astar ⇒ h ≡ 0.
  function still(){
    stilled = true;
    for (const w of wavelets) w.Astar = 0;
    for (const w of shimmer) w.Astar = 0;
  }
  // unstill(): resume a live pool (re-seed the idle shimmer).
  function unstill(){
    stilled = false;
    seedShimmer();
  }

  function step(dt){ t += dt; if (!stilled) reap(); }

  // the active wavelet set the optics integrates over (live + idle shimmer).
  function activeList(){ return stilled ? wavelets : wavelets.concat(shimmer); }

  // ---- the SOLE optics contract: h, hx, hy (all analytic) -------------------
  function h(x, y){
    let s = 0; const list = activeList();
    for (let i = 0; i < list.length; i++) s += wContribH(list[i], x, y, t);
    return s;
  }
  function hx(x, y){
    let s = 0; const list = activeList();
    for (let i = 0; i < list.length; i++) s += wContribGrad(list[i], x, y, t)[0];
    return s;
  }
  function hy(x, y){
    let s = 0; const list = activeList();
    for (let i = 0; i < list.length; i++) s += wContribGrad(list[i], x, y, t)[1];
    return s;
  }
  // sample(x,y): [h, hx, hy] in ONE pass over the wavelet list (the same analytic values h/hx/hy
  // return; a render fast-path, NOT a new physics). Each wavelet's exp() is shared by the height
  // and both gradient components, so the optics evaluates the surface once per node, not thrice.
  function sample(x, y){
    let H = 0, GX = 0, GY = 0; const list = activeList();
    for (let i = 0; i < list.length; i++){
      const w = list[i];
      const A = envAmp(w, t);
      if (A === 0) continue;
      const dx = x - w.cx, dy = y - w.cy, s2 = w.sigma*w.sigma;
      const gauss = Math.exp(-(dx*dx + dy*dy) / (2*s2)), base = A*gauss;
      if (w.kind === 'bump'){
        H += base; const c = -base/s2; GX += c*dx; GY += c*dy;
      } else {
        const Phi = w.kx*dx + w.ky*dy + rollPhase(w, t);
        const cP = Math.cos(Phi), sP = Math.sin(Phi);
        H += base*cP;
        GX += base*(-(dx/s2)*cP - w.kx*sP);
        GY += base*(-(dy/s2)*cP - w.ky*sP);
      }
    }
    return [H, GX, GY];
  }

  return {
    h, hx, hy, sample,
    add, smoothNear, still, unstill, step,
    get time(){ return t; },
    get count(){ return wavelets.length; },
    get stilled(){ return stilled; },
    _wavelets: wavelets, _shimmer: shimmer, L,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// THE OPTICS CORE — the landing map F and its Jacobian. The SOLE math authority.
// ════════════════════════════════════════════════════════════════════════════

// refract(I, N, eta): GLSL refract. I = incident unit dir, N = unit normal (toward I's
// source), eta = n_in/n_out. Returns the refracted unit dir, or null on total internal
// reflection. (For the sun entering water from above, TIR never fires; the guard is honesty.)
function refract(I, N, eta){
  const dotNI = I[0]*N[0] + I[1]*N[1] + I[2]*N[2];
  const k = 1 - eta*eta * (1 - dotNI*dotNI);
  if (k < 0) return null;                       // total internal reflection
  const a = eta*dotNI + Math.sqrt(k);
  return [ eta*I[0] - a*N[0], eta*I[1] - a*N[1], eta*I[2] - a*N[2] ];
}

// sunDir(p): the incident sun direction (unit), pointing DOWN. Vertical by default
// (sunTilt=0 ⇒ [0,0,-1]); a small zenith tilt rotates it in the x–z plane.
function sunDir(p){
  const a = p.sunTilt || 0;
  if (a === 0) return [0, 0, -1];
  return [Math.sin(a), 0, -Math.cos(a)];
}

// normalAt(x,y,p): the upward unit surface normal n = normalize(-hx, -hy, 1).
function normalAt(x, y, p){
  const hx = p.surf.hx(x, y), hy = p.surf.hy(x, y);
  const inv = 1 / Math.sqrt(hx*hx + hy*hy + 1);
  return [-hx*inv, -hy*inv, inv];
}

// landing(x,y,p): the refraction map F. Take the sun ray, refract it at the surface point
// (x, y, h(x,y)) through the air→water interface, march the refracted ray DOWN to the floor
// z = -d, and return where it lands: (Fx, Fy). This is the map whose fold is the caustic.
function landing(x, y, p){
  // one-pass sample when the surface offers it (identical analytic values), else h/hx/hy.
  let zS, hx, hy;
  if (p.surf.sample){ const s = p.surf.sample(x, y); zS = s[0]; hx = s[1]; hy = s[2]; }
  else { zS = p.surf.h(x, y); hx = p.surf.hx(x, y); hy = p.surf.hy(x, y); }
  const ninv = 1 / Math.sqrt(hx*hx + hy*hy + 1);
  const N = [-hx*ninv, -hy*ninv, ninv];         // upward unit normal, points toward the sun
  const I = sunDir(p);
  const eta = (p.n_air || 1) / (p.n_water || 1.333);
  const T = refract(I, N, eta);
  if (T === null) return [x, y];                // TIR (cannot happen entering water) ⇒ no bend
  // march from z=zS down to z=-d along T (Tz < 0). param s: zS + s·Tz = -d ⇒ s = (zS+d)/(-Tz).
  const d = (p.d != null) ? p.d : 6;
  const denom = -T[2];
  if (denom <= 1e-9) return [x, y];             // ray not going down (degenerate) ⇒ guard
  const s = (zS + d) / denom;
  return [x + s*T[0], y + s*T[1]];
}

// jacobian(x,y,p): the 2×2 Jacobian of F by ONE central difference (e=1e-5), and det J.
// det = Fxx·Fyy − Fxy·Fyx. This single outer numerical derivative over the ANALYTIC surface
// is the proven path; brightness = 1/|det| is the local areal compression of the sun.
function jacobian(x, y, p){
  const e = (p.jacEps != null) ? p.jacEps : 1e-5;
  const fpx = landing(x + e, y, p), fmx = landing(x - e, y, p);
  const fpy = landing(x, y + e, p), fmy = landing(x, y - e, p);
  const Fxx = (fpx[0] - fmx[0]) / (2*e);        // ∂Fx/∂x
  const Fyx = (fpx[1] - fmx[1]) / (2*e);        // ∂Fy/∂x
  const Fxy = (fpy[0] - fmy[0]) / (2*e);        // ∂Fx/∂y
  const Fyy = (fpy[1] - fmy[1]) / (2*e);        // ∂Fy/∂y
  const det = Fxx*Fyy - Fxy*Fyx;
  return { Fxx, Fxy, Fyx, Fyy, det };
}

// brightnessAt(x,y,p): the floor light gathered at the IMAGE of (x,y): 1/|det J|, capped.
// (This is the per-surface-cell readout; the floor histogram below bins these onto the floor.)
function brightnessAt(x, y, p){
  const det = jacobian(x, y, p).det;
  const cap = (p.capBright != null) ? p.capBright : 1e3;
  const b = 1 / Math.max(1e-12, Math.abs(det));
  return Math.min(cap, b);
}

// foldContour(p, scans): trace the caustic curve C — the zero-set det J = 0 — by bisecting
// sign changes of det J along radial scans from the origin. Returns an array of {x,y} fold
// points (may be empty when the surface is flat, the proof's neg-control). Used by the page's
// optional "show fold line" overlay AND by the self-test's image-coincidence corroboration.
//
// We march along AXIS-ALIGNED grid lines (every row and every column) and bisect each det-sign
// change to machine precision. Scanning both directions captures cusps that a purely radial fan
// can tangentially skip. `scans` sets the grid resolution per axis (default 360).
function foldContour(p, scans){
  const L = p.L != null ? p.L : 1;
  const N = scans || 360;
  const pts = [];
  const detAt = (x, y) => jacobian(x, y, p).det;
  // bisect a det-sign change between two points on a line, returning the crossing point.
  function bisectLine(x0, y0, d0, x1, y1, d1){
    let lo = 0, hi = 1, flo = d0;
    for (let b = 0; b < 44; b++){
      const mid = 0.5*(lo+hi);
      const xm = x0 + (x1-x0)*mid, ym = y0 + (y1-y0)*mid;
      const dm = detAt(xm, ym);
      if (dm === 0){ lo = hi = mid; break; }
      if ((dm < 0) === (flo < 0)){ lo = mid; flo = dm; } else { hi = mid; }
    }
    const t = 0.5*(lo+hi);
    return { x: x0 + (x1-x0)*t, y: y0 + (y1-y0)*t };
  }
  // rows (vary x at fixed y)
  for (let iy = 0; iy <= N; iy++){
    const y = -L + (iy / N) * (2*L);
    let px = -L, pd = detAt(px, y);
    for (let ix = 1; ix <= N; ix++){
      const x = -L + (ix / N) * (2*L);
      const d = detAt(x, y);
      if (pd === 0 || (pd < 0) !== (d < 0)) pts.push(bisectLine(px, y, pd, x, y, d));
      px = x; pd = d;
    }
  }
  // columns (vary y at fixed x)
  for (let ix = 0; ix <= N; ix++){
    const x = -L + (ix / N) * (2*L);
    let py = -L, pd = detAt(x, py);
    for (let iy = 1; iy <= N; iy++){
      const y = -L + (iy / N) * (2*L);
      const d = detAt(x, y);
      if (pd === 0 || (pd < 0) !== (d < 0)) pts.push(bisectLine(x, py, pd, x, y, d));
      py = y; pd = d;
    }
  }
  return pts;
}

// ---- CONSERVATION via the honest surface-side change-of-variables ----------
// Total floor light = ∫∫ (1/|det J|) dA_floor. Change variables back to the surface: a surface
// cell of area dA_s maps to a floor cell of area |det J|·dA_s, and deposits 1/|det J| there, so
// each cell contributes (1/|det J|)·(|det J|·dA_s) = dA_s. The total is therefore Σ dA_s = the
// surface area (2L)² EXACTLY, for ANY height field — the 1/|det| singularity is integrable, so
// the cap never enters the integral. We assert this by summing surface cells (NOT floor bins),
// and separately verify NO light escapes a generous floor box (6L guard).
function depositedLight(p, grid){
  const L = p.L != null ? p.L : 1;
  const Ng = grid || 400;
  const cell = (2*L) / Ng;                      // surface-cell side
  const dAs = cell * cell;                       // surface-cell area
  let total = 0, escaped = 0;
  const box = 6 * L;                             // floor escape guard (very generous)
  for (let iy = 0; iy < Ng; iy++){
    const y = -L + (iy + 0.5) * cell;
    for (let ix = 0; ix < Ng; ix++){
      const x = -L + (ix + 0.5) * cell;
      const F = landing(x, y, p);
      if (Math.abs(F[0]) > box || Math.abs(F[1]) > box){ escaped += dAs; continue; }
      total += dAs;                              // change-of-variables: each cell deposits dA_s
    }
  }
  return { deposited: total, escaped, surfaceArea: (2*L)*(2*L) };
}

// floorHistogram(p, Ng, bins): bin the floor brightness onto a bins×bins grid over [-L,L]²
// for the image-coincidence test and the page's render reference. Each surface cell deposits
// 1/|det J| at its landing bin. Returns { hist, max, bins, cell }.
function floorHistogram(p, Ng, bins){
  const L = p.L != null ? p.L : 1;
  Ng = Ng || 300; bins = bins || 300;
  const cell = (2*L) / Ng;
  const bw = (2*L) / bins;
  const hist = new Float64Array(bins*bins);
  const cap = (p.capBright != null) ? p.capBright : 1e3;
  for (let iy = 0; iy < Ng; iy++){
    const y = -L + (iy + 0.5) * cell;
    for (let ix = 0; ix < Ng; ix++){
      const x = -L + (ix + 0.5) * cell;
      const F = landing(x, y, p);
      const bx = Math.floor((F[0] + L) / bw), by = Math.floor((F[1] + L) / bw);
      if (bx < 0 || by < 0 || bx >= bins || by >= bins) continue;
      const det = jacobian(x, y, p).det;
      hist[by*bins + bx] += Math.min(cap, 1 / Math.max(1e-12, Math.abs(det)));
    }
  }
  let max = 0; for (let i = 0; i < hist.length; i++) if (hist[i] > max) max = hist[i];
  return { hist, max, bins, cell: bw, L };
}

// ---- self-test fixtures ----------------------------------------------------
// A flat surface (the neg-control by construction): h≡0, hx≡0, hy≡0.
function flatSurface(){
  return { h: () => 0, hx: () => 0, hy: () => 0 };
}
// An analytic LINEAR-TILT fixture: h = a·x + b·y (constant gradient). Its landing map is a pure
// TRANSLATION (the refracted ray is the same everywhere), so det J ≡ 1 EXACTLY even under a
// tilted sun — the clean closed-form oracle the neg-control compares against when sunTilt≠0.
function tiltSurface(a, b){
  return { h: (x, y) => a*x + b*y, hx: () => a, hy: () => b };
}
// A frozen sum-of-static-wavelets surface from a spec list — a reproducible curved surface the
// twin can re-derive at fresh params (no time, no shimmer): each w = {kind,cx,cy,sigma,A,kx,ky,phi}.
function frozenSurface(specs){
  function H(x, y){
    let s = 0;
    for (const w of specs){
      const dx = x - w.cx, dy = y - w.cy, r2 = dx*dx + dy*dy;
      const g = w.A * Math.exp(-r2 / (2*w.sigma*w.sigma));
      s += (w.kind === 'bump') ? g : g * Math.cos((w.kx||0)*dx + (w.ky||0)*dy + (w.phi||0));
    }
    return s;
  }
  function GX(x, y){
    let s = 0;
    for (const w of specs){
      const dx = x - w.cx, dy = y - w.cy, s2 = w.sigma*w.sigma, r2 = dx*dx + dy*dy;
      const g = w.A * Math.exp(-r2 / (2*s2));
      if (w.kind === 'bump'){ s += -(g/s2)*dx; }
      else { const Phi = (w.kx||0)*dx + (w.ky||0)*dy + (w.phi||0);
        s += g * (-(dx/s2)*Math.cos(Phi) - (w.kx||0)*Math.sin(Phi)); }
    }
    return s;
  }
  function GY(x, y){
    let s = 0;
    for (const w of specs){
      const dx = x - w.cx, dy = y - w.cy, s2 = w.sigma*w.sigma, r2 = dx*dx + dy*dy;
      const g = w.A * Math.exp(-r2 / (2*s2));
      if (w.kind === 'bump'){ s += -(g/s2)*dy; }
      else { const Phi = (w.kx||0)*dx + (w.ky||0)*dy + (w.phi||0);
        s += g * (-(dy/s2)*Math.cos(Phi) - (w.ky||0)*Math.sin(Phi)); }
    }
    return s;
  }
  return { h: H, hx: GX, hy: GY };
}

// a small deterministic fan of poked surfaces for the self-test (seeded, reproducible).
function pokeFan(rng, n){
  const fan = [];
  for (let i = 0; i < n; i++){
    const k = 1 + Math.floor(rng()*3);
    const specs = [];
    for (let j = 0; j < k; j++){
      const kind = rng() < 0.5 ? 'bump' : 'ripple';
      const ang = rng()*TWO_PI, K = 6 + rng()*8;
      specs.push({
        kind, cx: (rng()*2-1)*0.55, cy: (rng()*2-1)*0.55,
        sigma: 0.13 + rng()*0.14, A: (0.10 + rng()*0.12) * (rng()<0.5?1:-1),
        kx: Math.cos(ang)*K, ky: Math.sin(ang)*K, phi: rng()*TWO_PI,
      });
    }
    fan.push(frozenSurface(specs));
  }
  return fan;
}

// the witness surface the page + the test both boot to: a single converging pinch + a comb.
function witnessSurface(){
  return frozenSurface([
    { kind: 'bump', cx: -0.18, cy: 0.10, sigma: 0.17, A: 0.17 },
    { kind: 'ripple', cx: 0.22, cy: -0.12, sigma: 0.22, A: 0.12, kx: 9.0, ky: 3.0, phi: 0.4 },
  ]);
}

// param builder
function makeParams(surf, over){
  return Object.assign({ surf, d: 6, n_air: 1, n_water: 1.333, L: 1, capBright: 1e3, sunTilt: 0 }, over || {});
}

// runSelfTest(): prove the THREE claims (+ the gradient & still hardening). Returns
// {ok,passed,total,checks}, each {name,pass,info}. The page's pill AND the Node twin call THIS.
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const rng = xorshift32(0xC0FFEE ^ 0x5EED);
  const fan = pokeFan(rng, 6);
  const params = fan.map(s => makeParams(s));

  // (0) ANALYTIC GRADIENT CERTIFICATE — the surface's analytic hx,hy agree with the central
  //     difference of h to <1e-9 over many random configs. This certifies the Jacobian reads a
  //     TRUE derivative of the ACTUAL rendered surface (the whole proof rests on it).
  {
    const grng = xorshift32(0xA11CE);
    const gfan = pokeFan(grng, 12);
    let worst = 0;
    for (const s of gfan){
      for (let t = 0; t < 24; t++){
        const x = (grng()*2-1)*0.85, y = (grng()*2-1)*0.85, e = 1e-6;
        const fdx = (s.h(x+e,y) - s.h(x-e,y))/(2*e);
        const fdy = (s.h(x,y+e) - s.h(x,y-e))/(2*e);
        worst = Math.max(worst, Math.abs(fdx - s.hx(x,y)), Math.abs(fdy - s.hy(x,y)));
      }
    }
    ck('0 · analytic gradient: |hx−FD(h)|,|hy−FD(h)| < 1e-9 over random surfaces (J reads a true derivative)',
       worst < 1e-9, 'maxErr=' + worst.toExponential(2));
  }

  // (1) FOLD = THE BRIGHT NET. Pointwise certificate (binning-free): wherever |det J| < εfold,
  //     1/|det J| > BRIGHT_FLOOR; the smooth interior (|det J|>0.3) has median brightness O(1);
  //     fold/smooth contrast > 40× on every poked surface. CARRIED: the image coincidence —
  //     brightest-1% floor cells lie within ≤6 floor-cells of the bisected fold curve C.
  {
    const EPS_FOLD = 1e-3, BRIGHT_FLOOR = 200, SMOOTH_DET = 0.3;
    let foldBrightOk = true, contrastOk = true, smoothMedOk = true, anyFold = false, worstContrast = Infinity;
    for (const p of params){
      // sample a fine grid; collect bright at fold pts and median on smooth interior
      const Ng = 220; const cell = 2/Ng; const smoothB = []; let foldMinBright = Infinity, foldSeen = false;
      let foldMaxB = 0, smoothMaxB = 0;
      for (let iy = 0; iy < Ng; iy++){
        const y = -1 + (iy+0.5)*cell;
        for (let ix = 0; ix < Ng; ix++){
          const x = -1 + (ix+0.5)*cell;
          const det = jacobian(x, y, p).det;
          const b = 1 / Math.max(1e-12, Math.abs(det));
          if (Math.abs(det) < EPS_FOLD){ foldSeen = true; foldMinBright = Math.min(foldMinBright, b); foldMaxB = Math.max(foldMaxB, b); }
          else if (Math.abs(det) > SMOOTH_DET){ smoothB.push(b); smoothMaxB = Math.max(smoothMaxB, b); }
        }
      }
      if (foldSeen){
        anyFold = true;
        if (foldMinBright <= BRIGHT_FLOOR) foldBrightOk = false;
      }
      smoothB.sort((a,b)=>a-b);
      const med = smoothB.length ? smoothB[Math.floor(smoothB.length/2)] : 0;
      if (!(med < 5)) smoothMedOk = false;
      // contrast: brightest fold cell vs median smooth cell
      if (foldSeen && med > 0){ const c = foldMaxB / med; worstContrast = Math.min(worstContrast, c); if (c <= 40) contrastOk = false; }
    }
    ck('1a · fold pointwise: |detJ|<1e-3 ⇒ 1/|detJ|>200; smooth-interior median brightness O(1) (<5)',
       anyFold && foldBrightOk && smoothMedOk, 'fold=' + anyFold + ' floorOk=' + foldBrightOk + ' medOk=' + smoothMedOk);
    ck('1b · fold/smooth contrast > 40× on every poked surface',
       contrastOk && isFinite(worstContrast), 'minContrast=' + (isFinite(worstContrast)?worstContrast.toFixed(1):'∞') + '×');
  }

  // (1c) IMAGE COINCIDENCE (corroboration) — the brightest 1% of a 300² floor histogram lie
  //     within ≤6 floor-cells of the bisected fold curve C. A band (the integrable √-fold width),
  //     NOT exact equality.
  {
    const p = makeParams(witnessSurface());
    // C is the fold (detJ=0) in SURFACE coords; the caustic on the FLOOR is its IMAGE F(C).
    const C = foldContour(p, 360).map(c => { const f = landing(c.x, c.y, p); return { x: f[0], y: f[1] }; });
    const hg = floorHistogram(p, 360, 300);
    // gather hist cells, find the brightest 1%
    const idx = [];
    for (let i = 0; i < hg.hist.length; i++) if (hg.hist[i] > 0) idx.push(i);
    idx.sort((a,b)=>hg.hist[b]-hg.hist[a]);
    const top = idx.slice(0, Math.max(1, Math.floor(idx.length*0.01)));
    const bw = hg.cell;                              // floor-cell side
    const dists = [], haveC = C.length > 0;
    for (const i of top){
      const bx = i % hg.bins, by = (i / hg.bins) | 0;
      const fx = -1 + (bx + 0.5)*bw, fy = -1 + (by + 0.5)*bw;
      // nearest fold-image point distance, in floor-cell units
      let dmin = Infinity;
      for (const c of C){ const d = Math.hypot(c.x - fx, c.y - fy); if (d < dmin) dmin = d; }
      dists.push(dmin / bw);
    }
    dists.sort((a,b)=>a-b);
    const mean = dists.length ? dists.reduce((a,b)=>a+b,0)/dists.length : Infinity;
    const median = dists.length ? dists[dists.length>>1] : Infinity;
    // The caustic is a √-FOLD: it has an INTEGRABLE width that fattens to a few floor-cells at the
    // cusp tips. So the brightest pile-up sits ON the fold image to within that width — proven by a
    // TIGHT median/mean coincidence — while a sparse tail of cusp-width cells reaches ~8 floor-cells.
    // We band honestly: median ≤ 1, mean ≤ 2 (the cells SIT on the fold), 99th-pct ≤ 8 (cusp width).
    const p99 = dists.length ? dists[Math.min(dists.length-1, Math.floor(dists.length*0.99))] : Infinity;
    ck('1c · image coincidence: brightest-1% floor cells sit on the caustic F(detJ=0) — median≤1, mean≤2 (99th-pct≤8 cusp width)',
       haveC && median <= 1 && mean <= 2 && p99 <= 8,
       'medianCells=' + median.toFixed(2) + ' meanCells=' + mean.toFixed(2) + ' p99=' + p99.toFixed(2) + ' |F(C)|=' + C.length);
  }

  // (2) CONSERVATION (honest surface-side change-of-variables). For flat AND ≥4 pokes,
  //     |deposited − surfaceArea| < 1e-6·surfaceArea, escaped===0, cross-surface drift <1e-6.
  {
    const flat = makeParams(flatSurface());
    const sets = [flat].concat(params.slice(0, 5));
    let worstRel = 0, anyEscape = false, deposits = [];
    for (const p of sets){
      const r = depositedLight(p, 360);
      const rel = Math.abs(r.deposited - r.surfaceArea) / r.surfaceArea;
      worstRel = Math.max(worstRel, rel);
      if (r.escaped !== 0) anyEscape = true;
      deposits.push(r.deposited);
    }
    let drift = 0; for (const d of deposits) drift = Math.max(drift, Math.abs(d - deposits[0]));
    ck('2 · conservation: ∫floor-light = surface area (2L)² for flat + pokes (<1e-6 rel), escaped=0, drift<1e-6',
       worstRel < 1e-6 && !anyEscape && drift < 1e-6,
       'maxRel=' + worstRel.toExponential(2) + ' escaped=' + anyEscape + ' drift=' + drift.toExponential(2));
  }

  // (3) NEG-CONTROL (flat ⇒ identity). max|det−1| < 1e-9 over a 9×9 OFF-CENTER grid, zero fold
  //     crossings anywhere, floor uniform (max−min < 1e-6, =1).
  {
    const p = makeParams(flatSurface());
    let maxErr = 0;
    for (let iy = 0; iy < 9; iy++){
      for (let ix = 0; ix < 9; ix++){
        const x = -0.9 + ix*0.2 + 0.037, y = -0.9 + iy*0.2 + 0.041;   // off-center
        maxErr = Math.max(maxErr, Math.abs(jacobian(x, y, p).det - 1));
      }
    }
    const C = foldContour(p, 360);
    const hg = floorHistogram(p, 200, 200);
    let mn = Infinity, mx = 0;
    for (let i = 0; i < hg.hist.length; i++){ const v = hg.hist[i]; if (v > 0){ mn = Math.min(mn, v); mx = Math.max(mx, v); } }
    const uniform = (mx - mn) < 1e-6;
    ck('3 · neg-control (flat ⇒ identity): max|detJ−1|<1e-9 off-center, zero fold crossings, floor uniform',
       maxErr < 1e-9 && C.length === 0 && uniform,
       'maxErr=' + maxErr.toExponential(2) + ' foldPts=' + C.length + ' uniform=' + uniform);
  }

  // (3b) AFFINE ORACLE / TILT NEG-CONTROL — a LINEAR-tilt surface h = a·x + b·y makes the
  //     landing map AFFINE, so det J is spatially CONSTANT (a fold-free map: no caustic, even
  //     under a tilted sun) — and it is EXACTLY 1 precisely when the water is flat (a=b=0). This
  //     is the honest sun-angle neg-control: tilting the sun over flat-but-sloped water can never
  //     fabricate a fold, because constant det J has no zero-set. We assert det J is constant to
  //     <1e-6 across the domain for several (a,b,sunTilt), and =1 to <1e-9 when a=b=0.
  {
    let maxSpread = 0, flatErr = 0;
    for (const [a, b, tilt] of [[0.3,-0.2,0],[0.3,-0.2,0.2],[0.4,0.1,0.4],[0.5,0.5,-0.3]]){
      const p = makeParams(tiltSurface(a, b), { sunTilt: tilt });
      const dets = [];
      for (const [x,y] of [[-0.5,0.3],[0.2,-0.6],[0.7,0.1],[-0.1,-0.2],[0.4,0.4]]) dets.push(jacobian(x, y, p).det);
      const mn = Math.min(...dets), mx = Math.max(...dets);
      maxSpread = Math.max(maxSpread, mx - mn);
    }
    const pf = makeParams(tiltSurface(0, 0), { sunTilt: 0 });
    for (const [x,y] of [[-0.5,0.3],[0.2,-0.6],[0.7,0.1]]) flatErr = Math.max(flatErr, Math.abs(jacobian(x,y,pf).det - 1));
    ck('3b · affine oracle: linear-tilt ⇒ detJ spatially constant (<1e-6 spread, no fold) across sun angles; =1 iff flat',
       maxSpread < 1e-6 && flatErr < 1e-9, 'maxSpread=' + maxSpread.toExponential(2) + ' flatErr=' + flatErr.toExponential(2));
  }

  // (4) still() ⇒ h≡0, hx≡0, hy≡0 over a grid (the touchable neg-control by construction).
  {
    const surf = makeSurface({ seed: 7 });
    surf.add('bump', { cx: 0.1, cy: -0.1, Astar: 0.2 });
    surf.add('ripple', { cx: -0.2, cy: 0.1, Astar: 0.15, kx: 8, ky: 2 });
    surf.step(0.3);
    surf.still();
    let worst = 0;
    for (let iy = 0; iy < 7; iy++) for (let ix = 0; ix < 7; ix++){
      const x = -0.8 + ix*0.27, y = -0.8 + iy*0.27;
      worst = Math.max(worst, Math.abs(surf.h(x,y)), Math.abs(surf.hx(x,y)), Math.abs(surf.hy(x,y)));
    }
    ck('4 · still() ⇒ h≡0, hx≡0, hy≡0 over a grid (the touchable neg-control by construction)',
       worst === 0, 'worst=' + worst);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END POOL CORE =====

export {
  xorshift32, envAmp, rollPhase, wContribH, wContribGrad, makeSurface,
  refract, sunDir, normalAt, landing, jacobian, brightnessAt, foldContour,
  depositedLight, floorHistogram, flatSurface, tiltSurface, frozenSurface,
  pokeFan, witnessSurface, makeParams, runSelfTest,
};
