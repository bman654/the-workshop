/* ═══════════════════════════════════════════════════════════════════════════
   THE HEADWATERS · render.js   —  WebGL2, four passes, no post-processing.

     sky        a full-screen triangle; one function `skyCol(dir)` that the
                terrain and the sea also call, so fog, reflection and horizon
                are all the same sky by construction.
     terrain    a (N-1)^2 quad grid with NO vertex attributes at all: each
                vertex derives its cell from gl_VertexID and texelFetches its
                own height out of an R32F texture (NEAREST — a float texture
                is not filterable in core WebGL2, and a LINEAR sampler on one
                returns black; see LANDMINES).  Shadows are a horizon march
                over that same texture, so there is no shadow map and none of
                its bias.
     sea        one plane at y = 0, shaded against the sea floor under it, with
                a surf line wherever that floor comes near the surface.
     drops      a comet of GL_POINTS running down a flow path.

   Everything is metres.  X and Z are the grid; Y is up.  The only lie is the
   vertical exaggeration, which the room names on its card.
   ═══════════════════════════════════════════════════════════════════════════ */

function compile(gl, type, src, tag) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    throw new Error(tag + ': ' + log + '\n' + src.split('\n')
      .map((l, i) => String(i + 1).padStart(3) + ' ' + l).join('\n'));
  }
  return s;
}
function program(gl, vs, fs, tag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, tag + '.vs'));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, tag + '.fs'));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(tag + ' link: ' + gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, nm); }
  return { p, u };
}

/* ── small matrix helpers (column-major, as GL wants) ─────────────────────── */
function mul4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function perspective(fovy, asp, near, far) {
  const f = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
  o[0] = f / asp; o[5] = f; o[11] = -1;
  o[10] = (far + near) / (near - far); o[14] = 2 * far * near / (near - far);
  return o;
}
function lookAt(eye, ctr, up) {
  const z = norm3(sub3(eye, ctr));
  const x = norm3(cross3(up, z));
  const y = cross3(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
    -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
    -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1]);
}
function inv4(m) {
  const a = m, o = new Float32Array(16);
  const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4];
  const b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
  const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12];
  const b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return o; det = 1 / det;
  o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det;
  o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * det;
  o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det;
  o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * det;
  o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * det;
  o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det;
  o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * det;
  o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
  o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det;
  o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * det;
  o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det;
  o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * det;
  o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * det;
  o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det;
  o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * det;
  o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det;
  return o;
}
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

/* ═══════════════════════════════════════════════════════════════════════════
   THE SHADER LIBRARY — one copy of the sky, one copy of the height lookup
   ═══════════════════════════════════════════════════════════════════════════ */
const LIB = `
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D uH;        // R32F: the drawn surface, metres (land or sea bed)
uniform sampler2D uW;        // R32F: the river ribbon, in cells inside the bank
uniform sampler2D uO;        // R8:   Strahler order / 8
uniform float uN, uCell, uVX, uMaxH, uTime;
uniform vec3 uSun, uSunCol, uZen, uHor, uGround;
uniform float uSunTan, uCloud, uOmax;

vec2 gridOf(vec2 xz){ return xz / uCell + vec2((uN - 1.0) * 0.5); }

float hAtCell(ivec2 c){
  c = clamp(c, ivec2(0), ivec2(int(uN) - 1));
  return texelFetch(uH, c, 0).r;
}
// a float texture is NOT filterable in core WebGL2, so do the bilinear by hand
float hAt(vec2 xz){
  vec2 g = gridOf(xz);
  vec2 f = fract(g); ivec2 c = ivec2(floor(g));
  float a = hAtCell(c), b = hAtCell(c + ivec2(1,0));
  float d = hAtCell(c + ivec2(0,1)), e = hAtCell(c + ivec2(1,1));
  return mix(mix(a,b,f.x), mix(d,e,f.x), f.y);
}
float wAt(vec2 xz){
  vec2 g = gridOf(xz);
  vec2 f = fract(g); ivec2 c = ivec2(floor(g));
  ivec2 lo = ivec2(0), hi = ivec2(int(uN)-1);
  float a = texelFetch(uW, clamp(c,lo,hi),0).r, b = texelFetch(uW, clamp(c+ivec2(1,0),lo,hi),0).r;
  float d = texelFetch(uW, clamp(c+ivec2(0,1),lo,hi),0).r, e = texelFetch(uW, clamp(c+ivec2(1,1),lo,hi),0).r;
  return mix(mix(a,b,f.x), mix(d,e,f.x), f.y);
}

float hash21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash21(i), b = hash21(i+vec2(1,0)), c = hash21(i+vec2(0,1)), d = hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*vnoise(p); p*=2.03; a*=0.5; } return v; }

// A hillside at 40 m a sample is a smooth thing, and a real one is not. Two
// octaves of gradient noise bend the NORMAL only — no geometry, no parallax —
// and fade out with distance so nothing aliases into a shimmer.
vec3 roughen(vec3 N, vec2 xz, float dist, float amt){
  float f = exp(-dist / 7000.0) * amt;
  if (f < 0.02) return N;
  const float e = 7.0;
  float a0 = fbm(xz * 0.028);
  float ax = fbm((xz + vec2(e, 0.0)) * 0.028);
  float az = fbm((xz + vec2(0.0, e)) * 0.028);
  vec2 g = vec2(ax - a0, az - a0) / e;
  float b0 = fbm(xz * 0.14 + 91.0);
  float bx = fbm((xz + vec2(2.0, 0.0)) * 0.14 + 91.0);
  float bz = fbm((xz + vec2(0.0, 2.0)) * 0.14 + 91.0);
  vec2 g2 = vec2(bx - b0, bz - b0) / 2.0;
  return normalize(N + vec3(-(g.x * 9.0 + g2.x * 2.0), 0.0, -(g.y * 9.0 + g2.y * 2.0)) * f);
}

vec3 skyCol(vec3 d){
  float up = clamp(d.y, -1.0, 1.0);
  vec3 c = mix(uHor, uZen, pow(clamp(up,0.0,1.0), 0.52));
  float s = max(dot(normalize(d), uSun), 0.0);
  c += uSunCol * (pow(s, 1400.0) * 22.0 + pow(s, 9.0) * 0.30 + pow(s, 2.0) * 0.05);
  c = mix(uGround, c, smoothstep(-0.10, 0.03, up));
  return c;
}

// How much of the sun reaches this point: the largest elevation angle any
// terrain along the sun's bearing subtends, against the sun's own. No shadow
// map, so no shadow-map bias to get wrong. Everything here is in RENDER space
// (heights already multiplied by the vertical exaggeration), which is the
// space the sun you can see is in.
// The jitter argument, in [0,1), offsets the first step: 24 samples over a faceted
// heightfield band into hard-edged patches otherwise. The caller supplies it
// because this library is compiled into VERTEX shaders too, and one of those
// has no fragment coordinate to interleave against.
float sunlight(vec3 p, float jitter){
  if (uSun.y <= 0.015) return 0.0;
  vec2 dir = normalize(uSun.xz + vec2(1e-6));
  float horizon = -9.0;
  float d = uCell * (0.7 + 0.8 * jitter);
  for (int i = 0; i < 24; i++){
    float th = hAt(p.xz + dir * d) * uVX;
    horizon = max(horizon, (th - p.y) / d);
    if (d > uCell * 150.0) break;
    d *= 1.29;
  }
  float k = 0.075;                       // the sun is not a point
  return 1.0 - smoothstep(uSunTan - k, uSunTan + k, horizon);
}

// slow weather drifting across the island
float cloudShade(vec2 xz){
  if (uCloud <= 0.001) return 1.0;
  float n = fbm(xz * 0.00035 + vec2(uTime * 0.0035, uTime * 0.0012));
  return 1.0 - uCloud * smoothstep(0.44, 0.78, n);
}

vec3 fogged(vec3 col, vec3 world, vec3 eye){
  vec3 v = world - eye; float dist = length(v);
  float hAvg = max(20.0, 0.5 * (world.y + eye.y));
  float dens = 1.15e-4 * exp(-hAvg / 900.0) + 2.2e-5;
  float f = 1.0 - exp(-dist * dens);
  vec3 sky = skyCol(normalize(v));
  return mix(col, sky, clamp(f, 0.0, 0.94));
}
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
export function makeRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {
    antialias: true, alpha: false, depth: true, powerPreference: 'high-performance'
  });
  if (!gl) throw new Error('WebGL2 is not available in this browser.');
  gl.getExtension('EXT_color_buffer_float');

  /* ── programs ─────────────────────────────────────────────────────────── */
  const SKY = program(gl, `#version 300 es
    void main(){
      vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
      gl_Position = vec4(p * 2.0 - 1.0, 0.99999, 1.0);
    }`, `#version 300 es
    ${LIB}
    uniform mat4 uInvVP; uniform vec2 uViewport;
    out vec4 frag;
    void main(){
      vec2 ndc = gl_FragCoord.xy / uViewport * 2.0 - 1.0;
      vec4 na = uInvVP * vec4(ndc, -1.0, 1.0);
      vec4 fa = uInvVP * vec4(ndc,  1.0, 1.0);
      vec3 dir = normalize(fa.xyz / fa.w - na.xyz / na.w);
      vec3 c = skyCol(dir);
      // a high bank of cloud on a plane, so it converges to the horizon
      float t = max(dir.y, 0.004);
      vec2 pl = dir.xz / t;
      float n = fbm(pl * 0.42 + vec2(uTime * 0.006, uTime * 0.002));
      float cover = smoothstep(0.48, 0.88, n) * smoothstep(0.015, 0.26, dir.y) * 0.62;
      vec3 cc = mix(vec3(0.40,0.43,0.49), vec3(1.02,0.99,0.95), 0.30 + 0.70 * n);
      cc *= mix(vec3(1.0), uSunCol, 0.55);
      c = mix(c, cc, cover);
      if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
      c = c / (1.0 + c * 0.62);
      frag = vec4(c, 1.0);
    }`, 'sky');

  const TERRAIN = program(gl, `#version 300 es
    ${LIB}
    uniform mat4 uVP; uniform vec3 uEye;
    out vec3 vW; out vec3 vN; out float vWet; out float vOrd; out float vCurv; out float vSlope;
    void main(){
      int n = int(uN);
      int ix = gl_VertexID % n, iy = gl_VertexID / n;
      float y = texelFetch(uH, ivec2(ix,iy), 0).r;
      vec2 xz = (vec2(ix,iy) - (uN - 1.0) * 0.5) * uCell;
      vW = vec3(xz.x, y * uVX, xz.y);
      float hl = hAtCell(ivec2(ix-1,iy)), hr = hAtCell(ivec2(ix+1,iy));
      float hd = hAtCell(ivec2(ix,iy-1)), hu = hAtCell(ivec2(ix,iy+1));
      vN = normalize(vec3(-(hr-hl) * uVX, 2.0 * uCell, -(hu-hd) * uVX));
      vSlope = length(vec2(hr-hl, hu-hd)) / (2.0 * uCell);   // the TRUE gradient
      vCurv = (hl + hr + hu + hd - 4.0 * y) / uCell;
      vWet = texelFetch(uW, ivec2(ix,iy), 0).r;
      vOrd = texelFetch(uO, ivec2(ix,iy), 0).r * (255.0 / 30.0);   // back to 1..8
      gl_Position = uVP * vec4(vW, 1.0);
    }`, `#version 300 es
    ${LIB}
    uniform vec3 uEye; uniform float uOrderMode, uSeaLevel;
    in vec3 vW; in vec3 vN; in float vWet; in float vOrd; in float vCurv; in float vSlope;
    out vec4 frag;

    vec3 orderTint(float o){
      // 1..omax -> a cool-to-hot ladder, so a confluence is visible as a step
      float t = clamp((o - 1.0) / max(1.0, uOmax - 1.0), 0.0, 1.0);
      vec3 a = vec3(0.16,0.34,0.62), b = vec3(0.25,0.78,0.86);
      vec3 c = vec3(0.55,0.92,0.60), d = vec3(1.00,0.86,0.36), e = vec3(1.00,0.45,0.28);
      vec3 col = mix(a,b,smoothstep(0.0,0.25,t));
      col = mix(col,c,smoothstep(0.25,0.5,t));
      col = mix(col,d,smoothstep(0.5,0.75,t));
      col = mix(col,e,smoothstep(0.75,1.0,t));
      return col;
    }

    void main(){
      vec3 N = normalize(vN);
      float y = vW.y / uVX;                       // true metres
      float slope = vSlope;                       // rise over run, unexaggerated

      /* --- the ground itself ------------------------------------------ */
      float g1 = fbm(vW.xz * 0.00085);
      float g2 = fbm(vW.xz * 0.0125 + 11.0);
      float g3 = fbm(vW.xz * 0.062 + 41.0);
      float relH = clamp(y / max(uMaxH, 1.0), 0.0, 1.0);

      vec3 sand   = vec3(0.66,0.60,0.44);
      vec3 wood   = mix(vec3(0.075,0.150,0.070), vec3(0.130,0.210,0.085), g2);
      vec3 pasture= mix(vec3(0.185,0.265,0.100), vec3(0.270,0.310,0.130), g1);
      vec3 heath  = mix(vec3(0.270,0.240,0.140), vec3(0.345,0.290,0.175), g2);
      vec3 stone  = mix(vec3(0.215,0.205,0.195), vec3(0.360,0.335,0.305), g3);
      vec3 scree  = mix(vec3(0.415,0.395,0.370), vec3(0.545,0.520,0.495), g3);

      float steep = smoothstep(0.46, 0.86, slope + 0.16 * (g3 - 0.5));
      vec3 col = mix(wood, pasture, smoothstep(0.18, 0.50, slope));
      col = mix(col, heath, smoothstep(0.26, 0.66, relH + 0.16 * (g1 - 0.5)));
      col = mix(col, stone, steep);
      col = mix(col, scree, smoothstep(0.70, 1.0, relH) * (0.30 + 0.70 * steep));
      col = mix(col, sand, smoothstep(16.0, 2.0, y) * (1.0 - steep * 0.55));

      /* valleys are darker: a crease term straight off the curvature */
      col *= 1.0 + clamp(vCurv * 7.0, -0.34, 0.18);

      /* --- the water ---------------------------------------------------- */
      float bank = smoothstep(-0.55, 0.45, vWet);
      vec3 shallow = vec3(0.115,0.235,0.255), deep = vec3(0.038,0.115,0.200);
      float big = clamp((vOrd - 1.0) / max(1.0, uOmax - 1.0), 0.0, 1.0);
      vec3 water = mix(shallow, deep, big);
      /* a damp margin either side of the channel, then the water itself */
      col *= 1.0 - 0.22 * smoothstep(-2.4, -0.4, vWet);
      col = mix(col, water, bank * 0.94);

      /* --- light --------------------------------------------------------- */
      float camd = length(uEye - vW);
      float ign = fract(52.9829189 * fract(0.06711056 * gl_FragCoord.x + 0.00583715 * gl_FragCoord.y));
      N = roughen(N, vW.xz, camd, mix(1.0, 0.25, bank));
      float ndlRaw = max(dot(N, uSun), 0.0);
      float sh = sunlight(vW, ign);
      sh *= cloudShade(vW.xz);
      float ndl = ndlRaw;
      vec3 lit = uSunCol * ndl * sh * 2.25;
      vec3 amb = mix(uGround * 0.40, uZen * 0.90, 0.5 + 0.5 * N.y) * 0.50;
      amb += uSunCol * 0.055 * max(0.0, 0.35 - N.y) * (0.3 + 0.7 * sh);
      vec3 outc = col * (lit + amb);

      /* specular on the water only */
      if (bank > 0.01) {
        vec3 V = normalize(uEye - vW);
        vec3 Nw = normalize(vec3(N.x, N.y * 3.0, N.z)
          + vec3(sin(vW.x * 0.11 + uTime * 2.3), 0.0, cos(vW.z * 0.13 - uTime * 2.7)) * 0.10);
        float sp = pow(max(dot(normalize(V + uSun), Nw), 0.0), 60.0);
        outc += uSunCol * sp * sh * bank * 2.4;
        outc += skyCol(reflect(-V, Nw)) * 0.22 * bank;
      }

      /* --- the stream-order overlay ------------------------------------- */
      if (uOrderMode > 0.5) {
        outc *= 0.26;
        /* uO already carries each order out to a radius that grows with it
           (orderSpread, in the core) — so a fifth-order trunk is a broad band
           and a first-order stream is a thread. */
        float w = smoothstep(0.30, 0.95, vOrd);
        vec3 t = orderTint(max(vOrd, 1.0));
        outc = mix(outc, t * (0.85 + 0.55 * sh), w);
      }

      if (any(isnan(outc)) || any(isinf(outc))) outc = vec3(0.0);
      outc = fogged(outc, vW, uEye);
      outc = outc / (1.0 + outc * 0.62);          // a soft shoulder, no clipping
      frag = vec4(outc, 1.0);
    }`, 'terrain');

  const SEA = program(gl, `#version 300 es
    ${LIB}
    uniform mat4 uVP; uniform float uExtent;
    out vec3 vW;
    void main(){
      int id = gl_VertexID;
      vec2 q = vec2(float(id & 1), float((id >> 1) & 1)) * 2.0 - 1.0;
      vW = vec3(q.x * uExtent, 0.0, q.y * uExtent);
      gl_Position = uVP * vec4(vW, 1.0);
    }`, `#version 300 es
    ${LIB}
    uniform vec3 uEye;
    in vec3 vW;
    out vec4 frag;
    void main(){
      float bed = hAt(vW.xz);
      float depth = max(0.0, -bed);
      vec3 V = normalize(uEye - vW);
      float dist = length(uEye - vW);

      /* Six crossing swells. The short ones fade out with distance, or the
         whole sea moires into a plaid. */
      float t = uTime;
      vec2 p = vW.xz;
      vec2 slope = vec2(0.0);
      float amp = 0.55 + 0.45 * smoothstep(4.0, 40.0, depth);
      float detail = exp(-dist / 3400.0);
      for (int i = 0; i < 6; i++){
        float fi = float(i);
        float ang = 0.9 + fi * 1.17;
        vec2 k = vec2(cos(ang), sin(ang)) * (0.0038 * pow(1.72, fi));
        float a2 = amp * pow(0.70, fi) * mix(1.0, detail, clamp(fi / 3.0, 0.0, 1.0));
        float ph = dot(p, k) + t * (0.75 + 0.42 * fi) + fi * 2.1;
        slope += k * cos(ph) * a2 * 26.0;
      }
      vec3 N = normalize(vec3(-slope.x, 1.0, -slope.y));

      float fres = pow(1.0 - max(dot(N, V), 0.0), 4.5);
      vec3 shallowC = vec3(0.13,0.36,0.38), deepC = vec3(0.022,0.062,0.115);
      vec3 body = mix(shallowC, deepC, smoothstep(1.0, 30.0, depth));
      vec3 refl = skyCol(reflect(-V, N));
      vec3 col = mix(body * (0.30 + 0.70 * max(uSun.y, 0.05)), refl, clamp(0.045 + 0.92 * fres, 0.0, 0.97));

      float sp = pow(max(dot(normalize(V + uSun), N), 0.0), 260.0);
      col += uSunCol * sp * 2.0 * detail;

      /* surf: where the floor comes up to meet the surface */
      float band = smoothstep(6.5, 0.0, depth);
      float surf = band * (0.50 + 0.50 * sin(depth * 1.35 - t * 2.4));
      col = mix(col, vec3(0.90,0.94,0.95), clamp(surf, 0.0, 0.9) * 0.75);

      float a = smoothstep(-0.4, 1.2, depth);
      if (any(isnan(col)) || any(isinf(col))) { col = vec3(0.0); a = 1.0; }
      vec3 oc = fogged(col, vW, uEye);
      oc = oc / (1.0 + oc * 0.62);
      frag = vec4(oc, a);
    }`, 'sea');

  const DROP = program(gl, `#version 300 es
    layout(location=0) in vec3 aPos;
    layout(location=1) in float aS;
    uniform mat4 uVP; uniform float uHead, uPPM, uRad, uFade;
    out float vA;
    void main(){
      float d = uHead - aS;                 // aS is when the head gets HERE
      float live = step(0.0, d) * exp(-d * uFade);
      vA = live;
      gl_Position = uVP * vec4(aPos, 1.0);
      float r = uRad * (0.42 + 1.35 * live);
      gl_PointSize = clamp(uPPM * r / max(gl_Position.w, 1.0), 1.6, 48.0);
      if (live < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    }`, `#version 300 es
    precision highp float;
    in float vA; out vec4 frag;
    void main(){
      vec2 q = gl_PointCoord * 2.0 - 1.0;
      float r = dot(q,q);
      if (r > 1.0) discard;
      float a = (1.0 - r) * (1.0 - r) * (0.30 + 0.70 * vA);
      frag = vec4(mix(vec3(0.42,0.72,0.95), vec3(0.90,0.98,1.0), vA) * (0.55 + 0.85 * vA), a * vA);
    }`, 'drop');

  /* ── state ────────────────────────────────────────────────────────────── */
  const S = {
    N: 0, dx: 40, vx: 2.0, maxH: 600, extent: 60000,
    sunEl: 20, sunAz: 118, cloud: 0.35,
    orderMode: 0, omax: 4,
    cam: { yaw: 0.7, pitch: 0.34, dist: 15000, cx: 0, cz: 0, cy: 160 },
    dpr: 1, W: 1, H: 1,
    hCPU: null, wCPU: null
  };

  const texH = gl.createTexture(), texW = gl.createTexture(), texO = gl.createTexture();
  function mkTex(t) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  let idxBuf = null, idxCount = 0, vaoTerrain = null;
  const vaoEmpty = gl.createVertexArray();

  function setGrid(N, dx) {
    S.N = N; S.dx = dx;
    S.extent = Math.max(40000, N * dx * 4.0);
    for (const t of [texH, texW, texO]) mkTex(t);
    gl.bindTexture(gl.TEXTURE_2D, texH);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, N, N, 0, gl.RED, gl.FLOAT, null);
    gl.bindTexture(gl.TEXTURE_2D, texW);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, N, N, 0, gl.RED, gl.FLOAT, null);
    gl.bindTexture(gl.TEXTURE_2D, texO);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, N, N, 0, gl.RED, gl.UNSIGNED_BYTE, null);

    const q = N - 1, idx = new Uint32Array(q * q * 6);
    let k = 0;
    for (let y = 0; y < q; y++) for (let x = 0; x < q; x++) {
      const a = y * N + x, b = a + 1, c = a + N, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b;
      idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    idxCount = k;
    if (idxBuf) gl.deleteBuffer(idxBuf);
    idxBuf = gl.createBuffer();
    if (vaoTerrain) gl.deleteVertexArray(vaoTerrain);
    vaoTerrain = gl.createVertexArray();
    gl.bindVertexArray(vaoTerrain);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    S.cam.dist = N * dx * 0.84;
  }

  function setFields(h, w, o, maxH, omax) {
    if (omax) S.omax = omax;
    const N = S.N;
    /* the page hands these buffers straight back to the worker, which DETACHES
       them — so keep our own copy for picking. */
    if (!S.hCPU || S.hCPU.length !== h.length) S.hCPU = new Float32Array(h.length);
    S.hCPU.set(h);
    S.maxH = Math.max(60, maxH);
    gl.bindTexture(gl.TEXTURE_2D, texH);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RED, gl.FLOAT, h);
    gl.bindTexture(gl.TEXTURE_2D, texW);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RED, gl.FLOAT, w);
    gl.bindTexture(gl.TEXTURE_2D, texO);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RED, gl.UNSIGNED_BYTE, o);
  }

  /* ── the drop comets ──────────────────────────────────────────────────── */
  const dropVAO = gl.createVertexArray(), dropBuf = gl.createBuffer();
  gl.bindVertexArray(dropVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, dropBuf);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
  gl.bindVertexArray(null);
  let drops = [];                              /* {data:Float32Array, n, t0, len} */

  function setDrops(list) { drops = list; }

  /* ── sun / palette ────────────────────────────────────────────────────── */
  function sunVec() {
    const e = S.sunEl * Math.PI / 180, a = S.sunAz * Math.PI / 180;
    return [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
  }
  function palette() {
    const e = Math.max(-0.12, Math.sin(S.sunEl * Math.PI / 180));
    const warm = Math.pow(1 - Math.min(1, Math.max(0, e) / 0.45), 2.0);
    const day = Math.max(0, Math.min(1, e / 0.30));
    const sun = [
      1.30 * (0.55 + 0.60 * day) * (1.0),
      1.15 * (0.40 + 0.72 * day) * (1 - 0.30 * warm),
      1.00 * (0.28 + 0.80 * day) * (1 - 0.62 * warm)
    ];
    const zen = [0.10 + 0.16 * day, 0.20 + 0.28 * day, 0.38 + 0.42 * day];
    const hor = [
      0.34 + 0.36 * day + 0.34 * warm * day,
      0.40 + 0.40 * day + 0.10 * warm * day,
      0.46 + 0.42 * day - 0.06 * warm * day
    ];
    const gnd = [0.09 + 0.10 * day, 0.10 + 0.12 * day, 0.12 + 0.16 * day];
    return { sun, zen, hor, gnd };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    S.dpr = dpr; S.W = w; S.H = h;
  }

  function viewProj() {
    const c = S.cam;
    const eye = [
      c.cx + c.dist * Math.cos(c.pitch) * Math.sin(c.yaw),
      c.cy + c.dist * Math.sin(c.pitch),
      c.cz + c.dist * Math.cos(c.pitch) * Math.cos(c.yaw)
    ];
    const near = Math.max(20, c.dist * 0.008), far = Math.max(90000, c.dist * 12);
    const P = perspective(50 * Math.PI / 180, S.W / S.H, near, far);
    const V = lookAt(eye, [c.cx, c.cy, c.cz], [0, 1, 0]);
    return { VP: mul4(P, V), eye };
  }

  function common(pr, VP, eye, t) {
    const pal = palette(), sv = sunVec();
    const u = new Proxy(pr.u, { get: (o, k) => (k in o ? o[k] : null) });
    gl.uniform1i(u.uH, 0); gl.uniform1i(u.uW, 1); gl.uniform1i(u.uO, 2);
    gl.uniform1f(u.uN, S.N); gl.uniform1f(u.uCell, S.dx);
    gl.uniform1f(u.uVX, S.vx); gl.uniform1f(u.uMaxH, S.maxH);
    gl.uniform1f(u.uTime, t);
    gl.uniform3fv(u.uSun, sv);
    gl.uniform3fv(u.uSunCol, pal.sun);
    gl.uniform3fv(u.uZen, pal.zen);
    gl.uniform3fv(u.uHor, pal.hor);
    gl.uniform3fv(u.uGround, pal.gnd);
    gl.uniform1f(u.uSunTan, sv[1] / Math.max(1e-3, Math.hypot(sv[0], sv[2])));
    gl.uniform1f(u.uCloud, S.cloud);
    gl.uniform1f(u.uOmax, S.omax || 4);
    if (u.uVP) gl.uniformMatrix4fv(u.uVP, false, VP);
    if (u.uEye) gl.uniform3fv(u.uEye, eye);
  }

  function draw(t) {
    resize();
    const { VP, eye } = viewProj();
    gl.viewport(0, 0, S.W, S.H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texH);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texW);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texO);

    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(SKY.p);
    common(SKY, VP, eye, t);
    gl.uniformMatrix4fv(SKY.u.uInvVP, false, inv4(VP));
    gl.uniform2f(SKY.u.uViewport, S.W, S.H);
    gl.bindVertexArray(vaoEmpty);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!S.N) return;
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(TERRAIN.p);
    common(TERRAIN, VP, eye, t);
    gl.uniform1f(TERRAIN.u.uOrderMode, S.orderMode);
    gl.bindVertexArray(vaoTerrain);
    gl.drawElements(gl.TRIANGLES, idxCount, gl.UNSIGNED_INT, 0);

    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(SEA.p);
    common(SEA, VP, eye, t);
    gl.uniform1f(SEA.u.uExtent, S.extent);
    gl.bindVertexArray(vaoEmpty);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (drops.length) {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(DROP.p);
      gl.uniformMatrix4fv(DROP.u.uVP, false, VP);
      gl.uniform1f(DROP.u.uPPM, 0.5 * S.H / Math.tan(50 * Math.PI / 360));
      gl.bindVertexArray(dropVAO);
      for (const d of drops) {
        gl.bindBuffer(gl.ARRAY_BUFFER, dropBuf);
        gl.bufferData(gl.ARRAY_BUFFER, d.data, gl.DYNAMIC_DRAW);
        gl.uniform1f(DROP.u.uHead, d.head);
        gl.uniform1f(DROP.u.uRad, d.rad || Math.max(30, S.dx * 1.5));
        gl.uniform1f(DROP.u.uFade, d.fade || 3.2);
        gl.drawArrays(gl.POINTS, 0, d.n);
      }
    }
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }

  /* ── picking: march the view ray over the heightfield ─────────────────── */
  function pickCell(px, py) {
    if (!S.hCPU) return -1;
    const { VP, eye } = viewProj();
    const inv = inv4(VP);
    const nx = (px / canvas.clientWidth) * 2 - 1, ny = 1 - (py / canvas.clientHeight) * 2;
    const un = (v) => {
      const o = [
        inv[0] * v[0] + inv[4] * v[1] + inv[8] * v[2] + inv[12],
        inv[1] * v[0] + inv[5] * v[1] + inv[9] * v[2] + inv[13],
        inv[2] * v[0] + inv[6] * v[1] + inv[10] * v[2] + inv[14],
        inv[3] * v[0] + inv[7] * v[1] + inv[11] * v[2] + inv[15]];
      return [o[0] / o[3], o[1] / o[3], o[2] / o[3]];
    };
    const a = un([nx, ny, -1]), b = un([nx, ny, 1]);
    const dir = norm3(sub3(b, a));
    const N = S.N, dx = S.dx, half = (N - 1) * 0.5 * dx;
    const hAt = (x, z) => {
      const gx = x / dx + (N - 1) * 0.5, gz = z / dx + (N - 1) * 0.5;
      if (gx < 0 || gz < 0 || gx > N - 1 || gz > N - 1) return -9999;
      const i0 = Math.min(N - 2, Math.floor(gx)), j0 = Math.min(N - 2, Math.floor(gz));
      const fx = gx - i0, fz = gz - j0, H = S.hCPU;
      const h00 = H[j0 * N + i0], h10 = H[j0 * N + i0 + 1];
      const h01 = H[(j0 + 1) * N + i0], h11 = H[(j0 + 1) * N + i0 + 1];
      return (h00 * (1 - fx) + h10 * fx) * (1 - fz) + (h01 * (1 - fx) + h11 * fx) * fz;
    };
    let tMin = 0;
    /* skip forward to the bounding box of the island */
    const top = S.maxH * S.vx;
    if (eye[1] > top && dir[1] < 0) tMin = (top - eye[1]) / dir[1];
    let t = tMin, last = null;
    const stepLen = dx * 0.5, maxT = tMin + half * 8;
    for (let k = 0; k < 4200 && t < maxT; k++) {
      const p = [eye[0] + dir[0] * t, eye[1] + dir[1] * t, eye[2] + dir[2] * t];
      const surf = hAt(p[0], p[2]) * S.vx;
      if (surf > -9000 && p[1] <= surf) {
        /* refine */
        let lo = t - stepLen, hi = t;
        for (let r = 0; r < 26; r++) {
          const mid = (lo + hi) / 2;
          const q = [eye[0] + dir[0] * mid, eye[1] + dir[1] * mid, eye[2] + dir[2] * mid];
          if (q[1] <= hAt(q[0], q[2]) * S.vx) hi = mid; else lo = mid;
        }
        const q = [eye[0] + dir[0] * hi, eye[2] + dir[2] * hi];
        const gx = Math.round(q[0] / dx + (N - 1) * 0.5), gz = Math.round(q[1] / dx + (N - 1) * 0.5);
        if (gx < 0 || gz < 0 || gx > N - 1 || gz > N - 1) return -1;
        return gz * N + gx;
      }
      t += stepLen * (1 + k * 0.004);
      last = p;
    }
    return -1;
  }

  function cellWorld(i, lift) {
    const N = S.N, x = i % N, y = (i / N) | 0;
    return [
      (x - (N - 1) * 0.5) * S.dx,
      (S.hCPU ? S.hCPU[i] : 0) * S.vx + (lift || 0),
      (y - (N - 1) * 0.5) * S.dx
    ];
  }

  return {
    gl, S, setGrid, setFields, setDrops, draw, resize, pickCell, cellWorld,
    get cam() { return S.cam; },
    set vx(v) { S.vx = v; },
    get vx() { return S.vx; },
    set sunEl(v) { S.sunEl = v; }, get sunEl() { return S.sunEl; },
    set sunAz(v) { S.sunAz = v; }, get sunAz() { return S.sunAz; },
    set cloud(v) { S.cloud = v; },
    set orderMode(v) { S.orderMode = v ? 1 : 0; },
    get orderMode() { return S.orderMode; }
  };
}
