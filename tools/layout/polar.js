/* ════════════════════════════════════════════════════════════════════════════
   polar.js — THE POLAR SOLVER (layout engine v2, WS1 §1.4–§1.7)

   Pure, deterministic geometry: it takes the district DEEDS (contract.js: an orbit
   angle+tier + a frame-derived ρ per district) and DERIVES —
     · §1.4  the quantized-elastic tier radii (radial + conservative angular constraint)
             and each district's in-band offset (hash01-seeded) → its solved centre;
     · §1.5  the HARD angular law (uniqueness · separation · road-wedge · sky-lane
             clearance, all at the worst-case inward radius) + freeSlots(tier);
     · §1.4  the post-solve all-pairs clearance assert (true worst case);
     · §1.7  the DERIVED viewBox / world extent / camera K constants (the
             0 0 1440 900-never-mutated contract dies here — everything flows from ρ).

   DETERMINISM (§1.6): no Math.random, no Date, no locale/Intl, no unsorted key
   iteration. fnv1a32 / hash01 is the ONE shared hash — exported here and imported
   wherever else a stable seed is needed (derive-sky §3.2 reuses THIS one, never a
   re-seeded copy). All EMITTED numbers round to 0.1 (radii, star anchors, gate radii
   too — the rule binds everything emitted, not just leaf coordinates); the viewBox W/H
   are integers quantized up to 20. solve() double-runs byte-identical (polar.test.cjs).

   This is a LIBRARY: solve(contracts, opts) operates on its arguments and never reaches
   for a global — so it forge-inlines standalone and Node-requires standalone. The facade
   (layout.js) wires contract.CONTRACTS + formation hulls through it; the built-in ROAD/
   LANES defaults MATCH contract.js (the twin test asserts it) so a stray standalone call
   is still correct. Mirrors research/geometry-check.mjs (the committed oracle) exactly.
   ════════════════════════════════════════════════════════════════════════════ */

var Polar = (function () {
  'use strict';

  var DEG = Math.PI / 180;

  /* ── §1.4/§1.5/§1.7 constants (the oracle's G_BAND/G_ARC/QUANTUM/… + the world pads).
     ROAD/LANES here are DEFAULTS that mirror contract.js — the single source of truth is
     contract.js; opts.road/opts.lanes override these when the facade passes them. ── */
  var CONST = {
    G_BAND: 36,          // radial band gap between tiers
    G_ARC: 28,           // arc gap between same-tier neighbours
    QUANTUM: 24,         // tier-radius quantum (diff-stability, §1.4 step 3)
    MAX_OFF: 28,         // max in-band offset magnitude (§1.4 step 4)
    G_MIN: 16,           // min centre-to-centre clearance slack (§1.4 step 4)
    ANG_PAD: 40,         // angular-constraint denominator pad (>MAX_OFF on purpose, round 7)
    MARGIN: 1.5,         // spans must clear a reservation by ≥1.5° (§1.5)
    SKY_BAND: 240,       // sky annulus depth (§3.2)
    SKY_GAP: 60,         // R_sky = maxEdge + 60 (sky ring anchor)
    GATE_GAP: 70,        // R_gate = maxEdge + 70 (south gate, inside the ring)
    LABEL_MARGIN: 60,    // §1.7 additive label pad per side
    WORLD_PAD: 16,       // §1.7 pad per side
    WORLD_QUANT: 20,     // §1.7 quantize W,H up to 20
    K_LOD_BASE: 1.6,     // §5.1 K_LOD = 1.6·(VB.w/1440)
    ROAD: { theta: 180, halfWidth: 12 },
    LANES: [
      { id: 'east-lane', span: [82, 94], startTier: 1 },
      { id: 'west-lane', span: [246, 258], startTier: 1 }
    ]
  };

  /* ── §1.6 the ONE shared hash. FNV-1a 32-bit, seedless + stable across reloads. ── */
  function fnv1a32(str) {
    var h = 0x811c9dc5;                       // 2166136261 offset basis
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);           // ×16777619, 32-bit wrap
    }
    return h >>> 0;                            // unsigned
  }
  function hash01(str) { return fnv1a32(str) / 4294967296; }   // /2^32 → [0,1)

  var r01 = function (v) { return Math.round(v * 10) / 10; };  // §1.6 emit at 0.1

  /* ── §1.1/§1.4: ρ derives from the FRAME (never from n×band). Box → circumradius;
       disc → its radius. This is the district's local hull, per §1.1's lot contract. ── */
  function frameRho(frame) {
    if (!frame) throw new Error('Polar.frameRho: a frame is required.');
    if (frame.r != null) return frame.r;
    return Math.hypot(frame.w, frame.h) / 2;
  }

  /* ── build the TIERED working set from a CONTRACTS table: the districts that hold an
       orbit deed. The manor (pole) supplies ρ_0; the approach (road) is excluded — it
       owns the wedge, not a wheel seat (§1.2). Sorted iteration (§1.6). ── */
  function tieredDistricts(contracts) {
    return Object.keys(contracts).sort().filter(function (id) {
      var c = contracts[id];
      return id !== 'manor' && !c.road && c.tier != null && c.angle != null;
    }).map(function (id) {
      var c = contracts[id];
      return { id: id, tier: c.tier, angle: c.angle, rho: frameRho(c.frame) };
    });
  }

  function tiersOf(districts) {
    var s = {};
    districts.forEach(function (d) { s[d.tier] = 1; });
    return Object.keys(s).map(Number).sort(function (a, b) { return a - b; });
  }
  function byTier(districts, t) {
    return districts.filter(function (d) { return d.tier === t; });
  }

  /* ── §1.4 radius derivation — quantized elastic tiers (mirrors the oracle). Uses the
       PREVIOUS used tier for the radial term (= t−1 for the contiguous 1,2,3 table; robust
       to a future gap: an outer tier stacks on the last band, never on an undefined 0). ── */
  function solveRadii(districts, manorRho) {
    var tiers = tiersOf(districts);
    var R = { 0: 0 }, maxRho = { 0: manorRho };
    var prev = 0;
    tiers.forEach(function (t) {
      var ds = byTier(districts, t);
      maxRho[t] = Math.max.apply(null, ds.map(function (d) { return d.rho; }));
      var raw = R[prev] + maxRho[prev] + CONST.G_BAND + maxRho[t];
      var sorted = ds.slice().sort(function (a, b) { return a.angle - b.angle; });
      for (var i = 0; i < sorted.length; i++) {
        if (sorted.length === 1) break;
        var a = sorted[i], b = sorted[(i + 1) % sorted.length];
        var dth = Math.min((b.angle - a.angle + 360) % 360, 180);
        var need = (a.rho + b.rho + CONST.G_ARC) / (2 * Math.sin(dth / 2 * DEG));
        raw = Math.max(raw, need + CONST.ANG_PAD);
      }
      R[t] = Math.ceil(raw / CONST.QUANTUM) * CONST.QUANTUM;
      prev = t;
    });
    return { R: R, maxRho: maxRho, tiers: tiers };
  }

  /* ── §1.5 reservation helpers. A span (may wrap) hits a wedge if, in ANY of its three
       ±360° copies, it overlaps the wedge grown by MARGIN on both sides. ── */
  function spanHitsWedge(span, wedge) {
    var m = CONST.MARGIN;
    var copies = [span, [span[0] + 360, span[1] + 360], [span[0] - 360, span[1] - 360]];
    return copies.some(function (s) { return s[0] < wedge[1] + m && s[1] > wedge[0] - m; });
  }
  function reservesFor(tier, road, lanes) {
    var out = [['the road', [road.theta - road.halfWidth, road.theta + road.halfWidth]]];
    lanes.forEach(function (L) { if (tier >= L.startTier) out.push(['sky lane "' + L.id + '"', L.span]); });
    return out;
  }
  // worst-case INWARD radius: an in-band offset can pull a district in by min(slack,MAX_OFF)
  function worstInwardR(R, maxRhoT, rho, tier) {
    var slack = Math.min(Math.max(maxRhoT - rho, 0), 40);
    return R - Math.min(slack, CONST.MAX_OFF);
  }

  /* ── §1.5 the HARD angular law — throws (naming the offender + the remedy). ── */
  function assertAngular(districts, R, maxRho, road, lanes) {
    // uniqueness of the deed
    var deeds = {};
    districts.forEach(function (d) {
      var k = d.tier + '|' + d.angle;
      if (deeds[k]) throw new Error('Layout: districts "' + deeds[k] + '" and "' + d.id +
        '" share the polar deed (angle ' + d.angle + '°, orbit ' + d.tier + '). Nudge one angle.');
      deeds[k] = d.id;
    });
    tiersOf(districts).forEach(function (t) {
      var ds = byTier(districts, t).sort(function (a, b) { return a.angle - b.angle; });
      var minSep = 180 / (t + 1);
      for (var i = 0; i < ds.length; i++) {
        var d = ds[i];
        if (ds.length > 1) {
          var nb = ds[(i + 1) % ds.length];
          var dth = (nb.angle - d.angle + 360) % 360;
          if (dth < minSep - 1e-9) throw new Error('Layout: orbit ' + t + ' districts "' + d.id +
            '" (' + d.angle + '°) and "' + nb.id + '" (' + nb.angle + '°) are ' + dth.toFixed(1) +
            '° apart; orbit ' + t + ' needs ≥ ' + minSep + '° (π/(t+1)). Widen an angle, or found the new family a tier out.');
        }
        var rWorst = worstInwardR(R[t], maxRho[t], d.rho, t);
        var alpha = Math.asin(Math.min(1, d.rho / rWorst)) / DEG;
        var span = [d.angle - alpha, d.angle + alpha];
        reservesFor(t, road, lanes).forEach(function (rz) {
          if (spanHitsWedge(span, rz[1])) throw new Error('Layout: district "' + d.id + '" (orbit ' + t +
            ', ' + d.angle + '°, span ±' + alpha.toFixed(1) + '°) leans within ' + CONST.MARGIN + '° of ' + rz[0] +
            '. GROW is refused here — the answer is depth, not width (§1.8).');
        });
      }
    });
  }

  /* ── §1.4 post-solve all-pairs clearance (true worst case: all four inward/outward
       offset combos + the clamped interior-edge minima when cosΔθ>0). Throws. ── */
  function assertClearance(districts, R, maxRho) {
    var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
    for (var i = 0; i < districts.length; i++) for (var j = i + 1; j < districts.length; j++) {
      var A = districts[i], B = districts[j];
      var offA = Math.min(Math.min(Math.max(maxRho[A.tier] - A.rho, 0), 40), CONST.MAX_OFF);
      var offB = Math.min(Math.min(Math.max(maxRho[B.tier] - B.rho, 0), 40), CONST.MAX_OFF);
      var dth = Math.min((B.angle - A.angle + 360) % 360, (A.angle - B.angle + 360) % 360) * DEG;
      var cos = Math.cos(dth);
      var d2 = function (rA, rB) { return Math.sqrt(rA * rA + rB * rB - 2 * rA * rB * cos); };
      var dist = Infinity;
      [-1, 1].forEach(function (sA) {
        [-1, 1].forEach(function (sB) {
          var rA = R[A.tier] + sA * offA, rB = R[B.tier] + sB * offB;
          dist = Math.min(dist, d2(rA, rB));
          if (cos > 0) {
            dist = Math.min(dist, d2(rA, clamp(rA * cos, R[B.tier] - offB, R[B.tier] + offB)));
            dist = Math.min(dist, d2(clamp(rB * cos, R[A.tier] - offA, R[A.tier] + offA), rB));
          }
        });
      });
      var need = A.rho + B.rho + CONST.G_MIN;
      if (dist < need) throw new Error('Layout: districts "' + A.id + '" and "' + B.id + '" clear only ' +
        dist.toFixed(0) + 'px at worst-case offset (need ' + need.toFixed(0) + '). Nudge an angle or shrink a frame.');
    }
  }

  /* ── §1.4 step 4/5: apply each district's in-band offset (hash01-seeded) and translate
       its polar centre into CENTRED world coords (manor at origin). ── */
  function placeCentred(districts, R, maxRho) {
    var out = {};
    districts.forEach(function (d) {
      var slack = Math.min(Math.max(maxRho[d.tier] - d.rho, 0), 40);
      var off = (hash01(d.id) * 2 - 1) * Math.min(slack, CONST.MAX_OFF);
      var r = r01(R[d.tier] + off);
      var th = d.angle * DEG;
      var alpha = Math.asin(Math.min(1, d.rho / r)) / DEG;
      out[d.id] = {
        tier: d.tier, angle: d.angle, rho: r01(d.rho), r: r, slack: r01(slack),
        alpha: r01(alpha), xc: r01(r * Math.sin(th)), yc: r01(-r * Math.cos(th))
      };
    });
    return out;
  }

  /* ── §1.7 DERIVED viewBox / world extent. The sky annulus (a full circle of outer
       radius R_sky+SKY_BAND centred on the manor) dominates the bbox symmetrically; every
       district hull (r_d+ρ, worst-case OUTWARD) and the south gate (R_gate) sit inside it,
       so the union bbox is the sky circle's bbox — SQUARE — and the gate adds no extent
       (round 4). We still take an honest max over all reaches so a future petition that
       pushes a hull past the ring would enlarge the world, never clip it. ── */
  function deriveViewBox(districts, R, maxRho, manorRho) {
    var maxEdge = manorRho;   // the pole's own reach
    districts.forEach(function (d) {
      var slack = Math.min(Math.max(maxRho[d.tier] - d.rho, 0), 40);
      var edge = R[d.tier] + Math.min(slack, CONST.MAX_OFF) + d.rho;   // worst-case OUTWARD edge
      if (edge > maxEdge) maxEdge = edge;
    });
    var Rsky = maxEdge + CONST.SKY_GAP;              // sky ring anchor radius
    var skyOuter = Rsky + CONST.SKY_BAND;            // outer edge of the annulus
    var Rgate = maxEdge + CONST.GATE_GAP;            // south gate radius (inside skyOuter)
    var half = Math.max(skyOuter, Rgate, maxEdge);   // symmetric half-extent (skyOuter wins)
    var margin = CONST.LABEL_MARGIN + CONST.WORLD_PAD;   // 60 label + 16 pad, per side
    var raw = 2 * (half + margin);
    var W = Math.ceil(raw / CONST.WORLD_QUANT) * CONST.WORLD_QUANT;
    var H = W;                                        // square (the annulus is symmetric)
    var centre = { x: r01(half + margin), y: r01(half + margin) };   // manor's translated pos
    return {
      viewBox: '0 0 ' + W + ' ' + H, W: W, H: H, centre: centre,
      maxEdge: r01(maxEdge), Rsky: r01(Rsky), Rgate: r01(Rgate),
      skyOuter: r01(skyOuter), skyBand: CONST.SKY_BAND,
      // K_LOD is a display-only camera ratio (§5.1), not a coordinate — kept at 2dp (oracle: 3.44)
      K_MIN: 1, K_MAX: Math.ceil(W / 360), K_LOD: Math.round(CONST.K_LOD_BASE * (W / 1440) * 100) / 100
    };
  }

  /* ── §1.5 freeSlots(tier, rhoEstimate): the angle RANGES a new district of the given ρ
       could legally take at `tier` (≥ separation from every same-tier deed, span+MARGIN
       clear of road + lanes). Sweeps 0..359 at 1°, coalesces into ranges. The relief error
       and map-process petition path INTERPOLATE this live output — never a baked list.
       For an existing tier it seats at R[tier]; for a brand-new outer tier it derives a
       provisional band radius by stacking one band beyond the outermost. Sorted (§1.6). ── */
  function freeSlots(districts, R, maxRho, tier, rhoEstimate, road, lanes) {
    road = road || CONST.ROAD; lanes = lanes || CONST.LANES;
    var rho = rhoEstimate != null ? rhoEstimate : 140;   // a typical new-district ρ
    var same = byTier(districts, tier);
    var rBand;
    if (R[tier] != null) {
      rBand = R[tier];
    } else {
      var tiers = tiersOf(districts);
      var outer = tiers.length ? tiers[tiers.length - 1] : 0;
      var Ro = R[outer] != null ? R[outer] : 0;
      var mr = maxRho[outer] != null ? maxRho[outer] : 0;
      rBand = Math.ceil((Ro + mr + CONST.G_BAND + rho) / CONST.QUANTUM) * CONST.QUANTUM;
    }
    var minSep = 180 / (tier + 1);
    var alpha = Math.asin(Math.min(1, rho / rBand)) / DEG;
    var res = reservesFor(tier, road, lanes);
    var ok = [];
    for (var a = 0; a < 360; a++) {
      var good = true;
      for (var s = 0; s < same.length; s++) {
        var d = Math.min((a - same[s].angle + 360) % 360, (same[s].angle - a + 360) % 360);
        if (d < minSep) { good = false; break; }
      }
      if (good) {
        var span = [a - alpha, a + alpha];
        for (var k = 0; k < res.length; k++) {
          if (spanHitsWedge(span, res[k][1])) { good = false; break; }
        }
      }
      if (good) ok.push(a);
    }
    // coalesce consecutive integer angles into [lo,hi] ranges (wrap-merge 359↔0)
    var ranges = [];
    ok.forEach(function (a) {
      var last = ranges[ranges.length - 1];
      if (last && a === last[1] + 1) last[1] = a; else ranges.push([a, a]);
    });
    if (ranges.length > 1) {
      var first = ranges[0], lastR = ranges[ranges.length - 1];
      if (first[0] === 0 && lastR[1] === 359) { lastR[1] = first[1] + 360; ranges.shift(); }
    }
    return { tier: tier, rhoEstimate: rho, rBand: rBand, minSep: minSep, ranges: ranges };
  }

  /* ── the top-level solve: deeds → radii → asserts → world → placed centres → final
       positive coords. Returns a pure-data world model (byte-identical on a double run).
       opts.road / opts.lanes override the built-in reservations (the facade passes
       contract.ROAD / contract.LANES — the single source of truth). ── */
  function solve(contracts, opts) {
    opts = opts || {};
    var road = opts.road || CONST.ROAD;
    var lanes = opts.lanes || CONST.LANES;
    var districts = tieredDistricts(contracts);
    var manorC = contracts.manor;
    var manorRho = frameRho(manorC && manorC.frame ? manorC.frame : { w: 280, h: 200 });

    var rad = solveRadii(districts, manorRho);
    assertAngular(districts, rad.R, rad.maxRho, road, lanes);   // §1.5 — throws on violation
    assertClearance(districts, rad.R, rad.maxRho);              // §1.4 — throws on collision
    var vb = deriveViewBox(districts, rad.R, rad.maxRho, manorRho);
    var centred = placeCentred(districts, rad.R, rad.maxRho);

    var out = {};
    Object.keys(centred).sort().forEach(function (id) {
      var p = centred[id];
      out[id] = {
        tier: p.tier, angle: p.angle, rho: p.rho, r: p.r, slack: p.slack, alpha: p.alpha,
        x: r01(p.xc + vb.centre.x), y: r01(p.yc + vb.centre.y),
        span: [r01(((p.angle - p.alpha) % 360 + 360) % 360), r01(((p.angle + p.alpha) % 360 + 360) % 360)]
      };
    });

    // manor (the pole) + emitted maxRho (rounded to 0.1 at the emit boundary, §1.6)
    var maxRhoEmit = {};
    Object.keys(rad.maxRho).sort(function (a, b) { return Number(a) - Number(b); })
      .forEach(function (t) { maxRhoEmit[t] = r01(rad.maxRho[t]); });

    return {
      world: {
        viewBox: vb.viewBox, W: vb.W, H: vb.H, centre: vb.centre,
        R: rad.R, maxRho: maxRhoEmit, tiers: rad.tiers,
        maxEdge: vb.maxEdge, Rsky: vb.Rsky, Rgate: vb.Rgate, skyOuter: vb.skyOuter, skyBand: vb.skyBand,
        manorRho: r01(manorRho), K_MIN: vb.K_MIN, K_MAX: vb.K_MAX, K_LOD: vb.K_LOD
      },
      manor: { tier: 0, rho: r01(manorRho), x: vb.centre.x, y: vb.centre.y },
      districts: out
    };
  }

  return {
    solve: solve,
    solveRadii: solveRadii,
    assertAngular: assertAngular,
    assertClearance: assertClearance,
    deriveViewBox: deriveViewBox,
    placeCentred: placeCentred,
    freeSlots: freeSlots,
    tieredDistricts: tieredDistricts,
    frameRho: frameRho,
    fnv1a32: fnv1a32,
    hash01: hash01,
    CONST: CONST
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Polar; }

/* ── CLI: `node tools/layout/polar.js` solves the §2.1 table and prints the world extent.
     Guarded so the forge-inlined browser copy (require undefined) never runs it. ── */
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  var Contract = require('./contract.js');
  Contract.validate(Contract.CONTRACTS);
  var sol = Polar.solve(Contract.CONTRACTS, { road: Contract.ROAD, lanes: Contract.LANES });
  var w = sol.world;
  console.log('polar.solve(§2.1) — ALL ASSERTS GREEN');
  console.log('  tier radii: ' + w.tiers.map(function (t) { return 'R' + t + '=' + w.R[t]; }).join('  ') +
    '  (maxρ ' + w.tiers.map(function (t) { return w.maxRho[t]; }).join('/') + ')');
  console.log('  R_sky=' + w.Rsky + '  R_gate=' + w.Rgate + ' (inside ring edge ' + w.skyOuter + ')');
  console.log('  world extent: ' + w.viewBox + '  (centre ' + w.centre.x + ',' + w.centre.y + ')');
  console.log('  camera: K_MIN=' + w.K_MIN + '  K_LOD=' + w.K_LOD + '  K_MAX=' + w.K_MAX);
  [1, 2, 3].forEach(function (t) {
    var fs = Polar.freeSlots(Polar.tieredDistricts(Contract.CONTRACTS), w.R, rawMaxRho(w), t, 140, Contract.ROAD, Contract.LANES);
    console.log('  freeSlots(orbit ' + t + ', ρ~140): ' +
      (fs.ranges.length ? fs.ranges.map(function (r) { return '[' + r[0] + '..' + (r[1] % 360) + ']'; }).join(' · ') : 'FULL — the menu is empty'));
  });
  function rawMaxRho(world) { return world.maxRho; }   // 0.1-rounded is fine for the sweep
}
