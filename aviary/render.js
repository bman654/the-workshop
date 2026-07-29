/* ============================================================================
 *  THE AVIARY -- render.js
 *
 *  A wood, twenty minutes before the sun clears the ridge.  WebGL2.
 *
 *  Nothing here is a texture and nothing is loaded: the trees are grown by a
 *  recursive generalised-cylinder walk from a seeded PRNG, the birds are lathed
 *  out of a radius profile, and the sky is an analytic dawn.  Everything is
 *  drawn nearly in silhouette, because that is what a wood looks like when the
 *  light is all coming from one place low down and behind it -- and because a
 *  rim is a very forgiving way to draw a bird.
 *
 *  Passes:  scene -> HDR  ->  bright  ->  blur H/V  ->  composite (bloom +
 *  radial god-rays from the sun's screen position) -> tonemap.
 *
 *  Attribute slots are PINNED in every shader (see LANDMINES.md): the linker is
 *  otherwise free to renumber them per program.
 * ========================================================================== */

export const A_POS = 0, A_NRM = 1, A_PART = 2;

/* ── a seeded PRNG so the wood is the same wood every visit ───────────────── */
export function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── tiny vector / matrix helpers ─────────────────────────────────────────── */
function nrm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function perspective(fovy, asp, n, f) {
  const t = 1 / Math.tan(fovy / 2);
  return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0];
}
function lookAt(eye, at, up) {
  const z = nrm([eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]]);
  const x = nrm(cross(up, z)), y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
    -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
    -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1];
}
function mul(a, b) {
  const o = new Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
    o[i * 4 + j] = s;
  }
  return o;
}

/* ── a mesh builder that emits pos/nrm/part triples ───────────────────────── */
export function Mesh() { this.p = []; this.n = []; this.k = []; }
Mesh.prototype.tri = function (a, b, c, na, nb, nc, part) {
  this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  this.n.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
  this.k.push(part, part, part);
};
/* a tapered tube through a polyline of {p, r} with K sides */
Mesh.prototype.tube = function (path, K, part) {
  const rings = [];
  let up = [0, 1, 0];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)].p, b = path[Math.min(path.length - 1, i + 1)].p;
    let dir = nrm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    if (!isFinite(dir[0])) dir = [0, 1, 0];
    let sx = cross(up, dir);
    if (Math.hypot(sx[0], sx[1], sx[2]) < 1e-4) { up = [1, 0, 0]; sx = cross(up, dir); }
    sx = nrm(sx);
    const sy = nrm(cross(dir, sx));
    const ring = [], rnv = [];
    for (let j = 0; j < K; j++) {
      const th = j / K * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
      const nv = nrm([sx[0] * c + sy[0] * s, sx[1] * c + sy[1] * s, sx[2] * c + sy[2] * s]);
      ring.push([path[i].p[0] + nv[0] * path[i].r, path[i].p[1] + nv[1] * path[i].r, path[i].p[2] + nv[2] * path[i].r]);
      rnv.push(nv);
    }
    rings.push({ ring: ring, nv: rnv });
  }
  for (let i = 0; i + 1 < rings.length; i++) {
    for (let j = 0; j < K; j++) {
      const j2 = (j + 1) % K;
      const A = rings[i].ring[j], B = rings[i].ring[j2], C = rings[i + 1].ring[j2], D = rings[i + 1].ring[j];
      const na = rings[i].nv[j], nb = rings[i].nv[j2], nc = rings[i + 1].nv[j2], nd = rings[i + 1].nv[j];
      this.tri(A, B, C, na, nb, nc, part);
      this.tri(A, C, D, na, nc, nd, part);
    }
  }
};
Mesh.prototype.buffers = function () {
  return { p: new Float32Array(this.p), n: new Float32Array(this.n), k: new Float32Array(this.k),
    count: this.p.length / 3 };
};

/* ── growing a tree ───────────────────────────────────────────────────────── */
function branch(mesh, rnd, base, dir, len, rad, depth, out) {
  const steps = depth === 0 ? 7 : 4;
  const path = [];
  let p = base.slice(), d = dir.slice();
  const bendAx = nrm([rnd() - 0.5, rnd() * 0.2, rnd() - 0.5]);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push({ p: p.slice(), r: rad * (1 - 0.82 * t) + 0.004 });
    const w = 0.16 * (rnd() - 0.4);
    d = nrm([d[0] + bendAx[0] * w, d[1] + bendAx[1] * w * 0.35, d[2] + bendAx[2] * w]);
    const s = len / steps;
    p = [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];
  }
  mesh.tube(path, depth === 0 ? 8 : 6, 0);
  if (depth >= 4 || rad < 0.007) { out.push({ p: p, d: d, r: rad }); return; }
  const kids = depth === 0 ? 3 + ((rnd() * 2) | 0) : 2 + ((rnd() * 1.6) | 0);
  for (let i = 0; i < kids; i++) {
    const t = 0.45 + 0.55 * (i + rnd()) / kids;
    const idx = Math.min(path.length - 1, Math.round(t * steps));
    const from = path[idx].p;
    const ax = nrm([rnd() - 0.5, rnd() * 0.35 + 0.15, rnd() - 0.5]);
    const spread = depth === 0 ? 0.62 : 0.78;
    const nd = nrm([d[0] + ax[0] * spread, d[1] + ax[1] * spread * 0.5, d[2] + ax[2] * spread]);
    branch(mesh, rnd, from, nd, len * (0.52 + rnd() * 0.22), path[idx].r * 0.58, depth + 1, out);
  }
}

export function buildForest(seed) {
  const rnd = mulberry(seed);
  const mesh = new Mesh();
  const tips = [];
  const trees = [];
  /* a clearing straight ahead so the sun has somewhere to come through */
  for (let i = 0; i < 46; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = 5 + Math.pow(rnd(), 0.7) * 46;
    let x = Math.sin(ang) * dist, z = Math.cos(ang) * dist;
    if (z > 0 && Math.abs(x) < 5.5 && z < 34) { x += (x < 0 ? -1 : 1) * 6.5; }
    if (Math.hypot(x, z) < 4.2) continue;
    const h = 5.5 + rnd() * 8.5;
    const r = 0.10 + rnd() * 0.17 + h * 0.011;
    const tipsHere = [];
    branch(mesh, rnd, [x, 0, z], nrm([(rnd() - 0.5) * 0.14, 1, (rnd() - 0.5) * 0.14]), h, r, 0, tipsHere);
    for (const t of tipsHere) tips.push(t);
    trees.push({ x: x, z: z, h: h });
  }
  return { mesh: mesh, tips: tips, trees: trees };
}

/* THE BOUGHS: three branches crossing the frame at three depths, so that every
   bird in the wood is near enough to read as a bird.  A songbird eighteen
   metres off is four pixels of nothing; this room does not have any of those. */
const BOUGHS = [
  { z: 2.05, y: 2.16, x0: -2.35, x1: 0.85, r: 0.042, sag: 0.22, perch: [0.30] },
  { z: 4.40, y: 2.62, x0: 3.90, x1: -0.90, r: 0.048, sag: 0.36, perch: [0.30, 0.72] },
  { z: 7.90, y: 3.35, x0: -5.10, x1: 1.60, r: 0.050, sag: 0.52, perch: [0.30, 0.62] },
  { z: 12.4, y: 4.30, x0: 6.30, x1: -1.20, r: 0.044, sag: 0.62, perch: [0.40] },
];

export function buildBoughs(seed) {
  const rnd = mulberry(seed);
  const mesh = new Mesh();
  const perches = [];
  for (let bi = 0; bi < BOUGHS.length; bi++) {
    const B = BOUGHS[bi];
    const N = 26;
    const path = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = B.x0 + t * (B.x1 - B.x0);
      const y = B.y - B.sag * Math.sin(t * Math.PI * 0.92) - 0.10 * t;
      const z = B.z + 0.55 * Math.sin(t * 1.9 + bi * 1.3);
      path.push({ p: [x, y, z], r: B.r * (1 - 0.42 * t) + 0.012 });
    }
    mesh.tube(path, 9, 0);
    for (let i = 2; i < N - 1; i += 2) {
      const b = path[i];
      const ax = nrm([(rnd() - 0.5) * 1.3, 0.60 + rnd() * 0.7, (rnd() - 0.5) * 1.1]);
      branch(mesh, rnd, b.p, ax, 0.42 + rnd() * 0.62, b.r * 0.46, 2, []);
    }
    for (const t of B.perch) {
      const i = Math.round(t * N);
      perches.push({ p: [path[i].p[0], path[i].p[1] + path[i].r * 0.9, path[i].p[2]], depth: bi });
    }
  }
  /* a few twigs right at the lens, in the corners: depth, and a frame */
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (2.1 + rnd() * 1.6);
    const y = 0.90 + rnd() * 2.4;
    const z = 1.9 + rnd() * 1.8;
    const ax = nrm([-side * (0.30 + rnd() * 0.6), 0.30 + rnd() * 0.9, 0.20 + rnd() * 0.6]);
    branch(mesh, rnd, [x, y, z], ax, 0.42 + rnd() * 0.65, 0.009 + rnd() * 0.008, 3, []);
  }
  return { mesh: mesh, perches: perches };
}

/* ── lathing a bird ───────────────────────────────────────────────────────── */
/*  parts: 0 body+tail+wings   1 head + upper beak   2 lower beak   3 throat  */
export function buildBird() {
  const m = new Mesh();
  const K = 16;
  /* ONE continuous lathe from tail-root to beak-base: the head is a bulge in
     the profile with a neck pinch before it, not a sphere stuck on the front.
     (It was a sphere stuck on the front for one iteration, and it looked
     exactly like a sphere stuck on the front.) */
  const prof = [
    [-0.60, 0.024, -0.055], [-0.50, 0.052, -0.040], [-0.38, 0.090, -0.026],
    [-0.22, 0.130, -0.012], [-0.06, 0.150, 0.000], [0.08, 0.148, 0.012],
    [0.19, 0.132, 0.030], [0.27, 0.104, 0.052], [0.325, 0.088, 0.072],
    [0.375, 0.098, 0.093], [0.435, 0.104, 0.110], [0.495, 0.088, 0.118],
    [0.545, 0.058, 0.116], [0.575, 0.036, 0.112],
  ];
  m.tube(prof.map((q) => ({ p: [q[0], q[2], 0], r: q[1] })), K, 0);

  /* the beak: two short wedges meeting at a hinge just in front of the head */
  const HX = 0.575, HY = 0.112;
  m.tube([{ p: [HX - 0.01, HY + 0.014, 0], r: 0.030 }, { p: [HX + 0.055, HY + 0.010, 0], r: 0.020 },
          { p: [HX + 0.135, HY + 0.001, 0], r: 0.0035 }], 7, 1);
  m.tube([{ p: [HX - 0.01, HY - 0.012, 0], r: 0.026 }, { p: [HX + 0.052, HY - 0.010, 0], r: 0.016 },
          { p: [HX + 0.126, HY - 0.006, 0], r: 0.0035 }], 7, 2);

  /* the throat, tucked INSIDE the neck at rest so it only shows when it swells */
  const th = [];
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    th.push({ p: [0.14 + u * 0.20, -0.008 + u * 0.085, 0],
      r: 0.055 + 0.038 * Math.sin(u * Math.PI) });
  }
  m.tube(th, 12, 3);

  /* the tail: two long thin feathers, slightly fanned and cocked up */
  for (const s of [-1, 1]) {
    m.tube([{ p: [-0.54, -0.045, s * 0.012], r: 0.028 },
            { p: [-0.78, -0.012, s * 0.030], r: 0.019 },
            { p: [-1.02, 0.030, s * 0.048], r: 0.007 }], 5, 0);
  }
  /* the folded wing: a long shell lying along the flank, tip past the rump */
  for (const s of [-1, 1]) {
    const w = [];
    for (let i = 0; i <= 7; i++) {
      const u = i / 7;
      w.push({ p: [0.15 - u * 0.68, 0.030 - u * 0.075, s * (0.085 + 0.030 * Math.sin(u * 2.6))],
        r: 0.050 * Math.sin(0.35 + u * 2.5) + 0.006 });
    }
    m.tube(w, 7, 0);
  }
  /* legs, planted */
  for (const s of [-1, 1]) {
    m.tube([{ p: [0.055, -0.115, s * 0.042], r: 0.013 },
            { p: [0.040, -0.205, s * 0.047], r: 0.0095 },
            { p: [0.056, -0.262, s * 0.047], r: 0.0075 }], 5, 0);
    m.tube([{ p: [0.020, -0.262, s * 0.047], r: 0.006 },
            { p: [0.105, -0.268, s * 0.047], r: 0.004 }], 4, 0);
  }
  return m;
}

/* ── shaders ──────────────────────────────────────────────────────────────── */
const SKY = [
  'vec3 skyColour(vec3 rd, vec3 sun, float light){',
  '  float up = clamp(rd.y*0.5+0.5, 0.0, 1.0);',
  '  float mu = clamp(dot(normalize(rd), sun), -1.0, 1.0);',
  '  vec3 night = vec3(0.020,0.028,0.062);',
  '  vec3 zen   = mix(vec3(0.014,0.024,0.056), vec3(0.036,0.082,0.176), light);',
  '  vec3 mid   = mix(vec3(0.030,0.034,0.064), vec3(0.108,0.146,0.232), light);',
  '  vec3 horiz = mix(vec3(0.072,0.044,0.044), vec3(0.430,0.216,0.096), light);',
  '  vec3 c = mix(night, zen, smoothstep(0.0,1.0,light*0.85+0.15));',
  '  c = mix(mid, c, smoothstep(0.06, 0.52, up));',
  '  c = mix(horiz, c, smoothstep(0.0, 0.20, up));',
  /* the glow around the sun, and the sun itself */
  '  float g = pow(max(mu,0.0), 14.0);',
  '  c += mix(vec3(0.20,0.075,0.026), vec3(0.78,0.40,0.165), light) * g * (0.35+1.1*light);',
  '  float halo = pow(max(mu,0.0), 520.0);',
  '  c += vec3(2.4,1.55,0.92) * halo * (0.15 + 1.7*light);',
  '  float disc = smoothstep(0.99930, 0.99968, mu);',
  '  c += vec3(14.0,9.6,6.0) * disc * (0.15 + 2.0*light);',
  '  return c;',
  '}',
  'float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
  'float vnoise(vec2 p){',
  '  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);',
  '  return mix(mix(hsh(i),hsh(i+vec2(1,0)),u.x), mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),u.x), u.y);',
  '}',
  'float fbm(vec2 p){ float a=0.5,s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5;} return s; }',
].join('\n');

const VS_SCENE = [
  '#version 300 es',
  'precision highp float;',
  'layout(location=0) in vec3 aPos;',
  'layout(location=1) in vec3 aNrm;',
  'layout(location=2) in float aPart;',
  'uniform mat4 uVP;',
  'uniform mat4 uModel;',
  'uniform float uBeak, uThroat, uPuff;',
  'out vec3 vWorld; out vec3 vNrm;',
  'void main(){',
  '  vec3 p = aPos; vec3 n = aNrm;',
  '  if (aPart > 1.5 && aPart < 2.5) {',       /* lower beak: hinge open */
  '    vec2 d = p.xy - vec2(0.565, 0.106);',
  '    float c = cos(-uBeak), s = sin(-uBeak);',
  '    p.xy = vec2(0.565, 0.106) + vec2(c*d.x - s*d.y, s*d.x + c*d.y);',
  '  } else if (aPart > 2.5) {',               /* the throat swells */
  '    p.y -= uThroat * 0.030; p.z *= 1.0 + uThroat*0.62; p.x += uThroat*0.010;',
  '  }',
  '  p *= 1.0 + uPuff * 0.035;',
  '  vec4 w = uModel * vec4(p, 1.0);',
  '  vWorld = w.xyz;',
  '  vNrm = mat3(uModel) * n;',
  '  gl_Position = uVP * w;',
  '}',
].join('\n');

const FS_SCENE = [
  '#version 300 es',
  'precision highp float;',
  'in vec3 vWorld; in vec3 vNrm;',
  'uniform vec3 uEye, uSun; uniform float uLight, uFog;',
  'uniform vec3 uTint; uniform float uGlow;',
  'out vec4 frag;',
  SKY,
  'void main(){',
  '  vec3 n = normalize(vNrm);',
  '  vec3 v = normalize(uEye - vWorld);',
  '  float d = length(uEye - vWorld);',
  '  float lam = max(dot(n, uSun), 0.0);',
  /* the rim: the sun is BEHIND everything, so the light you see is the edge */
  '  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.6) * smoothstep(-0.40, 0.35, dot(n, uSun));',
  '  float back = pow(max(dot(-v, uSun), 0.0), 2.0);',
  '  vec3 sunCol = mix(vec3(0.42,0.18,0.075), vec3(1.55,0.90,0.44), uLight);',
  '  vec3 amb = mix(vec3(0.014,0.019,0.036), vec3(0.052,0.070,0.108), uLight);',
  '  vec3 c = uTint * (amb * (0.40 + 0.60*max(n.y,0.0)) + sunCol * lam * 0.09);',
  '  c += sunCol * rim * (0.10 + 1.55*back) * (0.24 + 0.95*uLight);',
  '  c += uTint * uGlow;',
  /* fog: distance and height, in the colour of the sky in that direction */
  '  float h = exp(-max(vWorld.y,0.0)*0.30);',
  '  float f = 1.0 - exp(-d * uFog * (0.35 + 1.15*h));',
  '  vec3 sky = skyColour(-v, uSun, uLight);',
  '  c = mix(c, sky * 0.86, clamp(f,0.0,1.0));',
  '  if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);',
  '  frag = vec4(c, 1.0);',
  '}',
].join('\n');

const VS_FULL = [
  '#version 300 es',
  'precision highp float;',
  'layout(location=0) in vec2 aPos;',
  'out vec2 vUv;',
  'void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }',
].join('\n');

const FS_SKY = [
  '#version 300 es',
  'precision highp float;',
  'in vec2 vUv; out vec4 frag;',
  'uniform mat4 uInvVP; uniform vec3 uEye, uSun; uniform float uLight, uTime;',
  SKY,
  'void main(){',
  '  vec4 h = uInvVP * vec4(vUv*2.0-1.0, 1.0, 1.0);',
  '  vec3 rd = normalize(h.xyz/h.w - uEye);',
  '  vec3 c = skyColour(rd, uSun, uLight);',
  /* a mist bank low in the trees, drifting */
  '  float band = smoothstep(0.16, -0.03, rd.y) * smoothstep(-0.26, -0.07, rd.y);',
  '  vec2 q = vec2(atan(rd.x, rd.z)*1.9, rd.y*7.0);',
  '  float m = fbm(q*1.5 + vec2(uTime*0.014, uTime*0.005));',
  '  m = smoothstep(0.34, 0.86, m);',
  '  vec3 mistCol = mix(vec3(0.040,0.046,0.066), vec3(0.30,0.235,0.196), uLight);',
  '  float sunAmt = pow(max(dot(rd,uSun),0.0), 3.0);',
  '  c = mix(c, mistCol*(0.50+2.2*sunAmt), band*m*0.62);',
  /* the ground, such as it is */
  '  if (rd.y < -0.012) {',
  '    float t = (-1.55) / rd.y;',
  '    vec3 g = uEye + rd*t;',
  '    float n2 = fbm(g.xz*0.55)*0.5 + fbm(g.xz*3.1)*0.25;',
  '    vec3 gc = mix(vec3(0.008,0.009,0.013), vec3(0.030,0.024,0.017), n2) * (0.4+1.1*uLight);',
  '    float f = 1.0 - exp(-t*0.038);',
  '    gc = mix(gc, c, clamp(f,0.0,1.0));',
  '    c = mix(c, gc, smoothstep(-0.012,-0.05, rd.y));',
  '  }',
  '  if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);',
  '  frag = vec4(c,1.0);',
  '}',
].join('\n');

const FS_BRIGHT = [
  '#version 300 es',
  'precision highp float;',
  'in vec2 vUv; out vec4 frag;',
  'uniform sampler2D uSrc; uniform vec2 uSrcTexel;',
  'void main(){',
  '  vec3 c = vec3(0.0);',
  '  c += texture(uSrc, vUv + uSrcTexel*vec2(-1.0,-1.0)).rgb;',
  '  c += texture(uSrc, vUv + uSrcTexel*vec2( 1.0,-1.0)).rgb;',
  '  c += texture(uSrc, vUv + uSrcTexel*vec2(-1.0, 1.0)).rgb;',
  '  c += texture(uSrc, vUv + uSrcTexel*vec2( 1.0, 1.0)).rgb;',
  '  c *= 0.25;',
  '  float l = dot(c, vec3(0.2126,0.7152,0.0722));',
  '  frag = vec4(c * smoothstep(0.75, 2.4, l), 1.0);',
  '}',
].join('\n');

const FS_BLUR = [
  '#version 300 es',
  'precision highp float;',
  'in vec2 vUv; out vec4 frag;',
  'uniform sampler2D uSrc; uniform vec2 uDir;',
  'void main(){',
  '  vec3 c = texture(uSrc, vUv).rgb * 0.2270270;',
  '  c += (texture(uSrc, vUv + uDir*1.3846).rgb + texture(uSrc, vUv - uDir*1.3846).rgb) * 0.3162162;',
  '  c += (texture(uSrc, vUv + uDir*3.2307).rgb + texture(uSrc, vUv - uDir*3.2307).rgb) * 0.0702702;',
  '  if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);',
  '  frag = vec4(c,1.0);',
  '}',
].join('\n');

const FS_COMP = [
  '#version 300 es',
  'precision highp float;',
  'in vec2 vUv; out vec4 frag;',
  'uniform sampler2D uScene, uBloom;',
  'uniform vec2 uSunUv; uniform float uRays, uExpo, uVig;',
  'void main(){',
  '  vec3 c = texture(uScene, vUv).rgb;',
  '  vec3 b = texture(uBloom, vUv).rgb;',
  /* god rays: march the bright buffer toward the sun on screen */
  '  vec3 r = vec3(0.0);',
  '  vec2 dv = (uSunUv - vUv) * 0.36;',
  '  vec2 uv = vUv; float w = 1.0, tot = 0.0;',
  '  for (int i=0;i<18;i++){ uv += dv/18.0; r += texture(uBloom, uv).rgb * w; tot += w; w *= 0.90; }',
  '  r /= max(tot, 1e-4);',
  '  c += b * 0.55 + r * uRays;',
  '  c *= uExpo;',
  '  c = c / (1.0 + c);',                       /* Reinhard */
  '  float v = length(vUv - 0.5);',
  '  c *= 1.0 - uVig * smoothstep(0.35, 0.92, v);',
  '  c = pow(max(c, 0.0), vec3(1.0/2.2));',
  '  frag = vec4(c, 1.0);',
  '}',
].join('\n');

const VS_MOTE = [
  '#version 300 es',
  'precision highp float;',
  'layout(location=0) in vec3 aPos;',
  'uniform mat4 uVP; uniform vec3 uEye; uniform float uTime, uPx;',
  'out float vB;',
  'void main(){',
  '  vec3 p = aPos;',
  '  p.x += sin(uTime*0.21 + p.z*1.7)*0.30 + uTime*0.045;',
  '  p.y += sin(uTime*0.33 + p.x*2.1)*0.16;',
  '  p.z += cos(uTime*0.17 + p.y*1.3)*0.26;',
  '  p = mod(p - uEye + vec3(9.0,4.0,9.0), vec3(18.0,8.0,18.0)) - vec3(9.0,4.0,9.0) + uEye;',
  '  vec4 cp = uVP * vec4(p,1.0);',
  '  gl_Position = cp;',
  '  float d = max(cp.w, 0.4);',
  '  gl_PointSize = clamp(uPx*2.4/d, 1.0, 7.0);',
  '  vB = clamp(2.2/d, 0.05, 1.0);',
  '}',
].join('\n');
const FS_MOTE = [
  '#version 300 es',
  'precision highp float;',
  'in float vB; out vec4 frag;',
  'uniform vec3 uCol;',
  'void main(){',
  '  vec2 d = gl_PointCoord - 0.5;',
  '  float a = smoothstep(0.5, 0.06, length(d));',
  '  frag = vec4(uCol * vB * a, 1.0);',
  '}',
].join('\n');

/* ── the renderer ─────────────────────────────────────────────────────────── */
export function createWood(gl, opts) {
  opts = opts || {};
  const ext = gl.getExtension('EXT_color_buffer_float');
  const HDR = ext ? gl.RGBA16F : gl.RGBA8;
  const HDRT = ext ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

  function sh(t, src) {
    const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src);
    return s;
  }
  function prog(v, f) {
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p: p, u: u };
  }
  const pScene = prog(VS_SCENE, FS_SCENE);
  const pSky = prog(VS_FULL, FS_SKY);
  const pBright = prog(VS_FULL, FS_BRIGHT);
  const pBlur = prog(VS_FULL, FS_BLUR);
  const pComp = prog(VS_FULL, FS_COMP);
  const pMote = prog(VS_MOTE, FS_MOTE);

  /* full-screen triangle */
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const qb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, qb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  function upload(bufs) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1);
    gl.bufferData(gl.ARRAY_BUFFER, bufs.p, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(A_POS); gl.vertexAttribPointer(A_POS, 3, gl.FLOAT, false, 0, 0);
    const b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2);
    gl.bufferData(gl.ARRAY_BUFFER, bufs.n, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(A_NRM); gl.vertexAttribPointer(A_NRM, 3, gl.FLOAT, false, 0, 0);
    const b3 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b3);
    gl.bufferData(gl.ARRAY_BUFFER, bufs.k, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(A_PART); gl.vertexAttribPointer(A_PART, 1, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return { vao: vao, count: bufs.count };
  }

  const forest = buildForest(opts.seed || 20260729);
  const fore = buildBoughs((opts.seed || 20260729) + 7);
  const gForest = upload(forest.mesh.buffers());
  const gFore = upload(fore.mesh.buffers());
  const gBird = upload(buildBird().buffers());

  /* dust */
  const MOTES = 2600;
  const mp = new Float32Array(MOTES * 3);
  { const r = mulberry(99);
    for (let i = 0; i < MOTES; i++) {
      mp[i * 3] = (r() - 0.5) * 18; mp[i * 3 + 1] = r() * 7.4 + 0.1; mp[i * 3 + 2] = (r() - 0.5) * 18;
    } }
  const moteVao = gl.createVertexArray();
  gl.bindVertexArray(moteVao);
  const mb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, mb);
  gl.bufferData(gl.ARRAY_BUFFER, mp, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  /* framebuffers */
  let W = 2, H = 2, hw = 1, hh = 1;
  function mkTex(w, h, fmt, type, filt) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, w, h, 0, gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  let texScene = null, texA = null, texB = null, rbDepth = null;
  let fbScene = gl.createFramebuffer(), fbA = gl.createFramebuffer(), fbB = gl.createFramebuffer();

  function resize(w, h) {
    W = Math.max(2, w | 0); H = Math.max(2, h | 0);
    hw = Math.max(1, W >> 1); hh = Math.max(1, H >> 1);
    for (const t of [texScene, texA, texB]) if (t) gl.deleteTexture(t);
    if (rbDepth) gl.deleteRenderbuffer(rbDepth);
    texScene = mkTex(W, H, HDR, HDRT, gl.LINEAR);
    texA = mkTex(hw, hh, HDR, HDRT, gl.LINEAR);
    texB = mkTex(hw, hh, HDR, HDRT, gl.LINEAR);
    rbDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, W, H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbScene);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texScene, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbDepth);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbA);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texA, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texB, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function fsPass(pr, fb, w, h) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, w, h);
    gl.useProgram(pr.p);
    gl.bindVertexArray(quadVao);
  }

  const EYE = [0, 1.55, -1.2];
  let lastVP = null;
  /* where a world point lands on screen, in 0..1 uv (y down). null if behind. */
  function project(p) {
    if (!lastVP) return null;
    const m = lastVP;
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    if (w <= 0.01) return null;
    return [x / w * 0.5 + 0.5, 0.5 - y / w * 0.5];
  }

  function draw(st) {
    const light = st.light;
    /* the sun rises out of the trees as the light comes up */
    const el = (-0.055 + 0.135 * light);
    const az = 0.11;
    const sun = nrm([Math.sin(az), el, Math.cos(az)]);
    const yaw = st.yaw || 0, pit = st.pitch || 0;
    const at = [EYE[0] + Math.sin(yaw) * Math.cos(pit), EYE[1] + Math.sin(pit) * 1.0, EYE[2] + Math.cos(yaw) * Math.cos(pit)];
    const P = perspective(0.92, W / H, 0.05, 220);
    const V = lookAt(EYE, at, [0, 1, 0]);
    const VP = mul(P, V);
    lastVP = VP;
    /* the sun's position on screen, for the rays */
    const sp = [EYE[0] + sun[0] * 400, EYE[1] + sun[1] * 400, EYE[2] + sun[2] * 400];
    const cw = VP[0] * sp[0] + VP[4] * sp[1] + VP[8] * sp[2] + VP[12];
    const cy = VP[1] * sp[0] + VP[5] * sp[1] + VP[9] * sp[2] + VP[13];
    const cwW = VP[3] * sp[0] + VP[7] * sp[1] + VP[11] * sp[2] + VP[15];
    const sunUv = [cw / cwW * 0.5 + 0.5, cy / cwW * 0.5 + 0.5];

    /* --- 1. sky + ground into the HDR buffer -------------------------------- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbScene);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(pSky.p); gl.bindVertexArray(quadVao);
    const inv = invert(VP);
    gl.uniformMatrix4fv(pSky.u.uInvVP, false, inv);
    gl.uniform3fv(pSky.u.uEye, EYE); gl.uniform3fv(pSky.u.uSun, sun);
    gl.uniform1f(pSky.u.uLight, light); gl.uniform1f(pSky.u.uTime, st.time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* --- 2. the wood -------------------------------------------------------- */
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.useProgram(pScene.p);
    gl.uniformMatrix4fv(pScene.u.uVP, false, new Float32Array(VP));
    gl.uniform3fv(pScene.u.uEye, EYE); gl.uniform3fv(pScene.u.uSun, sun);
    gl.uniform1f(pScene.u.uLight, light);
    gl.uniform1f(pScene.u.uBeak, 0); gl.uniform1f(pScene.u.uThroat, 0); gl.uniform1f(pScene.u.uPuff, 0);
    const I = ident();
    gl.uniformMatrix4fv(pScene.u.uModel, false, I);
    gl.uniform1f(pScene.u.uFog, 0.020);
    gl.uniform3f(pScene.u.uTint, 0.062, 0.050, 0.044);
    gl.uniform1f(pScene.u.uGlow, 0.0);
    gl.bindVertexArray(gForest.vao); gl.drawArrays(gl.TRIANGLES, 0, gForest.count);
    gl.uniform1f(pScene.u.uFog, 0.009);
    gl.uniform3f(pScene.u.uTint, 0.085, 0.066, 0.052);
    gl.bindVertexArray(gFore.vao); gl.drawArrays(gl.TRIANGLES, 0, gFore.count);

    /* --- 3. the birds ------------------------------------------------------- */
    gl.uniform1f(pScene.u.uFog, 0.009);
    gl.bindVertexArray(gBird.vao);
    for (let i = 0; i < st.birds.length; i++) {
      const b = st.birds[i];
      if (!b.here) continue;
      const e = Math.min(1, b.env * 3.2);
      gl.uniform1f(pScene.u.uBeak, 0.16 + 0.42 * e);
      gl.uniform1f(pScene.u.uThroat, e);
      gl.uniform1f(pScene.u.uPuff, b.hero ? 0.5 : 0.0);
      gl.uniform3f(pScene.u.uTint, b.tint[0], b.tint[1], b.tint[2]);
      gl.uniform1f(pScene.u.uGlow, b.sel ? 0.055 : 0.0);
      gl.uniformMatrix4fv(pScene.u.uModel, false, birdModel(b, st.time));
      gl.drawArrays(gl.TRIANGLES, 0, gBird.count);
    }
    gl.bindVertexArray(null);

    /* --- 4. dust in the light ---------------------------------------------- */
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    gl.useProgram(pMote.p); gl.bindVertexArray(moteVao);
    gl.uniformMatrix4fv(pMote.u.uVP, false, new Float32Array(VP));
    gl.uniform3fv(pMote.u.uEye, EYE);
    gl.uniform1f(pMote.u.uTime, st.time);
    gl.uniform1f(pMote.u.uPx, H / 900 * 1.6);
    const mc = 0.05 + 0.42 * light;
    gl.uniform3f(pMote.u.uCol, 0.95 * mc, 0.72 * mc, 0.42 * mc);
    gl.drawArrays(gl.POINTS, 0, MOTES);
    gl.disable(gl.BLEND); gl.depthMask(true);
    gl.bindVertexArray(null);
    gl.disable(gl.CULL_FACE);

    /* --- 5. bloom + rays ---------------------------------------------------- */
    gl.disable(gl.DEPTH_TEST);
    fsPass(pBright, fbA, hw, hh);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texScene);
    gl.uniform1i(pBright.u.uSrc, 0);
    gl.uniform2f(pBright.u.uSrcTexel, 1 / W, 1 / H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    fsPass(pBlur, fbB, hw, hh);
    gl.bindTexture(gl.TEXTURE_2D, texA); gl.uniform1i(pBlur.u.uSrc, 0);
    gl.uniform2f(pBlur.u.uDir, 1 / hw, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    fsPass(pBlur, fbA, hw, hh);
    gl.bindTexture(gl.TEXTURE_2D, texB); gl.uniform1i(pBlur.u.uSrc, 0);
    gl.uniform2f(pBlur.u.uDir, 0, 1 / hh);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* --- 6. composite ------------------------------------------------------- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(pComp.p); gl.bindVertexArray(quadVao);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texScene);
    gl.uniform1i(pComp.u.uScene, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(pComp.u.uBloom, 1);
    gl.uniform2f(pComp.u.uSunUv, sunUv[0], sunUv[1]);
    gl.uniform1f(pComp.u.uRays, 0.10 + 0.34 * light);
    gl.uniform1f(pComp.u.uExpo, 1.08 - 0.22 * light);
    gl.uniform1f(pComp.u.uVig, 0.52);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
  }

  function birdModel(b, t) {
    const bob = Math.sin(t * 1.7 + b.phase) * 0.006 + Math.min(1, b.env * 3) * 0.012;
    const ya = b.yaw + Math.sin(t * 0.35 + b.phase) * 0.10;
    const s = b.size;
    const c = Math.cos(ya), sn = Math.sin(ya);
    return new Float32Array([
      c * s, 0, -sn * s, 0,
      0, s, 0, 0,
      sn * s, 0, c * s, 0,
      b.p[0], b.p[1] + bob, b.p[2], 1,
    ]);
  }

  return { resize: resize, draw: draw, project: project, forest: forest, fore: fore, eye: EYE };
}

function ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }

/* general 4x4 inverse (column-major), for un-projecting the sky ray */
function invert(m) {
  const o = new Float32Array(16);
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return ident();
  det = 1 / det;
  o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return o;
}
