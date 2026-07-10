/* ════════════════════════════════════════════════════════════════════════════
   PRHand — the CH6 hand-on-mouse inset (WS7 T4.1, the Fable one-shot).

   An animated SVG of a (sweaty) human hand resting on a mouse, with THREE
   distinct triggerable click animations for CH6 "Press Record":

     'start' → the OBS click. Decisive index press, red ripple, the REC lamp
               comes on and blinks. The recording has begun.
     'arm'   → the click INSIDE the page ("a real one; a browser will not
               unlock sound for a script"). Nervous: the hand trembles in the
               approach, then a deliberate press-and-hold, double gold ripple.
     'stop'  → the exhale. Quick cool-blue click, REC lamp dies, the hand
               LIFTS off the mouse and the fingers splay — and one bead of
               sweat flicks off the back of the hand.

   Caption gag (part of the asset): "reenactment — the real one was sweatier."

   INVARIANT-5 CONTRACT (how the deck drives it):
     const inst = PRHand.mount(containerEl, opts);
     inst.setClicks([{t:<ms>, kind:'start'|'arm'|'stop'}, …]);   ← p06.json word
     inst.render(clockMs);          ← every frame, off audio.currentTime*1000
   render() is a PURE function of (clockMs, clicks): no accumulated state, no
   CSS animations, no self-running timers. Seeks snap. Ambient life (breathing,
   the sweat bead sliding, the REC blink) is derived from the same clock.

   opts: { caption:true, recLamp:true } (both default true).
   Multiple mounts coexist (per-instance SVG defs ids). Reusable from a plain
   page (hand-demo.html) or forge-included into a deck script — block comments
   only in this file, per the forge landmine rule.
   ════════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var UID = 0;
  var CSS_DONE = false;

  /* ── palette ─────────────────────────────────────────────────────────────── */
  var SKIN      = '#b97f5c';
  var SKIN_HI   = '#d9a67c';
  var SKIN_EDGE = '#4a2f1e';
  var NAIL      = '#dcae87';
  var RIM       = '#f2c9a0';
  var RIPPLE    = { start:'#ff4b3e', arm:'#f0b23e', stop:'#9fd8ff' };

  /* ── timing constants (ms) ───────────────────────────────────────────────── */
  var PRE      = 600;   /* tension approach before the click instant            */
  var ATTACK   = 90;    /* finger travel down                                   */
  var HOLD     = { start:60, arm:220, stop:50 };
  var RELEASE  = 240;   /* finger travel back up                                */
  var RIP_DUR  = 560;   /* one ripple ring                                      */
  var RIP_GAP  = 140;   /* arm's second ring delay                              */
  var RELAX    = 1500;  /* stop's lift-and-splay                                */

  function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(v){ v = clamp01(v); return 1 - Math.pow(1 - v, 3); }
  function easeIO(v){ v = clamp01(v); return v * v * (3 - 2 * v); }

  /* press envelope: 0→1 attack, hold, 1→0 release; pure fn of phase ms */
  function pressEnv(ph, hold){
    if (ph < 0) return 0;
    if (ph < ATTACK) return easeOut(ph / ATTACK);
    if (ph < ATTACK + hold) return 1;
    if (ph < ATTACK + hold + RELEASE) return 1 - easeOut((ph - ATTACK - hold) / RELEASE);
    return 0;
  }

  function injectCss(){
    if (CSS_DONE) return; CSS_DONE = true;
    var st = document.createElement('style');
    st.textContent = [
      '.prh-root{position:relative;overflow:hidden;background:#0b0a08;',
      '  border:1px solid rgba(255,255,255,.09);border-radius:10px;',
      '  box-shadow:0 18px 50px rgba(0,0,0,.55);}',
      '.prh-root svg{display:block;width:100%;height:100%;}',
      '.prh-caption{position:absolute;left:50%;bottom:4.5%;transform:translateX(-50%);',
      '  white-space:nowrap;font:italic 500 clamp(10px,4.2cqw,17px)/1.35 Georgia,"Times New Roman",serif;',
      '  color:#cbb9a4;background:rgba(10,8,6,.74);border:1px solid rgba(255,255,255,.08);',
      '  padding:.35em .95em;border-radius:4px;letter-spacing:.02em;pointer-events:none;}',
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── the drawing ──────────────────────────────────────────────────────────
     Scene 480×360. The mouse: a big capsule at translate(200,196) rotate(-14),
     local x∈[-52,52], y∈[-92,78]; buttons at the front (y<-26), wheel local
     (0,-55). The hand grips its rear: palm over the hump, four short curled
     fingers with tips ON the buttons (middle resting at the wheel's base),
     thumb hugging the left flank, forearm off to the bottom-right corner.
     The mouse's front third (buttons + seam + wheel top) stays EXPOSED —
     that is what makes the silhouette read instantly.                        */
  function svgMarkup(id){
    var g = 'prh' + id;   /* per-instance defs id prefix */
    return [
    '<svg viewBox="0 0 480 360" preserveAspectRatio="xMidYMid meet" aria-label="a hand on a mouse">',
    '<defs>',
    '  <radialGradient id="', g, '-bg" cx="42%" cy="40%" r="85%">',
    '    <stop offset="0" stop-color="#262019"/><stop offset=".55" stop-color="#141109"/>',
    '    <stop offset="1" stop-color="#0a0906"/></radialGradient>',
    '  <linearGradient id="', g, '-mb" x1="0" y1="0" x2="0" y2="1">',
    '    <stop offset="0" stop-color="#67718a"/><stop offset=".45" stop-color="#333947"/>',
    '    <stop offset="1" stop-color="#242a36"/></linearGradient>',
    '  <filter id="', g, '-b6" x="-40%" y="-40%" width="180%" height="180%">',
    '    <feGaussianBlur stdDeviation="6"/></filter>',
    '  <filter id="', g, '-b3" x="-40%" y="-40%" width="180%" height="180%">',
    '    <feGaussianBlur stdDeviation="3"/></filter>',
    '</defs>',

    /* desk + mousepad */
    '<rect width="480" height="360" fill="url(#', g, '-bg)"/>',
    '<rect x="36" y="74" width="356" height="252" rx="28" fill="#100e16"/>',
    '<rect x="36" y="74" width="356" height="252" rx="28" fill="none" stroke="#221e33" stroke-opacity=".55"/>',
    '<ellipse cx="212" cy="266" rx="102" ry="22" fill="#000" opacity=".5" filter="url(#', g, '-b6)"/>',

    /* the mouse (dynamic transform: dips on press) */
    '<g class="j-mouse">',
    '  <path d="M 0,-90 C -8,-122 -30,-136 -58,-142" fill="none" stroke="#3a4150" stroke-width="4.5" stroke-linecap="round"/>',
    '  <path d="M 0,-90 C -8,-122 -30,-136 -58,-142" fill="none" stroke="#5a6478" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>',
    '  <path d="M -52,-38 C -52,-96 52,-96 52,-38 L 52,46 C 52,80 -52,80 -52,46 Z" fill="url(#', g, '-mb)"/>',
    '  <path d="M -52,-38 C -52,-96 52,-96 52,-38 L 52,46 C 52,80 -52,80 -52,46 Z" fill="none" stroke="#0a0d12" stroke-width="2"/>',
    '  <ellipse cx="-16" cy="-34" rx="28" ry="50" fill="#fff" opacity=".05"/>',
    '  <ellipse cx="-22" cy="-56" rx="11" ry="19" fill="#fff" opacity=".1"/>',
    '  <path d="M -52,-26 C -22,-16 22,-16 52,-26" fill="none" stroke="#0c0f14" stroke-width="2.4"/>',
    '  <path d="M 0,-93 L 0,-24" stroke="#0c0f14" stroke-width="2.2"/>',
    '  <rect x="-8" y="-74" width="16" height="32" rx="8" fill="#0a0c10"/>',
    '  <rect x="-5" y="-70" width="10" height="24" rx="5" fill="#545c6c"/>',
    '  <line x1="-5" y1="-58" x2="5" y2="-58" stroke="#1a1e26" stroke-width="1.8"/>',
    '  <rect x="-4" y="-69" width="8" height="5" rx="2.5" fill="#6b7484" opacity=".8"/>',
    '</g>',

    /* click ripples (pool of 3, between mouse and hand so fingers overlap them) */
    '<g fill="none" stroke-width="3">',
    '  <circle class="j-rip" cx="164" cy="147" r="0" opacity="0"/>',
    '  <circle class="j-rip" cx="164" cy="147" r="0" opacity="0"/>',
    '  <circle class="j-rip" cx="164" cy="147" r="0" opacity="0"/>',
    '</g>',

    /* the hand (dynamic transform: tremor, lift, press-sink) */
    '<g class="j-hand">',
    '  <ellipse class="j-csh" cx="220" cy="210" rx="48" ry="24" fill="#000" opacity=".3" filter="url(#', g, '-b6)" transform="rotate(-18 220 210)"/>',

    /* forearm + cuff, trailing off to the bottom-right corner */
    '  <path d="M 282,258 L 386,352" stroke="', SKIN_EDGE, '" stroke-width="52" stroke-linecap="round"/>',
    '  <path d="M 282,258 L 386,352" stroke="', SKIN, '" stroke-width="46" stroke-linecap="round"/>',
    '  <path d="M 344,314 L 398,364" stroke="#242938" stroke-width="58" stroke-linecap="round"/>',
    '  <path d="M 340,310 L 346,316" stroke="#39415a" stroke-width="54" stroke-linecap="round" opacity=".7"/>',

    /* thumb (under the palm), pressed against the mouse’s left flank */
    '  <g class="j-th">',
    '    <path d="M 192,240 C 174,234 155,221 142,200" fill="none" stroke="', SKIN_EDGE, '" stroke-width="25" stroke-linecap="round"/>',
    '    <path d="M 192,240 C 174,234 155,221 142,200" fill="none" stroke="', SKIN, '" stroke-width="20" stroke-linecap="round"/>',
    '    <path d="M 178,230 C 167,223 156,214 148,204" fill="none" stroke="', SKIN_HI, '" stroke-width="6" stroke-linecap="round" opacity=".5"/>',
    '  </g>',

    /* palm: back of the hand over the mouse hump, heel toward the wrist */
    '  <path d="M 172,192 C 164,206 167,226 183,240 C 196,252 216,261 236,260',
    '           C 256,259 271,248 276,232 C 280,218 275,204 264,195',
    '           C 248,183 232,178 216,178 C 200,178 182,180 172,192 Z" fill="', SKIN_EDGE, '"/>',
    '  <path d="M 174,193 C 167,206 170,224 185,237 C 197,248 216,258 235,257',
    '           C 253,256 267,246 272,231 C 276,218 271,206 261,197',
    '           C 246,186 232,181 217,181 C 202,181 184,182 174,193 Z" fill="', SKIN, '"/>',
    '  <path d="M 246,240 L 178,190 M 251,236 L 196,186 M 256,232 L 215,183" stroke="#8a5a3c" stroke-width="2" opacity=".22" fill="none"/>',
    '  <ellipse cx="252" cy="238" rx="24" ry="17" fill="#7c5136" opacity=".3" filter="url(#', g, '-b3)" transform="rotate(-30 266 240)"/>',

    /* fingers, pinky→index so the index draws topmost; tips ON the buttons */
    '  <g class="j-f4">',
    '    <path d="M 233,185 C 231,177 230,169 231,161" fill="none" stroke="', SKIN_EDGE, '" stroke-width="20" stroke-linecap="round"/>',
    '    <path d="M 233,185 C 231,177 230,169 231,161" fill="none" stroke="', SKIN, '" stroke-width="16" stroke-linecap="round"/>',
    '  </g>',
    '  <g class="j-f3">',
    '    <path d="M 214,180 C 210,170 208,159 208,150" fill="none" stroke="', SKIN_EDGE, '" stroke-width="23" stroke-linecap="round"/>',
    '    <path d="M 214,180 C 210,170 208,159 208,150" fill="none" stroke="', SKIN, '" stroke-width="19" stroke-linecap="round"/>',
    '  </g>',
    '  <g class="j-f2">',
    '    <path d="M 194,182 C 188,170 185,156 185,144" fill="none" stroke="', SKIN_EDGE, '" stroke-width="24" stroke-linecap="round"/>',
    '    <path d="M 194,182 C 188,170 185,156 185,144" fill="none" stroke="', SKIN, '" stroke-width="20" stroke-linecap="round"/>',
    '    <ellipse cx="185" cy="148" rx="4.4" ry="3.3" fill="', NAIL, '" opacity=".6" transform="rotate(80 182 142)"/>',
    '  </g>',
    '  <g class="j-f1">',
    '    <path d="M 174,186 C 168,174 166,162 166,152" fill="none" stroke="', SKIN_EDGE, '" stroke-width="23" stroke-linecap="round"/>',
    '    <path d="M 174,186 C 168,174 166,162 166,152" fill="none" stroke="', SKIN, '" stroke-width="19" stroke-linecap="round"/>',
    '    <ellipse cx="166" cy="156" rx="4.4" ry="3.3" fill="', NAIL, '" opacity=".65" transform="rotate(75 165 152)"/>',
    '  </g>',

    /* knuckle highlights + rim light along the top contour */
    '  <circle cx="176" cy="189" r="3.4" fill="', SKIN_HI, '" opacity=".32"/>',
    '  <circle cx="196" cy="185" r="3.2" fill="', SKIN_HI, '" opacity=".3"/>',
    '  <circle cx="216" cy="183" r="3" fill="', SKIN_HI, '" opacity=".28"/>',
    '  <circle cx="234" cy="188" r="2.7" fill="', SKIN_HI, '" opacity=".26"/>',
    '  <path d="M 270,234 C 256,212 240,196 222,186" fill="none" stroke="', RIM, '" stroke-width="2.4" stroke-linecap="round" opacity=".35"/>',
    '  <path d="M 171,183 C 166,172 164,161 165,153" fill="none" stroke="', RIM, '" stroke-width="2" stroke-linecap="round" opacity=".3"/>',

    /* sweat: sheen, two fixed glints, one sliding bead, one flick particle */
    '  <ellipse class="j-sheen" cx="228" cy="210" rx="30" ry="20" fill="#fff" opacity=".06" transform="rotate(-25 228 210)"/>',
    '  <circle cx="228" cy="204" r="1.8" fill="#e8f4ff" opacity=".5"/>',
    '  <circle cx="244" cy="222" r="1.5" fill="#e8f4ff" opacity=".42"/>',
    '  <circle class="j-bead" cx="228" cy="198" r="2.4" fill="#dff1ff" opacity="0"/>',
    '  <circle class="j-flick" cx="0" cy="0" r="2.6" fill="#dff1ff" opacity="0"/>',
    '</g>',

    /* REC lamp chip */
    '<g class="j-rec" font-family="ui-monospace,Menlo,monospace" font-size="13">',
    '  <circle class="j-recglow" cx="399" cy="26" r="10" fill="#ff4438" opacity="0" filter="url(#', g, '-b3)"/>',
    '  <circle class="j-recdot" cx="399" cy="26" r="5.5" fill="#3a3a3a" opacity=".6"/>',
    '  <text class="j-rectxt" x="412" y="31" fill="#8a8a8a" opacity=".5" letter-spacing="2">REC</text>',
    '</g>',
    '</svg>'
    ].join('');
  }

  /* ── mount ───────────────────────────────────────────────────────────────── */
  function mount(container, opts){
    opts = opts || {};
    injectCss();
    var id = ++UID;
    container.classList.add('prh-root');
    container.style.containerType = 'inline-size';   /* cqw caption sizing */
    container.innerHTML = svgMarkup(id);
    if (opts.caption !== false){
      var cap = document.createElement('div');
      cap.className = 'prh-caption';
      cap.textContent = 'reenactment — the real one was sweatier.';
      container.appendChild(cap);
    }
    var q = function(s){ return container.querySelector(s); };
    var el = {
      mouse: q('.j-mouse'), hand: q('.j-hand'), csh: q('.j-csh'),
      f1: q('.j-f1'), f2: q('.j-f2'), f3: q('.j-f3'), f4: q('.j-f4'), th: q('.j-th'),
      rips: container.querySelectorAll('.j-rip'),
      sheen: q('.j-sheen'), bead: q('.j-bead'), flick: q('.j-flick'),
      recglow: q('.j-recglow'), recdot: q('.j-recdot'), rectxt: q('.j-rectxt'),
      rec: q('.j-rec'),
    };
    if (opts.recLamp === false) el.rec.style.display = 'none';

    var clicks = [];   /* [{t, kind}] sorted by t */

    function setClicks(list){
      clicks = (list || []).slice().sort(function(a, b){ return a.t - b.t; });
    }

    /* PURE render: every visual derived from (t, clicks) alone.
       Finger rotation sign: fingers point up-left, so NEGATIVE rotation
       flexes the tip down into the button; POSITIVE extends it off.       */
    function render(t){
      var hx = 0, hy = 0, hr = 0, dip = 0, lift = 0;
      var f1 = 0, f2 = 0, f3 = 0, f4 = 0, th = 0;
      var recording = false;
      var rings = [];               /* {r, op, color} */
      var flick = null;

      /* idle breathing — pure of the clock */
      hy += 0.6 * Math.sin(t * 0.0007);

      for (var i = 0; i < clicks.length; i++){
        var c = clicks[i], ph = t - c.t;
        if (ph >= 0 && c.kind === 'start') recording = true;
        if (ph >= 0 && c.kind === 'stop')  recording = false;
        if (ph < -PRE || ph > 2600) continue;

        /* approach tension */
        var preW = (c.kind === 'stop') ? 250 : PRE;
        if (ph < 0 && ph >= -preW){
          var k = easeIO((ph + preW) / preW);
          hy += 1.6 * k; f1 -= 2.5 * k; dip += 0.4 * k;
          if (c.kind === 'arm'){          /* the nervous tremor */
            var amp = 1.4 * k;
            hx += Math.sin(ph * 0.09) * amp;
            hy += Math.cos(ph * 0.067) * amp * 0.7;
          }
        }

        /* the press */
        var hold = HOLD[c.kind] || 60;
        var p = pressEnv(ph, hold);
        f1 -= 9.5 * p; f2 -= 2 * p; dip += 2.2 * p; hy += 1.2 * p;

        /* ripples: arm gets a double ring */
        var nRings = (c.kind === 'arm') ? 2 : 1;
        for (var r = 0; r < nRings; r++){
          var rs = ph - r * RIP_GAP;
          if (rs >= 0 && rs <= RIP_DUR){
            var s = rs / RIP_DUR;
            rings.push({ r: 8 + 44 * easeOut(s), op: (1 - s) * 0.85, color: RIPPLE[c.kind] });
          }
        }

        /* the exhale: lift + splay + the sweat flick */
        if (c.kind === 'stop'){
          var re = ph - (ATTACK + hold);
          if (re > 0 && re < RELAX){
            var b = Math.sin(clamp01(re / RELAX) * Math.PI);
            lift = Math.max(lift, b);
            hy -= 7 * b; hr -= 2.2 * b;
            f1 += 8 * b; f2 += 5 * b; f3 += 4 * b; f4 += 6 * b; th -= 4 * b;
          }
          if (ph >= 130 && ph <= 950 && flick === null){
            var fs = (ph - 130) / 820;
            flick = { x: 248 + 54 * fs, y: 202 - 42 * fs + 76 * fs * fs,
                      r: 2.6 * (1 - 0.3 * fs), op: 0.9 * (1 - fs) };
          }
        }
      }

      /* apply — attribute transforms only, no CSS animation anywhere */
      el.hand.setAttribute('transform', 'translate(' + hx.toFixed(2) + ',' + hy.toFixed(2) +
        ') rotate(' + hr.toFixed(2) + ' 224 218)');
      el.mouse.setAttribute('transform', 'translate(200,' + (196 + dip).toFixed(2) + ') rotate(-14)');
      el.f1.setAttribute('transform', 'rotate(' + f1.toFixed(2) + ' 174 186)');
      el.f2.setAttribute('transform', 'rotate(' + f2.toFixed(2) + ' 194 182)');
      el.f3.setAttribute('transform', 'rotate(' + f3.toFixed(2) + ' 214 180)');
      el.f4.setAttribute('transform', 'rotate(' + f4.toFixed(2) + ' 233 185)');
      el.th.setAttribute('transform', 'rotate(' + th.toFixed(2) + ' 192 240)');
      el.csh.setAttribute('opacity', (0.3 - 0.22 * lift).toFixed(3));

      for (var j = 0; j < el.rips.length; j++){
        var ring = rings[j];
        if (ring){
          el.rips[j].setAttribute('r', ring.r.toFixed(1));
          el.rips[j].setAttribute('opacity', ring.op.toFixed(3));
          el.rips[j].setAttribute('stroke', ring.color);
        } else {
          el.rips[j].setAttribute('opacity', '0');
        }
      }

      /* ambient sweat: a bead slides down the back of the hand every 9s */
      var sp = (t % 9000 + 9000) % 9000 / 9000;
      if (sp < 0.6){
        var q2 = sp / 0.6;
        el.bead.setAttribute('cx', (224 + 16 * q2).toFixed(1));
        el.bead.setAttribute('cy', (196 + 26 * q2).toFixed(1));
        el.bead.setAttribute('opacity', (0.55 * Math.sin(q2 * Math.PI)).toFixed(3));
      } else {
        el.bead.setAttribute('opacity', '0');
      }
      el.sheen.setAttribute('opacity', (0.055 + 0.03 * Math.sin(t * 0.0011)).toFixed(3));

      if (flick){
        el.flick.setAttribute('cx', flick.x.toFixed(1));
        el.flick.setAttribute('cy', flick.y.toFixed(1));
        el.flick.setAttribute('r', flick.r.toFixed(2));
        el.flick.setAttribute('opacity', flick.op.toFixed(3));
      } else {
        el.flick.setAttribute('opacity', '0');
      }

      /* REC lamp: blinking while recording — derived from the same clock */
      if (recording){
        var on = (Math.floor(t / 650) % 2) === 0;
        el.recdot.setAttribute('fill', '#ff4438');
        el.recdot.setAttribute('opacity', on ? '0.95' : '0.45');
        el.recglow.setAttribute('opacity', on ? '0.5' : '0.12');
        el.rectxt.setAttribute('fill', '#ffb0aa');
        el.rectxt.setAttribute('opacity', on ? '0.9' : '0.55');
      } else {
        el.recdot.setAttribute('fill', '#3a3a3a');
        el.recdot.setAttribute('opacity', '0.6');
        el.recglow.setAttribute('opacity', '0');
        el.rectxt.setAttribute('fill', '#8a8a8a');
        el.rectxt.setAttribute('opacity', '0.5');
      }
    }

    render(0);
    return { root: container, setClicks: setClicks, render: render };
  }

  window.PRHand = { mount: mount };
})();
