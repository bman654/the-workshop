// ============================================================================
//  THE MAXWELL–BOLTZMANN GAS — collision CORE (the single source of truth).
//
//  Pure, dependency-free. This is the SOLE authority for the 2-D hard-disc
//  collision engine: the PRNG, the exact equal-mass elastic exchange, the
//  momentum/kinetic/speed ledgers, the 2-D temperature ⟨½v²⟩, the M–B CDF,
//  and the inverse-CDF thermal sampler. The IDENTICAL slice (between the same
//  sentinels, `export` stripped) is inlined into:
//    · cavern/maxwell-boltzmann/index.html  (the gas that relaxes to the bell)
//    · cavern/pressure/index.html           (where pressure comes from)
//  so every bench that simulates this gas runs the SAME proven collision rule.
//  mb-core.test.mjs asserts the inlined page slices === this module slice,
//  char-for-char (the byte-twin guard).
//
//  Conventions: m = 1, k_B ≡ 1 throughout. kT_from returns ⟨½v²⟩ = ½⟨v²⟩,
//  which IS the 2-D temperature by equipartition (⟨½mv²⟩ = kT, two d.o.f.).
// ============================================================================

// ===== MB CORE (inlined byte-twin) BEGIN =====
  // A tiny deterministic PRNG (mulberry32) so seeds reproduce exactly.
  export function rng(seed){
    var s = seed >>> 0;
    return function(){
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Elastic collision of two EQUAL-mass discs in 2-D ──────────────
  // For equal masses, the two discs simply EXCHANGE the components of
  // their velocities along the line of centres (n̂); the tangential
  // components are untouched. This conserves total momentum AND total
  // kinetic energy exactly, by construction. (m=1 throughout.)
  //   Δv = -( (v1-v2)·n̂ ) n̂   added to v1, subtracted from v2.
  export function collideEqual(v1, v2, nx, ny){
    var dvx = v1[0] - v2[0], dvy = v1[1] - v2[1];
    var dot = dvx*nx + dvy*ny;            // closing speed along n̂
    if(dot >= 0) return false;            // already separating — no collision
    var jx = dot*nx, jy = dot*ny;         // the exchanged component
    v1[0] -= jx; v1[1] -= jy;
    v2[0] += jx; v2[1] += jy;
    return true;
  }

  // momentum & kinetic-energy ledgers (m=1)
  export function momentum(vels){ var px=0, py=0; for(var i=0;i<vels.length;i++){ px+=vels[i][0]; py+=vels[i][1]; } return [px,py]; }
  export function kinetic(vels){ var k=0; for(var i=0;i<vels.length;i++){ k += 0.5*(vels[i][0]*vels[i][0]+vels[i][1]*vels[i][1]); } return k; }
  export function speeds(vels){ var s=new Array(vels.length); for(var i=0;i<vels.length;i++){ s[i]=Math.hypot(vels[i][0],vels[i][1]); } return s; }

  // ── The 2-D Maxwell–Boltzmann (Rayleigh) speed law ────────────────
  // From equipartition, kT = ⟨½ v²⟩ = ½⟨v²⟩, i.e. kT = (mean square speed)/2.
  export function kT_from(vels){ return 0.5 * (2*kinetic(vels) / vels.length); } // = ⟨½v²⟩ averaged
  // CDF (closed form): F(v) = 1 − exp(−v²/2kT). Used for exact bin probabilities.
  export function mbCdf(v, kT){ if(kT<=0) return (v>0?1:0); return 1 - Math.exp(-(v*v)/(2*kT)); }

  // ── Build a velocity set by drawing speeds from a TRUE 2-D M–B at kT ──
  // Inverse-CDF: v = √(−2kT·ln(1−u)).
  export function sampleMB(n, kT, rand){
    var vels=new Array(n);
    for(var i=0;i<n;i++){
      var u=rand(); if(u>=1) u=0.999999999;
      var v=Math.sqrt(-2*kT*Math.log(1-u));
      var th=2*Math.PI*rand();
      vels[i]=[v*Math.cos(th), v*Math.sin(th)];
    }
    return vels;
  }
// ===== MB CORE END =====
