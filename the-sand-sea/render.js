/* ════════════════════════════════════════════════════════════════════════════
   render.js — THE SAND SEA · WebGL2.

   A dune field at low sun, drawn from the simulation's own height field.

   · NO VERTEX ATTRIBUTES for the terrain.  Each vertex derives its cell from
     gl_VertexID and fetches its own height out of an R32F texture, so a step of
     the solver is one texSubImage and nothing else moves.
   · SHADOWS ARE A HORIZON MARCH over that same texture — the fragment walks
     toward the sun and asks whether the sand ever rises above the sun's own
     elevation.  No shadow map, so no shadow-map bias to get wrong, and the long
     raking shadow of a slip face at dawn is exact.
   · THE FIELD IS A TORUS, so the desert is drawn 3x3 and runs to the horizon.
   · THE DRIFTING HAZE IS THE MODEL'S OWN FLUX.  The sand you see moving is the
     sand the simulation actually moved, read out of the crossing counter.

   No backtick appears anywhere inside a shader string, comments included — one
   would end the template literal early and kill the module (see LANDMINES).
   ════════════════════════════════════════════════════════════════════════════ */

function compile(gl, type, src, tag) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    const numbered = src.split('\n').map((l, i) => (i + 1) + '| ' + l).join('\n');
    throw new Error('shader ' + tag + ': ' + log + '\n' + numbered);
  }
  return s;
}
function program(gl, vs, fs, tag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, tag + '.vs'));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, tag + '.fs'));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link ' + tag + ': ' + gl.getProgramInfoLog(p));
  return p;
}

/* ── small matrix kit ────────────────────────────────────────────────────── */
function mul4(a, b) {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
    o[i * 4 + j] = s;
  }
  return o;
}
function perspective(fovy, asp, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  return new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1,
    0, 0, 2 * far * near / (near - far), 0]);
}
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function lookAt(eye, ctr, up) {
  const f = norm3(sub3(ctr, eye)), s = norm3(cross3(f, up)), u = cross3(s, f);
  return new Float32Array([
    s[0], u[0], -f[0], 0, s[1], u[1], -f[1], 0, s[2], u[2], -f[2], 0,
    -(s[0] * eye[0] + s[1] * eye[1] + s[2] * eye[2]),
    -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]),
    (f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2]), 1]);
}

/* ════════════════════════════════════════════════════════════════════════════
   THE SHADER LIBRARY — shared by every stage.  Nothing here touches
   gl_FragCoord, so it is safe in a vertex shader too (see LANDMINES).
   ════════════════════════════════════════════════════════════════════════════ */
const LIB = `
precision highp float;
precision highp sampler2D;

uniform sampler2D uH;        /* height, in metres, R32F, one texel per cell   */
uniform sampler2D uQ;        /* saltation flux, R32F, same grid               */
uniform vec2  uGrid;         /* NX, NY                                        */
uniform float uDX;           /* metres per cell                               */
uniform vec3  uSun;          /* unit vector TOWARD the sun, world space       */
uniform vec3  uSunCol;
uniform vec3  uSkyCol;
uniform vec3  uHaze;
uniform vec3  uEye;
uniform float uVE;           /* vertical exaggeration                         */
uniform float uTime;
uniform vec2  uWind;         /* unit vector the sand travels toward           */

float hcell(vec2 c) {
  vec2 w = mod(c, uGrid);
  return texelFetch(uH, ivec2(w), 0).r;
}
float qcell(vec2 c) {
  vec2 w = mod(c, uGrid);
  return texelFetch(uQ, ivec2(w), 0).r;
}
/* the surface is sampled at cell centres, so a bilinear read is exact between
   them and needs no filterable float texture (which core WebGL2 does not have) */
float hAt(vec2 c) {
  vec2 f = fract(c), i = floor(c);
  float a = hcell(i), b = hcell(i + vec2(1.0, 0.0));
  float d = hcell(i + vec2(0.0, 1.0)), e = hcell(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(d, e, f.x), f.y);
}
vec3 normalAt(vec2 c) {
  float l = hAt(c - vec2(1.0, 0.0)), r = hAt(c + vec2(1.0, 0.0));
  float d = hAt(c - vec2(0.0, 1.0)), u = hAt(c + vec2(0.0, 1.0));
  return normalize(vec3(-(r - l) * uVE, 2.0 * uDX, -(u - d) * uVE));
}
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}
/* an interleaved-gradient dither: too few march steps then read as a fine even
   weave instead of hard rings */
float ign(vec2 p) {
  return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}
`;

/* ── the terrain ─────────────────────────────────────────────────────────── */
const TERRAIN_VS = LIB + `
layout(location=0) in vec2 aCell;      /* cell corner, 0..NX / 0..NY          */
uniform mat4 uVP;
uniform vec2 uTile;                    /* which copy of the torus, in tiles   */
out vec3 vPos;
out vec3 vNrm;
out vec2 vCell;
out float vH;
void main() {
  vec2 c = aCell;
  float h = hAt(c) * uVE;
  vec3 p = vec3((c.x + uTile.x * uGrid.x) * uDX, h, (c.y + uTile.y * uGrid.y) * uDX);
  vPos = p;
  vNrm = normalAt(c);
  vCell = c;
  vH = hAt(c);
  gl_Position = uVP * vec4(p, 1.0);
}
`;

const TERRAIN_FS = LIB + `
in vec3 vPos;
in vec3 vNrm;
in vec2 vCell;
in float vH;
out vec4 oCol;
uniform float uSunTan;      /* tan of the sun elevation                        */
uniform vec2  uSunDir2;     /* the sun bearing on the ground plane             */
uniform float uFogK;
uniform float uRipple;

/* THE HORIZON MARCH.  Walk toward the sun over the height field and ask
   whether anything rises above the sun's own elevation as seen from here. */
float sunlight(vec2 c, float h0, float jitter) {
  float horizon = -9.0;
  float d = 0.6 + jitter * 0.8;
  for (int i = 0; i < 40; i++) {
    vec2 s = c + uSunDir2 * d;
    float th = hAt(s) * uVE;
    horizon = max(horizon, (th - h0) / (d * uDX));
    d *= 1.16;
    if (d > 90.0) break;
  }
  float k = 0.035;
  return 1.0 - smoothstep(uSunTan - k, uSunTan + k, horizon);
}

void main() {
  float jitter = ign(gl_FragCoord.xy + vec2(uTime * 13.0));
  vec3 n = normalize(vNrm);

  /* WIND RIPPLES.  Drawn, not solved: a 10 cm ripple is a fiftieth of a cell,
     so the model cannot carry them and the room says so on its card.  They lie
     across the wind, as real ones do, and they fade out on the slip face,
     where a real lee is smooth. */
  vec2 wperp = vec2(-uWind.y, uWind.x);
  float along = dot(vPos.xz, uWind) / uDX;
  float across = dot(vPos.xz, wperp) / uDX;
  float rip = sin(along * 1.35 + fbm(vPos.xz * 0.045) * 5.0 + across * 0.16);
  float lee = smoothstep(0.30, 0.05, dot(normalize(vec3(n.x, 0.0, n.z) + vec3(1e-5)), vec3(uWind.x, 0.0, uWind.y)) * (1.0 - n.y));
  float ripAmp = uRipple * (0.55 + 0.45 * smoothstep(0.0, 0.6, n.y)) * lee;
  vec3 rn = normalize(n + vec3(uWind.x, 0.0, uWind.y) * rip * ripAmp * 0.13);
  rn = normalize(mix(n, rn, 0.85));

  float sh = sunlight(vCell, vH * uVE, jitter);
  float ndl = max(0.0, dot(rn, uSun));
  /* the sky is a bright dome at dawn: a hemisphere term, not a constant */
  float sky = 0.5 + 0.5 * rn.y;

  /* sand: pale and warm in the sun, and BLUE where only the sky reaches it —
     that split is most of what makes a desert look like a desert, so the sky
     term is a real hemisphere light and not a token ambient */
  vec3 albedo = vec3(0.94, 0.80, 0.60);
  albedo *= 0.94 + 0.12 * fbm(vPos.xz * 0.021);
  /* the slip face is freshly avalanched and reads a shade cleaner */
  float steep = smoothstep(0.55, 0.85, 1.0 - rn.y);
  albedo = mix(albedo, albedo * vec3(0.95, 0.93, 0.93), steep);

  vec3 lit = albedo * (uSunCol * ndl * sh * 1.35 + uSkyCol * sky * 0.62);

  /* a low sun grazing sand gives it a forward-scattering sheen */
  vec3 V = normalize(uEye - vPos);
  float fres = pow(1.0 - max(0.0, dot(V, rn)), 4.0);
  lit += uSunCol * fres * 0.09 * sh;

  /* the saltating sheet: the model's own flux, lying a few centimetres thick */
  float q = qcell(vCell);
  float drift = fbm(vec2(along * 0.5 - uTime * 2.6, across * 0.28));
  float haze = clamp(q, 0.0, 1.4) * (0.30 + 0.70 * drift);
  lit = mix(lit, uHaze * (0.60 + 0.45 * sh), clamp(haze * 0.30, 0.0, 0.5));

  float dist = length(uEye - vPos);
  float fog = 1.0 - exp(-dist * uFogK);
  vec3 col = mix(lit, uHaze, fog * 0.92);

  /* a gentle shoulder, so a lit crest can be bright without the shade going
     to mud and without anything clipping to a flat white */
  col = col / (col + vec3(0.86)) * 1.86;

  if (any(isnan(col)) || any(isinf(col))) col = uHaze;
  oCol = vec4(col, 1.0);
}
`;

/* ── the sky ─────────────────────────────────────────────────────────────── */
const SKY_VS = `#version 300 es
layout(location=0) in vec2 aP;
out vec2 vUV;
void main(){ vUV = aP; gl_Position = vec4(aP, 0.9999, 1.0); }
`;
const SKY_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 oCol;
uniform mat4 uInvVP;
uniform vec3 uEye;
uniform vec3 uSun;
uniform vec3 uSunCol;
uniform vec3 uSkyCol;
uniform vec3 uHaze;
void main() {
  vec4 f = uInvVP * vec4(vUV, 1.0, 1.0);
  vec3 dir = normalize(f.xyz / f.w - uEye);
  float up = clamp(dir.y, -1.0, 1.0);
  vec3 col = mix(uHaze, uSkyCol, smoothstep(-0.02, 0.55, up));
  float mu = max(0.0, dot(dir, uSun));
  col += uSunCol * pow(mu, 12.0) * 0.55 * (1.0 - smoothstep(0.0, 0.4, up));
  col += uSunCol * pow(mu, 900.0) * 3.2;
  /* a warm band low in the sky, where the light has come a long way through
     the dust a desert always has in it */
  col = mix(col, uHaze * 1.06, exp(-max(0.0, up) * 9.0) * 0.75);
  if (any(isnan(col)) || any(isinf(col))) col = uHaze;
  oCol = vec4(col, 1.0);
}
`;

/* ════════════════════════════════════════════════════════════════════════════
   THE RENDERER
   ════════════════════════════════════════════════════════════════════════════ */
export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {
    antialias: true, alpha: false, depth: true, powerPreference: 'high-performance'
  });
  if (!gl) throw new Error('This room needs WebGL2.');
  gl.getExtension('EXT_color_buffer_float');

  const V300 = '#version 300 es\n';
  const terrain = program(gl, V300 + TERRAIN_VS, V300 + TERRAIN_FS, 'terrain');
  const sky = program(gl, SKY_VS, SKY_FS, 'sky');

  let NX = 0, NY = 0, DX = 2, VE = 1.0;
  let hTex = null, qTex = null, cellBuf = null, idxBuf = null, nIdx = 0, vao = null;

  const skyVao = gl.createVertexArray();
  gl.bindVertexArray(skyVao);
  const skyBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  function mkTex(w, h) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, w, h);
    /* NEAREST, always: a 32-bit float texture is not filterable in core WebGL2
       and a LINEAR sampler on one returns BLACK for every fetch (LANDMINES).
       The bilinear that matters is done by hand in hAt(). */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return t;
  }

  function setGrid(nx, ny, dx) {
    NX = nx; NY = ny; DX = dx;
    if (hTex) gl.deleteTexture(hTex);
    if (qTex) gl.deleteTexture(qTex);
    hTex = mkTex(NX, NY); qTex = mkTex(NX, NY);

    /* one vertex per cell corner; the last row/column wraps back onto the
       first, which is what makes the tiles join seamlessly */
    const W = NX + 1, H = NY + 1;
    const cells = new Float32Array(W * H * 2);
    for (let y = 0, k = 0; y < H; y++) for (let x = 0; x < W; x++) { cells[k++] = x; cells[k++] = y; }
    const idx = new Uint32Array(NX * NY * 6);
    for (let y = 0, k = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      const a = y * W + x, b = a + 1, c = a + W, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b;
      idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    nIdx = idx.length;

    if (vao) gl.deleteVertexArray(vao);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    if (cellBuf) gl.deleteBuffer(cellBuf);
    cellBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cellBuf);
    gl.bufferData(gl.ARRAY_BUFFER, cells, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    if (idxBuf) gl.deleteBuffer(idxBuf);
    idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
  }

  function upload(heights, flux) {
    if (!hTex) return;
    gl.bindTexture(gl.TEXTURE_2D, hTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NX, NY, gl.RED, gl.FLOAT, heights);
    if (flux) {
      gl.bindTexture(gl.TEXTURE_2D, qTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NX, NY, gl.RED, gl.FLOAT, flux);
    }
  }

  const st = {
    yaw: -0.62, pitch: 0.20, dist: 620, target: [0, 0, 0],
    sunAz: 2.35, sunEl: 0.155, ve: 1.0, ripple: 1.0, tiles: 1
  };

  function sunVec() {
    return [Math.cos(st.sunEl) * Math.cos(st.sunAz), Math.sin(st.sunEl), Math.cos(st.sunEl) * Math.sin(st.sunAz)];
  }
  function palette() {
    /* the lower the sun, the redder it gets and the more the sky owns the shade */
    const e = Math.max(0.0, Math.min(1, st.sunEl / 0.9));
    const warm = 1 - e;
    return {
      sun: [1.08 + 0.14 * warm, 0.82 - 0.15 * warm, 0.58 - 0.33 * warm],
      sky: [0.22 + 0.10 * e, 0.36 + 0.14 * e, 0.72 + 0.14 * e],
      haze: [0.62 + 0.22 * warm, 0.52 + 0.10 * warm, 0.46 - 0.04 * warm]
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return [w, h];
  }

  function camera(w, h) {
    const cxm = NX * DX * 0.5, czm = NY * DX * 0.5;
    const ctr = [cxm + st.target[0], st.target[1], czm + st.target[2]];
    const eye = [
      ctr[0] + st.dist * Math.cos(st.pitch) * Math.cos(st.yaw),
      ctr[1] + st.dist * Math.sin(st.pitch),
      ctr[2] + st.dist * Math.cos(st.pitch) * Math.sin(st.yaw)
    ];
    const P = perspective(48 * Math.PI / 180, w / h, 4, 12000);
    const V = lookAt(eye, ctr, [0, 1, 0]);
    return { eye, VP: mul4(P, V) };
  }

  function invert4(m) {
    const inv = new Float32Array(16), a = m;
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
    let det = a[0]*inv[0]+a[1]*inv[4]+a[2]*inv[8]+a[3]*inv[12];
    if (!det) return inv;
    det = 1 / det;
    for (let i = 0; i < 16; i++) inv[i] *= det;
    return inv;
  }

  let lastCam = null;

  function draw(t, wind) {
    const [w, h] = resize();
    gl.viewport(0, 0, w, h);
    const cam = camera(w, h);
    lastCam = { VP: cam.VP, eye: cam.eye, w, h };
    const pal = palette();
    const sun = sunVec();
    const sunTan = Math.tan(st.sunEl);
    const sunDir2 = norm3([sun[0], 0, sun[2]]);

    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(sky);
    gl.uniformMatrix4fv(gl.getUniformLocation(sky, 'uInvVP'), false, invert4(cam.VP));
    gl.uniform3fv(gl.getUniformLocation(sky, 'uEye'), cam.eye);
    gl.uniform3fv(gl.getUniformLocation(sky, 'uSun'), sun);
    gl.uniform3fv(gl.getUniformLocation(sky, 'uSunCol'), pal.sun);
    gl.uniform3fv(gl.getUniformLocation(sky, 'uSkyCol'), pal.sky);
    gl.uniform3fv(gl.getUniformLocation(sky, 'uHaze'), pal.haze);
    gl.bindVertexArray(skyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(terrain);
    const u = n => gl.getUniformLocation(terrain, n);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hTex);
    gl.uniform1i(u('uH'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, qTex);
    gl.uniform1i(u('uQ'), 1);
    gl.uniform2f(u('uGrid'), NX, NY);
    gl.uniform1f(u('uDX'), DX);
    gl.uniform1f(u('uVE'), st.ve);
    gl.uniform1f(u('uTime'), t);
    gl.uniform1f(u('uRipple'), st.ripple);
    gl.uniform3fv(u('uSun'), sun);
    gl.uniform3fv(u('uSunCol'), pal.sun);
    gl.uniform3fv(u('uSkyCol'), pal.sky);
    gl.uniform3fv(u('uHaze'), pal.haze);
    gl.uniform3fv(u('uEye'), cam.eye);
    gl.uniform1f(u('uSunTan'), sunTan);
    gl.uniform2f(u('uSunDir2'), sunDir2[0], sunDir2[2]);
    gl.uniform1f(u('uFogK'), 0.00030);
    gl.uniform2f(u('uWind'), wind ? wind[0] : 1, wind ? wind[1] : 0);
    gl.uniformMatrix4fv(u('uVP'), false, cam.VP);
    gl.bindVertexArray(vao);
    const T = st.tiles;
    const uTile = u('uTile');
    for (let ty = -T; ty <= T; ty++) for (let tx = -T; tx <= T; tx++) {
      gl.uniform2f(uTile, tx, ty);
      gl.drawElements(gl.TRIANGLES, nIdx, gl.UNSIGNED_INT, 0);
    }
    gl.bindVertexArray(null);
  }

  /* project a world point to CSS pixels — used by the 2-D overlay for the
     tagged dunes' trails and labels */
  function project(p) {
    if (!lastCam) return null;
    const m = lastCam.VP;
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const wc = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    if (wc <= 0.001) return null;
    return [(x / wc * 0.5 + 0.5) * canvas.clientWidth, (0.5 - y / wc * 0.5) * canvas.clientHeight, wc];
  }

  /* the eye ray through a CSS pixel — returns [origin, unit direction] */
  function pickRay(px, py) {
    if (!lastCam) return null;
    const x = px / canvas.clientWidth * 2 - 1;
    const y = 1 - py / canvas.clientHeight * 2;
    const inv = invert4(lastCam.VP);
    const un = z => {
      const w = inv[3] * x + inv[7] * y + inv[11] * z + inv[15];
      return [(inv[0] * x + inv[4] * y + inv[8] * z + inv[12]) / w,
              (inv[1] * x + inv[5] * y + inv[9] * z + inv[13]) / w,
              (inv[2] * x + inv[6] * y + inv[10] * z + inv[14]) / w];
    };
    const a = un(-1), b = un(1);
    return [lastCam.eye, norm3(sub3(b, a))];
  }

  return { gl, st, setGrid, upload, draw, project, pickRay, sunVec,
           get NX() { return NX; }, get NY() { return NY; }, get DX() { return DX; } };
}
