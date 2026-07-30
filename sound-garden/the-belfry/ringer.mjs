/* ============================================================================
 *  THE BELFRY — ringer.mjs   ·   six bells, a row of numbers, and six ringers
 *
 *  Zero-dependency, DOM-free ESM.  Node twin: belfry.test.mjs.
 *  NO BACKTICK, NO DOLLAR-BRACE — spliced into a String.raw template.
 *
 *  ── WHAT THIS FILE IS ──────────────────────────────────────────────────────
 *  method.mjs says what order the bells should sound in.  bell.mjs says what a
 *  bell will do when you pull it.  This is the thing in between: six ringers,
 *  each holding one rope, trying to put their bell's blow on the beat.
 *
 *  A ringer here is not a schedule.  It is a controller with ONE STROKE of dead
 *  time, and that is the whole point of the room:
 *
 *    · when a bell arrives at the balance the time of its NEXT blow is already
 *      decided — it is a - b ln(eps - eps*) and eps is fixed;
 *    · so the only thing the ringer can aim at is the blow AFTER that one, by
 *      choosing how hard to pull NOW;
 *    · the room shows you the residual: every blow lands some milliseconds off
 *      the beat, and that error is what ringers call striking.
 *
 *  The solve is a bisection on the live integrator — the same Swinger the room
 *  draws, never a table or a second model.
 *
 *  ── THE HANDSTROKE GAP ─────────────────────────────────────────────────────
 *  A bell sounds once per row and alternates handstroke and backstroke, and by
 *  long convention English ringing leaves an extra beat's silence before every
 *  handstroke row — the open handstroke lead.  It is why a peal has a heartbeat
 *  instead of a metronome.  Switchable here because you should be able to hear
 *  what it does.
 *  ========================================================================= */

import { Swinger, swing, strikeLaw, steadyPull } from './bell.mjs';

/* Everything a ringer needs to aim: the fitted timing law of ONE bell, plus the
 * two constants the fit is anchored on.  Computed once per bell at load.
 *
 * FIT IT AT THE PULL THE BELL WILL ACTUALLY BE RUNG WITH.  The dead-rope law is
 * the one the twin reports, because it is the bell's own property — but a
 * ringer's rope is never dead, and the rope's few tens of milliseconds land
 * where the law has a POLE in it, so a bell left very high (a bell leading at
 * handstroke) has its next blow mispredicted by most of a second.  That is one
 * catastrophic blow every hundred and it sounds exactly like a broken room.
 * Refitting at the steady pull — which is nearly the same number at every
 * height, because it only has to replace the damping — costs one extra sweep at
 * load and removes the whole failure mode. */
export function aimingLaw(p, opts = {}) {
  const pull = opts.pull === undefined ? steadyPull(p) : opts.pull;
  const law = strikeLaw(p, { dt: opts.dt || 0.001, pull });
  /* THE RISE: blow to the far balance.  Unlike the fall it barely depends on
   * anything (the bell is going flat out through the bottom either way), so a
   * stroke period is tFall + tRise with only the first term free.  That is how
   * a bell is SET UP for a given speed of ringing without a search. */
  const mid = swing(p, 3 * Math.PI / 180, pull, { dt: 0.002 });
  const tRise = mid.strikeT === null ? 0.5 : mid.apexT - mid.strikeT;
  return {
    a: law.a, b: law.b, epsStar: p.epsStar, r2: law.r2, pull, tRise,
    /* the fall time from a given residual */
    tFall: (eps) => law.a - law.b * Math.log(Math.max(1e-9, eps - p.epsStar)),
    /* and its inverse: the residual that gives a given fall time */
    epsFor: (t) => p.epsStar + Math.exp((law.a - t) / law.b),
    law,
  };
}

const EPS_MIN_OVER = 1e-4;      /* rad above eps* — nearer than this is unringable */
const EPS_MAX = 55 * Math.PI / 180;

/* ── HOW HIGH A RINGER WILL LET A BELL GO ───────────────────────────────────
 * A fifth of a degree over the balance.  This is not a fudge, it is the whole
 * of the twin's claim B5 turned into a rule the band obeys: past about two
 * places late the bell is standing on its own balance, a degree of error is
 * worth a whole row, and NO ringer can hold it there.  Without this bound the
 * solve happily reports success at eps* + 0.006 deg — mathematically it does
 * hit the target — and then the next stroke arrives half a second early
 * because at the pole the law's own slope is infinite.  One blow in a hundred,
 * which is enough to make a room that is right sound broken.
 * With the bound, an impossible demand comes out as a bell that is merely
 * LATE, which is what would actually happen in the tower. */
const MIN_HOLD = 0.20 * Math.PI / 180;

export class Ringer {
  /* ONE bell and the person on its rope. */
  constructor(p, opts = {}) {
    this.p = p;
    this.dt = opts.dt || 0.002;
    this.aim = opts.aim || aimingLaw(p, { dt: 0.001 });
    this.trialDt = opts.trialDt || 0.002;
    this.pull = 40;
    this.sgn = 1;
    this.eps = this.aim.epsFor(1.4);
    this.sw = null;
    this.tBalance = 0;          /* wall time at which the current swing began */
    this.target = 0;            /* wall time this swing's blow is aimed at */
    this.nextTarget = 0;        /* … and the one after, which is what the pull buys */
    this.lastErr = 0;           /* ms the last blow missed the beat by */
    this.lastBlow = 0;
    this.overStay = false;      /* the ringer was asked for more than the bell has */
    this.strained = 0;          /* -1 asked to go too high, +1 asked to go too low */
    this.nudge = 1;             /* the visitor's hand on this rope, as a pull multiplier */
    /* TWO biases, one per stroke.  The aiming law is fitted on a bell with a
     * dead rope, and a real swing has the rope in it, so every aim is a little
     * out — and out by DIFFERENT amounts at handstroke and backstroke, because
     * the open handstroke lead makes the two strokes different lengths.  A
     * ringer corrects both by feel and so does this one: integral action on
     * the last blow's error, held separately for hand and back.  (One shared
     * bias oscillates, which is a real fault with a real name.) */
    this.bias = [0, 0];
    this.kI = 0.65;
  }

  strokeIdx() { return this.sgn > 0 ? 0 : 1; }

  /* Put the bell at the balance at wall time t0, set to strike at tBlow — and
   * iterate until it really does, so the first row is not a shambles. */
  set(t0, tBlow, sgn = 1, nextTarget = null) {
    this.sgn = sgn;
    this.tBalance = t0;
    this.target = tBlow;
    this.sw = null;
    const want = Math.max(0.25, tBlow - t0);
    let corr = 0;
    for (let it = 0; it < 5; it++) {
      this.eps = clampEps(this.aim.epsFor(want + corr));
      const pull = nextTarget === null ? 0 : this.solvePull(nextTarget);
      const r = swing(this.p, this.eps, pull, { dt: this.trialDt, sgn: this.sgn });
      if (r.strikeT === null) break;
      corr += want - r.strikeT;
    }
    this.bias[this.strokeIdx()] = -corr;
  }

  /* Begin the swing whose blow is aimed at 'target' and whose FAR balance must
   * set up a blow at 'nextTarget'.  Chooses the pull, then hands back a live
   * Swinger for the room to step. */
  begin(target, nextTarget) {
    this.target = target;
    this.nextTarget = nextTarget;
    /* aim at the NEXT stroke's target, shifted by that stroke's standing bias */
    /* the visitor's hand on the rope is a ONE-SHOT, consumed by the next stroke
     * that actually happens — a nudge on a timer would silently do nothing at
     * all whenever no bell reached its balance inside the window */
    this.pull = this.solvePull(nextTarget - this.bias[1 - this.strokeIdx()]) * this.nudge;
    this.nudged = this.nudge !== 1;
    this.nudge = 1;
    this.sw = new Swinger(this.p, this.eps, this.pull, { dt: this.dt, sgn: this.sgn });
    return this.sw;
  }

  /* THE ONE-STROKE-BEHIND SOLVE.  Find the pull whose far balance leaves the
   * bell high enough that its NEXT fall lands on nextTarget.  Monotone: more
   * pull, higher balance, longer fall, later next blow. */
  solvePull(nextTarget) {
    const want = nextTarget - this.tBalance;         /* apexT + tFall(apexEps) */
    const trial = (pull) => {
      const r = swing(this.p, this.eps, pull, { dt: this.trialDt, sgn: this.sgn });
      if (r.overStay || r.apexEps < this.p.epsStar + MIN_HOLD) return { v: Infinity, r };
      const e = Math.max(this.p.epsStar + EPS_MIN_OVER, r.apexEps);
      return { v: r.apexT + this.aim.tFall(e), r };
    };
    let lo = 0, hi = 60;
    let f0 = trial(0);
    if (f0.v >= want) { this.strained = 1; return 0; }   /* even a dead rope is too slow */
    let fh = trial(hi);
    for (let i = 0; i < 8 && fh.v < want && isFinite(fh.v); i++) { hi *= 1.7; fh = trial(hi); }
    if (fh.v < want) { this.strained = -1; return hi; }  /* cannot be pulled up far enough */
    this.strained = 0;
    /* Bisect on the VALUE, not on the pull.  Near the top of a bell's range the
     * far balance is a hair from upright and the next fall time has a pole
     * there, so a pull tolerance that looks tight (a twentieth of a newton
     * metre out of sixty) is still half a second of ringing.  A treble, whose
     * whole working range of pull is a third of a tenor's, was landing its
     * blows most of a second out because of exactly this. */
    /* KEEP THE BEST FEASIBLE MID, not the last one.  The bracket's upper end is
     * a pull that is REJECTED (it puts the bell over the balance, or over the
     * stay), and the last probe of a bisection lands there about half the time.
     * Taking it — because it was the last thing tried — hands the band a pull
     * that leaves the bell exactly at eps*, and the stroke after that is a
     * second out.  That was one blow in forty and it sounded like a broken
     * room, not like a wrong number. */
    let best = lo, bestMiss = Infinity;
    for (let i = 0; i < 28; i++) {
      const mid = 0.5 * (lo + hi);
      const f = trial(mid);
      if (isFinite(f.v)) {
        const miss = Math.abs(f.v - want);
        if (miss < bestMiss) { bestMiss = miss; best = mid; }
        if (miss < 0.002) break;
      }
      if (f.v < want) lo = mid; else hi = mid;
      if (hi - lo < 1e-6 * (1 + hi)) break;
    }
    /* (A secant refinement that integrates the NEXT swing too, to get away
     * from the dead-rope fitted law, was tried here and made the striking ten
     * times worse: the estimate of the pull to come is the previous stroke's
     * pull, which after a place change is the wrong answer to a question with
     * a pole in it, and the secant then chases it.  A ringer aims with the law
     * and corrects by feel, and so does this one — the per-stroke bias above
     * is the feel.) */
    return best;
  }

  /* Called by the room when the live swing has reached the far balance. */
  land(tNow) {
    const r = this.sw.result();
    this.overStay = r.overStay;
    this.eps = clampEps(r.overStay ? this.p.epsStar + EPS_MIN_OVER : r.apexEps);
    this.tBalance = tNow;
    this.sgn = -this.sgn;
    this.sw = null;
    return r;
  }
}

function clampEps(e) { return Math.min(EPS_MAX, Math.max(0, e)); }

/* ── THE BAND ───────────────────────────────────────────────────────────────
 * Six ringers, a row source, and a wall clock.  step(seconds) advances all six
 * live integrators and returns every blow that happened, in order.
 */
export class Band {
  constructor(opts) {
    this.bells = opts.bells;                       /* array of bell params, index 0 = treble */
    this.stage = this.bells.length;
    this.rowTime = opts.rowTime || 2.0;
    this.openHandstroke = opts.openHandstroke !== false;
    this.rowAt = opts.rowAt;                       /* (r) -> array of bell numbers, 1-based */
    this.ringers = this.bells.map((p, i) => new Ringer(p, { aim: opts.aims && opts.aims[i] }));
    this.t = 0;
    this.rowOf = new Array(this.stage).fill(0);    /* which row each bell is currently ringing */
    this.blowCount = 0;
    this.started = false;
  }

  get gap() { return this.rowTime / this.stage; }

  /* wall time at which row r begins (its first bell's blow) */
  rowStart(r) {
    const extra = this.openHandstroke ? this.gap : 0;
    return r * this.rowTime + Math.floor((r + 1) / 2) * extra;
  }

  /* when bell b (1-based) sounds in row r */
  blowTime(r, b) {
    const row = this.rowAt(r);
    const j = row.indexOf(b);
    return this.rowStart(r) + j * this.gap;
  }

  /* ── LOOK TO … TREBLE'S GOING … SHE'S GONE ───────────────────────────────
   * A band does not start ringing.  It stands its bells MOUTH UP at the
   * balance, and then, on the word, they are pulled off one after another in
   * order — because the first row has to come out in order too, and a bell
   * takes a second and a half to fall.  So the room opens with six bells
   * standing, and each ringer waits for their moment. */
  start(t0 = 0) {
    this.t = t0;
    this.standing = false;
    this.leadIn = this.leadIn || 1.6;
    for (let i = 0; i < this.stage; i++) {
      const b = i + 1;
      const rg = this.ringers[i];
      const tBlow = t0 + this.leadIn + this.blowTime(0, b);
      /* stand it at the balance at a comfortable height, then work out when to
       * pull off so that its first blow lands where the row wants it */
      /* Stand it where a bell that had ALREADY been ringing at this speed
       * would be standing — the steady height for the interval it is about to
       * be asked for.  Standing every bell at the same comfortable height
       * instead looks fine and then hands the treble a first row it cannot
       * possibly ring, because the bell is too low to be late enough. */
      const T1 = this.blowTimeAbs(1, b) - this.blowTimeAbs(0, b);
      rg.eps = clampEps(rg.aim.epsFor(Math.max(0.4, T1 - rg.aim.tRise)));
      /* the pull it will actually use shortens the fall by a few tens of ms,
       * so work the release time out WITH that pull in it, twice */
      let fall = swing(rg.p, rg.eps, 0, { dt: rg.trialDt, sgn: 1 }).strikeT || 1.35;
      for (let it = 0; it < 2; it++) {
        rg.tBalance = tBlow - fall;
        const pull = rg.solvePull(t0 + this.blowTimeAbs(1, b));
        const r = swing(rg.p, rg.eps, pull, { dt: rg.trialDt, sgn: 1 });
        if (r.strikeT !== null) fall = r.strikeT;
      }
      rg.releaseAt = tBlow - fall;
      rg.sgn = 1;
      rg.sw = null;
      rg.target = tBlow;
      rg.bias[0] = rg.bias[1] = 0;
      this.rowOf[i] = 0;
    }
    this.started = true;
  }

  /* the conductor's last word: after the coming blow, set every bell up */
  stand() { this.standing = true; }

  blowTimeAbs(r, b) { return this.leadIn + this.blowTime(r, b); }

  /* Advance the whole band by 'seconds' of wall clock.  Returns the blows.
   *
   * The integrator takes whole steps of h = 2 ms, so each ringer carries an
   * ACCUMULATOR of the time the frame did not fill.  Without it, a frame
   * shorter than one step advances nothing at all while the schedule the
   * ringers aim at moves on — see Swinger.advanceSteps. */
  step(seconds) {
    const out = [];
    const end = this.t + seconds;
    for (let i = 0; i < this.stage; i++) {
      const rg = this.ringers[i];
      rg.acc = (rg.acc || 0) + seconds;
      let steps = Math.floor(rg.acc / rg.dt);
      rg.acc -= steps * rg.dt;
      if (steps > 600) { steps = 600; rg.acc = 0; }   /* never let a stalled tab spiral */

      /* still standing at the balance, waiting to be pulled off */
      if (!rg.sw) {
        if (this.standing || rg.releaseAt === undefined || end < rg.releaseAt) continue;
        rg.tBalance = rg.releaseAt;
        const r = this.rowOf[i];
        rg.begin(this.blowTimeAbs(r, i + 1), this.blowTimeAbs(r + 1, i + 1));
        /* catch the integrator up to now, in whole steps */
        steps = Math.max(0, Math.min(600, Math.floor((end - rg.releaseAt) / rg.dt)));
        rg.releaseAt = undefined;
      }
      let guard = 0;
      while (steps > 0 && guard++ < 8) {
        if (!rg.sw) break;
        const used = rg.sw.advanceSteps(steps, (hit) => {
          if (!hit.first) return;
          const tw = rg.tBalance + hit.t;
          rg.lastBlow = tw;
          rg.lastErr = (tw - rg.target) * 1000;
          /* the ringer feels the miss and leans on this stroke's bias */
          const k = rg.strokeIdx();
          rg.bias[k] = Math.max(-0.5, Math.min(0.5, rg.bias[k] + rg.kI * (tw - rg.target)));
          out.push({ bell: i + 1, t: tw, speed: hit.speed, row: this.rowOf[i],
                     errMs: rg.lastErr, strained: rg.strained,
                     place: this.rowAt(this.rowOf[i]).indexOf(i + 1) + 1 });
          this.blowCount++;
        });
        steps -= used;
        if (rg.sw.done) {
          const tLand = rg.tBalance + rg.sw.t;
          rg.land(tLand);
          const r = ++this.rowOf[i];
          if (this.standing) { rg.sw = null; break; }
          rg.begin(this.blowTimeAbs(r, i + 1), this.blowTimeAbs(r + 1, i + 1));
        } else break;
      }
    }
    this.t = end;
    out.sort((a, b) => a.t - b.t);
    return out;
  }

  /* the visible state of one bell right now */
  poseOf(i) {
    const rg = this.ringers[i];
    if (!rg.sw) return { th: rg.sgn * (Math.PI - rg.eps), ph: rg.sgn * (Math.PI - rg.eps) + rg.sgn * this.bells[i].beta, resting: true };
    return { th: rg.sw.th, ph: rg.sw.ph, resting: rg.sw.s !== 0 };
  }
}
