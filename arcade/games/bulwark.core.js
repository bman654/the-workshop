/* ═══════════════════════════════════════════════════════════════════════════
   bulwark.core.js — the deterministic CORE of BULWARK (neon Defender/Scramble).

   This file is DUAL-USE:
     • forge inlines it into bulwark.src.html → bulwark.html (the module guard at
       the foot is STRIPPED, so every symbol below becomes page-scope and the
       renderer/UI call them directly).
     • a Node harness `require()`s it raw (module guard intact) to run the
       replay-determinism + invariant battery headless.

   THE CONTRACT THIS FILE PROVES
   ─────────────────────────────
   The whole simulation is a PURE FUNCTION of (seed, scripted input track). No
   Math.random, no Date/performance.now, no wall-clock dt. Time advances in
   FIXED integer ticks of DT seconds via an accumulator the page feeds with real
   dt — but the sim itself only ever sees whole ticks, so the same seed + the
   same per-tick input → byte-identical state, forever. That is what runSelfTest
   asserts (twice), and what makes the in-page chip and the Node harness agree.

   WORLD MODEL (a Defender ring with a Scramble fuel loop laid over it)
   ────────────────────────────────────────────────────────────────────
   The world is a horizontally-wrapping RING of width RING_W. Everything lives at
   an x in [0,RING_W); distances use the shortest signed arc in [-RING_W/2, +RING_W/2].
   A camera follows the ship; the scanner strip shows the whole ring scaled down.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── tunables (frozen — both renderer + self-test read these) ─────────────── */
var DT       = 1 / 120;        // fixed sim tick (seconds) — integer ticks only
var RING_W   = 4096;           // world ring circumference (px)
var WORLD_H  = 720;            // logical world height (the playfield band)
var SKY_TOP  = 40;             // ship can't fly above this
var GROUND_Y = WORLD_H - 28;   // nominal ground band baseline (terrain rides here)
var TERR_N   = 256;            // terrain sample count around the ring

var SHIP_THRUST = 1700;        // px/s² horizontal thrust
var SHIP_LIFT   = 1500;        // px/s² vertical thrust
var SHIP_DRAGX  = 0.86;        // per-tick-ish horizontal damping (applied scaled)
var SHIP_DRAGY  = 0.80;        // vertical damping
var SHIP_VMAX_X = 560;         // clamp speeds so the ring stays readable
var SHIP_VMAX_Y = 420;
var SHIP_R      = 13;          // collision radius

var SHOT_SPEED  = 920;         // px/s, fired in the facing direction
var SHOT_LIFE   = 0.55;        // seconds before a shot expires
var SHOT_R      = 6;
var FIRE_CD     = 0.13;        // min seconds between shots
var BOMB_CD     = 0.45;        // min seconds between bombs
var BOMB_FALL   = 520;         // px/s bomb descent
var BOMB_R      = 16;

var FUEL_MAX    = 1000;
var FUEL_BURN   = 14;          // fuel per SECOND of normal flight
var FUEL_REFUEL = 360;         // fuel restored per depot bombed
var DEPOT_R     = 26;

var ENEMY_R       = 14;
var LANTERN_SPEED = 70;        // px/s drift speed of a hunting Lantern
var MUTANT_SPEED  = 165;       // px/s — a Lantern that landed a tender becomes this
var DIVER_SPEED   = 230;       // px/s — fast strafing diver
var GRAB_R        = 22;        // Lantern grabs a grounded tender within this arc-dist
var CARRY_LIFT    = 60;        // px/s a carried tender ascends
var TENDER_FALL   = 300;       // px/s a freed tender falls
var TENDER_CATCH_R= 26;        // ship catches a falling tender within this radius
var TENDER_R      = 11;

var SCORE_SHOOT_CARRIER = 75;  // freeing a tender (shooting its carrier)
var SCORE_SHOOT_ENEMY   = 25;  // a plain enemy kill
var SCORE_CATCH         = 250; // catching + re-grounding a falling tender
var SCORE_BOMB_DEPOT    = 60;  // bombing a depot (refuel bonus)
var SCORE_MUTATE_PENALTY= 0;   // no points lost, but the threat escalates

var N_TENDERS = 6;
var N_DEPOTS  = 5;
var SHIP_LIVES= 3;

/* ── seeded RNG: mulberry32 (pure, 32-bit, no globals) ────────────────────── */
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── ring geometry: shortest signed arc delta from a→b in [-RING_W/2,RING_W/2] */
function arcDelta(a, b) {
  var d = (b - a) % RING_W;
  if (d > RING_W / 2) d -= RING_W;
  else if (d < -RING_W / 2) d += RING_W;
  return d;
}
function arcDist(a, b) { var d = arcDelta(a, b); return d < 0 ? -d : d; }
function wrapX(x) { x = x % RING_W; if (x < 0) x += RING_W; return x; }

/* ── terrain: seeded summed-sine ridge sampled at TERR_N points; bilerp lookup.
   Pure function of seed → identical ridge every run, every skin. Returns the
   ground Y (larger = lower on screen) at ring-x. The ship crashes if it touches it. */
function makeTerrain(seed) {
  var rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  var amps = [], phs = [], freqs = [1, 2, 3, 5, 8];
  for (var k = 0; k < freqs.length; k++) { amps.push(rng()); phs.push(rng() * Math.PI * 2); }
  var t = new Float32Array(TERR_N);
  var span = 150;                         // peak-to-trough height range
  for (var i = 0; i < TERR_N; i++) {
    var u = (i / TERR_N) * Math.PI * 2;
    var h = 0, norm = 0;
    for (var j = 0; j < freqs.length; j++) {
      h += amps[j] * Math.sin(freqs[j] * u + phs[j]);
      norm += amps[j];
    }
    // map [-norm,norm] → [0,1] → a ground band that rides near GROUND_Y
    var v = (h / (norm || 1)) * 0.5 + 0.5;
    t[i] = GROUND_Y - v * span;           // higher v ⇒ taller ridge (smaller Y)
  }
  return t;
}
function terrainAt(terr, x) {
  x = wrapX(x);
  var f = (x / RING_W) * TERR_N;
  var i0 = Math.floor(f) % TERR_N;
  var i1 = (i0 + 1) % TERR_N;
  var frac = f - Math.floor(f);
  return terr[i0] * (1 - frac) + terr[i1] * frac;
}

/* ── world construction: EVERYTHING (terrain + every spawn) seeded from `seed`.
   Identical across skins (skin is a render-only field the sim never reads). */
function makeWorld(seed, skin) {
  seed = seed >>> 0;
  var rng = mulberry32(seed);
  var terr = makeTerrain(seed);

  var ship = {
    x: 0, y: WORLD_H * 0.45, vx: 0, vy: 0,
    facing: 1,                 // +1 right, -1 left
    fuel: FUEL_MAX, lives: SHIP_LIVES,
    fireCd: 0, bombCd: 0, alive: true, respawnT: 0
  };

  // tenders: spaced around the ring, each grounded on the terrain
  var tenders = [];
  for (var i = 0; i < N_TENDERS; i++) {
    var tx = wrapX((i / N_TENDERS) * RING_W + (rng() - 0.5) * 120);
    tenders.push({ x: tx, y: terrainAt(terr, tx) - TENDER_R - 2,
                   grounded: true, carriedBy: -1, falling: false, alive: true });
  }

  // depots: spaced around the ring, sitting on the terrain
  var depots = [];
  for (var d = 0; d < N_DEPOTS; d++) {
    var dx = wrapX((d / N_DEPOTS) * RING_W + RING_W / (2 * N_DEPOTS) + (rng() - 0.5) * 90);
    depots.push({ x: dx, y: terrainAt(terr, dx) - DEPOT_R, fuel: FUEL_REFUEL, alive: true });
  }

  // enemies: a seeded opening wave of Lanterns + a couple of divers
  var enemies = [];
  var nLanterns = 5, nDivers = 2;
  for (var e = 0; e < nLanterns; e++) {
    enemies.push({ kind: 'lantern', x: wrapX(rng() * RING_W),
                   y: SKY_TOP + 30 + rng() * 160, vx: (rng() < 0.5 ? -1 : 1) * LANTERN_SPEED,
                   vy: 0, target: -1, cd: rng() * 1.5, alive: true });
  }
  for (var v = 0; v < nDivers; v++) {
    enemies.push({ kind: 'diver', x: wrapX(rng() * RING_W),
                   y: SKY_TOP + 50 + rng() * 100, vx: (rng() < 0.5 ? -1 : 1) * DIVER_SPEED,
                   vy: 0, target: -1, cd: rng() * 2, alive: true });
  }

  return {
    seed: seed, skin: skin || 'aurora',
    ringW: RING_W, camX: 0,
    ship: ship, terrain: terr,
    tenders: tenders, depots: depots, enemies: enemies,
    shots: [], bombs: [],
    score: 0, frame: 0,
    rng: rng,                  // the live spawn stream (advanced ONLY inside step)
    spawnCd: 6.0,              // seconds until the next seeded enemy reinforcement
    over: false
  };
}

/* ── input shape: a plain object the renderer fills from the keyboard and the
   self-test fills from a scripted track. The sim reads it READ-ONLY per tick. */
function blankInput() {
  return { left: false, right: false, up: false, down: false,
           fire: false, bomb: false, reverse: false };
}

/* ── ONE fixed tick. Mutates `w` in place. Pure given (w, input): no Date, no
   Math.random (only w.rng, the seeded stream). dt is the constant DT. ───────── */
function stepTick(w, input) {
  if (w.over) return;
  var dt = DT;
  var s = w.ship;

  // facing follows held intent: reverse key inverts the thrust→facing mapping.
  if (input.left && !input.right) s.facing = input.reverse ? 1 : -1;
  else if (input.right && !input.left) s.facing = input.reverse ? -1 : 1;

  if (s.alive) {
    // thrust
    if (input.left)  s.vx -= SHIP_THRUST * dt;
    if (input.right) s.vx += SHIP_THRUST * dt;
    if (input.up)    s.vy -= SHIP_LIFT * dt;
    if (input.down)  s.vy += SHIP_LIFT * dt;

    // damping (frame-rate-independent via DT-scaled pow)
    s.vx *= Math.pow(SHIP_DRAGX, dt * 60);
    s.vy *= Math.pow(SHIP_DRAGY, dt * 60);

    // clamp
    if (s.vx >  SHIP_VMAX_X) s.vx =  SHIP_VMAX_X;
    if (s.vx < -SHIP_VMAX_X) s.vx = -SHIP_VMAX_X;
    if (s.vy >  SHIP_VMAX_Y) s.vy =  SHIP_VMAX_Y;
    if (s.vy < -SHIP_VMAX_Y) s.vy = -SHIP_VMAX_Y;

    // integrate + WRAP
    s.x = wrapX(s.x + s.vx * dt);
    s.y += s.vy * dt;
    if (s.y < SKY_TOP) { s.y = SKY_TOP; if (s.vy < 0) s.vy = 0; }

    // fuel burns down (SCRAMBLE loop)
    s.fuel -= FUEL_BURN * dt;
    if (s.fuel <= 0) { s.fuel = 0; crashShip(w); }

    // terrain crash (SCRAMBLE loop)
    var gy = terrainAt(w.terrain, s.x);
    if (s.alive && s.y + SHIP_R >= gy) crashShip(w);

    // weapons
    if (s.alive) {
      if (s.fireCd > 0) s.fireCd -= dt;
      if (input.fire && s.fireCd <= 0) {
        s.fireCd = FIRE_CD;
        w.shots.push({ x: s.x, y: s.y, vx: s.facing * SHOT_SPEED, life: SHOT_LIFE, alive: true });
      }
      if (s.bombCd > 0) s.bombCd -= dt;
      if (input.bomb && s.bombCd <= 0) {
        s.bombCd = BOMB_CD;
        w.bombs.push({ x: s.x, y: s.y, alive: true });
      }
    }
  } else {
    // dead → tick the respawn timer; respawn if lives remain
    s.respawnT -= dt;
    if (s.respawnT <= 0 && s.lives > 0) respawnShip(w);
  }

  // camera follows ship along the ring (kept here so render is a pure read)
  w.camX = s.x;

  // ── shots ──
  for (var i = 0; i < w.shots.length; i++) {
    var sh = w.shots[i]; if (!sh.alive) continue;
    sh.life -= dt;
    sh.x = wrapX(sh.x + sh.vx * dt);
    if (sh.life <= 0) sh.alive = false;
  }

  // ── bombs (fall straight down; refuel a depot on contact) ──
  for (var b = 0; b < w.bombs.length; b++) {
    var bo = w.bombs[b]; if (!bo.alive) continue;
    bo.y += BOMB_FALL * dt;
    // depot hit?
    for (var dd = 0; dd < w.depots.length; dd++) {
      var dp = w.depots[dd]; if (!dp.alive) continue;
      if (arcDist(bo.x, dp.x) <= DEPOT_R + BOMB_R && Math.abs(bo.y - dp.y) <= DEPOT_R + BOMB_R) {
        dp.alive = false; bo.alive = false;
        refuel(w, FUEL_REFUEL);
        w.score += SCORE_BOMB_DEPOT;
        break;
      }
    }
    // hit terrain or fell off the band
    if (bo.alive && (bo.y >= terrainAt(w.terrain, bo.x) || bo.y > WORLD_H + 40)) bo.alive = false;
  }

  // ── enemies ──
  for (var e = 0; e < w.enemies.length; e++) {
    var en = w.enemies[e]; if (!en.alive) continue;
    if (en.kind === 'lantern') updateLantern(w, en, dt);
    else if (en.kind === 'mutant') updateMutant(w, en, dt);
    else if (en.kind === 'diver') updateDiver(w, en, dt);
  }

  // ── tenders (carried ascend; freed fall; ship catches falling) ──
  for (var t = 0; t < w.tenders.length; t++) {
    var td = w.tenders[t]; if (!td.alive) continue;
    if (td.carriedBy >= 0) {
      var carrier = w.enemies[td.carriedBy];
      if (!carrier || !carrier.alive || (carrier.kind !== 'lantern' && carrier.kind !== 'mutant')) {
        // carrier gone (shot) → tender is freed and FALLS
        td.carriedBy = -1; td.grounded = false; td.falling = true;
      } else {
        // ride the carrier upward
        td.x = carrier.x;
        td.y = carrier.y + ENEMY_R + TENDER_R;
        carrier.y -= CARRY_LIFT * dt;
        // reached the top → the Lantern MUTATES into a faster mutant, tender consumed
        if (carrier.y <= SKY_TOP + 4) {
          carrier.kind = 'mutant';
          carrier.vx = (carrier.vx >= 0 ? 1 : -1) * MUTANT_SPEED;
          carrier.target = -1;
          td.carriedBy = -1; td.alive = false;     // tender lost
          w.score += SCORE_MUTATE_PENALTY;
        }
      }
    } else if (td.falling) {
      td.y += TENDER_FALL * dt;
      // ship catch?
      if (s.alive && arcDist(td.x, s.x) <= TENDER_CATCH_R && Math.abs(td.y - s.y) <= TENDER_CATCH_R) {
        td.falling = false; td.grounded = true;
        td.y = terrainAt(w.terrain, td.x) - TENDER_R - 2;
        w.score += SCORE_CATCH;
      } else if (td.y >= terrainAt(w.terrain, td.x) - TENDER_R - 2) {
        // landed safely back on the ground on its own
        td.falling = false; td.grounded = true;
        td.y = terrainAt(w.terrain, td.x) - TENDER_R - 2;
      }
    }
  }

  // ── collisions: shots vs enemies (arc-symmetric) ──
  for (var si = 0; si < w.shots.length; si++) {
    var ss = w.shots[si]; if (!ss.alive) continue;
    for (var ei = 0; ei < w.enemies.length; ei++) {
      var ee = w.enemies[ei]; if (!ee.alive) continue;
      if (arcDist(ss.x, ee.x) <= ENEMY_R + SHOT_R && Math.abs(ss.y - ee.y) <= ENEMY_R + SHOT_R) {
        ss.alive = false;
        killEnemy(w, ei);
        break;
      }
    }
  }

  // ── collisions: ship vs enemies (arc-symmetric) → ship dies ──
  if (s.alive) {
    for (var ci = 0; ci < w.enemies.length; ci++) {
      var ce = w.enemies[ci]; if (!ce.alive) continue;
      if (arcDist(s.x, ce.x) <= SHIP_R + ENEMY_R && Math.abs(s.y - ce.y) <= SHIP_R + ENEMY_R) {
        crashShip(w);
        break;
      }
    }
  }

  // ── seeded reinforcement spawns (pure: only w.rng) ──
  w.spawnCd -= dt;
  if (w.spawnCd <= 0) {
    w.spawnCd = 5.0 + w.rng() * 4.0;
    spawnReinforcement(w);
  }

  // compact dead transient arrays occasionally (deterministic: every 240 ticks)
  w.frame++;
  if (w.frame % 240 === 0) {
    w.shots = w.shots.filter(function (o) { return o.alive; });
    w.bombs = w.bombs.filter(function (o) { return o.alive; });
  }

  // lose bookkeeping: out of lives + final respawn timer elapsed → game over
  if (s.lives <= 0 && !s.alive && s.respawnT <= 0) w.over = true;
}

/* ── enemy behaviours ─────────────────────────────────────────────────────── */
function updateLantern(w, en, dt) {
  var myIdx = w.enemies.indexOf(en);
  // if already carrying a tender, the tender loop drives the ascent; just hold x.
  for (var c = 0; c < w.tenders.length; c++) {
    if (w.tenders[c].alive && w.tenders[c].carriedBy === myIdx) return;
  }
  // drift along the ring toward nearest grounded tender
  var best = -1, bestD = Infinity;
  for (var i = 0; i < w.tenders.length; i++) {
    var td = w.tenders[i];
    if (!td.alive || !td.grounded || td.carriedBy >= 0) continue;
    var d = arcDist(en.x, td.x);
    if (d < bestD) { bestD = d; best = i; }
  }
  if (best >= 0) {
    var tgt = w.tenders[best];
    var dir = arcDelta(en.x, tgt.x);
    en.vx = (dir >= 0 ? 1 : -1) * LANTERN_SPEED;
    en.vy = (en.y < tgt.y - 8) ? LANTERN_SPEED * 0.6 : 0;
    // grab when overlapping
    if (bestD <= GRAB_R && Math.abs(en.y - tgt.y) <= GRAB_R + 12) {
      tgt.carriedBy = myIdx;
      tgt.grounded = false;
    }
  } else {
    en.vy = 0;
  }
  en.x = wrapX(en.x + en.vx * dt);
  en.y += en.vy * dt;
  if (en.y < SKY_TOP) en.y = SKY_TOP;
}
function updateMutant(w, en, dt) {
  // a mutant strafes fast at the ship's altitude (the escalated threat)
  var s = w.ship;
  if (s.alive) {
    var dir = arcDelta(en.x, s.x);
    en.vx = (dir >= 0 ? 1 : -1) * MUTANT_SPEED;
    en.vy = (en.y < s.y - 6) ? MUTANT_SPEED * 0.5 : (en.y > s.y + 6 ? -MUTANT_SPEED * 0.5 : 0);
  }
  en.x = wrapX(en.x + en.vx * dt);
  en.y += en.vy * dt;
  if (en.y < SKY_TOP) en.y = SKY_TOP;
  var gy = terrainAt(w.terrain, en.x);
  if (en.y > gy - ENEMY_R) en.y = gy - ENEMY_R;
}
function updateDiver(w, en, dt) {
  // a diver sweeps along the ring, bobbing toward the ship's altitude
  var s = w.ship;
  en.cd -= dt;
  if (en.cd <= 0) { en.cd = 1.2; en.vx = (en.vx >= 0 ? -1 : 1) * DIVER_SPEED; }
  if (s.alive) en.vy = (en.y < s.y) ? DIVER_SPEED * 0.4 : -DIVER_SPEED * 0.4;
  en.x = wrapX(en.x + en.vx * dt);
  en.y += en.vy * dt;
  if (en.y < SKY_TOP) en.y = SKY_TOP;
  var gy = terrainAt(w.terrain, en.x);
  if (en.y > gy - ENEMY_R) { en.y = gy - ENEMY_R; en.vy = -Math.abs(en.vy); }
}

function killEnemy(w, idx) {
  var en = w.enemies[idx];
  en.alive = false;
  // was it carrying a tender? → freeing it (DEFENDER rescue: shoot the carrier)
  var freed = false;
  for (var t = 0; t < w.tenders.length; t++) {
    if (w.tenders[t].alive && w.tenders[t].carriedBy === idx) {
      w.tenders[t].carriedBy = -1;
      w.tenders[t].grounded = false;
      w.tenders[t].falling = true;
      freed = true;
    }
  }
  w.score += freed ? SCORE_SHOOT_CARRIER : SCORE_SHOOT_ENEMY;
}

function crashShip(w) {
  var s = w.ship;
  if (!s.alive) return;
  s.alive = false;
  s.lives -= 1;
  s.vx = 0; s.vy = 0;
  s.respawnT = (s.lives <= 0) ? 0.5 : 1.0;
}
function respawnShip(w) {
  var s = w.ship;
  s.alive = true;
  s.x = wrapX(s.x);
  s.y = WORLD_H * 0.4;
  s.vx = 0; s.vy = 0;
  s.fuel = Math.max(s.fuel, FUEL_MAX * 0.5);
}
function refuel(w, amt) {
  w.ship.fuel = Math.min(FUEL_MAX, w.ship.fuel + amt);
}
function spawnReinforcement(w) {
  // pure: only w.rng. Spawn a Lantern near a still-grounded tender if any remain,
  // else a roaming diver.
  var hasGrounded = false;
  for (var i = 0; i < w.tenders.length; i++)
    if (w.tenders[i].alive && w.tenders[i].grounded) { hasGrounded = true; break; }
  if (hasGrounded && w.rng() < 0.7) {
    w.enemies.push({ kind: 'lantern', x: wrapX(w.rng() * RING_W),
                     y: SKY_TOP + 20 + w.rng() * 140, vx: (w.rng() < 0.5 ? -1 : 1) * LANTERN_SPEED,
                     vy: 0, target: -1, cd: w.rng() * 1.5, alive: true });
  } else {
    w.enemies.push({ kind: 'diver', x: wrapX(w.rng() * RING_W),
                     y: SKY_TOP + 40 + w.rng() * 110, vx: (w.rng() < 0.5 ? -1 : 1) * DIVER_SPEED,
                     vy: 0, target: -1, cd: w.rng() * 2, alive: true });
  }
}

/* ── deterministic state hash (FNV-1a over the salient numeric state) ──────── */
function hashWorld(w) {
  var h = 0x811c9dc5;
  function mix(n) {
    // quantize floats to 1e-3 so trivial FP noise can't perturb the hash.
    var q = Math.round(n * 1000) | 0;
    h ^= (q & 0xff);          h = Math.imul(h, 0x01000193);
    h ^= ((q >>> 8) & 0xff);  h = Math.imul(h, 0x01000193);
    h ^= ((q >>> 16) & 0xff); h = Math.imul(h, 0x01000193);
    h ^= ((q >>> 24) & 0xff); h = Math.imul(h, 0x01000193);
  }
  var s = w.ship;
  mix(s.x); mix(s.y); mix(s.vx); mix(s.vy); mix(s.facing);
  mix(s.fuel); mix(s.lives); mix(s.alive ? 1 : 0);
  mix(w.score); mix(w.frame); mix(w.over ? 1 : 0);
  for (var i = 0; i < w.tenders.length; i++) {
    var t = w.tenders[i];
    mix(t.x); mix(t.y); mix(t.carriedBy); mix(t.grounded ? 1 : 0);
    mix(t.falling ? 1 : 0); mix(t.alive ? 1 : 0);
  }
  for (var e = 0; e < w.enemies.length; e++) {
    var en = w.enemies[e];
    mix(en.x); mix(en.y); mix(en.vx); mix(en.vy);
    mix(en.kind === 'lantern' ? 1 : en.kind === 'mutant' ? 2 : 3);
    mix(en.alive ? 1 : 0);
  }
  mix(w.shots.length); mix(w.bombs.length); mix(w.depots.length);
  return (h >>> 0);
}

/* ── replay a scripted input track and return the per-tick hash sequence.
   `track` is [{at:tick, set:{key:bool,...}}] — sparse edits to a held input.
   Returns {hashes:[...], world:finalWorld}. Pure given (seed, track). ───────── */
function replay(seed, track, ticks, skin) {
  var w = makeWorld(seed, skin);
  var input = blankInput();
  var edits = {};
  for (var i = 0; i < track.length; i++) edits[track[i].at] = track[i].set;
  var hashes = [];
  for (var k = 0; k < ticks; k++) {
    if (edits[k]) { var set = edits[k]; for (var key in set) input[key] = set[key]; }
    stepTick(w, input);
    hashes.push(hashWorld(w));
  }
  return { hashes: hashes, world: w };
}

/* ── the proof battery. Returns {allPass, results:[{name,pass,detail}]}. The page
   wires the result into the #selftest chip; the Node harness asserts allPass. ── */
function runSelfTest() {
  var results = [], allPass = true;
  function check(name, cond, detail) {
    var pass = !!cond; if (!pass) allPass = false;
    results.push({ name: name, pass: pass, detail: detail || '' });
  }

  // a representative scripted input track exercising thrust, fire, bomb, wrap
  var track = [
    { at: 0,   set: { right: true } },
    { at: 60,  set: { fire: true } },
    { at: 120, set: { up: true } },
    { at: 200, set: { fire: false, bomb: true } },
    { at: 260, set: { bomb: false, left: true, right: false } },
    { at: 400, set: { reverse: true } },
    { at: 520, set: { down: true, up: false } },
    { at: 700, set: { left: false } }
  ];
  var TICKS = 900;

  // 1) REPLAY DETERMINISM — same seed + same track → identical per-tick hash, twice.
  {
    var a = replay(12345, track, TICKS);
    var b = replay(12345, track, TICKS);
    var same = a.hashes.length === b.hashes.length;
    var firstDiff = -1;
    for (var i = 0; same && i < a.hashes.length; i++)
      if (a.hashes[i] !== b.hashes[i]) { same = false; firstDiff = i; }
    check('replay determinism: seed 12345 + scripted track → identical ' + TICKS +
          '-tick hash sequence, twice', same,
          same ? 'final hash 0x' + a.hashes[a.hashes.length - 1].toString(16)
               : 'diverged at tick ' + firstDiff);
  }

  // 2) WRAP CONTINUITY — driving right past RING_W keeps x in range, the seam IS
  //    crossed (full lap), and arc-delta never jumps the seam.
  {
    var w = makeWorld(777);
    w.enemies = [];                 // isolate wrap from combat deaths
    w.spawnCd = 1e9;
    // park the ship at a safe mid-air altitude well above any ridge
    var safeY = SKY_TOP + 120;
    w.ship.y = safeY;
    var input = blankInput(); input.right = true;
    var inRange = true, maxDelta = 0, prev = w.ship.x, wrapped = false;
    for (var k = 0; k < 3000; k++) {
      w.ship.y = safeY; w.ship.vy = 0;     // keep it level so it never hits terrain
      var beforeX = w.ship.x;
      stepTick(w, input);
      if (w.ship.x < 0 || w.ship.x >= RING_W) inRange = false;
      var d = Math.abs(arcDelta(prev, w.ship.x));
      if (d > maxDelta) maxDelta = d;
      if (beforeX > w.ship.x + RING_W / 2) wrapped = true; // crossed the seam going right
      prev = w.ship.x;
    }
    var seamOk = maxDelta < SHIP_VMAX_X * DT * 3;
    check('wrap continuity: x stays in [0,ringW), seam crossed, arc-delta bounded',
          inRange && seamOk && wrapped,
          'inRange=' + inRange + ' wrapped=' + wrapped + ' maxArcDelta=' + maxDelta.toFixed(2));
  }

  // 3) RESCUE INVARIANT — force a Lantern to grab a tender, ascend, shoot it →
  //    tender falls; then catch it → re-grounds + EXACT score bumps.
  {
    var w2 = makeWorld(42);
    var td = w2.tenders[0];
    td.grounded = true; td.carriedBy = -1; td.falling = false;
    // single lantern sitting right on the tender so it grabs immediately; index 0
    w2.enemies = [{ kind: 'lantern', x: td.x, y: td.y - 10, vx: 0, vy: 0, target: -1, cd: 99, alive: true }];
    w2.spawnCd = 1e9;                          // suppress reinforcements during the test
    var input2 = blankInput();
    for (var g = 0; g < 40; g++) stepTick(w2, input2);
    var grabbed = (td.carriedBy === 0 && !td.grounded && w2.enemies[0].alive);
    var scoreBefore = w2.score;
    // shoot the carrier
    w2.shots.push({ x: w2.enemies[0].x, y: w2.enemies[0].y, vx: 0, life: SHOT_LIFE, alive: true });
    stepTick(w2, input2);
    var freed = (td.falling === true && td.carriedBy === -1 && !w2.enemies[0].alive);
    var freeBump = w2.score - scoreBefore;     // expect +SCORE_SHOOT_CARRIER
    // catch the falling tender by shadowing the ship onto it
    w2.ship.alive = true;
    var scorePreCatch = w2.score, caught = false;
    for (var c = 0; c < 60 && !caught; c++) {
      w2.ship.x = td.x; w2.ship.y = td.y;
      stepTick(w2, input2);
      if (td.grounded && !td.falling) caught = true;
    }
    var catchBump = w2.score - scorePreCatch;  // expect +SCORE_CATCH
    check('rescue invariant: shoot carrier → tender falls (+' + SCORE_SHOOT_CARRIER +
          '); catch → re-ground (+' + SCORE_CATCH + ')',
          grabbed && freed && caught && freeBump === SCORE_SHOOT_CARRIER && catchBump === SCORE_CATCH,
          'grabbed=' + grabbed + ' freed=' + freed + ' caught=' + caught +
          ' freeBump=' + freeBump + ' catchBump=' + catchBump);
  }

  // 4) FUEL MONOTONICITY — fuel never RISES except on a depot-bomb (or respawn) tick.
  {
    var w3 = makeWorld(99);
    w3.enemies = [];                  // no enemy deaths / crashes to muddy the test
    w3.spawnCd = 1e9;
    var input3 = blankInput(); input3.right = true; input3.up = true;
    var rises = 0, prevFuel = w3.ship.fuel;
    var dep = w3.depots[0];
    for (var f = 0; f < 1400; f++) {
      if (f === 100) { w3.ship.x = dep.x; w3.bombs.push({ x: dep.x, y: dep.y - 120, alive: true }); }
      var aliveBefore = w3.ship.alive;
      stepTick(w3, input3);
      if (w3.ship.alive && aliveBefore && w3.ship.fuel > prevFuel + 1e-6) rises++;
      prevFuel = w3.ship.fuel;
    }
    var depotsBombed = w3.depots.filter(function (d) { return !d.alive; }).length;
    check('fuel monotonicity: fuel only rises on a depot-bomb/respawn tick',
          depotsBombed >= 1 && rises <= depotsBombed + 1,
          'rises=' + rises + ' depotsBombed=' + depotsBombed);
  }

  // 5) COLLISION SYMMETRY UNDER ARC-DISTANCE.
  {
    var symOk = true;
    for (var q = 0; q < 64; q++) {
      var aX = (q * 137) % RING_W, bX = (q * 251 + 3) % RING_W;
      if (Math.abs(arcDist(aX, bX) - arcDist(bX, aX)) > 1e-9) symOk = false;
    }
    var near = arcDist(RING_W - 5, 5);            // seam-spanning: should be 10
    var near2 = arcDist(5, RING_W - 5);
    var seamHit = Math.abs(near - 10) < 1e-9 && Math.abs(near2 - 10) < 1e-9;
    check('collision symmetry: arcDist symmetric + seam-spanning hit detected both ways',
          symOk && seamHit, 'sym=' + symOk + ' seamDist=' + near.toFixed(3));
  }

  // 6) SEED-PURITY — terrain + first 200 reinforcement spawns are a pure fn of
  //    seed, IDENTICAL across skins (skin must never touch the sim).
  {
    var wA = makeWorld(2024, 'aurora');
    var wB = makeWorld(2024, 'ember');
    var terrSame = true;
    for (var ti = 0; ti < TERR_N; ti++) if (wA.terrain[ti] !== wB.terrain[ti]) { terrSame = false; break; }
    // Collect the first 200 reinforcement spawns. The stream is driven SOLELY by
    // w.rng, so it must be byte-identical across skins. To observe it uninterrupted
    // we hold the ship in a god state each tick (fuel pinned, alive, lives high,
    // over cleared, parked safely mid-air) — the sim's spawn RNG is untouched by
    // any of that, which is exactly the point.
    function spawnStream(w) {
      w.enemies = [];                       // clear the opening wave; only reinforcements count
      var input = blankInput();
      var safeY = SKY_TOP + 120;
      var xs = [], prevLen = 0;
      for (var k = 0; k < 300000 && xs.length < 200; k++) {
        w.over = false; w.ship.alive = true; w.ship.lives = 999;
        w.ship.y = safeY; w.ship.vy = 0; w.ship.fuel = FUEL_MAX;
        stepTick(w, input);
        if (w.enemies.length > prevLen) {
          for (var n = prevLen; n < w.enemies.length; n++) xs.push(Math.round(w.enemies[n].x * 1000));
          prevLen = w.enemies.length;
        }
      }
      return xs;
    }
    var sa = spawnStream(makeWorld(2024, 'aurora'));
    var sb = spawnStream(makeWorld(2024, 'ember'));
    var spawnSame = sa.length === sb.length && sa.length >= 200;
    for (var sp = 0; spawnSame && sp < sa.length; sp++) if (sa[sp] !== sb[sp]) spawnSame = false;
    check('seed-purity: terrain + first 200 spawns identical across skins',
          terrSame && spawnSame,
          'terrSame=' + terrSame + ' spawns=' + sa.length + ' spawnSame=' + spawnSame);
  }

  return { allPass: allPass, results: results };
}

/* ── dual-use module guard (forge strips exactly this braced block) ─────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DT: DT, RING_W: RING_W, WORLD_H: WORLD_H, SKY_TOP: SKY_TOP, GROUND_Y: GROUND_Y,
    SHIP_R: SHIP_R, ENEMY_R: ENEMY_R, TENDER_R: TENDER_R, DEPOT_R: DEPOT_R,
    FUEL_MAX: FUEL_MAX, SHIP_LIVES: SHIP_LIVES, N_TENDERS: N_TENDERS, N_DEPOTS: N_DEPOTS,
    SCORE_SHOOT_CARRIER: SCORE_SHOOT_CARRIER, SCORE_CATCH: SCORE_CATCH,
    SCORE_SHOOT_ENEMY: SCORE_SHOOT_ENEMY, SCORE_BOMB_DEPOT: SCORE_BOMB_DEPOT,
    mulberry32: mulberry32, arcDelta: arcDelta, arcDist: arcDist, wrapX: wrapX,
    makeTerrain: makeTerrain, terrainAt: terrainAt,
    makeWorld: makeWorld, blankInput: blankInput, stepTick: stepTick,
    hashWorld: hashWorld, replay: replay, runSelfTest: runSelfTest
  };
}
