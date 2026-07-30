/* ============================================================================
   render.js — THE HIVE, drawn.  WebGL2, two panes, no textures and no assets.

   The room is a diptych, because the claim is a diptych: the same angle, in
   two places at once.

     LEFT   the comb, in the dark, seen through the glass of an observation
            hive.  A fragment shader builds real worker comb — pointy-top
            hexagons with two vertical walls, 5.3 mm across the flats, because
            that is what bees build — with honey caps, brood caps, pollen and
            open cells, lit by one warm lamp from the upper left.  The bees on
            it are instanced sprites: an SDF body with a striped abdomen, a
            fuzzy thorax and wings whose blur follows how fast she is moving.

     RIGHT  the meadow, from nine hundred metres up.  Another fragment shader:
            fields partitioned by a Worley cell walk, hedgerows on the borders
            casting shadows in the direction the SUN actually is, a stream, and
            drifts of flowers.  The light warms and lengthens as the day runs.

   Everything drawn ON TOP of those two — the plumb line, the angle wedge, the
   bearing rays, the recruits and their trails, every label — is a plain 2-D
   canvas laid over each pane.  Text belongs to the 2-D context; wax and grass
   belong to the shader.  Neither is asked to do the other's job.
   ============================================================================ */

/* ── the smallest GL wrapper that is not a lie ────────────────────────────── */

function glCompile(gl, type, src, tag) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(tag + ': ' + gl.getShaderInfoLog(s));
  }
  return s;
}

function glProgram(gl, vs, fs, tag) {
  const p = gl.createProgram();
  gl.attachShader(p, glCompile(gl, gl.VERTEX_SHADER, vs, tag + '.vs'));
  gl.attachShader(p, glCompile(gl, gl.FRAGMENT_SHADER, fs, tag + '.fs'));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(tag + ': ' + gl.getProgramInfoLog(p));
  }
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

const VS_QUAD = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  uv = v;
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

/* shared shader preamble: hashes and value noise, once */
const GLSL_NOISE = `
float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2  hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x),
             mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++){ s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}`;

/* ════════════════════════════════════════════════════════════════════════════
   THE COMB
   ════════════════════════════════════════════════════════════════════════════ */

const FS_COMB = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 frag;
uniform vec2 uRes;
uniform float uCells;     /* cells across the short side of the pane */
uniform float uTime;
uniform float uLamp;      /* 0 dark hive .. 1 the keeper's lamp */
uniform float uYOff;      /* cells the dance floor sits above pane centre */
${GLSL_NOISE}

/* pointy-top hex lattice: neighbours 1 apart, so 1 unit = one cell across the
   flats.  the two candidate sub-lattices, nearest wins. */
vec4 hexGrid(vec2 p){
  vec2 s = vec2(1.0, 1.7320508);
  vec4 hC = floor(vec4(p, p - vec2(0.5, 0.8660254)) / s.xyxy) + 0.5;
  vec4 h  = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 0.5);
}
/* 0.5 on the wall, 0 at the centre */
float hexD(vec2 p){ p = abs(p); return max(p.x, p.x * 0.5 + p.y * 0.8660254); }
vec2 hexG(vec2 p){
  vec2 a = abs(p);
  return (a.x > a.x * 0.5 + a.y * 0.8660254)
    ? vec2(sign(p.x), 0.0)
    : vec2(0.5 * sign(p.x), 0.8660254 * sign(p.y));
}

const vec3 WAX   = vec3(0.86, 0.63, 0.30);
const vec3 HONEY = vec3(1.00, 0.63, 0.16);
const vec3 BROOD = vec3(0.80, 0.62, 0.40);
const vec3 POLLN = vec3(1.00, 0.74, 0.22);

void main(){
  vec2 fragXY = uv * uRes;
  float m = min(uRes.x, uRes.y);
  /* comb space, in cells, origin at pane centre */
  vec2 p = (fragXY - 0.5 * uRes) / m * uCells;
  p.y -= uYOff;                                /* keep the wax with the dancer */

  vec4 hx = hexGrid(p);
  vec2 h = hx.xy;  vec2 id = hx.zw;
  float d = 0.5 - hexD(h);                     /* inward distance from the wall */
  vec2 g = hexG(h);

  float t = hash21(id * 1.7 + 3.1);
  float t2 = hash21(id * 5.3 - 11.0);
  float age = fbm(p * 0.09 + 4.0);

  vec3 L = normalize(vec3(-0.55, 0.62, 0.56)); /* one warm lamp, upper left */

  /* the wall itself: a rounded ridge, so it catches the light on one side */
  float wallW = 0.085;
  float ridge = 1.0 - smoothstep(0.0, wallW, d);
  vec3 nWall = normalize(vec3(g * ridge * 1.55, 0.85));
  float litWall = max(0.0, dot(nWall, L));

  vec3 waxCol = WAX * (0.58 + 0.60 * age) * (0.84 + 0.30 * t2);
  /* the WALLS are what catch the lamp — that is the whole look of comb: a
     lattice of lit edges standing over holes that are almost black */
  vec3 col = waxCol * (0.055 + 1.55 * pow(litWall, 1.35) * (0.30 + 0.85 * ridge));
  /* wax is translucent — a little light comes THROUGH the thin walls */
  col += WAX * 0.10 * ridge * ridge * (0.30 + 0.70 * age);

  /* ── what is in the cell ── */
  float r = clamp(d / 0.5, 0.0, 1.0);           /* 0 wall .. 1 centre */
  vec3 fill;
  if (t < 0.26) {
    /* capped honey: a shallow amber dome, glossy, sitting proud of the rim */
    float dome = sqrt(max(0.0, 1.0 - pow(1.0 - r, 2.0)));
    vec3 n = normalize(vec3(-g * (1.0 - r) * 1.3, dome + 0.30));
    float diff = max(0.0, dot(n, L));
    float spec = pow(max(0.0, dot(reflect(-L, n), vec3(0, 0, 1))), 30.0);
    fill = HONEY * (0.16 + 1.15 * diff) * (0.78 + 0.44 * t2) + vec3(1.0, 0.92, 0.74) * spec * 0.85;
  } else if (t < 0.42) {
    /* capped brood: matte, papery, slightly domed and a touch rough */
    float dome = sqrt(max(0.0, 1.0 - pow(1.0 - r, 2.0)));
    vec3 n = normalize(vec3(-g * (1.0 - r) * 0.95, dome + 0.45));
    float rough = fbm(p * 26.0) * 0.22;
    fill = BROOD * (0.14 + 1.05 * max(0.0, dot(n, L))) * (0.88 + rough);
  } else if (t < 0.53) {
    /* pollen: packed, granular, and each cell a different forage colour */
    float grain = fbm(p * 34.0 + id * 7.0);
    vec3 pc = mix(POLLN, mix(vec3(0.95, 0.40, 0.14), vec3(0.72, 0.72, 0.20), hash21(id * 2.1)), 0.55);
    fill = pc * (0.20 + 0.90 * grain) * (0.30 + 0.90 * r) * 0.90;
  } else {
    /* Open cell: a hexagonal shaft going back into the dark.  The lamp lights
       a crescent of the far wall on the side AWAY from it, and the floor is
       almost invisible.  That crescent is the entire reason an empty cell
       reads as a HOLE and not as a flat grey hexagon. */
    float depth = smoothstep(0.0, 0.50, r);
    float crescent = max(0.0, dot(normalize(vec3(g, 0.30)), -L));
    crescent *= 1.0 - smoothstep(0.10, 0.62, r);
    vec3 inner = waxCol * (0.020 + 0.62 * crescent) * (1.0 - 0.86 * depth);
    /* a few cells hold a bead of uncapped nectar, and it catches the lamp */
    float nectar = step(0.88, t2) * (1.0 - smoothstep(0.20, 0.52, r));
    fill = mix(inner, HONEY * 0.42 * (0.4 + 0.9 * crescent), nectar * 0.8);
  }

  float inside = smoothstep(0.0, wallW * 1.15, d);
  col = mix(col, fill, inside * 0.96);

  /* the comb is not flat: a slow swell across it, and old wax is darker */
  col *= 0.82 + 0.30 * fbm(p * 0.055 - 2.0);

  /* THE LAMP.  One warm light, and beyond its reach a hive is simply black —
     which is the fact the whole room turns on. */
  vec2 q = (fragXY - 0.5 * uRes) / m;
  vec2 lq = q - vec2(0.0, uYOff / uCells);     /* centred on the dance floor */
  float lamp = exp(-4.60 * dot(lq, lq));
  col *= mix(0.22, 1.55, uLamp) * (0.045 + 1.10 * lamp);
  col += vec3(0.020, 0.0125, 0.0065) * (0.35 + 0.9 * lamp);  /* the dark is warm, not black */

  col = col / (1.0 + max(max(col.r, col.g), col.b) * 0.42);
  col = pow(max(col, 0.0), vec3(0.82));
  frag = vec4(col, 1.0);
}`;

/* ── bees: instanced sprites, an SDF body ────────────────────────────────── */

const VS_BEE = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;      /* -1..1 quad */
layout(location=1) in vec4 iPosRot;      /* x, y (cells), heading, size (cells) */
layout(location=2) in vec4 iStyle;       /* wingBlur, tint, alpha, phase */
uniform vec2 uRes;
uniform float uCells;
uniform vec2 uOrigin;
uniform float uYOff2;
out vec2 vLocal;
out vec4 vStyle;
out float vLamp;
void main(){
  float c = cos(iPosRot.z), s = sin(iPosRot.z);
  /* the sprite is 1.55 body-lengths wide so the wings have room */
  vec2 local = aCorner * vec2(0.86, 1.0);
  vec2 rot = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
  vec2 cell = iPosRot.xy + uOrigin + rot * iPosRot.w * 0.5;
  float m = min(uRes.x, uRes.y);
  vec2 ndc = cell / uCells * 2.0 * (m / uRes);
  vLocal = local;
  vStyle = iStyle;
  /* the same lamp the comb shader uses, evaluated at the bee's own place, so
     a bee out at the edge of the light is as dim as the wax she stands on */
  vec2 q = ndc * 0.5 * (uRes / m) - vec2(0.0, uYOff2 / uCells);
  vLamp = 0.045 + 1.10 * exp(-4.60 * dot(q, q));
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;

const FS_BEE = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vStyle;
in float vLamp;
out vec4 frag;
${GLSL_NOISE}

float ell(vec2 p, vec2 r){ return length(p / r) - 1.0; }

void main(){
  vec2 p = vLocal;                    /* +y is forward (head), x is right */
  float blur = vStyle.x, tint = vStyle.y, alpha = vStyle.z, ph = vStyle.w;
  vec3 col = vec3(0.0);
  float a = 0.0;

  /* ── wings: two long translucent blades sweeping back, blurred by speed ── */
  float wingSweep = 0.34 + 0.30 * sin(ph);
  for (float sgn = -1.0; sgn <= 1.0; sgn += 2.0) {
    vec2 w = p - vec2(sgn * 0.30, 0.10);
    float ca = cos(sgn * wingSweep), sa = sin(sgn * wingSweep);
    vec2 wr = vec2(w.x * ca - w.y * sa, w.x * sa + w.y * ca);
    float dw = ell(wr - vec2(sgn * 0.12, -0.10), vec2(0.13 + 0.11 * blur, 0.34));
    float m = 1.0 - smoothstep(-0.06 - 0.22 * blur, 0.06, dw);
    float wa = m * mix(0.20, 0.095, blur);
    col = mix(col, vec3(0.86, 0.90, 0.98), wa * (1.0 - a));
    a = a + wa * (1.0 - a);
  }

  /* ── abdomen: tapered, banded ── */
  float taper = 1.0 - 0.34 * smoothstep(-0.10, -0.52, p.y);
  float dAbd = ell(p - vec2(0.0, -0.20), vec2(0.185 * taper, 0.30));
  float mAbd = 1.0 - smoothstep(-0.02, 0.03, dAbd);
  float band = smoothstep(0.32, 0.62, sin((p.y + 0.22) * 46.0) * 0.5 + 0.5);
  vec3 abd = mix(vec3(0.13, 0.095, 0.065), vec3(1.00, 0.74, 0.20), band);
  abd *= 0.72 + 0.55 * smoothstep(0.22, -0.20, p.x);      /* round it with light */
  col = mix(col, abd, mAbd); a = max(a, mAbd);

  /* ── thorax: a ball of ginger fuzz, the brightest thing on her ── */
  float dTh = ell(p - vec2(0.0, 0.11), vec2(0.205, 0.205));
  float fuzz = fbm(p * 46.0 + 9.0);
  float mTh = 1.0 - smoothstep(-0.03, 0.055 + fuzz * 0.05, dTh);
  vec3 th = vec3(0.86, 0.60, 0.28) * (0.72 + fuzz * 0.88);
  th *= 0.78 + 0.62 * smoothstep(0.22, -0.20, p.x);
  th *= 0.80 + 0.45 * smoothstep(0.30, -0.05, length(p - vec2(-0.05, 0.16)));
  col = mix(col, th, mTh); a = max(a, mTh);

  /* ── head, with the two big compound eyes ── */
  float dHd = ell(p - vec2(0.0, 0.335), vec2(0.125, 0.108));
  float mHd = 1.0 - smoothstep(-0.02, 0.03, dHd);
  col = mix(col, vec3(0.16, 0.12, 0.085), mHd); a = max(a, mHd);
  for (float sgn = -1.0; sgn <= 1.0; sgn += 2.0) {
    float de = ell(p - vec2(sgn * 0.082, 0.335), vec2(0.045, 0.082));
    float me = 1.0 - smoothstep(-0.01, 0.018, de);
    col = mix(col, vec3(0.30, 0.24, 0.19) * (0.7 + 0.9 * smoothstep(0.10, -0.05, p.x * sgn)), me);
  }
  for (float sgn = -1.0; sgn <= 1.0; sgn += 2.0) {
    vec2 ap = p - vec2(sgn * 0.06, 0.40);
    float d = abs(ap.x - sgn * ap.y * 0.85) - 0.012;
    float m = (1.0 - smoothstep(0.0, 0.02, d)) * step(0.0, ap.y) * step(ap.y, 0.16);
    col = mix(col, vec3(0.09), m); a = max(a, m);
  }

  /* ── legs ── */
  for (float i = 0.0; i < 3.0; i += 1.0) {
    for (float sgn = -1.0; sgn <= 1.0; sgn += 2.0) {
      vec2 lp = p - vec2(sgn * 0.16, 0.20 - i * 0.14);
      lp.x *= sgn;
      float d = abs(lp.y + lp.x * 0.55) - 0.014;
      float m = (1.0 - smoothstep(0.0, 0.018, d)) * step(0.0, lp.x) * step(lp.x, 0.20);
      col = mix(col, vec3(0.10, 0.08, 0.06), m * 0.9); a = max(a, m * 0.9);
    }
  }

  if (a < 0.004) discard;
  col = mix(col, vec3(1.0, 0.86, 0.42), tint * 0.30);
  col *= clamp(vLamp * 1.30 + 0.12, 0.0, 1.9) * 1.34;
  col += vec3(1.0, 0.72, 0.22) * tint * 0.20;          /* the dancer keeps a glow */
  col = col / (1.0 + max(max(col.r, col.g), col.b) * 0.42);
  col = pow(max(col, 0.0), vec3(0.82));
  frag = vec4(col, a * alpha);
}`;

export class CombView {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 is not available');
    this.gl = gl; this.canvas = canvas;
    this.comb = glProgram(gl, VS_QUAD, FS_COMB, 'comb');
    this.bee = glProgram(gl, VS_BEE, FS_BEE, 'bee');
    this.vao = gl.createVertexArray();

    /* the bee quad + its instance buffers */
    this.beeVao = gl.createVertexArray();
    gl.bindVertexArray(this.beeVao);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.bufPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);
    this.bufSty = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufSty);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);

    this.cells = 17;
    this.yOff = -0.6;
    this.posArr = new Float32Array(0);
    this.styArr = new Float32Array(0);
  }

  resize() {
    const c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return [w, h];
  }

  /* bees: [{x, y, heading, size, blur, tint, alpha, phase}] in comb cells */
  draw(bees, time, lamp) {
    const gl = this.gl;
    const [w, h] = this.resize();
    gl.viewport(0, 0, w, h);
    gl.disable(gl.BLEND);
    gl.useProgram(this.comb.p);
    gl.uniform2f(this.comb.u.uRes, w, h);
    gl.uniform1f(this.comb.u.uCells, this.cells);
    gl.uniform1f(this.comb.u.uTime, time);
    gl.uniform1f(this.comb.u.uLamp, lamp);
    gl.uniform1f(this.comb.u.uYOff, this.yOff);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const n = bees.length;
    if (!n) return;
    if (this.posArr.length < n * 4) {
      this.posArr = new Float32Array(n * 4);
      this.styArr = new Float32Array(n * 4);
    }
    for (let i = 0; i < n; i++) {
      const b = bees[i];
      this.posArr[i * 4] = b.x; this.posArr[i * 4 + 1] = b.y;
      this.posArr[i * 4 + 2] = b.heading; this.posArr[i * 4 + 3] = b.size;
      this.styArr[i * 4] = b.blur; this.styArr[i * 4 + 1] = b.tint;
      this.styArr[i * 4 + 2] = b.alpha; this.styArr[i * 4 + 3] = b.phase;
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.bee.p);
    gl.uniform2f(this.bee.u.uRes, w, h);
    gl.uniform1f(this.bee.u.uCells, this.cells);
    gl.uniform2f(this.bee.u.uOrigin, 0, this.yOff);
    gl.uniform1f(this.bee.u.uYOff2, this.yOff);
    gl.bindVertexArray(this.beeVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.posArr.subarray(0, n * 4), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufSty);
    gl.bufferData(gl.ARRAY_BUFFER, this.styArr.subarray(0, n * 4), gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    gl.bindVertexArray(null);
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   THE MEADOW
   ════════════════════════════════════════════════════════════════════════════ */

const FS_MEADOW = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 frag;
uniform vec2 uRes;
uniform float uSpanM;     /* metres across the SHORT side of the pane */
uniform float uSunAz;     /* radians, clockwise from north */
uniform float uSunAlt;    /* degrees */
uniform float uTime;
${GLSL_NOISE}

/* field partition: a jittered Worley walk.  returns the border distance and a
   per-field id, so each field can take its own crop and colour. */
vec3 fields(vec2 p, float scale){
  vec2 g = p / scale;
  vec2 i = floor(g), f = fract(g);
  float d1 = 8.0, d2 = 8.0; vec2 best = vec2(0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y));
    vec2 c = o + 0.15 + 0.70 * hash22(i + o);
    float d = length(c - f);
    if (d < d1) { d2 = d1; d1 = d; best = i + o; }
    else if (d < d2) { d2 = d; }
  }
  return vec3((d2 - d1) * scale, best);
}

void main(){
  vec2 fragXY = uv * uRes;
  float m = min(uRes.x, uRes.y);
  /* world metres: +x east, +y north, hive at the origin, north UP the pane */
  vec2 P = (fragXY - 0.5 * uRes) / m * uSpanM;

  vec3 sunDir = vec3(sin(uSunAz), cos(uSunAz), 0.0);   /* toward the sun, on the ground */
  float low = 1.0 - smoothstep(2.0, 34.0, uSunAlt);    /* 1 at the horizon */

  /* the fields, at two scales so hedged closes sit inside bigger holdings */
  vec3 F  = fields(P, 430.0);
  vec3 F2 = fields(P + 120.0, 168.0);
  float fid = hash21(F.yz * 1.7);
  float fid2 = hash21(F2.yz * 3.3);

  /* each field gets a crop.  the boundaries are hedged, so a field can be a
     very different colour from the one next to it without looking wrong. */
  vec3 pasture = vec3(0.17, 0.34, 0.10);
  vec3 clover  = vec3(0.25, 0.42, 0.13);
  vec3 hay     = vec3(0.52, 0.52, 0.16);
  vec3 wheat   = vec3(0.76, 0.62, 0.18);
  vec3 fallow  = vec3(0.44, 0.35, 0.20);
  vec3 base = fid < 0.30 ? pasture : (fid < 0.52 ? clover
            : (fid < 0.72 ? hay : (fid < 0.90 ? wheat : fallow)));
  base = mix(base, fid2 < 0.5 ? pasture : hay, 0.16);
  base *= 0.80 + 0.42 * fbm(P * 0.0075 + fid * 20.0);

  /* the grain of the grass itself — fine at this height, but not nothing.
     the wind walks across it. */
  float blades = fbm(P * 0.30 + vec2(uTime * 0.9, uTime * 0.35)) * 0.42
               + fbm(P * 1.35) * 0.34 + fbm(P * 5.0) * 0.24;
  base *= 0.68 + 0.62 * blades;

  /* the plough, in the arable fields: faint parallel lines at the field's
     own angle, which is what actually makes farmland look like farmland */
  float ang = hash21(F.yz * 4.4) * 3.14159;
  vec2 rp = vec2(P.x * cos(ang) - P.y * sin(ang), P.x * sin(ang) + P.y * cos(ang));
  float furrow = sin(rp.y * 0.30) * 0.5 + 0.5;
  base *= 1.0 + (furrow - 0.5) * 0.14 * step(0.52, fid);

  /* drifts of flowers, following the low-frequency field pattern */
  float drift = smoothstep(0.52, 0.84, fbm(P * 0.014 - 7.0));
  float speck = smoothstep(0.78, 0.97, hash21(floor(P * 1.1)));
  vec3 petal = fid2 < 0.4 ? vec3(1.0, 0.92, 0.52) : (fid2 < 0.75 ? vec3(0.94, 0.90, 1.0) : vec3(1.0, 0.68, 0.78));
  base = mix(base, petal, drift * speck * 0.70);

  /* HEDGEROWS on the field borders — thick, dark, lumpy, with standard trees
     in them, and each throwing a shadow in the direction the sun really is */
  float hw = 15.0 + 11.0 * fbm(P * 0.05);
  float hedge = 1.0 - smoothstep(hw * 0.55, hw, F.x);
  float hedge2 = (1.0 - smoothstep(6.0, 13.0, F2.x)) * 0.78;
  hedge = max(hedge, hedge2);
  /* trees: fat blobs strung along the hedge line */
  float treeN = fbm(P * 0.16 + 31.0);
  float tree = smoothstep(0.62, 0.80, treeN) * (1.0 - smoothstep(hw * 1.4, hw * 2.6, F.x));
  float canopy = max(hedge, tree);

  float shLen = mix(7.0, 60.0, low);
  vec2 off = sunDir.xy * shLen;
  vec3 Fs  = fields(P + off, 430.0);
  vec3 Fs2 = fields(P + off + 120.0, 168.0);
  float sh1 = 1.0 - smoothstep(hw * 0.6, hw * 1.25, Fs.x);
  float sh2 = (1.0 - smoothstep(7.0, 15.0, Fs2.x)) * 0.72;
  float shTree = smoothstep(0.62, 0.80, fbm((P + off) * 0.16 + 31.0))
               * (1.0 - smoothstep(hw * 1.4, hw * 2.8, Fs.x));
  float shadow = max(max(sh1, sh2), shTree);
  shadow *= (1.0 - canopy) * mix(0.30, 0.72, low);
  base *= 1.0 - shadow * 0.72;
  base = mix(base, base * vec3(0.62, 0.72, 0.95), shadow * 0.45);   /* shadows go blue */

  vec3 hedgeCol = vec3(0.075, 0.155, 0.062) * (0.45 + 1.25 * fbm(P * 0.34));
  /* the sunward side of a hedge is lit; the far side is not */
  float hlit = 0.5 + 0.5 * dot(normalize(vec2(dFdx(F.x), dFdy(F.x)) + 1e-6), -sunDir.xy);
  hedgeCol *= 0.55 + 0.95 * hlit;
  base = mix(base, hedgeCol, canopy * 0.94);

  /* a stream, and its darker margin */
  float sy = P.y - 260.0 - 190.0 * sin(P.x * 0.0016) - 70.0 * sin(P.x * 0.0051 + 1.0);
  float water = 1.0 - smoothstep(5.0, 13.0, abs(sy));
  float bank  = 1.0 - smoothstep(10.0, 30.0, abs(sy));
  base = mix(base, vec3(0.22, 0.34, 0.28), bank * 0.35);
  vec3 wcol = mix(vec3(0.30, 0.44, 0.50), vec3(0.92, 0.86, 0.62), low * 0.55);
  base = mix(base, wcol * (0.85 + 0.4 * fbm(P * 0.6 + uTime * 0.4)), water);

  /* a track running to the hive */
  float tr = abs(P.x + 30.0 * sin(P.y * 0.0035) + 240.0);
  base = mix(base, vec3(0.62, 0.56, 0.42), (1.0 - smoothstep(3.5, 7.0, tr)) * 0.7);

  /* the light of the hour: warm and raking low, white and flat at noon */
  vec3 warm = mix(vec3(1.28, 0.84, 0.52), vec3(1.03, 1.01, 0.97), smoothstep(3.0, 40.0, uSunAlt));
  float bright = mix(0.36, 1.06, smoothstep(-2.0, 46.0, uSunAlt));
  base *= warm * bright;

  /* a soft fall-off to the edge of the pane so the map has a horizon feel */
  vec2 q = (fragXY - 0.5 * uRes) / m;
  base *= 1.0 - 0.26 * smoothstep(0.42, 0.95, length(q));

  base = base / (1.0 + max(max(base.r, base.g), base.b) * 0.24);
  base = pow(max(base, 0.0), vec3(0.78));
  frag = vec4(base, 1.0);
}`;

export class MeadowView {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL2 is not available');
    this.gl = gl; this.canvas = canvas;
    this.prog = glProgram(gl, VS_QUAD, FS_MEADOW, 'meadow');
    this.vao = gl.createVertexArray();
    this.spanM = 2600;
  }

  resize() {
    const c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return [w, h];
  }

  draw(sunAzDeg, sunAltDeg, time) {
    const gl = this.gl;
    const [w, h] = this.resize();
    gl.viewport(0, 0, w, h);
    gl.disable(gl.BLEND);
    gl.useProgram(this.prog.p);
    gl.uniform2f(this.prog.u.uRes, w, h);
    gl.uniform1f(this.prog.u.uSpanM, this.spanM);
    gl.uniform1f(this.prog.u.uSunAz, sunAzDeg * Math.PI / 180);
    gl.uniform1f(this.prog.u.uSunAlt, sunAltDeg);
    gl.uniform1f(this.prog.u.uTime, time);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  /* pane pixels ⇄ world metres, so the overlay and the click both agree with
     exactly what the shader drew */
  toPane(east, north, cssW, cssH) {
    const m = Math.min(cssW, cssH);
    return [cssW * 0.5 + east / this.spanM * m, cssH * 0.5 - north / this.spanM * m];
  }
  toWorld(px, py, cssW, cssH) {
    const m = Math.min(cssW, cssH);
    return [(px - cssW * 0.5) / m * this.spanM, -(py - cssH * 0.5) / m * this.spanM];
  }
}
