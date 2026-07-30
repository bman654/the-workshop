/* ============================================================================
   render.js — the water, the ice, the sky, and the craft drawn on top of them.
   the-boathouse/

   TWO SURFACES, ONE CAMERA.  A WebGL2 fragment shader owns everything that is
   scenery: it builds a ray per pixel from the SAME basis the overlay projects
   with, hits the plane y = 0, and shades it as moving water or as wind-scoured
   ice.  A 2-D canvas over the top owns everything that is the exhibit: the
   craft, its wake, and the two force arrows painted flat on the surface as if
   somebody had drawn the diagram on the sea.

   The camera basis is hand-rolled ONCE, here, and handed to both — which is the
   only way to be sure the boat sits where the water says it does.  (A separate
   basis for a marched pass and a projected pass is a coin flip, and only half
   the frame tells you: see LANDMINES.)  `Sea.selfCheck()` pins the one case you
   can do by hand: looking down -Z, right must be +X and up must be +Y.

   The wind blows DOWN THE SCREEN, always.  The camera sits downwind of the boat
   and looks up into the weather, so "toward the horizon" is "toward the wind"
   and a beat to windward is a visible zig-zag up the picture.  Nothing else
   makes a windward leg legible.
   ============================================================================ */

const Sea = (function () {
  const S = {};

  /* ── camera ────────────────────────────────────────────────────────────── */
  function norm3(v) {
    const m = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / m, v[1] / m, v[2] / m];
  }
  function cross3(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /* World is (x, y) on the surface plus height h.  Render space is
     (X, Y, Z) = (x, h, y): Y up, so the surface is the plane Y = 0.        */
  S.w2r = (x, y, h) => [x, h || 0, y];

  S.makeCamera = function (eye, target, fovY, aspect) {
    const fwd = norm3([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]);
    const right = norm3(cross3(fwd, [0, 1, 0]));
    const up = cross3(right, fwd);
    return { eye, fwd, right, up, tan: Math.tan(fovY / 2), aspect, fovY };
  };

  /* Project a render-space point to CSS pixels.  z is the depth along fwd:
     anything with z <= near is behind the lens and must not be drawn.       */
  S.project = function (cam, p, W, H) {
    const d = [p[0] - cam.eye[0], p[1] - cam.eye[1], p[2] - cam.eye[2]];
    const z = dot3(d, cam.fwd);
    const f = (H / 2) / cam.tan;
    const inv = 1 / (z || 1e-6);
    return {
      x: W / 2 + dot3(d, cam.right) * inv * f,
      y: H / 2 - dot3(d, cam.up) * inv * f,
      z,
      s: f * inv,                       /* CSS px per world metre at this depth */
      ok: z > 0.35
    };
  };
  /* the same thing straight from world coordinates */
  S.pw = (cam, x, y, h, W, H) => S.project(cam, [x, h || 0, y], W, H);

  S.selfCheck = function () {
    const c = S.makeCamera([0, 0, 0], [0, 0, -1], 1.0, 1.5);
    const bad = [];
    if (Math.abs(c.right[0] - 1) > 1e-12 || Math.abs(c.right[1]) > 1e-12 || Math.abs(c.right[2]) > 1e-12)
      bad.push('right != +X for fwd = -Z (' + c.right.join(',') + ')');
    if (Math.abs(c.up[1] - 1) > 1e-12 || Math.abs(c.up[0]) > 1e-12 || Math.abs(c.up[2]) > 1e-12)
      bad.push('up != +Y for fwd = -Z (' + c.up.join(',') + ')');
    /* a point one metre dead ahead lands in the middle of the frame */
    const p = S.project(c, [0, 0, -1], 800, 600);
    if (Math.abs(p.x - 400) > 1e-9 || Math.abs(p.y - 300) > 1e-9) bad.push('centre projection off');
    /* and one metre to the right of that lands right of centre */
    const q = S.project(c, [1, 0, -1], 800, 600);
    if (!(q.x > 400)) bad.push('+X does not project right');
    const r = S.project(c, [0, 1, -1], 800, 600);
    if (!(r.y < 300)) bad.push('+Y does not project up');
    return bad;
  };

  /* ── the shader ────────────────────────────────────────────────────────── */
  const VERT = `#version 300 es
layout(location=0) in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2  uRes;
uniform vec3  uEye, uFwd, uRight, uUp;
uniform float uTan, uAspect;
uniform float uTime;
uniform vec2  uWind;        /* unit vector the wind BLOWS toward, in (x,y)     */
uniform float uWindSpeed;   /* m/s                                             */
uniform float uIce;         /* 0 water, 1 ice                                  */
uniform vec3  uSun;         /* unit, render space                              */
uniform float uDawn;        /* 0..1 how far up the sun is                      */

const float FAR = 2600.0;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.55);
  return fract(p.x * p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1,0));
  float c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return s;
}

/* ── the sky ──────────────────────────────────────────────────────────────
   A dawn gradient with a warm band low down where the sun is, plus a slab of
   thin cloud that the wind carries.  Reflections read this too.            */
vec3 skyColor(vec3 d, float ice){
  float h = clamp(d.y, -0.2, 1.0);
  vec3 zen   = mix(vec3(0.030,0.082,0.185), vec3(0.060,0.110,0.205), ice);
  vec3 mid   = mix(vec3(0.135,0.245,0.400), vec3(0.230,0.320,0.440), ice);
  vec3 horiz = mix(vec3(0.340,0.400,0.505), vec3(0.520,0.560,0.620), ice);
  vec3 c = mix(mid, zen, pow(clamp(h,0.0,1.0), 0.50));
  /* the pale band is kept LOW — a warm horizon smeared twenty degrees up the
     sky turns the whole frame, and the reflection in the whole sea, brown. */
  c = mix(horiz, c, smoothstep(-0.004, 0.105, h));

  /* the sun, low and off the bow, with its warmth pooled AROUND its own
     bearing rather than painted along the entire horizon */
  float sd = max(dot(d, uSun), 0.0);
  float lowband = 1.0 - smoothstep(-0.01, 0.20, h);
  c += mix(vec3(0.95,0.52,0.26), vec3(0.72,0.66,0.62), ice) * pow(sd, 3.0) * 0.55 * lowband;
  c += vec3(1.00,0.66,0.36) * pow(sd, 40.0) * 0.55;
  c += vec3(1.00,0.86,0.62) * pow(sd, 3000.0) * 5.5;

  /* cloud: thin banded stuff drifting with the wind, only above the horizon */
  if (d.y > 0.002){
    vec2 cp = d.xz / max(d.y, 0.02) * 0.020;
    cp -= uWind * uTime * 0.010 * max(uWindSpeed, 2.0);
    float f = fbm(cp * vec2(1.0, 2.4));
    float cover = smoothstep(0.50, 0.88, f) * smoothstep(0.0, 0.20, d.y);
    vec3 cc = mix(vec3(0.20,0.24,0.33), vec3(1.00,0.72,0.46), pow(sd, 2.2) * 0.95 + 0.14);
    c = mix(c, cc, cover * (0.60 - 0.20 * ice));
  }
  return c;
}

/* ── the wind ON the surface ──────────────────────────────────────────────
   Cat's paws: a slow noise field advected downwind.  Where it is high the
   surface is ruffled by small chop, which scatters and reads DARKER and more
   matte than the glassy water beside it.  This is the only honest way to draw
   wind, and it is also what a sailor actually looks at.                     */
float gust(vec2 p){
  vec2 q = p * 0.026 - uWind * (uTime * uWindSpeed * 0.55 * 0.026);
  float g = fbm(q * vec2(1.0, 0.42));       /* stretched into streaks downwind */
  return smoothstep(0.42, 0.78, g);
}

/* wave height field.  Pure sine trains read as regular horizontal BANDS at a
   grazing angle — they look like a venetian blind, not like water — so every
   train is multiplied by a slow noise envelope that walks downwind, which is
   what makes crests come and go along their own length.  The small scales
   carry most of the LOOK; the long swell only carries the motion.          */
float waveH(vec2 p, float lod){
  float t = uTime;
  float amp = 0.030 + 0.0265 * uWindSpeed;
  vec2 w = uWind;
  vec2 wa = vec2(w.x * 0.91 - w.y * 0.42, w.x * 0.42 + w.y * 0.91);
  vec2 wb = vec2(w.x * 0.88 + w.y * 0.47, -w.x * 0.47 + w.y * 0.88);
  vec2 wc = vec2(-w.y, w.x);
  float env = 0.45 + 0.85 * vnoise(p * 0.055 - w * t * 0.35);
  float h = 0.0;
  h += sin(dot(p, w  * 0.30) - t * 1.30) * amp * 1.00 * env;
  h += sin(dot(p, wa * 0.52) - t * 1.75) * amp * 0.70 * (1.4 - 0.5 * env);
  h += sin(dot(p, wb * 0.87) - t * 2.30) * amp * 0.46 * env;
  h += sin(dot(p, wc * 1.35) - t * 1.05) * amp * 0.16;
  float g = gust(p);
  /* the chop: this is the texture you actually read as water */
  h += (vnoise(p * 1.9  - w * t * 1.5) - 0.5) * amp * 2.4 * (0.28 + 0.9 * g) * lod;
  h += (vnoise(p * 4.6  - w * t * 2.6) - 0.5) * amp * 1.3 * (0.22 + 1.0 * g) * lod;
  h += (vnoise(p * 11.0 - w * t * 4.4) - 0.5) * amp * 0.55 * (0.18 + 1.0 * g) * lod;
  return h;
}

vec3 waterNormal(vec2 p, float lod){
  float e = 0.055 + 1.30 * (1.0 - lod);
  float h  = waveH(p, lod);
  float hx = waveH(p + vec2(e, 0.0), lod);
  float hy = waveH(p + vec2(0.0, e), lod);
  vec3 n = normalize(vec3(-(hx - h) / e, 1.0, -(hy - h) / e));
  return normalize(mix(vec3(0.0,1.0,0.0), n, lod));
}

/* ice: nearly flat, with wind-blown snow drift and a few old cracks         */
vec3 iceNormal(vec2 p, float lod, out float snow, out float crack){
  vec2 w = uWind;
  vec2 al = vec2(dot(p, w), dot(p, vec2(-w.y, w.x)));
  float d = fbm(vec2(al.x * 0.030, al.y * 0.62));       /* streaked with the wind */
  snow = smoothstep(0.45, 0.80, d) * lod;
  float e = 0.35;
  float h  = d * 0.028;
  float hx = fbm(vec2((al.x + e) * 0.030, al.y * 0.62)) * 0.028;
  float hy = fbm(vec2(al.x * 0.030, (al.y + e) * 0.62)) * 0.028;
  vec3 n = normalize(vec3(-(hx - h) / e, 1.0, -(hy - h) / e));
  float c = fbm(p * 0.055 + 31.0);
  crack = (1.0 - smoothstep(0.0, 0.030, abs(c - 0.5))) * lod;
  return normalize(mix(vec3(0.0,1.0,0.0), n, lod * 0.8));
}

void main(){
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  vec3 dir = normalize(uFwd + uRight * (uv.x * uTan * uAspect) + uUp * (uv.y * uTan));

  vec3 col;
  if (dir.y > -0.0016){
    col = skyColor(dir, uIce);
  } else {
    float t = -uEye.y / dir.y;
    vec3 P = uEye + dir * t;
    vec2 p = P.xz;
    float dist = t;
    /* fade the fine detail out with distance instead of aliasing it */
    float lod = clamp(1.0 - (dist - 34.0) / 330.0, 0.015, 1.0);

    vec3 N; vec3 base; float rough; float foam = 0.0;
    if (uIce > 0.5){
      float snow, crack;
      N = iceNormal(p, lod, snow, crack);
      base = mix(vec3(0.30,0.38,0.47), vec3(0.86,0.90,0.95), snow);
      base = mix(base, vec3(0.13,0.20,0.28), crack * 0.8);
      rough = mix(0.045, 0.55, snow);
    } else {
      N = waterNormal(p, lod);
      float g = gust(p);
      base = mix(vec3(0.014,0.042,0.062), vec3(0.026,0.058,0.072), g);
      rough = mix(0.016, 0.15, g);
      /* whitecaps once it is really blowing: on the steep windward faces */
      float steep = clamp((1.0 - N.y) * 26.0, 0.0, 1.0);
      float wc = smoothstep(7.0, 13.0, uWindSpeed);
      foam = smoothstep(0.55, 0.95, steep * (0.35 + 0.9 * g)) * wc * lod;
    }

    vec3 V = -dir;
    vec3 R = reflect(dir, N);
    R.y = abs(R.y) * 0.55 + R.y * 0.45;             /* keep it off the sea bed */
    vec3 refl = skyColor(normalize(R), uIce);

    float f0 = uIce > 0.5 ? 0.035 : 0.020;
    float fres = f0 + (1.0 - f0) * pow(1.0 - max(dot(N, V), 0.0), 5.0);

    /* sun glitter: a rough specular whose lobe widens where it is ruffled */
    vec3 H = normalize(uSun + V);
    float sh = mix(4200.0, 90.0, rough);
    float spec = pow(max(dot(N, H), 0.0), sh) * (uIce > 0.5 ? 1.4 : 3.4);

    col = mix(base, refl, clamp(fres * (uIce > 0.5 ? 5.0 : 2.6), 0.0, 1.0));
    col += vec3(1.00,0.80,0.56) * spec * (0.35 + 0.40 * uDawn);
    col = mix(col, vec3(0.92,0.94,0.96), foam * 0.85);

    /* haze into the horizon */
    float hz = 1.0 - exp(-dist / 760.0);
    col = mix(col, skyColor(normalize(vec3(dir.x, 0.004, dir.z)), uIce), clamp(hz, 0.0, 0.97));
  }

  /* Reinhard, so the sun cannot take the frame with it.  Without this the
     glitter path and the sky both clip to white and the sea goes with them. */
  col = col / (1.0 + col * 0.62);
  col = pow(max(col, 0.0), vec3(0.92));

  /* an interleaved-gradient dither: banding in a dawn sky is very visible */
  float d = fract(52.9829189 * fract(0.06711056 * gl_FragCoord.x + 0.00583715 * gl_FragCoord.y));
  col += (d - 0.5) / 255.0 * 1.6;
  outColor = vec4(max(col, 0.0), 1.0);
}`;

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error('shader: ' + gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  S.initGL = function (canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false });
    if (!gl) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    for (const n of ['uRes', 'uEye', 'uFwd', 'uRight', 'uUp', 'uTan', 'uAspect',
                     'uTime', 'uWind', 'uWindSpeed', 'uIce', 'uSun', 'uDawn']) {
      u[n] = gl.getUniformLocation(prog, n);
    }
    return { gl, prog, vao, u };
  };

  S.drawSea = function (R, cam, p) {
    const { gl, prog, vao, u } = R;
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(u.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform3fv(u.uEye, cam.eye);
    gl.uniform3fv(u.uFwd, cam.fwd);
    gl.uniform3fv(u.uRight, cam.right);
    gl.uniform3fv(u.uUp, cam.up);
    gl.uniform1f(u.uTan, cam.tan);
    gl.uniform1f(u.uAspect, cam.aspect);
    gl.uniform1f(u.uTime, p.time);
    gl.uniform2f(u.uWind, p.windX, p.windY);
    gl.uniform1f(u.uWindSpeed, p.windSpeed);
    gl.uniform1f(u.uIce, p.ice ? 1 : 0);
    gl.uniform3fv(u.uSun, p.sun);
    gl.uniform1f(u.uDawn, p.dawn);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* ── the craft, drawn on the 2-D layer ─────────────────────────────────── */
  /* Everything below is in BOAT coordinates: +u forward along the bow, +v to
     port, +w up.  heel rotates about the fore-aft axis, positive to leeward.  */

  function boatToWorld(st, u, v, w, heelSign) {
    const hl = st.heel * (heelSign === undefined ? 1 : heelSign);
    /* heel tips the mast to leeward: rotate (v, w) about the u axis */
    const ch = Math.cos(hl), sh = Math.sin(hl);
    const v2 = v * ch - w * sh;
    const w2 = v * sh + w * ch;
    const cp = Math.cos(st.psi), sp = Math.sin(st.psi);
    return [st.x + u * cp - v2 * sp, st.y + u * sp + v2 * cp, w2];
  }

  function poly(ctx, cam, st, pts, W, H, heelSign) {
    ctx.beginPath();
    let any = false;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const wpt = boatToWorld(st, p[0], p[1], p[2], heelSign);
      const s = S.pw(cam, wpt[0], wpt[1], wpt[2], W, H);
      if (!s.ok) return false;
      if (!any) { ctx.moveTo(s.x, s.y); any = true; } else ctx.lineTo(s.x, s.y);
    }
    return any;
  }

  /* The boom runs aft and to LEEWARD, and the cloth bellies out perpendicular
     to it, also to leeward.  With the wind on the port side (side = +1) leeward
     is -v, so:
         boom  b = (-cos s,  -side sin s)
         belly p = ( sin s,  -side cos s)      (b . p = 0, p points to leeward)
     Getting these two signs right is the whole of drawing a sail; everything
     else is a triangle.                                                      */
  function sailBasis(st, side) {
    const s = st.sheet;
    return { bU: -Math.cos(s), bV: -side * Math.sin(s),
             pU: Math.sin(s), pV: -side * Math.cos(s) };
  }

  function sailShape(craft, st, side, flap, phase) {
    const rig = craft.rig;
    const mastU = rig.boom * 0.42;               /* mast a little forward of centre */
    const foot = rig.boom, luff = rig.luff;
    const { bU, bV, pU, pV } = sailBasis(st, side);
    const camber = rig.camber * foot * (1 - 0.80 * flap);
    const grid = [];
    const NH = 6, NV = 8;
    for (let j = 0; j < NV; j++) {
      const tv = j / (NV - 1);
      const chord = foot * (1 - 0.70 * tv * tv);   /* head much narrower than foot */
      const row = [];
      for (let i = 0; i < NH; i++) {
        const tu = i / (NH - 1);
        const along = chord * tu;
        /* a parabolic belly, deepest a third of the way back, flatter aloft */
        let belly = camber * 3.6 * tu * (1 - tu) * (1 - 0.45 * tv);
        /* and when it luffs, the whole leech shakes */
        if (flap > 0.001) belly += flap * 0.30 * chord * tu * Math.sin(phase * 7.4 + tv * 2.6 - tu * 3.1);
        row.push([mastU + bU * along + pU * belly, bV * along + pV * belly, luff * tv]);
      }
      grid.push(row);
    }
    return grid;
  }

  S.drawCraft = function (ctx, cam, craft, st, f, W, H, opts) {
    opts = opts || {};
    const side = f && f.side < 0 ? -1 : 1;        /* +1 wind from port */
    /* st.heel is already signed: positive tips the masthead to starboard, which
       is to leeward when the wind is on the port side.  Nothing to flip here. */
    const heelSign = 1;
    const flap = f ? f.luff : 0;
    const phase = opts.phase || 0;
    const ice = craft.ground.mode === 'ice';
    const ink = 'rgba(9,14,20,';

    /* ── hull ── */
    const L = ice ? 5.4 : 4.2, B = ice ? 0.62 : 1.62;
    const hull = [];
    const NS = 16;
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, x = (t - 0.42) * L;
      const k = 1 - Math.pow(Math.abs(x) / (L * 0.58), ice ? 1.7 : 2.1);
      hull.push([x, Math.max(0, k) * B * 0.5, 0.10]);
    }
    for (let i = NS; i >= 0; i--) {
      const t = i / NS, x = (t - 0.42) * L;
      const k = 1 - Math.pow(Math.abs(x) / (L * 0.58), ice ? 1.7 : 2.1);
      hull.push([x, -Math.max(0, k) * B * 0.5, 0.10]);
    }
    /* the shadow it sits in */
    ctx.save();
    if (poly(ctx, cam, st, hull.map(p => [p[0], p[1], 0.001]), W, H, heelSign)) {
      ctx.closePath();
      ctx.fillStyle = 'rgba(3,8,14,0.45)';
      ctx.fill();
    }
    if (poly(ctx, cam, st, hull, W, H, heelSign)) {
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, ice ? '#cfd8e2' : '#e8e2d4');
      g.addColorStop(1, ice ? '#8d99a8' : '#b7ac96');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = ink + '0.85)'; ctx.stroke();
    }
    /* deck line / cockpit */
    const inner = hull.map(p => [p[0] * 0.72, p[1] * 0.55, 0.16]);
    if (poly(ctx, cam, st, inner, W, H, heelSign)) {
      ctx.closePath();
      ctx.fillStyle = ice ? 'rgba(30,42,56,0.85)' : 'rgba(46,38,28,0.80)';
      ctx.fill();
    }

    if (ice) {
      /* the cross-plank and its two runners, plus the steering runner forward */
      const span = 3.6;
      for (const s of [1, -1]) {
        ctx.beginPath();
        if (poly(ctx, cam, st, [[-0.5, 0, 0.16], [-0.5, s * span / 2, 0.16]], W, H, heelSign)) {
          ctx.lineWidth = 3; ctx.strokeStyle = '#7e8894'; ctx.stroke();
        }
        ctx.beginPath();
        if (poly(ctx, cam, st, [[-1.0, s * span / 2, 0.03], [0.1, s * span / 2, 0.03]], W, H, heelSign)) {
          ctx.lineWidth = 4; ctx.strokeStyle = '#dfe7ef'; ctx.stroke();
        }
      }
      ctx.beginPath();
      if (poly(ctx, cam, st, [[L * 0.52, 0, 0.02], [L * 0.52 - 0.7, 0, 0.02]], W, H, heelSign)) {
        ctx.lineWidth = 4; ctx.strokeStyle = '#dfe7ef'; ctx.stroke();
      }
    } else {
      /* the centreboard's slot, and the rudder blade kicked by the tiller */
      ctx.beginPath();
      if (poly(ctx, cam, st, [[0.15, 0, 0.17], [-0.55, 0, 0.17]], W, H, heelSign)) {
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,28,36,0.7)'; ctx.stroke();
      }
      const rud = st.rudder;
      ctx.beginPath();
      if (poly(ctx, cam, st, [[-L * 0.42, 0, 0.18],
                              [-L * 0.42 - 0.85 * Math.cos(rud), 0.85 * Math.sin(rud), 0.18]], W, H, heelSign)) {
        ctx.lineWidth = 2.6; ctx.strokeStyle = '#8a7c62'; ctx.stroke();
      }
    }

    /* ── mast, boom, sail ── */
    const rig = craft.rig;
    const mastU = rig.boom * 0.42;

    if (rig.mode === 'drag') {
      /* the barn door: a flat square board held square to the apparent wind */
      const ar = f ? f.awa : 0;
      const board = 2.5;
      const pts = [];
      const dirU = -Math.cos(ar), dirV = -Math.sin(ar);
      for (const [a, b] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) {
        pts.push([mastU + dirV * a * board / 2, -dirU * a * board / 2, 0.35 + b * board]);
      }
      ctx.beginPath();
      if (poly(ctx, cam, st, pts, W, H, heelSign)) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(206,190,158,0.94)';
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#4a4032'; ctx.stroke();
        /* planking */
        for (let k = 1; k < 4; k++) {
          const t = k / 4;
          ctx.beginPath();
          if (poly(ctx, cam, st, [
            [mastU + dirV * -board / 2, dirU * board / 2, 0.35 + t * board],
            [mastU + dirV * board / 2, -dirU * board / 2, 0.35 + t * board]], W, H, heelSign)) {
            ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(74,64,50,0.5)'; ctx.stroke();
          }
        }
      }
    } else {
      const grid = sailShape(craft, st, side, flap, phase);
      /* fill it as a strip of quads, back to front */
      for (let j = 0; j < grid.length - 1; j++) {
        for (let i = 0; i < grid[0].length - 1; i++) {
          const quad = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]];
          ctx.beginPath();
          if (poly(ctx, cam, st, quad, W, H, heelSign)) {
            ctx.closePath();
            const shade = 0.86 - 0.16 * (i / grid[0].length) + 0.10 * (j / grid.length);
            const a = 0.93 - 0.34 * flap;
            ctx.fillStyle = 'rgba(' + Math.round(250 * shade) + ',' + Math.round(246 * shade) + ',' + Math.round(232 * shade) + ',' + a + ')';
            ctx.fill();
          }
        }
      }
      /* leech + luff + foot outline */
      const outline = [];
      for (let j = 0; j < grid.length; j++) outline.push(grid[j][0]);
      for (let j = grid.length - 1; j >= 0; j--) outline.push(grid[j][grid[0].length - 1]);
      ctx.beginPath();
      if (poly(ctx, cam, st, outline, W, H, heelSign)) {
        ctx.closePath();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(60,54,44,0.78)'; ctx.stroke();
      }
      /* the boom, and the sheet running from its end down to the horse */
      const B = sailBasis(st, side);
      const clewU = mastU + B.bU * rig.boom, clewV = B.bV * rig.boom;
      ctx.beginPath();
      if (poly(ctx, cam, st, [[mastU, 0, 0.55], [clewU, clewV, 0.55]], W, H, heelSign)) {
        ctx.lineWidth = 2.6; ctx.strokeStyle = '#6b5f4a'; ctx.stroke();
      }
      ctx.beginPath();
      if (poly(ctx, cam, st, [[clewU, clewV, 0.55], [-L * 0.30, 0, 0.18]], W, H, heelSign)) {
        ctx.lineWidth = 1.1; ctx.strokeStyle = 'rgba(230,224,206,0.55)'; ctx.stroke();
      }
    }
    /* the mast last, over the cloth */
    ctx.beginPath();
    if (poly(ctx, cam, st, [[mastU, 0, 0.1], [mastU, 0, rig.luff * 1.03]], W, H, heelSign)) {
      ctx.lineWidth = 2.8; ctx.strokeStyle = '#4a4436'; ctx.stroke();
    }

    /* the masthead vane: it points where the apparent wind comes FROM */
    if (f) {
      const top = rig.luff * 1.03;
      const va = f.awa;
      ctx.beginPath();
      if (poly(ctx, cam, st, [[mastU, 0, top], [mastU + Math.cos(va) * 0.85, Math.sin(va) * 0.85, top]], W, H, heelSign)) {
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffd08a'; ctx.stroke();
      }
    }
    ctx.restore();
  };

  /* ── the wake ─────────────────────────────────────────────────────────── */
  S.drawWake = function (ctx, cam, trail, W, H, ice) {
    if (trail.length < 3) return;
    ctx.save();
    for (let k = 0; k < 2; k++) {
      const s = k ? 1 : -1;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const age = (trail.length - 1 - i) / trail.length;
        const spread = s * (0.55 + age * 5.2) * Math.min(1, t.v / 2.2);
        const px = t.x + Math.cos(t.psi + Math.PI / 2) * spread;
        const py = t.y + Math.sin(t.psi + Math.PI / 2) * spread;
        const p = S.pw(cam, px, py, 0.02, W, H);
        if (!p.ok) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
      }
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = ice ? 'rgba(214,230,244,0.55)' : 'rgba(232,244,250,0.46)';
      ctx.stroke();
    }
    /* the churned water right behind the transom */
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const p = S.pw(cam, t.x, t.y, 0.02, W, H);
      if (!p.ok) { started = false; continue; }
      if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
    }
    ctx.lineWidth = 7.0;
    ctx.strokeStyle = ice ? 'rgba(206,222,240,0.30)' : 'rgba(234,246,252,0.26)';
    ctx.stroke();
    ctx.restore();
  };

  /* ── an arrow painted flat on the surface ─────────────────────────────── */
  S.surfaceArrow = function (ctx, cam, x, y, dx, dy, len, W, H, colour, width, label) {
    const m = Math.hypot(dx, dy) || 1;
    const ux = dx / m, uy = dy / m;
    const hx = x + ux * len, hy = y + uy * len;
    const a = S.pw(cam, x, y, 0.05, W, H);
    const b = S.pw(cam, hx, hy, 0.05, W, H);
    if (!a.ok || !b.ok) return null;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    /* the head, also on the surface, so it foreshortens with everything else */
    const hw = Math.max(0.5, len * 0.16);
    const p1 = S.pw(cam, hx - ux * hw * 1.7 - uy * hw, hy - uy * hw * 1.7 + ux * hw, 0.05, W, H);
    const p2 = S.pw(cam, hx - ux * hw * 1.7 + uy * hw, hy - uy * hw * 1.7 - ux * hw, 0.05, W, H);
    if (p1.ok && p2.ok) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath();
      ctx.fillStyle = colour; ctx.fill();
    }
    if (label) {
      ctx.font = '600 12px ui-monospace,Menlo,monospace';
      ctx.fillStyle = colour;
      ctx.textAlign = 'center';
      ctx.fillText(label, b.x + uy * 14, b.y - 12);
    }
    ctx.restore();
    return b;
  };

  /* ── a mark, standing up out of the surface ───────────────────────────── */
  /* A racing mark is a small thing two hundred metres off, so it is drawn as a
     spar with a ball and a flag and given a little glow — otherwise it is two
     pixels of orange and the visitor never finds the thing they are sailing to. */
  S.drawMark = function (ctx, cam, x, y, W, H, colour, tall, label, t) {
    const base = S.pw(cam, x, y, 0, W, H);
    const top = S.pw(cam, x, y, tall, W, H);
    if (!base.ok || !top.ok) return null;
    const r = Math.max(2.6, base.s * 0.55);
    ctx.save();
    /* the glow, so it is findable at any range */
    const gr = ctx.createRadialGradient(top.x, top.y, 0, top.x, top.y, Math.max(14, r * 6));
    gr.addColorStop(0, 'rgba(255,150,70,0.42)');
    gr.addColorStop(1, 'rgba(255,150,70,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(top.x, top.y, Math.max(14, r * 6), 0, 7); ctx.fill();
    /* its shadow on the water */
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, r * 1.8, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(4,10,16,0.5)'; ctx.fill();
    /* the spar */
    ctx.beginPath();
    ctx.moveTo(base.x - r, base.y);
    ctx.lineTo(top.x - r * 0.34, top.y);
    ctx.lineTo(top.x + r * 0.34, top.y);
    ctx.lineTo(base.x + r, base.y);
    ctx.closePath();
    const g = ctx.createLinearGradient(base.x - r, 0, base.x + r, 0);
    g.addColorStop(0, colour); g.addColorStop(0.42, '#ffd9a8'); g.addColorStop(1, colour);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.1; ctx.strokeStyle = 'rgba(20,14,8,0.7)'; ctx.stroke();
    /* the ball at its head, and a flag that streams downwind */
    ctx.beginPath(); ctx.arc(top.x, top.y, r * 1.5, 0, 7);
    ctx.fillStyle = '#ff9a4c'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(40,20,8,0.6)'; ctx.stroke();
    if (label) {
      ctx.font = '600 11px ui-monospace,Menlo,monospace';
      ctx.fillStyle = 'rgba(255,214,166,0.95)';
      ctx.textAlign = 'center';
      ctx.fillText(label, top.x, top.y - r * 2.4 - 4);
    }
    ctx.restore();
    return top;
  };

  /* ── a dashed line on the surface (laylines, the course, the wind) ─────── */
  S.surfaceLine = function (ctx, cam, x0, y0, x1, y1, W, H, colour, width, dash) {
    ctx.save();
    ctx.setLineDash(dash || []);
    ctx.strokeStyle = colour; ctx.lineWidth = width;
    ctx.beginPath();
    let started = false;
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = S.pw(cam, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0.03, W, H);
      if (!p.ok) { started = false; continue; }
      if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  };

  return S;
})();
