/* cloud-engine.js — the Colophon's self-portrait engine.
 *
 * The page portrays its own text being generated the way its author generates
 * text: a latent field of glowing smears, a rolling window of legible candidate
 * sets (the true next word hiding among plausible alternatives), a flare as each
 * choice is weighed, the sampled word flying out of the cloud to lock into the
 * laid-out prose ~100ms before the voice speaks it, and — when the last word has
 * landed — an ⟨end⟩ token drawn from the cloud, at which the churn quiets and
 * the field dissolves to a few drifting stars.
 *
 * Everything correctness-critical (reveals, flights, highlights) is a pure
 * function of the master clock t (audio time), so a hidden tab or a stalled
 * frame can never desynchronize the text from the voice. Ambience (smear drift)
 * is incremental and free to lag; it carries no meaning.
 *
 * No network, no deps. Boots via ColophonCloud.boot({data, audio, els}).
 */
"use strict";
(function () {
  var TAU = Math.PI * 2;

  /* ── deterministic rng (the estate's taste: seeded, reproducible) ─────────── */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }

  /* ── timeline constants (ms, relative to each word's spoken start s) ──────── */
  var LEAD_FLARE = 700;   // candidates flare (the model weighing)
  var LEAD_FLY = 450;     // the true word detaches and flies
  var LEAD_LAND = 100;    // …landing this long before it is spoken
  var DECAY_MS = 650;     // distractors fade back to smears
  var ENTER_MS = 900;     // a fresh set condenses from the field

  var ColophonCloud = { boot: boot };

  function boot(opts) {
    var data = opts.data, audio = opts.audio, els = opts.els;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── 1. wrap the article's words in spans, grouped exactly like the data ──
     * A standalone "—" is display-only: it reveals with the previous word's
     * group (a paragraph-leading "—" reveals with the next). The grouping rule
     * is duplicated in prepare.mjs; a mismatch fails open to a readable page. */
    var BARE = function (t) { return t.replace(/^[^A-Za-z0-9'’]+|[^A-Za-z0-9'’]+$/g, ""); };
    var groups = [];          // {spans:[...], word:span, p:int}
    (function wrapWords() {
      var ps = els.article.querySelectorAll("p");
      for (var pi = 0; pi < ps.length; pi++) {
        var pendingDash = null;
        var walker = document.createTreeWalker(ps[pi], NodeFilter.SHOW_TEXT, null);
        var textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        for (var ni = 0; ni < textNodes.length; ni++) {
          var node = textNodes[ni];
          var parts = node.textContent.split(/(\s+)/);
          if (parts.length === 1 && !parts[0].trim()) continue;
          var frag = document.createDocumentFragment();
          for (var ti = 0; ti < parts.length; ti++) {
            var tok = parts[ti];
            if (!tok) continue;
            if (!tok.trim()) { frag.appendChild(document.createTextNode(tok)); continue; }
            var sp = document.createElement("span");
            sp.className = "w";
            sp.textContent = tok;
            frag.appendChild(sp);
            if (BARE(tok) === "") {
              /* display-only token (an em-dash, a stray ":" split off by markup):
               * it reveals with the previous word (paragraph-leading → the next) */
              if (groups.length && groups[groups.length - 1].p === pi) groups[groups.length - 1].spans.push(sp);
              else pendingDash = sp;
            } else {
              var g = { spans: [sp], word: sp, p: pi };
              if (pendingDash) { g.spans.unshift(pendingDash); pendingDash = null; }
              groups.push(g);
            }
          }
          node.parentNode.replaceChild(frag, node);
        }
      }
    })();

    var N = data.words.length;
    var wired = groups.length === N;
    if (wired) {
      var normCmp = function (s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); };
      for (var gi = 0; gi < N; gi++) {
        if (normCmp(groups[gi].word.textContent) !== normCmp(data.words[gi].w)) { wired = false; break; }
      }
    }
    if (!wired) {
      console.warn("colophon: word grouping mismatch (" + groups.length + " vs " + N + ") — revealing plain page");
      revealAll(true);
      return;
    }

    /* the reserved ⟨end⟩ landing site, inline after the signature */
    var endTok = document.createElement("span");
    endTok.className = "endtok";
    endTok.textContent = "⟨end⟩";
    groups[N - 1].word.parentNode.appendChild(document.createTextNode(" "));
    groups[N - 1].word.parentNode.appendChild(endTok);

    /* ── reduced motion: the calm fallback — full text now, gentle listen ────── */
    if (reduce) {
      state = "calm";
      revealAll(false);
      els.page.classList.add("calm");
      bootCalm();
      return;
    }
    els.page.classList.add("woven", "idlelock");

    /* ── 2. canvas + sprites ─────────────────────────────────────────────────── */
    var canvas = els.canvas, ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var VW = 0, VH = 0;
    var rng = mulberry32(392);   // the cycle that built this page

    function sizeCanvas() {
      VW = window.innerWidth; VH = window.innerHeight;
      canvas.width = Math.floor(VW * dpr);
      canvas.height = Math.floor(VH * dpr);
      canvas.style.width = VW + "px";
      canvas.style.height = VH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* smear sprites: elongated soft gradients in the estate's night palette */
    var SMEAR_HUES = [250, 274, 216, 184, 330];
    var smearSprites = [];
    (function bakeSmears() {
      for (var i = 0; i < 10; i++) {
        var w = 96, h = 44;
        var c = document.createElement("canvas");
        c.width = w * 2; c.height = h * 2;
        var g = c.getContext("2d");
        g.scale(2, 2);
        var hue = SMEAR_HUES[i % SMEAR_HUES.length];
        var sat = 46 + (i * 7) % 22, lit = 58 + (i * 5) % 14;
        var grad = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
        grad.addColorStop(0, "hsla(" + hue + "," + sat + "%," + lit + "%,.85)");
        grad.addColorStop(0.45, "hsla(" + hue + "," + sat + "%," + (lit - 12) + "%,.32)");
        grad.addColorStop(1, "hsla(" + hue + "," + sat + "%,30%,0)");
        g.fillStyle = grad;
        g.save(); g.translate(w / 2, h / 2); g.scale(1, h / w); g.beginPath();
        g.arc(0, 0, w / 2, 0, TAU); g.fill(); g.restore();
        smearSprites.push(c);
      }
    })();

    /* text sprites: candidates are deliberately uniform — the truth must be
     * indistinguishable from its distractors until the moment it is drawn. */
    var spriteCache = {};   // key → {c, w, h}
    function textSprite(word, kind, px, mono) {
      var key = kind + "|" + px + "|" + (mono ? "m|" : "") + word;
      var hit = spriteCache[key];
      if (hit) return hit;
      var font = mono
        ? "500 " + px + "px ui-monospace, Menlo, monospace"
        : (kind === "gold" ? "" : "italic ") + px + "px Georgia, 'Times New Roman', serif";
      var mc = document.createElement("canvas");
      var mg = mc.getContext("2d");
      mg.font = font;
      var tw = Math.ceil(mg.measureText(word).width);
      var pad = 14;
      mc.width = (tw + pad * 2) * 2; mc.height = (px + pad * 2) * 2;
      mg = mc.getContext("2d");
      mg.scale(2, 2);
      mg.font = font;
      mg.textBaseline = "middle";
      if (kind === "gold") {
        mg.shadowColor = "rgba(224,186,110,.9)"; mg.shadowBlur = 12;
        mg.fillStyle = "#eccf8e";
      } else {
        mg.shadowColor = "rgba(140,165,215,.8)"; mg.shadowBlur = 8;
        mg.fillStyle = "rgba(196,210,238,.92)";
      }
      mg.fillText(word, pad, px / 2 + pad);
      mg.shadowBlur = 0;
      mg.fillText(word, pad, px / 2 + pad);
      var s = { c: mc, w: tw + pad * 2, h: px + pad * 2 };
      spriteCache[key] = s;
      /* cap the cache; evict half when it bloats (landed words never return) */
      var keys = Object.keys(spriteCache);
      if (keys.length > 340) for (var i = 0; i < 170; i++) delete spriteCache[keys[i]];
      return s;
    }

    /* ── 3. field state ──────────────────────────────────────────────────────── */
    var smears = [], motes = [];
    function seedField() {
      smears.length = 0; motes.length = 0;
      var count = clamp(Math.round(VW * VH / 11000), 70, 170);
      for (var i = 0; i < count; i++) {
        smears.push({
          x: rng() * VW, y: rng() * VH,
          a: rng() * TAU, spin: (rng() - 0.5) * 0.0011,
          v: 0.09 + rng() * 0.2, dir: rng() * TAU,
          s: 0.5 + rng() * 1.7, alpha: 0.075 + rng() * 0.13,
          tw: rng() * TAU, tws: 0.4 + rng() * 0.8,
          k: (rng() * 10) | 0
        });
      }
      var mcount = clamp(Math.round(VW * VH / 26000), 26, 70);
      for (var m = 0; m < mcount; m++) {
        motes.push({
          x: rng() * VW, y: rng() * VH,
          vy: -(0.02 + rng() * 0.06), r: 0.4 + rng() * 1.2,
          base: 0.1 + rng() * 0.3, tw: rng() * TAU, tws: 0.3 + rng() * 0.7
        });
      }
    }

    /* candidate sets: created on window entry, freed after decay */
    var sets = {};            // k → set
    var W_SETS = 18;          // rolling window; ≈ 72 legible tokens with 3 alts
    function windowSize() {
      var w = VW * VH < 420000 ? 11 : W_SETS;
      // idle is the first impression — keep it a calmer, more legible field so the
      // "roads not taken" read individually; the full window fills in on play.
      return state === "play" ? w : Math.round(w * 0.55);
    }

    function makeSet(k) {
      var frontier = frontierY();
      var bandTop = clamp(frontier + 26, 60, VH - 160);
      var isEnd = k === N;
      var anchor = {
        /* the ⟨end⟩ set rises near the centre — its weighing should be witnessed */
        x: isEnd ? VW * (0.34 + rng() * 0.32) : 46 + rng() * (VW - 92),
        y: bandTop + rng() * Math.max(80, VH - bandTop - 90),
        dir: rng() * TAU
      };
      var truth = isEnd ? "⟨end⟩" : data.words[k].w;
      var alts = isEnd ? data.end.d : data.words[k].d;
      var toks = [];
      var all = [truth].concat(alts);
      for (var i = 0; i < all.length; i++) {
        toks.push({
          word: all[i], truth: i === 0,
          r: 16 + rng() * 26, ang: rng() * TAU,
          spd: (rng() < 0.5 ? -1 : 1) * (0.00022 + rng() * 0.00035),
          jx: (rng() - 0.5) * 8, jy: (rng() - 0.5) * 6
        });
      }
      return { k: k, anchor: anchor, toks: toks, born: null, isEnd: isEnd };
    }

    /* ── 4. word timing accessors (the END virtual word rides at index N) ────── */
    var last = data.words[N - 1];
    var END_S = last.e + 900;
    function wS(k) { return k === N ? END_S : data.words[k].s; }
    function landT(k) { return wS(k) - LEAD_LAND; }

    /* ── 5. master clock: audio-driven, synthetic after 'ended' ──────────────── */
    var state = "idle";       // idle | play | done | read
    var endedAt = null, endedT = 0;
    audio.addEventListener("ended", function () {
      if (endedAt === null) { endedAt = performance.now(); endedT = audio.currentTime * 1000 || data.duration_ms; }
    });
    function clockT() {
      if (state !== "play") return -1;
      if (endedAt !== null) return endedT + (performance.now() - endedAt);
      return audio.currentTime * 1000;
    }

    /* ── 6. layout measurement (document coords; viewport = doc − scrollY) ───── */
    var targets = [];         // per group: {x, y, px}
    var endTarget = null;
    function measure() {
      targets.length = 0;
      var sy = window.scrollY || window.pageYOffset;
      for (var i = 0; i < N; i++) {
        var r = groups[i].word.getBoundingClientRect();
        targets.push({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2 + sy,
          px: parseFloat(getComputedStyle(groups[i].word).fontSize) || 18.5
        });
      }
      var er = endTok.getBoundingClientRect();
      endTarget = { x: er.left + er.width / 2, y: er.top + er.height / 2 + sy, px: 14 };
    }
    function targetOf(k) { return k === N ? endTarget : targets[k]; }

    /* the frontier: viewport y just below the last-revealed line */
    var revealCursor = 0;     // groups [0, revealCursor) are visible
    function frontierY() {
      var sy = window.scrollY || window.pageYOffset;
      if (revealCursor === 0) {
        var ar = els.article.getBoundingClientRect();
        return clamp(ar.top + 8, 60, VH * 0.4);
      }
      var t = targets[revealCursor - 1];
      return t ? clamp(t.y - sy + 26, 60, VH - 120) : VH * 0.4;
    }

    /* ── 7. reveal machinery (monotonic; pure in t) ──────────────────────────── */
    var spkCursor = 0, spkActive = null;
    function advanceReveals(t) {
      while (revealCursor < N && landT(revealCursor) <= t) {
        var g = groups[revealCursor];
        for (var i = 0; i < g.spans.length; i++) g.spans[i].classList.add("on");
        g.word.classList.add("land");
        revealCursor++;   /* the set lingers: its distractors decay in drawFrame */
      }
      /* spoken highlight — at most one active */
      while (spkCursor < N && data.words[spkCursor].e <= t) {
        if (spkActive === spkCursor) { groups[spkCursor].word.classList.remove("spk"); spkActive = null; }
        spkCursor++;
      }
      if (spkCursor < N && data.words[spkCursor].s <= t && spkActive !== spkCursor) {
        if (spkActive !== null) groups[spkActive].word.classList.remove("spk");
        groups[spkCursor].word.classList.add("spk");
        spkActive = spkCursor;
      }
      /* live-paragraph focus */
      var liveP = revealCursor < N ? groups[revealCursor].p : groups[N - 1].p;
      if (liveP !== lastLiveP) {
        var ps = els.article.querySelectorAll("p");
        for (var pi = 0; pi < ps.length; pi++) ps[pi].classList.toggle("live", pi === liveP);
        lastLiveP = liveP;
      }
    }
    var lastLiveP = -1;

    function revealAll(hard) {
      els.page.classList.add("revealed");
      if (hard) els.page.classList.add("plain");
    }

    /* ── 8. auto-scroll: keep the landing frontier ~42% down the viewport ────── */
    var userScrollHold = 0;
    window.addEventListener("wheel", function () { userScrollHold = performance.now() + 3500; }, { passive: true });
    window.addEventListener("touchmove", function () { userScrollHold = performance.now() + 3500; }, { passive: true });
    function autoScroll() {
      if (state !== "play" || performance.now() < userScrollHold) return;
      var k = Math.min(revealCursor, N - 1);
      var tg = targets[k];
      if (!tg) return;
      var want = clamp(tg.y - VH * 0.42, 0, Math.max(0, document.documentElement.scrollHeight - VH));
      var cur = window.scrollY || window.pageYOffset;
      var d = want - cur;
      if (Math.abs(d) > 2) window.scrollTo(0, cur + d * 0.07);
    }

    /* ── 9. drawing ──────────────────────────────────────────────────────────── */
    var dissolveFrom = null;  // t at which the field starts to die
    function fieldAlpha(t) {
      if (dissolveFrom === null || t < dissolveFrom) return 1;
      return clamp(1 - (t - dissolveFrom) / 2600, 0.13, 1);
    }

    function drawFrame(now, t) {
      ctx.clearRect(0, 0, VW, VH);
      var fa = state === "done" || state === "read" ? 0.13 : fieldAlpha(t);
      var churn = fa > 0.14 ? 1 : 0.25;   // the quieting: drift slows as it dies
      var fr = frontierY();

      /* smears — additive, steered gently below the frontier */
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < smears.length; i++) {
        var s = smears[i];
        s.dir += (rngDrift(now, i)) * 0.012 * churn;
        s.x += Math.cos(s.dir) * s.v * churn;
        s.y += Math.sin(s.dir) * s.v * churn;
        s.a += s.spin * churn;
        if (s.y < fr - 30) s.y += (fr - 30 - s.y) * 0.006;   // ease out of the prose
        if (s.x < -120) s.x = VW + 110; else if (s.x > VW + 120) s.x = -110;
        if (s.y < -80) s.y = VH + 70; else if (s.y > VH + 80) s.y = fr + 40;
        var al = (s.alpha + Math.sin(now * 0.00045 * s.tws + s.tw) * 0.03) * fa;
        if (al <= 0.004) continue;
        var sp = smearSprites[s.k];
        ctx.globalAlpha = clamp(al, 0, 0.24);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.a);
        ctx.scale(s.s, s.s);
        ctx.drawImage(sp, -48, -22, 96, 44);
        ctx.restore();
      }
      /* motes — the residue that outlives the cloud (the old page's stars) */
      ctx.globalCompositeOperation = "source-over";
      for (var m = 0; m < motes.length; m++) {
        var mo = motes[m];
        mo.y += mo.vy * churn;
        if (mo.y < -2) { mo.y = VH + 2; mo.x = (mo.x * 31 % VW + VW) % VW; }
        var ma = (mo.base + Math.sin(now * 0.0006 * mo.tws + mo.tw) * 0.1) * Math.max(fa, 0.5);
        ctx.beginPath();
        ctx.arc(mo.x, mo.y, mo.r, 0, TAU);
        ctx.fillStyle = "rgba(220,226,244," + clamp(ma, 0, 0.5).toFixed(3) + ")";
        ctx.fill();
      }
      if (state === "done" || state === "read") return;

      /* candidate sets */
      var sy = window.scrollY || window.pageYOffset;
      var from = state === "play" ? revealCursor : 0;
      var winEnd = Math.min(from + windowSize(), N + 1);
      for (var k = from; k < winEnd; k++) {
        if (k === N && state !== "play") break;
        if (!sets[k]) { sets[k] = makeSet(k); sets[k].born = now; }
        drawSet(sets[k], now, t, sy);
      }
      /* decaying distractors of just-landed sets */
      for (var dk in sets) {
        var dset = sets[dk];
        if (dset.k < from) {
          var dt = t - (wS(dset.k) - LEAD_FLY);
          if (dt > DECAY_MS + 200) delete sets[dk];
          else drawSet(dset, now, t, sy);
        }
      }
    }

    /* small deterministic per-smear wander (no Math.random in the loop) */
    function rngDrift(now, i) { return Math.sin(now * 0.00013 + i * 12.9898) * 0.6; }

    function drawSet(set, now, t, sy) {
      var s0 = wS(set.k);
      var enter = set.born === null ? 1 : clamp((now - set.born) / ENTER_MS, 0, 1);
      var flare = state === "play" ? clamp((t - (s0 - LEAD_FLARE)) / (LEAD_FLARE - LEAD_FLY), 0, 1) : 0;
      var sampleAt = s0 - LEAD_FLY;
      var sampled = state === "play" && t >= sampleAt;
      var a = set.anchor;

      /* the anchor breathes; on flare it holds still (attention) */
      var still = 1 - flare * 0.85;
      a.dir += Math.sin(now * 0.00011 + set.k * 3.7) * 0.01 * still;
      a.x = clamp(a.x + Math.cos(a.dir) * 0.14 * still, 40, VW - 40);
      a.y = clamp(a.y + Math.sin(a.dir) * 0.12 * still, 54, VH - 46);

      /* condensation haze while entering */
      if (enter < 1) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.1 * (1 - enter);
        var hz = smearSprites[set.k % 10];
        var hs = 2.4 - enter * 1.3;
        ctx.drawImage(hz, a.x - 48 * hs, a.y - 22 * hs, 96 * hs, 44 * hs);
        ctx.globalCompositeOperation = "source-over";
      }

      for (var i = 0; i < set.toks.length; i++) {
        var tok = set.toks[i];
        tok.ang += tok.spd * (1 - flare * 0.75) * 16;
        var pull = 1 - flare * 0.35;                       // flare draws the set tighter
        var tx = a.x + Math.cos(tok.ang) * tok.r * pull + tok.jx;
        var ty = a.y + Math.sin(tok.ang) * tok.r * 0.62 * pull + tok.jy;

        if (tok.truth && sampled) {
          /* the sampled word: gold, flying to its slot in the prose */
          var tg = targetOf(set.k);
          if (!tg) continue;
          var p = clamp((t - sampleAt) / (LEAD_FLY - LEAD_LAND), 0, 1);
          if (p >= 1) continue;                            // landed — the DOM span owns it now
          var ep = easeInOut(p);
          var gx = tg.x, gy = tg.y - sy;
          /* one gentle curve: control point perpendicular to the chord */
          var mx = (tx + gx) / 2 - (gy - ty) * 0.18;
          var my = (ty + gy) / 2 + (gx - tx) * 0.18;
          var bx = lerp(lerp(tx, mx, ep), lerp(mx, gx, ep), ep);
          var by = lerp(lerp(ty, my, ep), lerp(my, gy, ep), ep);
          var px = set.isEnd ? 14 : Math.round(targetOf(set.k).px);
          var ghost = textSprite(tok.word, "ghost", 16, set.isEnd);
          var gold = textSprite(tok.word, "gold", px, set.isEnd);
          var xf = clamp(p / 0.35, 0, 1);                  // crossfade ghost→gold early
          if (xf < 1) {
            ctx.globalAlpha = (1 - xf);
            ctx.drawImage(ghost.c, bx - ghost.w / 2, by - ghost.h / 2, ghost.w, ghost.h);
          }
          ctx.globalAlpha = 0.35 + 0.65 * xf;
          var sc = lerp(0.94, 1, ep);
          ctx.drawImage(gold.c, bx - gold.w / 2 * sc, by - gold.h / 2 * sc, gold.w * sc, gold.h * sc);
          continue;
        }

        var alpha;
        if (sampled && !tok.truth) {
          var dp = clamp((t - sampleAt) / DECAY_MS, 0, 1);  // fading back to latent
          alpha = (0.5 + flare * 0.5) * (1 - dp);
          tx += Math.cos(tok.ang) * dp * 26;
          ty += Math.sin(tok.ang) * dp * 18 + dp * 8;
          if (alpha <= 0.01) continue;
        } else {
          alpha = (0.34 + 0.28 * Math.sin(now * 0.0009 + set.k * 2.1 + i * 1.7)) * enter;
          if (state !== "play") alpha *= 0.82;              // idle: softer, so overlaps don't crowd
          alpha = alpha + flare * (1 - alpha) * 0.85;       // flare: everything brightens
        }
        var spTx = textSprite(tok.word, "ghost", 16, tok.truth && set.isEnd);
        var scl = (0.92 + flare * 0.12) * (sampled && !tok.truth ? 1 - 0.2 * clamp((t - sampleAt) / DECAY_MS, 0, 1) : 1);
        ctx.globalAlpha = clamp(alpha * fieldAlpha(t), 0, 1);
        ctx.drawImage(spTx.c, tx - spTx.w / 2 * scl, ty - spTx.h / 2 * scl, spTx.w * scl, spTx.h * scl);
      }
      ctx.globalAlpha = 1;
    }

    /* ── 10. the ⟨end⟩ finale ─────────────────────────────────────────────────── */
    var endShown = false, doneAt = null;
    function endSequence(t) {
      if (t >= END_S - LEAD_LAND && !endShown) {
        endShown = true;
        endTok.classList.add("on");
        dissolveFrom = t;
      }
      if (endShown && doneAt === null && t >= END_S + 2800) {
        doneAt = t;
        finish("done");
      }
    }

    function finish(kind) {
      state = kind;
      finishedAt = performance.now();
      els.page.classList.add("finished");
      els.page.classList.remove("idlelock", "playing");
      revealAll(false);
      if (spkActive !== null) { groups[spkActive].word.classList.remove("spk"); spkActive = null; }
      if (kind === "read") { endTok.classList.remove("on"); try { audio.pause(); } catch (e) {} }
      els.controls.classList.add("end");
    }

    /* ── 11. the frame loop ──────────────────────────────────────────────────── */
    var rafId = null, finishedAt = 0;
    var SETTLE_MS = 3200;   // once the field has fully dissolved, stop burning frames
    function ensureLoop() { if (rafId === null) rafId = window.requestAnimationFrame(frame); }
    function frame(now) {
      var t = clockT();
      if (state === "play") {
        advanceReveals(t);
        autoScroll();
        if (revealCursor >= N) endSequence(t);
      }
      drawFrame(now, t);
      /* in done/read the residual field has faded to a static wash — draw it a few
       * seconds for the dissolve to complete, then release the loop (resumed on replay). */
      if ((state === "done" || state === "read") && now - finishedAt > SETTLE_MS) {
        ctx.clearRect(0, 0, VW, VH);
        rafId = null;
        return;
      }
      rafId = window.requestAnimationFrame(frame);
    }

    /* ── 12. controls ────────────────────────────────────────────────────────── */
    function begin() {
      if (state !== "idle") return;
      ensureLoop();
      var p = audio.play();
      var go = function () {
        if (state !== "idle") return;   // a race (double-activate / rejected sibling) already resolved
        state = "play";
        els.page.classList.add("playing");
        els.page.classList.remove("idlelock");
        els.begin.classList.add("gone");
      };
      if (p && p.then) p.then(go).catch(function () {
        console.warn("colophon: audio would not start — offering the quiet page");
        finish("read");
        els.begin.classList.add("gone");
      });
      else go();
    }
    function skipToRead() {
      if (state !== "idle" && state !== "play") return;
      els.begin.classList.add("gone");
      finish("read");
    }
    function replay() {
      if (state !== "done" && state !== "read") return;
      /* full reset: hide every word again, rebuild the field, play from the top */
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        for (var si = 0; si < g.spans.length; si++) g.spans[si].classList.remove("on");
        g.word.classList.remove("land", "spk");
      }
      endTok.classList.remove("on");
      els.page.classList.remove("finished", "revealed", "plain");
      els.controls.classList.remove("end");
      sets = {}; revealCursor = 0; spkCursor = 0; spkActive = null; lastLiveP = -1;
      endShown = false; doneAt = null; dissolveFrom = null; endedAt = null;
      rng = mulberry32(392); seedField();
      try { audio.currentTime = 0; } catch (e) {}
      window.scrollTo(0, 0);
      state = "idle";
      ensureLoop();   // the loop may have been released after the field settled
      begin();
    }

    els.beginBtn.addEventListener("click", function (e) { e.stopPropagation(); begin(); });
    els.begin.addEventListener("click", begin);
    els.readLink.addEventListener("click", function (e) { e.stopPropagation(); skipToRead(); });
    els.skipBtn.addEventListener("click", skipToRead);
    els.replayBtn.addEventListener("click", replay);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") skipToRead();
      else if ((e.key === "Enter" || e.key === " ") && state === "idle" && document.activeElement === document.body) {
        e.preventDefault(); begin();
      }
    });

    /* estate-wide mute: the one shared key, via WS */
    if (window.WS && WS.muted) {
      var syncMute = function () {
        audio.muted = WS.muted();
        els.muteBtn.textContent = WS.muted() ? "🔇" : "🔊";
        els.muteBtn.setAttribute("aria-label", WS.muted() ? "unmute the estate" : "mute the estate");
      };
      syncMute();
      els.muteBtn.addEventListener("click", function (e) { e.stopPropagation(); WS.setMuted(!WS.muted()); syncMute(); });
      if (WS.onMuteChange) WS.onMuteChange(syncMute);
    } else {
      els.muteBtn.addEventListener("click", function (e) { e.stopPropagation(); audio.muted = !audio.muted; els.muteBtn.textContent = audio.muted ? "🔇" : "🔊"; });
    }

    /* ── calm mode (reduced motion): plain listen with a soft spoken highlight ── */
    function bootCalm() {
      spkCursor = 0; spkActive = null;   /* the vars' initializers live below the reduce-path return */
      els.begin.classList.add("gone");
      els.controls.classList.add("calm");
      var playing = false, starting = false, ticker = null;
      function clearSpk() {
        if (spkActive !== null) { groups[spkActive].word.classList.remove("spk"); spkActive = null; }
        spkCursor = 0;
      }
      function tick() {
        var t = audio.currentTime * 1000;
        while (spkCursor < N && data.words[spkCursor].e <= t) {
          if (spkActive === spkCursor) { groups[spkCursor].word.classList.remove("spk"); spkActive = null; }
          spkCursor++;
        }
        if (spkCursor < N && data.words[spkCursor].s <= t && spkActive !== spkCursor) {
          if (spkActive !== null) groups[spkActive].word.classList.remove("spk");
          groups[spkCursor].word.classList.add("spk");
          spkActive = spkCursor;
        }
      }
      els.calmBtn.addEventListener("click", function () {
        if (playing) {
          audio.pause(); playing = false;
          els.calmBtn.textContent = "▶ hear it read";
          if (ticker) { clearInterval(ticker); ticker = null; }
          return;
        }
        if (starting) return;                       // A4: no second play() before the first resolves
        starting = true;
        if (audio.ended || audio.currentTime === 0) clearSpk();   // A2: fresh listen highlights from the top
        audio.play().then(function () {
          starting = false; playing = true; els.calmBtn.textContent = "‖ pause";
          if (ticker) clearInterval(ticker);
          ticker = setInterval(tick, 90);
        }).catch(function () { starting = false; console.warn("colophon: audio would not start"); });
      });
      audio.addEventListener("ended", function () {
        playing = false; els.calmBtn.textContent = "▶ hear it read";
        if (ticker) { clearInterval(ticker); ticker = null; }
        if (spkActive !== null) { groups[spkActive].word.classList.remove("spk"); spkActive = null; }
      });
      // A1: the mute button must be live in calm mode too (a pre-muted visitor
      // must be able to unmute — the shared estate key, same as the animated path).
      if (window.WS && WS.muted) {
        var syncCalmMute = function () {
          audio.muted = WS.muted();
          els.muteBtn.textContent = WS.muted() ? "🔇" : "🔊";
          els.muteBtn.setAttribute("aria-label", WS.muted() ? "unmute the estate" : "mute the estate");
        };
        syncCalmMute();
        els.muteBtn.addEventListener("click", function (e) { e.stopPropagation(); WS.setMuted(!WS.muted()); syncCalmMute(); });
        if (WS.onMuteChange) WS.onMuteChange(syncCalmMute);
      } else {
        els.muteBtn.addEventListener("click", function (e) { e.stopPropagation(); audio.muted = !audio.muted; els.muteBtn.textContent = audio.muted ? "🔇" : "🔊"; });
      }
    }

    /* ── go ──────────────────────────────────────────────────────────────────── */
    sizeCanvas(); seedField(); measure();
    var remeasureTimer = null;
    window.addEventListener("resize", function () {
      sizeCanvas();
      if (remeasureTimer) clearTimeout(remeasureTimer);
      remeasureTimer = setTimeout(function () { measure(); }, 120);
    });
    document.addEventListener("visibilitychange", function () {
      /* reveals are pure in t; on return the next frame catches everything up */
    });
    rafId = window.requestAnimationFrame(frame);

    /* ══════════════════════════════════════════════════════════════════════════
       WS5 · Book-3 trailer cold-open hooks — ADDITIVE; inert unless poked.

       Appended INSIDE boot() so the four verbs close over `audio`, `begin`, and
       `groups`. The trailer deck (a same-origin parent) reads these off
       window.__tourHooks the way talk/showing.js routes __tourHooks verbs
       (the-errand/showing-hook.js is the estate precedent). Nothing here runs
       unless the deck pokes it: window.ColophonCloud, the begin veil, #beginBtn,
       WS mute sync, and every unpoked code path are untouched — zero behaviour
       change on an ordinary visit.

       FOUR verbs (ENGINE §3 + research/22 §2.3 + verify-pass F3). Why a separate
       resume verb: begin() hard-guards re-entry (`if (state !== "idle") return`)
       and the pre-begin page is a full-screen veil, so a re-begin cannot resume
       after a cut. The cold-open choreography is weave-and-pause at the record
       arm click (colophonBeginAt + colophonCut, #voice shielded to 0) then
       colophonResume() at the t=1.5 cue — a DIRECT audio.play(), legal once the
       arm gesture has unlocked audio. begin() never resets currentTime (only
       replay() does), so seek-then-begin plays from the sought position.

       Word lookup is by textContent over `groups` (each group's primary word
       span), NEVER by span index: there are more `.w` spans than data words
       (display-only tokens — em-dashes — carry `.w` too but ride a group's
       `spans` array, absent from `groups`). The zoom target 'I' is the first bare
       "I" token (word 53, "I am Claude,") — verified no earlier "I" exists, so
       first-match is the correct word.

       Forge landmine: this file forge-inlines into a <script>; BLOCK COMMENTS
       ONLY — a multi-line <!-- --> here would silently kill the whole script.
       ══════════════════════════════════════════════════════════════════════════ */
    if (typeof window !== "undefined") {
      window.__tourHooks = window.__tourHooks || {};
      window.__tourHooks.colophonBeginAt = function (ms) {
        try { audio.currentTime = Math.max(0, ms || 0) / 1000; } catch (e) {}
        begin();
        return true;
      };
      window.__tourHooks.colophonCut = function () {
        try { audio.pause(); } catch (e) {}
        return true;
      };
      window.__tourHooks.colophonResume = function () {
        try { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
        return true;
      };
      window.__tourHooks.colophonWordRect = function (txt) {
        for (var i = 0; i < groups.length; i++)
          if (groups[i].word && groups[i].word.textContent === txt)
            return groups[i].word.getBoundingClientRect();
        return null;
      };
    }
  }

  if (typeof window !== "undefined") { window.ColophonCloud = ColophonCloud; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = ColophonCloud; }
})();
