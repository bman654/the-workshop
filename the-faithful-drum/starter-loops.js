/* ============================================================================
   starter-loops.js — the five parametric STARTER LOOPS for The Faithful Drum.

   FINAL (foundry synthesis) — "the animator's hand". Each loop is drawn as warm
   ink with a TAPERED-BRUSH feel: strokes swell in the belly and thin at the
   ends, so the line has the weight of a real animation exercise rather than a
   wire diagram. The timing is the point — a squash/anticipation/stretch ball, an
   eased bloom with a breathing sway, a weight-shifted walk with heel plant, and
   a wingbeat with follow-through on the primaries. The HORSE is a confident
   filled-silhouette gallop (barrel + chest + haunch + eared head + streaming
   tail) with a gather→extension gait — grafted in from a stronger take and
   given beefier legs + a dim far-leg pair so near/far read cleanly at slice
   scale.

   API — each loop is  fn(ctx, t)  where:
     ctx : a 2D context for ONE frame bitmap, sized L.W × L.H (144 × 220).
           Origin top-left. Draw the pose for phase t.
     t   : phase ∈ [0,1). Frame i uses t = i / 12. fn(ctx,0) and the limit as
           t→1 register as one seamless loop.
   ============================================================================ */
"use strict";
(function (root) {
  var W = 144, H = 220, CX = W / 2, GROUND = H - 26;
  var TAU = Math.PI * 2;

  /* ---- ink palette ---- */
  var GOLD = '#f4d27a', COOL = '#6fb2c9', GREEN = '#9ad06f',
      ROSE = '#c96f9a', CREAM = '#e8e0cf';

  /* small eases */
  function easeInOut(x){ return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2, 2)/2; }

  /* ---------------------------------------------------------------------------
     taperStroke(ctx, pts, w0, w1, color, opts)
     Draws a variable-width "brush" stroke along a polyline of {x,y} points.
     Width interpolates from w0 (start) to w1 (end) along arc length; a `belly`
     option (0..1) fattens the middle so a single lash reads as a loaded brush.
     Implemented by outlining the two offset edges and filling — gives clean
     tapered nibs that a plain lineWidth cannot. --------------------------------*/
  function taperStroke(ctx, pts, w0, w1, color, opts){
    opts = opts || {};
    var belly = opts.belly == null ? 0 : opts.belly;
    var n = pts.length;
    if (n < 2) return;
    // cumulative arc length for parameterization
    var len = [0], total = 0;
    for (var i = 1; i < n; i++){
      var dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
      total += Math.hypot(dx, dy); len.push(total);
    }
    if (total < 1e-4) total = 1e-4;
    // per-point half-width and unit normal (averaged from adjacent segments)
    var L = [], R = [];
    for (var j = 0; j < n; j++){
      var u = len[j] / total;                       // 0..1 along stroke
      var w = w0 + (w1 - w0) * u;
      w += belly * Math.sin(Math.PI * u) * (0.5 * (w0 + w1) + 1.5);
      var hw = Math.max(0.25, w * 0.5);
      // tangent
      var pa = pts[Math.max(0, j-1)], pb = pts[Math.min(n-1, j+1)];
      var tx = pb.x - pa.x, ty = pb.y - pa.y, tl = Math.hypot(tx, ty) || 1;
      var nx = -ty / tl, ny = tx / tl;              // left normal
      L.push({ x: pts[j].x + nx * hw, y: pts[j].y + ny * hw });
      R.push({ x: pts[j].x - nx * hw, y: pts[j].y - ny * hw });
    }
    ctx.beginPath();
    ctx.moveTo(L[0].x, L[0].y);
    for (var a = 1; a < n; a++) ctx.lineTo(L[a].x, L[a].y);
    for (var b = n - 1; b >= 0; b--) ctx.lineTo(R[b].x, R[b].y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /* sample a cubic-ish arc (quadratic) into points for taperStroke */
  function quadPts(x0,y0, cx,cy, x1,y1, steps){
    steps = steps || 10; var out = [];
    for (var i = 0; i <= steps; i++){
      var u = i/steps, iu = 1-u;
      out.push({ x: iu*iu*x0 + 2*iu*u*cx + u*u*x1,
                 y: iu*iu*y0 + 2*iu*u*cy + u*u*y1 });
    }
    return out;
  }
  function linePts(x0,y0,x1,y1){ return [{x:x0,y:y0},{x:x1,y:y1}]; }

  /* a soft cast shadow ellipse on the ground line */
  function groundShadow(ctx, x, y, rx, alpha){
    ctx.save();
    ctx.fillStyle = 'rgba(201,162,74,' + alpha + ')';
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.22, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------------------------------------------------------------------------
     HORSE-SILHOUETTE helpers (grafted with the horse). A Catmull-Rom brush
     (spine points carry their own width) and a smooth CLOSED filled silhouette
     give the horse real mass, which a limb-only taperStroke gallop could not. */
  // A tapered filled brushstroke through spine points [{x,y,w}]; the polyline of
  // centres is smoothed to a Catmull-Rom curve and offset ±w/2 along the normal.
  function brush(ctx, pts, color) {
    if (pts.length < 2) return;
    var n = pts.length, spine = [];
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[i > 0 ? i - 1 : i], p1 = pts[i], p2 = pts[i + 1],
          p3 = pts[i + 2 < n ? i + 2 : i + 1];
      var steps = 6;
      for (var s = 0; s < steps; s++) {
        var u = s / steps, u2 = u * u, u3 = u2 * u;
        var x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * u +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
        var y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * u +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);
        var w = p1.w + (p2.w - p1.w) * u;
        spine.push({ x: x, y: y, w: w });
      }
    }
    spine.push({ x: pts[n - 1].x, y: pts[n - 1].y, w: pts[n - 1].w });
    var m = spine.length, left = [], right = [];
    for (var j = 0; j < m; j++) {
      var a = spine[Math.max(0, j - 1)], b = spine[Math.min(m - 1, j + 1)];
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len, hw = spine[j].w / 2;
      left.push({ x: spine[j].x + nx * hw, y: spine[j].y + ny * hw });
      right.push({ x: spine[j].x - nx * hw, y: spine[j].y - ny * hw });
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (var k = 1; k < m; k++) ctx.lineTo(left[k].x, left[k].y);
    for (var q = m - 1; q >= 0; q--) ctx.lineTo(right[q].x, right[q].y);
    ctx.closePath();
    ctx.fill();
  }

  // round ink dot (nib press, eye)
  function dot(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  // a smooth CLOSED filled silhouette through {x,y} points via a Catmull-Rom loop
  function fillShape(ctx, pts, color) {
    var n = pts.length;
    if (n < 3) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i],
          p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (var s = 1; s <= 8; s++) {
        var u = s / 8, u2 = u * u, u3 = u2 * u;
        var x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * u +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
        var y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * u +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  /* =========================================================================
     BALL — anticipation squash → stretch launch → float → stretch fall →
     impact squash. A single loop of a bounce with real timing curves.
     =======================================================================*/
  function ball(ctx, t){
    var R = 21;
    var x = CX;
    // One CONTINUOUS bounce per loop, ground contact at t=0 (and t→1) so the
    // seam lands exactly on the impact — no hitch. Parabolic height gives the
    // natural "fast past the ground, hang at the apex" gravity feel:
    //   phase p = distance from the nearest ground contact, in [0,1]
    // p=0 at t=0 and t=1 (contact), p=1 at t=0.5 (apex).
    var p = 1 - Math.abs(2 * t - 1);               // 0→1→0 (triangle)
    var hgt = (1 - (1 - p) * (1 - p)) * (H * 0.60); // parabola: hangs at apex
    // vertical speed ~ derivative → fast near ground (small p), slow at apex
    var speed = (1 - p);                            // 1 at ground, 0 at apex
    var rising = t < 0.5;                           // launch vs fall

    // squash sharply only within the contact window; stretch while airborne+fast
    var contact = Math.pow(Math.max(0, 1 - p * 8), 2);   // spike near p=0
    var stretchAmt = speed * (1 - contact);
    var sq = 1 + contact * 0.55 - stretchAmt * 0.14;     // wide when squashed
    var st = 1 - contact * 0.50 + stretchAmt * 0.30;     // tall when stretched
    var rx = R * sq, ry = R * st;
    var y = GROUND - R - hgt + (R - ry);            // keep the BASE on the arc
    var tilt = 0;                                   // vertical bounce, no lean

    // shadow: tight & dark at ground, wide & faint at apex
    var near = 1 - p;
    groundShadow(ctx, CX, GROUND + 3, R * (0.5 + near * 0.75), 0.04 + near * 0.18);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    var grad = ctx.createRadialGradient(-rx*0.3, -ry*0.35, 1, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0, 'rgba(255,255,255,.85)');
    grad.addColorStop(0.35, COOL);
    grad.addColorStop(1, 'rgba(58,120,140,.95)');
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fillStyle = grad; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(30,70,84,.9)'; ctx.stroke();
    ctx.restore();

    // speed-lines trailing behind the direction of travel while fast & airborne
    if (speed > 0.45 && hgt > 24 && contact < 0.05){
      var dir = rising ? 1 : -1;                    // trail below when rising, above when falling
      ctx.strokeStyle = 'rgba(111,178,201,' + (0.10 + speed*0.16) + ')';
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      for (var k = -1; k <= 1; k++){
        ctx.beginPath();
        ctx.moveTo(x + k*7, y + dir*(ry+3));
        ctx.lineTo(x + k*7, y + dir*(ry + 12 + speed*10));
        ctx.stroke();
      }
    }
  }

  /* =========================================================================
     HORSE — a galloping horse in profile with a CONFIDENT FILLED SILHOUETTE
     (long barrel, chest + haunch, eared head on a reaching neck, streaming tail)
     and a real 4-beat gallop gait: hind legs gather & thrust, fore legs reach &
     catch, each limb FOLDING tight under the body in recovery and EXTENDING at
     strike. Grafted from a stronger take; legs beefed up to match the body mass
     and split into a DIM FAR pair (drawn behind the body) + a full-strength NEAR
     pair (drawn over it) so near/far read cleanly even in the thin strip slice.
     =======================================================================*/
  function horse(ctx, t){
    var a = t * TAU;
    var bob = Math.sin(a * 2) * 3;                 // body rocks 2×/stride
    var pitch = Math.sin(a) * 0.05;                // front-high on the leap
    var bx = CX - 2, by = H * 0.47 + bob;
    var cos = Math.cos(pitch), sin = Math.sin(pitch);
    function P(dx, dy){ return { x: bx + dx*cos - dy*sin, y: by + dx*sin + dy*cos }; }

    // one gallop leg: root → knee/hock → cannon → hoof. `far` dims + slims it and
    // is drawn BEHIND the barrel; near legs are drawn over it at full weight.
    function leg(rootx, rooty, ph, len, back, far){
      var s = a + ph;
      var swing = Math.sin(s);                     // +fore  −aft
      var fold = (Math.cos(s) + 1) / 2;            // 1 = tucked under, 0 = extended
      var reach = swing * (back ? 20 : 24);
      var kx = rootx + reach * 0.45 + (back ? -4 : 5);
      var ky = rooty + len * 0.5 - fold * 11;
      var hx = rootx + reach + (back ? -3 : 8);
      var hy = rooty + len - fold * (len * 0.6) + Math.abs(swing) * 3;
      // beefier than the source: thigh/forearm meatier, cannon carries more ink,
      // so the legs match the filled body instead of reading as wire.
      var col = far ? 'rgba(196,166,104,.55)' : GOLD;
      var k = far ? 0.82 : 1;                       // far legs a touch slimmer
      brush(ctx, [
        { x: rootx, y: rooty, w: (back ? 11 : 10) * k },  // thigh/forearm
        { x: kx, y: ky, w: (back ? 8 : 7.5) * k },        // knee/hock
        { x: hx, y: hy, w: 5 * k },                        // cannon
        { x: hx + swing * 3, y: hy + 4, w: 3.2 * k }       // hoof
      ], col);
    }
    var hipx = bx - 26, hipy = by + 10, shx = bx + 30, shy = by + 8, L = 46;

    // FAR pair first, behind the body (dim + slim): diagonal gallop phasing.
    leg(hipx + 3, hipy + 3, 0.35, L, true, true);          // far hind
    leg(shx - 3, shy + 3, Math.PI + 0.35, L, false, true); // far fore

    // ---- BODY: a long horse silhouette as a smooth closed fill --------------
    var out = [
      P(38, -14),   // withers / base of neck (front-top)
      P(26, -20),   // top of back dips toward croup
      P(4, -22),    // back
      P(-24, -18),  // croup (rump top)
      P(-40, -8),   // point of buttock (tail root)
      P(-34, 6),    // upper hind
      P(-20, 14),   // belly rear
      P(2, 18),     // belly low
      P(24, 16),    // belly front / girth
      P(38, 6),     // chest
      P(42, -6)     // shoulder front
    ];
    fillShape(ctx, out, GOLD);

    // ---- NECK + HEAD: reach up-forward, nodding with the stride --------------
    var nod = Math.sin(a) * 5;
    brush(ctx, [
      { x: bx + 38, y: by - 10, w: 18 },           // base of neck (into shoulder)
      { x: bx + 48, y: by - 22 + nod, w: 13 },
      { x: bx + 56, y: by - 32 + nod, w: 9 },       // poll
      { x: bx + 62, y: by - 28 + nod, w: 7 },       // jaw
      { x: bx + 67, y: by - 22 + nod, w: 4.5 }      // muzzle
    ], GOLD);
    // mane along the neck crest (a few short flicks trailing back)
    for (var mi = 0; mi < 4; mi++){
      var mf = mi / 3;
      var mx = bx + 40 + mf * 15, myv = by - 12 - mf * 18 + nod * mf;
      brush(ctx, [{ x: mx, y: myv, w: 3 }, { x: mx - 7, y: myv - 5, w: 1 }], GOLD);
    }
    // ear + eye
    brush(ctx, [{ x: bx + 55, y: by - 33 + nod, w: 3.5 }, { x: bx + 58, y: by - 41 + nod, w: 1.5 }], GOLD);
    dot(ctx, bx + 59, by - 28 + nod, 1.5, '#2a2016');

    // ---- TAIL: one clean sweeping brush, streaming + follow-through ---------
    var tailLag = Math.sin(a - 1.1);               // lags the body's motion
    brush(ctx, [
      { x: bx - 38, y: by - 8, w: 10 },            // dock
      { x: bx - 50, y: by - 2 + tailLag * 4, w: 8 },
      { x: bx - 58, y: by + 10 + tailLag * 9, w: 5.5 },
      { x: bx - 60, y: by + 24 + tailLag * 13, w: 3.5 },
      { x: bx - 57, y: by + 34 + tailLag * 16, w: 1.5 } // tip flick
    ], GOLD);

    // NEAR pair last, over the body at full weight.
    leg(hipx, hipy, 0.0, L, true, false);                   // near hind
    leg(shx, shy, Math.PI, L, false, false);                // near fore

    // ground shadow tracks the suspended moment (all legs up → faint)
    var allUp = (Math.max(0,Math.sin(a)) + Math.max(0,Math.sin(a+Math.PI)))*0.5;
    groundShadow(ctx, CX - 2, GROUND + 14, 34, 0.13 - allUp*0.06);
  }

  /* =========================================================================
     FLOWER — an eased bloom that overshoots slightly and settles, with a
     gentle breathing sway so a fully-open flower still "lives" on the loop.
     Stem grows, then petals unfurl; loops by easing closed near the end.
     =======================================================================*/
  function flower(ctx, t){
    // bloom cycle: a bud already stands at t=0 (min 0.18), grows+opens through
    // 0..0.5, breathes open 0.5..0.82, then eases back toward the bud by t→1 so
    // the loop seams (frame 12 ≈ frame 1). No dead/empty frames.
    var grow, open;
    var floor = 0.20;                                    // stem never fully retracts
    if (t < 0.5){ var u = t / 0.5; grow = floor + (1-floor)*easeInOut(u); open = easeInOut(u); }
    else if (t < 0.82){ grow = 1; open = 1 + Math.sin((t-0.5)/0.32*Math.PI)*0.06; }
    else { var v = (t - 0.82)/0.18; grow = 1 - easeInOut(v)*(1-floor); open = 1 - easeInOut(v); }

    var sway = Math.sin(t * TAU) * (3 + open*4);   // top sway
    var stemLen = 70 * grow;
    var topx = CX + sway, topy = GROUND - stemLen;

    // ground tuft
    taperStroke(ctx, linePts(CX-10, GROUND+1, CX-4, GROUND-8*grow), 3, 0.5, GREEN);
    taperStroke(ctx, linePts(CX+11, GROUND+1, CX+5, GROUND-9*grow), 3, 0.5, GREEN);

    // stem — a swept taper from base to flowerhead
    taperStroke(ctx, quadPts(CX, GROUND, CX + sway*0.4, GROUND - stemLen*0.55, topx, topy, 12),
                6.5, 3, GREEN, {belly:0.15});
    // a leaf midway
    var ly = GROUND - stemLen*0.5;
    taperStroke(ctx, quadPts(CX + sway*0.3, ly, CX-18*grow, ly-6, CX-26*grow, ly+8, 10), 5, 0.5, GREEN, {belly:0.6});

    // petals: unfurl from closed bud to open star
    var petals = 6, R = 30 * open;
    for (var k = 0; k < petals; k++){
      var ang = -Math.PI/2 + k/petals * TAU;       // start pointing up
      var px = topx + Math.cos(ang) * R, py = topy + Math.sin(ang) * R;
      // each petal is a loaded lash from center outward
      taperStroke(ctx, quadPts(topx, topy,
                    topx + Math.cos(ang)*R*0.5 + Math.cos(ang+0.4)*4,
                    topy + Math.sin(ang)*R*0.5 + Math.sin(ang+0.4)*4,
                    px, py, 10),
                  Math.max(1, 7*open), 0.5, ROSE, {belly:0.9*open});
    }
    // center — swells with bloom
    ctx.beginPath(); ctx.arc(topx, topy, 4 + 5*open, 0, TAU);
    ctx.fillStyle = GOLD; ctx.fill();
    if (open > 0.5){
      ctx.beginPath(); ctx.arc(topx, topy, 2 + 2*open, 0, TAU);
      ctx.fillStyle = 'rgba(255,240,200,.9)'; ctx.fill();
    }
  }

  /* =========================================================================
     WALKER — a weight-shifted walk cycle: pelvis bobs (twice per stride),
     torso counter-rotates, arms swing opposite to legs, heel plants and the
     body rides over the planted foot. Loops over ONE full stride.
     =======================================================================*/
  function walker(ctx, t){
    var a = t * TAU;
    // two contact lows per stride → bob at 2×; highest at passing position
    var bob = -Math.abs(Math.cos(a)) * 6;
    var lean = Math.sin(a) * 0.06;                 // subtle torso sway
    var hipx = CX, hipy = H * 0.46 + bob;

    ctx.save();
    ctx.translate(hipx, hipy);
    ctx.rotate(lean);

    // ----- legs: thigh + shin, opposite phase; front leg reaches heel-first --
    function legPose(phase, far){
      var s = Math.sin(a + phase);                 // +fwd / -back at hip
      var stride = 22;
      var footx = s * stride;
      // lift the rear/swing foot; planted foot stays on ground
      var swing = Math.max(0, -Math.cos(a + phase));   // lifts mid-swing
      var footy = 58 - swing * 12;
      var kneex = footx * 0.5 + 2;
      var kneey = 30 - swing * 6;
      var col = far ? 'rgba(196,188,168,.5)' : CREAM;
      taperStroke(ctx, [{x:0,y:2},{x:kneex,y:kneey}], 6, 4, col);           // thigh
      taperStroke(ctx, [{x:kneex,y:kneey},{x:footx,y:footy}], 4, 2.4, col); // shin
      // foot
      taperStroke(ctx, [{x:footx,y:footy},{x:footx + (s>=0?7:-5), y:footy+2}], 2.6, 1, col);
    }
    legPose(Math.PI, true);   // far leg
    legPose(0, false);        // near leg

    // ----- spine + head, riding over the step -----
    var sx = 0, sy = 2, nx = Math.sin(a)*2, ny = -46;   // neck offset
    taperStroke(ctx, quadPts(sx, sy, nx*0.4, -22, nx, ny, 10), 9, 5, CREAM, {belly:0.2});
    // head
    ctx.beginPath(); ctx.arc(nx, ny - 9, 10, 0, TAU);
    ctx.fillStyle = CREAM; ctx.fill();

    // ----- arms swing opposite the legs -----
    function arm(phase){
      var s = Math.sin(a + phase);
      var shoulderx = nx*0.7, shouldery = ny + 12;
      var elbowx = shoulderx + s*10, elbowy = shouldery + 16;
      var handx = shoulderx + s*18, handy = shouldery + 30 - Math.abs(s)*3;
      taperStroke(ctx, [{x:shoulderx,y:shouldery},{x:elbowx,y:elbowy}], 4.5, 3.2, CREAM);
      taperStroke(ctx, [{x:elbowx,y:elbowy},{x:handx,y:handy}], 3.2, 1.6, CREAM);
    }
    arm(0);          // near arm swings with far leg → opposite of near leg
    arm(Math.PI);    // far arm

    ctx.restore();

    // shadow under planted foot region
    groundShadow(ctx, CX, GROUND + 6, 22, 0.12);
  }

  /* =========================================================================
     BIRD — a wingbeat with follow-through: down-stroke drives, up-stroke
     recovers with the primaries lagging (bent tip). Body bobs on the beat,
     tail fans on the down-stroke. Loops on ONE wingbeat.
     =======================================================================*/
  function bird(ctx, t){
    var a = t * TAU;
    // wing angle: down-stroke sharper than up-stroke (asymmetric power)
    var beat = Math.sin(a);
    var lift = -Math.cos(a) * 8;                    // body rises on downbeat
    var bx = CX, by = H * 0.46 + lift;

    // follow-through: tips lag the wing root by a phase
    var tipLag = Math.sin(a - 0.9);

    function wing(dir){                              // dir = +1 right, -1 left
      var rootx = bx + dir*6, rooty = by - 4;
      // mid & tip driven by beat, tip lags → the wing bends/whips
      var midAng = beat * 0.9;
      var tipAng = tipLag * 1.1;
      var midx = rootx + dir*26, midy = rooty - beat*22;
      var tipx = midx + dir*24, tipy = midy - tipLag*18 + 4;
      // arm (root→mid): loaded leading edge
      taperStroke(ctx, quadPts(rootx, rooty, rootx + dir*14, rooty - beat*16, midx, midy, 10),
                  6, 4, COOL, {belly:0.3});
      // hand/primaries (mid→tip): thins to a whip, splays a couple feathers
      taperStroke(ctx, quadPts(midx, midy, midx + dir*14, midy - tipLag*10, tipx, tipy, 10),
                  4, 0.5, COOL, {belly:0.2});
      // two trailing primary feathers on the down/recovery
      var spread = 0.4 + Math.max(0, -beat)*0.6;
      for (var f = -1; f <= 1; f++){
        taperStroke(ctx, linePts(midx, midy,
                     tipx - dir*4 + f*6*spread, tipy + 6 + Math.abs(f)*4),
                    2.4, 0.4, 'rgba(111,178,201,.75)');
      }
    }

    // body — a tucked ovoid, drawn as a loaded stroke pair
    taperStroke(ctx, quadPts(bx-14, by-2, bx, by-12, bx+16, by-2, 12), 5, 9, COOL, {belly:0.6}); // back
    taperStroke(ctx, quadPts(bx-14, by-2, bx, by+10, bx+16, by-2, 12), 9, 5, COOL, {belly:0.5}); // breast

    // wings behind/over body: far wing dimmer first
    ctx.save(); ctx.globalAlpha = 0.55; wing(-1); ctx.restore();  // far wing
    wing(1);                                                       // near wing

    // head + beak reaching forward
    taperStroke(ctx, quadPts(bx+14, by-4, bx+22, by-8, bx+26, by-6, 8), 6, 3, COOL);
    taperStroke(ctx, linePts(bx+26, by-6, bx+34, by-5), 2.6, 0.4, GOLD);   // beak
    // eye
    ctx.beginPath(); ctx.arc(bx+22, by-7, 1.3, 0, TAU); ctx.fillStyle='#0a0b10'; ctx.fill();

    // tail — fans on the downbeat
    var fan = 0.5 + Math.max(0, -beat)*0.5;
    for (var q = -1; q <= 1; q++){
      taperStroke(ctx, linePts(bx-12, by-1, bx-30, by + 6 + q*8*fan), 3.5, 0.5, COOL);
    }
  }

  root.Loops = {
    W: W, H: H,
    list: ['horse', 'ball', 'flower', 'walker', 'bird'],
    horse: horse, ball: ball, flower: flower, walker: walker, bird: bird
  };
})(typeof window !== 'undefined' ? window : this);
