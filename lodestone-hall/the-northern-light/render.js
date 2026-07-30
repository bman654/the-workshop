/* ============================================================================
   render.js — THE NORTHERN LIGHT's picture.  WebGL2, no dependencies.

   IT RE-IMPLEMENTS NO PHYSICS.  Everything the aurora looks like comes out of
   ONE array that aurora.mjs hands over: a 256-entry table of linear-sRGB
   radiance against altitude, 80 to 420 km.  The shader's whole job is geometry
   and exposure — where the sheet is, how much of it a ray passes through, and
   how to get an emitting gas that spans four decades onto a screen that spans
   two.  There is no second model here to drift away from the first.

   WHAT IS REAL GEOMETRY
     · The world is a SPHERE of radius 6371 km with the visitor standing on it,
       so the horizon is where the horizon is and a curtain 500 km to the north
       rises out of it the way a real one does — the bottom hidden, the top in
       view.  A point at surface distance s and altitude h sits at
       (Re+h)*sin(s/Re) out and (Re+h)*cos(s/Re) - Re up.  Nothing is faked flat.
     · A curtain is FIELD-ALIGNED, because the electrons that make it are.  Each
       sheet is a curve on the ground extruded along the local magnetic field —
       dip 78 degrees, so the top of a 400 km curtain leans 85 km to magnetic
       north of its foot.  Look straight up during a breakup and the rays
       converge on a point: they are parallel, and that point is the magnetic
       zenith.  That is perspective, not a special case in the code.
     · The rays are constant along the field and structured across it, which is
       why an aurora is striated vertically and smooth horizontally.  They live
       in the fragment shader as a function of the ACROSS-sheet coordinate only.
     · A sheet is thin — a few hundred metres — so how bright it looks depends
       on how obliquely you cut it: brightness scales as 1/|dot(N, V)|, the path
       length through a slab.  That is the whole reason an arc has a knife edge.

   WHAT IS EXPOSURE, SAID OUT LOUD
     · ONE fixed constant turns radiance into screen brightness for the whole
       room, so a 1 kR arc really is a hundredth of a 100 kR one here.  Above
       the top the picture soft-saturates towards white, exactly as a bright
       aurora does on any sensor and in any eye.  Every number in the panel is
       read off the raw field, never off the picture.

   LANDMINES HEEDED (see LANDMINES.md)
     · Every vertex shader pins its attribute locations.
     · Normals are STATED (cross of the two parametric tangents), never derived
       from winding, and nothing is culled.
     · dt is clamped at both ends; the loop never indexes off an array.
     · An emitting gas is optically thin, so the compositing really is ADDITIVE
       — this is the one case where adding is the physics and not a shortcut.
   ============================================================================ */

function makeRenderer(canvas, opts) {
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: true, depth: true, powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error('WebGL2 is not available in this browser.');

  const RE = 6371.0;                 // km
  const DIP = 78 * Math.PI / 180;    // magnetic dip at an auroral latitude
  const BHAT = [0, Math.sin(DIP), -Math.cos(DIP)];   // up, leaning to -Z = north

  /* ── shader plumbing ─────────────────────────────────────────────────── */
  function compile(type, src, tag) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(tag + ': ' + gl.getShaderInfoLog(s));
    return s;
  }
  function program(vs, fs, tag) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs, tag + '.vs'));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs, tag + '.fs'));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error(tag + ' link: ' + gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const nm = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, '');
      u[nm] = gl.getUniformLocation(p, nm);
    }
    return { p, u };
  }

  const HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\n';

  /* the shared bits of GLSL both passes want.  NOTE: nothing in here may touch
     gl_FragCoord — it is compiled into vertex shaders too (LANDMINES.md). */
  const COMMON = [
    'float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }',
    'float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33);',
    '  return fract((p3.x+p3.y)*p3.z); }',
    'float vnoise(float x){ float i = floor(x), f = fract(x);',
    '  f = f*f*(3.0-2.0*f); return mix(hash11(i), hash11(i+1.0), f); }',
    'float vnoise2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);',
    '  float a = hash21(i), b = hash21(i+vec2(1,0)), c = hash21(i+vec2(0,1)), d = hash21(i+vec2(1,1));',
    '  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }',
  ].join('\n');

  /* ── 1. the night behind everything ──────────────────────────────────── */
  const bg = program(
    HEAD + [
      'layout(location=0) in vec2 aXY;',
      'out vec2 vNdc;',
      'void main(){ vNdc = aXY; gl_Position = vec4(aXY, 0.9999, 1.0); }',
    ].join('\n'),
    HEAD + COMMON + [
      'in vec2 vNdc; out vec4 oCol;',
      'uniform mat4 uInvVP; uniform vec3 uEye; uniform float uTime;',
      'void main(){',
      '  vec4 far = uInvVP * vec4(vNdc, 1.0, 1.0); vec3 dir = normalize(far.xyz/far.w - uEye);',
      '  float up = clamp(dir.y, -1.0, 1.0);',
      // a real night sky is not black: airglow and scattered starlight brighten
      // it towards the horizon, and it is BLUER overhead.
      '  vec3 zen = vec3(0.006, 0.010, 0.022);',
      '  vec3 hor = vec3(0.020, 0.026, 0.038);',
      '  float t = pow(clamp(1.0-up, 0.0, 1.0), 2.2);',
      '  vec3 c = mix(zen, hor, t);',
      // the Milky Way, a broad band on a great circle, as a soft mottled arch
      '  vec3 axis = normalize(vec3(0.42, 0.36, 0.83));',
      '  float band = 1.0 - abs(dot(dir, axis));',
      '  float mw = smoothstep(0.86, 1.0, band);',
      '  float mott = 0.55 + 0.45*vnoise2(dir.xz*11.0 + dir.y*7.0);',
      '  c += vec3(0.030, 0.030, 0.040) * mw * mw * mott * max(0.0, up+0.05);',
      '  oCol = vec4(c, 1.0);',
      '}',
    ].join('\n'), 'bg');

  /* ── 2. stars ────────────────────────────────────────────────────────── */
  const starProg = program(
    HEAD + [
      'layout(location=0) in vec3 aDir;',
      'layout(location=1) in vec2 aMagT;',       // magnitude, twinkle phase
      'uniform mat4 uVP; uniform vec3 uEye; uniform float uH; uniform float uTanHalf;',
      'uniform float uTime;',
      'out float vB; out vec3 vTint;',
      'void main(){',
      '  vec3 pos = uEye + aDir * 4.0e5;',
      '  gl_Position = uVP * vec4(pos, 1.0);',
      '  float bright = pow(2.512, -aMagT.x) * 60.0;',
      '  float tw = 0.82 + 0.18*sin(uTime*(2.0+aMagT.y*5.0) + aMagT.y*40.0);',
      '  vB = bright * tw;',
      '  float k = fract(aMagT.y*13.37);',
      '  vTint = mix(vec3(0.72,0.80,1.0), vec3(1.0,0.86,0.70), k);',
      '  gl_PointSize = clamp(1.2 + 1.9*pow(bright, 0.30), 1.0, 6.0);',
      '}',
    ].join('\n'),
    HEAD + [
      'in float vB; in vec3 vTint; out vec4 oCol;',
      'void main(){',
      '  vec2 d = gl_PointCoord - 0.5; float r2 = dot(d,d);',
      '  if (r2 > 0.25) discard;',
      '  float a = exp(-r2*13.0);',
      '  oCol = vec4(vTint * vB * a * 0.14, 1.0);',
      '}',
    ].join('\n'), 'stars');

  /* ── 3. the ground ───────────────────────────────────────────────────── */
  const groundProg = program(
    HEAD + COMMON + [
      'layout(location=0) in vec2 aRT;',       // radius (km), theta
      'uniform mat4 uVP; uniform float uRe;',
      'out vec3 vPos; out float vR;',
      'void main(){',
      '  float s = aRT.x, th = aRT.y;',
      '  float ang = s / uRe;',
      // rolling snow: a couple of octaves, in metres, tiny against 6371 km
      '  vec2 xz = vec2(sin(th), cos(th)) * (uRe*sin(ang));',
      '  float relief = (vnoise2(xz*0.35)-0.5)*0.020 + (vnoise2(xz*1.7)-0.5)*0.006;',
      '  relief *= smoothstep(0.03, 0.9, s);',
      '  float y = uRe*cos(ang) - uRe + relief;',
      '  vPos = vec3(xz.x, y, xz.y); vR = s;',
      '  gl_Position = uVP * vec4(vPos, 1.0);',
      '}',
    ].join('\n'),
    HEAD + COMMON + [
      'in vec3 vPos; in float vR; out vec4 oCol;',
      'uniform vec3 uSkyCol; uniform float uSkyLum; uniform vec3 uEye;',
      'void main(){',
      '  vec3 dp = dFdx(vPos), dq = dFdy(vPos);',
      '  vec3 N = normalize(cross(dq, dp));',
      '  if (N.y < 0.0) N = -N;',
      // snow: sparkle, and a faint drift texture
      '  float g = 0.55 + 0.45*vnoise2(vPos.xz*3.1);',
      '  float sp = smoothstep(0.986, 1.0, hash21(floor(vPos.xz*900.0)));',
      // the aurora is the light source.  It sits high overhead, so the lit
      // colour of the snow IS the sky colour, dimmed by how much sky each
      // patch can see and by the cosine.
      '  float amb = 0.14;',                       // starlight + airglow
      '  float lit = uSkyLum * (0.35 + 0.65*max(0.0, N.y));',
      '  vec3 c = (uSkyCol*lit + vec3(0.10,0.13,0.20)*amb) * g;',
      '  c += uSkyCol * sp * min(uSkyLum, 0.35) * 1.5;',
      // haze towards the horizon
      '  float haze = 1.0 - exp(-vR*0.035);',
      '  c = mix(c, vec3(0.020,0.026,0.040) + uSkyCol*uSkyLum*0.34, haze*0.90);',
      '  oCol = vec4(max(c, vec3(0.0)), 1.0);',
      '}',
    ].join('\n'), 'ground');

  /* ── 4. the treeline ─────────────────────────────────────────────────── */
  const treeProg = program(
    HEAD + [
      'layout(location=0) in vec4 aPH;',       // x, z, height(km), seed
      'uniform mat4 uVP; uniform float uRe; uniform float uH; uniform float uTanHalf;',
      'uniform vec3 uEye;',
      'out float vSeed;',
      'void main(){',
      '  float s = length(aPH.xy); float ang = s/uRe;',
      '  vec2 xz = normalize(aPH.xy) * (uRe*sin(ang));',
      '  float y = uRe*cos(ang) - uRe + aPH.z*0.5;',
      '  vec3 pos = vec3(xz.x, y, xz.y);',
      '  gl_Position = uVP * vec4(pos, 1.0);',
      '  float d = max(0.02, length(pos - uEye));',
      // gl_PointSize is a DIAMETER in pixels (LANDMINES.md)
      '  gl_PointSize = clamp(aPH.z * uH / (d * uTanHalf), 1.0, 400.0);',
      '  vSeed = aPH.w;',
      '}',
    ].join('\n'),
    HEAD + [
      'in float vSeed; out vec4 oCol;',
      'uniform vec3 uSkyCol; uniform float uSkyLum;',
      'void main(){',
      '  vec2 q = gl_PointCoord*2.0 - 1.0;  q.y = -q.y;',   // y up
      '  float w = 0.62*(0.5 - 0.5*q.y);',                   // spruce taper
      '  float jag = 0.10*sin(q.y*26.0 + vSeed*20.0);',
      '  if (abs(q.x) > w + jag*max(0.0,(0.6-q.y))) discard;',
      '  if (q.y > 0.98) discard;',
      // rim light from the sky above
      '  float rim = smoothstep(0.2, 1.0, q.y);',
      '  vec3 c = vec3(0.010,0.014,0.020) + uSkyCol*uSkyLum*(0.05 + 0.22*rim);',
      '  oCol = vec4(c, 1.0);',
      '}',
    ].join('\n'), 'trees');

  /* ── 5. THE CURTAIN ──────────────────────────────────────────────────── */
  const auroraProg = program(
    HEAD + COMMON + [
      'layout(location=0) in vec3 aPos;',
      'layout(location=1) in vec3 aNrm;',
      'layout(location=2) in vec3 aUHB;',      // across-sheet km, altitude km, brightness
      'uniform mat4 uVP;',
      'out vec3 vPos; out vec3 vN; out vec3 vUHB;',
      'void main(){ vPos = aPos; vN = aNrm; vUHB = aUHB;',
      '  gl_Position = uVP * vec4(aPos, 1.0); }',
    ].join('\n'),
    HEAD + COMMON + [
      'in vec3 vPos; in vec3 vN; in vec3 vUHB; out vec4 oCol;',
      'uniform sampler2D uLUT;',
      'uniform vec3 uEye; uniform float uTime; uniform float uGain;',
      'uniform float uZ0; uniform float uZ1; uniform float uThick;',
      'uniform float uRayAmp; uniform float uRaySpeed; uniform float uExtinct;',
      '',
      // Rays: structure ACROSS the sheet only, constant along the field — which
      // is what a bundle of field lines looks like.  Three scales: the metre-
      // scale is invisible from here, so the finest kept is ~600 m.
      'float rayField(float u, float t){',
      '  float d = u*0.62 + t*uRaySpeed;',
      '  float a = vnoise(d*1.7);',
      '  float b = vnoise(d*6.1 + 11.0);',
      '  float c = vnoise(d*19.0 + 41.0);',
      '  float f = 0.50*a + 0.32*b + 0.18*c;',
      '  return mix(1.0, 0.20 + 1.55*f, uRayAmp);',
      '}',
      'void main(){',
      '  float h = vUHB.y;',
      '  float t01 = clamp((h - uZ0) / (uZ1 - uZ0), 0.0, 1.0);',
      '  vec3 rad = texture(uLUT, vec2(t01, 0.5)).rgb;',
      '  vec3 V = normalize(vPos - uEye);',
      '  vec3 N = normalize(vN);',
      // path length through a slab of thickness uThick, cut at this angle
      '  float ct = abs(dot(N, V));',
      '  float path = uThick / max(ct, 0.13);',
      '  float rays = rayField(vUHB.x, uTime);',
      '  float dist = length(vPos - uEye);',
      '  float ext = exp(-dist * uExtinct);',
      '  vec3 c = rad * (vUHB.z * rays * path * ext * uGain);',
      // TONEMAP.  An optically thin emitter can outrun any screen by decades, and
      // clipping one channel at a time turns a bright green arc YELLOW, which is a
      // lie about the physics.  Scale all three by the same 1/(1+L) instead, so the
      // hue is exact at every brightness and nothing can ever clip; then let the
      // very top desaturate a little, which is what a real sensor and a real retina
      // both do.
      '  float L = max(max(c.r, c.g), c.b);',
      '  float k = 1.0 / (1.0 + L);',
      '  c *= k;',
      '  c = mix(c, vec3(L*k), 0.30*L*k);',
      '  if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);',
      '  oCol = vec4(max(c, vec3(0.0)), 1.0);',
      '}',
    ].join('\n'), 'aurora');

  /* ── buffers ─────────────────────────────────────────────────────────── */
  const quadVAO = gl.createVertexArray();
  {
    gl.bindVertexArray(quadVAO);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  /* stars — a procedural catalogue with a plausible magnitude distribution */
  const N_STARS = 2600;
  const starVAO = gl.createVertexArray();
  {
    gl.bindVertexArray(starVAO);
    const dir = new Float32Array(N_STARS * 3), mag = new Float32Array(N_STARS * 2);
    let seed = 20260730;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < N_STARS; i++) {
      // uniform on the sphere, then keep the upper hemisphere generously
      let x, y, z, r2;
      do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; r2 = x * x + y * y + z * z; }
      while (r2 > 1 || r2 < 1e-6);
      const s = 1 / Math.sqrt(r2);
      dir[i * 3] = x * s; dir[i * 3 + 1] = Math.abs(y * s) * 0.98 - 0.02; dir[i * 3 + 2] = z * s;
      // N(<m) grows ~ 10^(0.42 m): draw m from that
      mag[i * 2] = 1.2 + Math.log10(1 + rnd() * 5000) / 0.42 * 0.55;
      mag[i * 2 + 1] = rnd();
    }
    const b1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, dir, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    const b2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, mag, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  /* ground — a radial fan, geometric in radius so the near field is dense */
  const GR = 96, GT = 128;
  const groundVAO = gl.createVertexArray();
  let groundCount = 0;
  {
    gl.bindVertexArray(groundVAO);
    const verts = [], idx = [];
    for (let i = 0; i <= GR; i++) {
      const f = i / GR;
      const s = 0.02 * Math.pow(1400 / 0.02, f);       // 20 m out to 1400 km
      for (let j = 0; j <= GT; j++) verts.push(s, j / GT * Math.PI * 2);
    }
    for (let i = 0; i < GR; i++) for (let j = 0; j < GT; j++) {
      const a = i * (GT + 1) + j, b = a + GT + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
    groundCount = idx.length;
    gl.bindVertexArray(null);
  }

  /* treeline */
  const N_TREES = 1400;
  const treeVAO = gl.createVertexArray();
  {
    gl.bindVertexArray(treeVAO);
    const a = new Float32Array(N_TREES * 4);
    let seed = 77123;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < N_TREES; i++) {
      const th = rnd() * Math.PI * 2;
      const r = 0.35 + Math.pow(rnd(), 0.6) * 6.0;     // 0.35 to 6.4 km out
      a[i * 4] = Math.sin(th) * r; a[i * 4 + 1] = Math.cos(th) * r;
      a[i * 4 + 2] = (0.011 + rnd() * 0.014);          // 11-25 m spruce
      a[i * 4 + 3] = rnd();
    }
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  /* the curtain mesh — rebuilt on the CPU whenever the sheets move */
  const NU = 200, NH = 56;
  const auroraVAO = gl.createVertexArray();
  const posArr = new Float32Array(NU * NH * 3 * 4);     // room for 4 sheets
  const nrmArr = new Float32Array(NU * NH * 3 * 4);
  const uhbArr = new Float32Array(NU * NH * 3 * 4);
  let idxArr = null, auroraCount = 0, posBuf, nrmBuf, uhbBuf;
  {
    gl.bindVertexArray(auroraVAO);
    posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, posArr.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    nrmBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
    gl.bufferData(gl.ARRAY_BUFFER, nrmArr.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    uhbBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uhbBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uhbArr.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

    const idx = [];
    for (let sheet = 0; sheet < 4; sheet++) {
      const base = sheet * NU * NH;
      for (let i = 0; i < NU - 1; i++) for (let j = 0; j < NH - 1; j++) {
        const a = base + i * NH + j, b = a + NH;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    idxArr = new Uint32Array(idx);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxArr, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
  }

  /* the altitude LUT texture — the ONE thing physics hands the picture */
  const lutTex = [gl.createTexture(), gl.createTexture()];
  for (const t of lutTex) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  let lutN = 0;
  function uploadLUT(lut, slot) {
    // RGBA16F with LINEAR is filterable in core WebGL2 (RGBA32F is NOT —
    // LANDMINES.md: a LINEAR sampler on a 32-bit float texture reads black).
    const n = lut.n;
    const data = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      data[i * 4] = lut.rgb[i * 3]; data[i * 4 + 1] = lut.rgb[i * 3 + 1];
      data[i * 4 + 2] = lut.rgb[i * 3 + 2]; data[i * 4 + 3] = 1;
    }
    gl.bindTexture(gl.TEXTURE_2D, lutTex[slot | 0]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, n, 1, 0, gl.RGBA, gl.FLOAT, data);
    lutN = n;
  }

  /* ── camera ──────────────────────────────────────────────────────────── */
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1,
            0, 0, 2 * far * near / (near - far), 0];
  }
  function lookAt(eye, at, up) {
    const z = norm3(sub3(eye, at));
    const x = norm3(cross3(up, z));
    const y = cross3(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
            -dot3(x, eye), -dot3(y, eye), -dot3(z, eye), 1];
  }
  function mul4(a, b) {
    const o = new Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
      o[i * 4 + j] = s;
    }
    return o;
  }
  function inv4(m) {
    const inv = new Array(16), a = m;
    inv[0] = a[5]*a[10]*a[15]-a[5]*a[11]*a[14]-a[9]*a[6]*a[15]+a[9]*a[7]*a[14]+a[13]*a[6]*a[11]-a[13]*a[7]*a[10];
    inv[4] = -a[4]*a[10]*a[15]+a[4]*a[11]*a[14]+a[8]*a[6]*a[15]-a[8]*a[7]*a[14]-a[12]*a[6]*a[11]+a[12]*a[7]*a[10];
    inv[8] = a[4]*a[9]*a[15]-a[4]*a[11]*a[13]-a[8]*a[5]*a[15]+a[8]*a[7]*a[13]+a[12]*a[5]*a[11]-a[12]*a[7]*a[9];
    inv[12] = -a[4]*a[9]*a[14]+a[4]*a[10]*a[13]+a[8]*a[5]*a[14]-a[8]*a[6]*a[13]-a[12]*a[5]*a[10]+a[12]*a[6]*a[9];
    inv[1] = -a[1]*a[10]*a[15]+a[1]*a[11]*a[14]+a[9]*a[2]*a[15]-a[9]*a[3]*a[14]-a[13]*a[2]*a[11]+a[13]*a[3]*a[10];
    inv[5] = a[0]*a[10]*a[15]-a[0]*a[11]*a[14]-a[8]*a[2]*a[15]+a[8]*a[3]*a[14]+a[12]*a[2]*a[11]-a[12]*a[3]*a[10];
    inv[9] = -a[0]*a[9]*a[15]+a[0]*a[11]*a[13]+a[8]*a[1]*a[15]-a[8]*a[3]*a[13]-a[12]*a[1]*a[11]+a[12]*a[3]*a[9];
    inv[13] = a[0]*a[9]*a[14]-a[0]*a[10]*a[13]-a[8]*a[1]*a[14]+a[8]*a[2]*a[13]+a[12]*a[1]*a[10]-a[12]*a[2]*a[9];
    inv[2] = a[1]*a[6]*a[15]-a[1]*a[7]*a[14]-a[5]*a[2]*a[15]+a[5]*a[3]*a[14]+a[13]*a[2]*a[7]-a[13]*a[3]*a[6];
    inv[6] = -a[0]*a[6]*a[15]+a[0]*a[7]*a[14]+a[4]*a[2]*a[15]-a[4]*a[3]*a[14]-a[12]*a[2]*a[7]+a[12]*a[3]*a[6];
    inv[10] = a[0]*a[5]*a[15]-a[0]*a[7]*a[13]-a[4]*a[1]*a[15]+a[4]*a[3]*a[13]+a[12]*a[1]*a[7]-a[12]*a[3]*a[5];
    inv[14] = -a[0]*a[5]*a[14]+a[0]*a[6]*a[13]+a[4]*a[1]*a[14]-a[4]*a[2]*a[13]-a[12]*a[1]*a[6]+a[12]*a[2]*a[5];
    inv[3] = -a[1]*a[6]*a[11]+a[1]*a[7]*a[10]+a[5]*a[2]*a[11]-a[5]*a[3]*a[10]-a[9]*a[2]*a[7]+a[9]*a[3]*a[6];
    inv[7] = a[0]*a[6]*a[11]-a[0]*a[7]*a[10]-a[4]*a[2]*a[11]+a[4]*a[3]*a[10]+a[8]*a[2]*a[7]-a[8]*a[3]*a[6];
    inv[11] = -a[0]*a[5]*a[11]+a[0]*a[7]*a[9]+a[4]*a[1]*a[11]-a[4]*a[3]*a[9]-a[8]*a[1]*a[7]+a[8]*a[3]*a[5];
    inv[15] = a[0]*a[5]*a[10]-a[0]*a[6]*a[9]-a[4]*a[1]*a[10]+a[4]*a[2]*a[9]+a[8]*a[1]*a[6]-a[8]*a[2]*a[5];
    let det = a[0]*inv[0] + a[1]*inv[4] + a[2]*inv[8] + a[3]*inv[12];
    if (!det) return m.slice();
    det = 1 / det;
    for (let i = 0; i < 16; i++) inv[i] *= det;
    return inv;
  }
  const sub3 = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const dot3 = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const cross3 = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  function norm3(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; }

  /* place a point given surface distance vector (x, z) in km and altitude h */
  function place(x, z, h) {
    const s = Math.hypot(x, z);
    if (s < 1e-9) return [0, h, 0];
    const ang = s / RE, R = RE + h;
    const k = R * Math.sin(ang) / s;
    return [x * k, R * Math.cos(ang) - RE, z * k];
  }

  /* ── the sheets ──────────────────────────────────────────────────────── */
  const Z0 = 80, Z1 = 420;
  function altitudeOf(j) {
    // pack the stations towards the bottom, where the structure is
    const f = j / (NH - 1);
    return Z0 + (Z1 - Z0) * Math.pow(f, 1.55);
  }

  /* build the vertex arrays for a list of sheet descriptors */
  function buildSheets(sheets) {
    let v = 0, sheetsUsed = 0;
    for (const sh of sheets.slice(0, 4)) {
      for (let i = 0; i < NU; i++) {
        const t = i / (NU - 1);
        const p = sh.curve(t);                       // {x, z, bright}
        const pm = sh.curve(Math.max(0, t - 1e-3));
        const pp = sh.curve(Math.min(1, t + 1e-3));
        // the tangent along the sheet's foot, and the STATED normal
        const tx = pp.x - pm.x, tz = pp.z - pm.z;
        const tl = Math.hypot(tx, tz) || 1;
        const T = [tx / tl, 0, tz / tl];
        let N = cross3(T, BHAT);
        N = norm3(N);
        const across = sh.arc ? sh.arc(t) : t * sh.length;
        for (let j = 0; j < NH; j++) {
          const h = altitudeOf(j);
          const L = h / Math.sin(DIP);
          const x = p.x + BHAT[0] * L, z = p.z + BHAT[2] * L;
          const P = place(x, z, h);
          posArr[v * 3] = P[0]; posArr[v * 3 + 1] = P[1]; posArr[v * 3 + 2] = P[2];
          nrmArr[v * 3] = N[0]; nrmArr[v * 3 + 1] = N[1]; nrmArr[v * 3 + 2] = N[2];
          uhbArr[v * 3] = across; uhbArr[v * 3 + 1] = h; uhbArr[v * 3 + 2] = p.bright;
          v++;
        }
      }
      sheetsUsed++;
    }
    // any unused sheet slots collapse to a point so their triangles vanish
    for (; v < NU * NH * 4; v++) {
      posArr[v * 3] = 0; posArr[v * 3 + 1] = -RE; posArr[v * 3 + 2] = 0;
      nrmArr[v * 3] = 0; nrmArr[v * 3 + 1] = 1; nrmArr[v * 3 + 2] = 0;
      uhbArr[v * 3] = 0; uhbArr[v * 3 + 1] = 0; uhbArr[v * 3 + 2] = 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, posArr);
    gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, nrmArr);
    gl.bindBuffer(gl.ARRAY_BUFFER, uhbBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, uhbArr);
    auroraCount = sheetsUsed * (NU - 1) * (NH - 1) * 6;
  }

  /* ── the frame ───────────────────────────────────────────────────────── */
  let W = 1, H = 1, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = Math.max(2, Math.round(r.width * DPR));
    H = Math.max(2, Math.round(r.height * DPR));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  }

  function draw(state) {
    resize();
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);                      // nothing is culled, ever

    const fovy = state.fov * Math.PI / 180;
    const aspect = W / H;
    const P = perspective(fovy, aspect, 0.004, 40000);
    const V = lookAt(state.eye, state.at, [0, 1, 0]);
    const VP = mul4(P, V);
    const invVP = inv4(VP);
    lastVP = VP;
    const tanHalf = Math.tan(fovy / 2);

    // 1. night
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    gl.useProgram(bg.p);
    gl.uniformMatrix4fv(bg.u.uInvVP, false, new Float32Array(invVP));
    gl.uniform3fv(bg.u.uEye, new Float32Array(state.eye));
    gl.uniform1f(bg.u.uTime, state.time);
    gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2. stars
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(starProg.p);
    gl.uniformMatrix4fv(starProg.u.uVP, false, new Float32Array(VP));
    gl.uniform3fv(starProg.u.uEye, new Float32Array(state.eye));
    gl.uniform1f(starProg.u.uTime, state.time);
    gl.uniform1f(starProg.u.uH, H);
    gl.uniform1f(starProg.u.uTanHalf, tanHalf);
    gl.bindVertexArray(starVAO); gl.drawArrays(gl.POINTS, 0, N_STARS);

    // 3. ground + trees (depth on, they occlude the sky)
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
    if (state.showGround) {
      gl.useProgram(groundProg.p);
      gl.uniformMatrix4fv(groundProg.u.uVP, false, new Float32Array(VP));
      gl.uniform1f(groundProg.u.uRe, RE);
      gl.uniform3fv(groundProg.u.uSkyCol, new Float32Array(state.skyCol));
      gl.uniform1f(groundProg.u.uSkyLum, state.skyLum);
      gl.uniform3fv(groundProg.u.uEye, new Float32Array(state.eye));
      gl.bindVertexArray(groundVAO);
      gl.drawElements(gl.TRIANGLES, groundCount, gl.UNSIGNED_INT, 0);

      gl.useProgram(treeProg.p);
      gl.uniformMatrix4fv(treeProg.u.uVP, false, new Float32Array(VP));
      gl.uniform1f(treeProg.u.uRe, RE);
      gl.uniform1f(treeProg.u.uH, H);
      gl.uniform1f(treeProg.u.uTanHalf, tanHalf);
      gl.uniform3fv(treeProg.u.uEye, new Float32Array(state.eye));
      gl.uniform3fv(treeProg.u.uSkyCol, new Float32Array(state.skyCol));
      gl.uniform1f(treeProg.u.uSkyLum, state.skyLum);
      gl.bindVertexArray(treeVAO); gl.drawArrays(gl.POINTS, 0, N_TREES);
    }

    // 4. the curtain — optically thin, so ADDITIVE is the physics
    if (auroraCount > 0 && state.passes && state.passes.length) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      gl.useProgram(auroraProg.p);
      gl.uniformMatrix4fv(auroraProg.u.uVP, false, new Float32Array(VP));
      gl.uniform3fv(auroraProg.u.uEye, new Float32Array(state.eye));
      gl.uniform1f(auroraProg.u.uTime, state.time);
      gl.uniform1f(auroraProg.u.uZ0, Z0);
      gl.uniform1f(auroraProg.u.uZ1, Z1);
      gl.uniform1f(auroraProg.u.uRaySpeed, state.raySpeed);
      gl.uniform1f(auroraProg.u.uExtinct, state.extinct);
      gl.bindVertexArray(auroraVAO);
      // TWO passes, and the reason is physics, not decoration.  The fast states
      // (0.75 s and shorter) carry the ray structure; O(1D) at 117 s cannot —
      // it has already smeared over anything finer than a minute of motion, so
      // the red layer is drawn diffuse and slightly thicker.  Same mesh, same
      // table machinery, different lifetime.
      for (const pass of state.passes) {
        gl.uniform1f(auroraProg.u.uGain, pass.gain);
        gl.uniform1f(auroraProg.u.uThick, pass.thickness);
        gl.uniform1f(auroraProg.u.uRayAmp, pass.rayAmp);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lutTex[pass.slot | 0]);
        gl.uniform1i(auroraProg.u.uLUT, 0);
        gl.drawElements(gl.TRIANGLES, auroraCount, gl.UNSIGNED_INT, 0);
      }
      gl.depthMask(true);
    }
    gl.bindVertexArray(null);
  }

  /* the last frame's view-projection, so an overlay can put a label exactly
     where a world point landed (the altitude ruler in the section view). */
  let lastVP = null;
  function projectPoint(p) {
    if (!lastVP) return null;
    const m = lastVP;
    const x = m[0]*p[0] + m[4]*p[1] + m[8]*p[2] + m[12];
    const y = m[1]*p[0] + m[5]*p[1] + m[9]*p[2] + m[13];
    const w = m[3]*p[0] + m[7]*p[1] + m[11]*p[2] + m[15];
    if (!(w > 0)) return null;
    return [(x / w * 0.5 + 0.5) * W / DPR, (0.5 - y / w * 0.5) * H / DPR];
  }

  return { gl, draw, uploadLUT, buildSheets, place, projectPoint,
           RE, DIP, BHAT, Z0, Z1, NU, NH,
           get size() { return [W, H]; } };
}
