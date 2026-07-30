/* ==========================================================================
   render.js — THE RING CANNON's renderer.  WebGL2, hand-rolled, no libraries.

   The hall is rasterised; the smoke is a GPU particle field advected by the
   SAME Biot-Savart kernel the filament obeys (rings.mjs KERNEL_GLSL is spliced
   into the advection shader, so there is one kernel in the room), and it is
   composited by absorption rather than added, so a dense ring looks like
   smoke and not like plasma.

   PASSES
     1  scene   -> HDR colour + a DEPTH TEXTURE
     2  advect  -> ping-pong RGBA32F particle positions (xyz, +/-birth time)
     3  smoke   -> a second HDR buffer sharing pass 1's depth texture:
                   depth-tested, depth-write off, additive.  rgb accumulates
                   premultiplied radiance, a accumulates optical depth.
     4  compose -> scene*exp(-kD) + (rgb/a)*(1-exp(-kD)), tonemap, dither.

   LANDMINES OBSERVED
     · every vertex shader pins layout(location=) — WebGL2 numbers attributes
       itself otherwise and different programs disagree.
     · every float texture is NEAREST and read with texelFetch; a LINEAR
       sampler on a 32-bit float texture returns black.
     · the depth texture is unbound from every sampler before it is attached
       as a render target.
     · no backtick appears inside any GLSL comment in this file.
   ========================================================================== */

const RC = (function () {
  "use strict";

  const PW = 256, PH = 256;          // particle pool: 65536 slots
  const SHOTS = 4;                   // round-robin blocks
  const BLOCK = PH / SHOTS;          // rows per shot = 32  (8192 particles)
  const MAXSEG = 2048;

  /* ── tiny GL helpers ─────────────────────────────────────────────────── */

  function compile(gl, type, src, name) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(name + ': ' + gl.getShaderInfoLog(s) + '\n' +
        src.split('\n').map((l, i) => (i + 1) + '| ' + l).join('\n'));
    }
    return s;
  }
  function program(gl, vs, fs, name) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, name + '.vs'));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, name + '.fs'));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(name + ' link: ' + gl.getProgramInfoLog(p));
    }
    p.u = new Proxy({}, { get: (c, k) => (k in c ? c[k] : (c[k] = gl.getUniformLocation(p, k))) });
    return p;
  }
  function tex2D(gl, w, h, internal, format, type, data) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data || null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return t;
  }

  /* ── matrices (column-major, GL order) ───────────────────────────────── */

  function mIdent() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function mMul(a, b, out) {
    const o = out || new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  }
  function mPerspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, 2 * far * near / (near - far), 0
    ]);
  }
  // Right-handed lookAt.  Checked by hand for the one case that matters:
  // eye=(0,0,1), target=origin, up=+y  gives  s=(1,0,0), u=(0,1,0), f=(0,0,-1).
  function mLookAt(eye, target, up) {
    let fx = target[0] - eye[0], fy = target[1] - eye[1], fz = target[2] - eye[2];
    let rl = 1 / Math.hypot(fx, fy, fz); fx *= rl; fy *= rl; fz *= rl;
    let sx = fy * up[2] - fz * up[1], sy = fz * up[0] - fx * up[2], sz = fx * up[1] - fy * up[0];
    rl = 1 / (Math.hypot(sx, sy, sz) || 1); sx *= rl; sy *= rl; sz *= rl;
    const ux = sy * fz - sz * fy, uy = sz * fx - sx * fz, uz = sx * fy - sy * fx;
    return new Float32Array([
      sx, ux, -fx, 0,
      sy, uy, -fy, 0,
      sz, uz, -fz, 0,
      -(sx * eye[0] + sy * eye[1] + sz * eye[2]),
      -(ux * eye[0] + uy * eye[1] + uz * eye[2]),
      (fx * eye[0] + fy * eye[1] + fz * eye[2]), 1
    ]);
  }

  /* ── the hall, as triangles ──────────────────────────────────────────── */
  //  MAT codes: 0 matte, 1 emissive, 2 floor (grid + metre marks), 3 metal

  function MeshBuilder() {
    this.pos = []; this.nrm = []; this.col = []; this.mat = []; this.idx = [];
  }
  MeshBuilder.prototype.vert = function (p, n, c, m) {
    this.pos.push(p[0], p[1], p[2]);
    this.nrm.push(n[0], n[1], n[2]);
    this.col.push(c[0], c[1], c[2]);
    this.mat.push(m);
    return this.pos.length / 3 - 1;
  };
  MeshBuilder.prototype.quad = function (a, b, c, d, col, mat) {
    let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    let vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    const n = [nx, ny, nz];
    const i0 = this.vert(a, n, col, mat), i1 = this.vert(b, n, col, mat);
    const i2 = this.vert(c, n, col, mat), i3 = this.vert(d, n, col, mat);
    this.idx.push(i0, i1, i2, i0, i2, i3);
  };
  // A quad with the normal STATED rather than derived.  Winding bugs in a
  // hand-built mesh are invisible until the whole room renders black, so the
  // shell of the hall says which way is "inside" and the shader obeys that,
  // not the vertex order.
  MeshBuilder.prototype.quadN = function (a, b, c, d, n, col, mat) {
    const i0 = this.vert(a, n, col, mat), i1 = this.vert(b, n, col, mat);
    const i2 = this.vert(c, n, col, mat), i3 = this.vert(d, n, col, mat);
    this.idx.push(i0, i1, i2, i0, i2, i3);
  };
  MeshBuilder.prototype.box = function (c, h, col, mat) {
    const [x, y, z] = c, [a, b, d] = h;
    const P = (sx, sy, sz) => [x + sx * a, y + sy * b, z + sz * d];
    this.quad(P(-1,-1, 1), P( 1,-1, 1), P( 1, 1, 1), P(-1, 1, 1), col, mat);
    this.quad(P( 1,-1,-1), P(-1,-1,-1), P(-1, 1,-1), P( 1, 1,-1), col, mat);
    this.quad(P( 1,-1, 1), P( 1,-1,-1), P( 1, 1,-1), P( 1, 1, 1), col, mat);
    this.quad(P(-1,-1,-1), P(-1,-1, 1), P(-1, 1, 1), P(-1, 1,-1), col, mat);
    this.quad(P(-1, 1, 1), P( 1, 1, 1), P( 1, 1,-1), P(-1, 1,-1), col, mat);
    this.quad(P(-1,-1,-1), P( 1,-1,-1), P( 1,-1, 1), P(-1,-1, 1), col, mat);
  };
  // A tube along +z from z0 to z1, radius r0->r1, optional inner radius (annulus caps).
  MeshBuilder.prototype.tube = function (cx, cy, z0, z1, r0, r1, seg, col, mat, cap) {
    for (let i = 0; i < seg; i++) {
      const t0 = 2 * Math.PI * i / seg, t1 = 2 * Math.PI * (i + 1) / seg;
      const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      this.quad(
        [cx + r0 * c0, cy + r0 * s0, z0], [cx + r0 * c1, cy + r0 * s1, z0],
        [cx + r1 * c1, cy + r1 * s1, z1], [cx + r1 * c0, cy + r1 * s0, z1], col, mat);
      if (cap) {
        const [ri, zc] = cap;   // annulus at zc between ri and (zc===z0?r0:r1)
        const ro = (zc === z0) ? r0 : r1;
        this.quad(
          [cx + ri * c0, cy + ri * s0, zc], [cx + ri * c1, cy + ri * s1, zc],
          [cx + ro * c1, cy + ro * s1, zc], [cx + ro * c0, cy + ro * s0, zc], col, mat);
      }
    }
  };
  MeshBuilder.prototype.disc = function (cx, cy, z, r, seg, col, mat, flip) {
    const n = [0, 0, flip ? -1 : 1];
    const ci = this.vert([cx, cy, z], n, col, mat);
    for (let i = 0; i < seg; i++) {
      const t0 = 2 * Math.PI * i / seg, t1 = 2 * Math.PI * (i + 1) / seg;
      const a = this.vert([cx + r * Math.cos(t0), cy + r * Math.sin(t0), z], n, col, mat);
      const b = this.vert([cx + r * Math.cos(t1), cy + r * Math.sin(t1), z], n, col, mat);
      if (flip) this.idx.push(ci, b, a); else this.idx.push(ci, a, b);
    }
  };

  /* ── shaders ─────────────────────────────────────────────────────────── */

  const LIGHT_GLSL = [
    'uniform vec3 uLampP[4];',
    'uniform vec3 uLampC[4];',
    'uniform int  uLampN;',
    'uniform vec3 uEye;',
    'vec3 lampSum(vec3 P, vec3 N, float rough){',
    '  vec3 acc = vec3(0.0);',
    '  for (int i = 0; i < 4; i++){',
    '    if (i >= uLampN) break;',
    '    vec3 d = uLampP[i] - P; float r2 = dot(d,d); float r = sqrt(r2);',
    '    vec3 L = d / max(r, 1e-4);',
    '    float lam = max(dot(N, L), 0.0);',
    '    float fall = 1.0 / (0.30 + r2);',
    '    vec3 V = normalize(uEye - P); vec3 H = normalize(L + V);',
    '    float spec = pow(max(dot(N,H),0.0), mix(90.0, 6.0, rough)) * (1.0 - rough) * 0.85;',
    '    acc += uLampC[i] * fall * (lam + spec);',
    '  }',
    '  return acc;',
    '}'
  ].join('\n');

  const SCENE_VS = [
    '#version 300 es',
    'layout(location=0) in vec3 aPos;',
    'layout(location=1) in vec3 aNrm;',
    'layout(location=2) in vec3 aCol;',
    'layout(location=3) in float aMat;',
    'uniform mat4 uVP;',
    'out vec3 vPos; out vec3 vNrm; out vec3 vCol; out float vMat;',
    'void main(){ vPos=aPos; vNrm=aNrm; vCol=aCol; vMat=aMat;',
    '  gl_Position = uVP * vec4(aPos,1.0); }'
  ].join('\n');

  const SCENE_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec3 vPos; in vec3 vNrm; in vec3 vCol; in float vMat;',
    'out vec4 outC;',
    LIGHT_GLSL,
    'uniform sampler2D uMarks;',
    'uniform float uFog;',
    'uniform float uNearCut;',
    'uniform float uCeil;',
    'float grid(vec2 p, float sp, float w){',
    '  vec2 g = abs(fract(p/sp - 0.5) - 0.5) * sp;',
    '  float d = min(g.x, g.y);',
    '  return 1.0 - smoothstep(0.0, w, d);',
    '}',
    'void main(){',
    '  vec3 N = normalize(vNrm);',
    '  vec3 toEye = uEye - vPos;',
    '  if (vMat < 1.5 || vMat > 2.5) {',
    '    if (dot(toEye, toEye) < uNearCut*uNearCut) discard;',
    '  }',
    '  if (vMat > 4.5) {',
    '    if (uEye.y > uCeil) discard;',        // ceiling fitting, seen from above
    '    if (dot(N, toEye) < 0.0) N = -N;',
    '  } else if (vMat > 3.5) {',
    '    if (dot(N, toEye) < 0.0) discard;',   // shell: only from inside
    '  } else if (dot(N, toEye) < 0.0) {',
    '    N = -N;',                              // everything else is two-sided
    '  }',
    '  vec3 base = vCol;',
    '  float rough = 0.85;',
    '  if (vMat > 2.5 && vMat < 3.5) rough = 0.25;',
    '  if ((vMat > 0.5 && vMat < 1.5) || vMat > 5.5){ outC = vec4(base, 1.0); return; }',
    '  vec3 paint = vec3(0.0);',
    '  if (vMat > 1.5 && vMat < 2.5){',
    '    float g = grid(vPos.xz, 1.0, 0.010);',
    '    base = mix(base, base*1.9 + vec3(0.02,0.015,0.008), g*0.45);',
    '    rough = 0.5;',
    '    float u = vPos.z/12.0, v = (vPos.x+2.7)/5.4;',
    '    paint = texture(uMarks, vec2(u, v)).rgb * 0.42;',
    '  }',
    '  vec3 lit = base * (lampSum(vPos, N, rough) + vec3(0.055,0.052,0.064)) + paint;',
    '  float fog = 1.0 - exp(-uFog * length(vPos - uEye));',
    '  lit = mix(lit, vec3(0.020,0.021,0.028), fog);',
    '  outC = vec4(lit, 1.0);',
    '}'
  ].join('\n');

  const FSQ_VS = [
    '#version 300 es',
    'layout(location=0) in vec2 aXY;',
    'out vec2 vUV;',
    'void main(){ vUV = aXY*0.5+0.5; gl_Position = vec4(aXY,0.0,1.0); }'
  ].join('\n');

  function advectFS(kernelGlsl) {
    return [
      '#version 300 es',
      'precision highp float;',
      'out vec4 outC;',
      'uniform sampler2D uPos;',
      'uniform sampler2D uSegA;',
      'uniform sampler2D uSegB;',
      'uniform int   uSegN;',
      'uniform float uTime;',
      'uniform float uDt;',
      'uniform float uLife;',
      'uniform int   uSub;',
      'uniform vec3  uPuffO;',
      'uniform vec3  uPuffN;',
      'uniform vec4  uPuff;',   // x = front, y = dfront/dt, z = b, w = db/dt
      'uniform float uSwirl;',
      kernelGlsl,
      'vec3 field(vec3 P){',
      '  vec3 v = vec3(0.0);',
      '  for (int i = 0; i < 2048; i++){',
      '    if (i >= uSegN) break;',
      '    vec4 A = texelFetch(uSegA, ivec2(i & 1023, i >> 10), 0);',
      '    vec4 B = texelFetch(uSegB, ivec2(i & 1023, i >> 10), 0);',
      '    v += A.w * segInduce(A.xyz, B.xyz, P, B.w);',
      '  }',
      '  return v;',
      '}',
      'float hash(vec3 p){ p = fract(p*0.3183099 + vec3(0.71,0.113,0.419));',
      '  p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
      'void main(){',
      '  ivec2 c = ivec2(gl_FragCoord.xy);',
      '  vec4 s = texelFetch(uPos, c, 0);',
      '  if (s.w == 0.0) { outC = s; return; }',
      '  float birth = abs(s.w);',
      '  float age = uTime - birth;',
      '  if (age > uLife || age < 0.0) { outC = vec4(s.xyz, 0.0); return; }',
      '  vec3 p = s.xyz;',
      '  if (s.w < 0.0) {',
      '    vec3 d = p - uPuffO;',
      '    float ax = dot(d, uPuffN);',
      '    vec3 rad = d - ax * uPuffN;',
      '    float gz = uPuff.x > 1e-4 ? uPuff.y / uPuff.x : 0.0;',
      '    float gr = uPuff.z > 1e-4 ? uPuff.w / uPuff.z : 0.0;',
      '    vec3 v = gz * ax * uPuffN + gr * rad;',
      '    float j = hash(p*31.0 + uTime*0.7) - 0.5;',
      '    vec3 t1 = normalize(cross(uPuffN, vec3(0.31,0.77,0.55)));',
      '    v += (t1 * j + cross(uPuffN, t1) * (hash(p*17.0 - uTime*0.5)-0.5))',
      '         * 0.55 * length(v);',
      '    p += v * uDt;',
      '  } else {',
      '    float h = uDt / float(uSub);',
      '    for (int k = 0; k < 6; k++){',
      '      if (k >= uSub) break;',
      '      vec3 v = field(p);',
      '      vec3 vm = field(p + 0.5*h*v);',
      '      vec3 d = vm * h;',
      '      float L = length(d);',
      '      if (L > 0.06) d *= 0.06 / L;',
      '      p += d;',
      '    }',
      '    if (uSwirl > 0.0) {',
      '      float j1 = hash(p*23.0 + uTime*0.31) - 0.5;',
      '      float j2 = hash(p*29.0 - uTime*0.27) - 0.5;',
      '      float j3 = hash(p*37.0 + uTime*0.19) - 0.5;',
      '      p += vec3(j1,j2,j3) * uSwirl * uDt;',
      '    }',
      '  }',
      '  if (any(isnan(p)) || any(isinf(p))) { outC = vec4(s.xyz, 0.0); return; }',
      '  outC = vec4(p, s.w);',
      '}'
    ].join('\n');
  }

  const SMOKE_VS = [
    '#version 300 es',
    'precision highp float;',
    'uniform sampler2D uPos;',
    'uniform mat4 uVP;',
    'uniform float uTime;',
    'uniform float uLife;',
    'uniform float uPx;',
    'uniform float uGrow;',
    'uniform float uPuffFade;',
    'uniform float uPuffGrow;',
    'out vec3 vRad; out float vW;',
    LIGHT_GLSL,
    'float hash(int i){ float f = float(i)*0.6180339887; return fract(f*43758.5453); }',
    'void main(){',
    '  int id = gl_VertexID;',
    '  vec4 s = texelFetch(uPos, ivec2(id & 255, id >> 8), 0);',
    '  if (s.w == 0.0) { gl_Position = vec4(2.0,2.0,2.0,1.0); gl_PointSize = 0.0; vW = 0.0; return; }',
    '  float age = uTime - abs(s.w);',
    '  float f = clamp(age/0.18, 0.0, 1.0) * pow(clamp((uLife-age)/(uLife*0.78), 0.0, 1.0), 1.5);',
    '  if (f <= 0.001) { gl_Position = vec4(2.0,2.0,2.0,1.0); gl_PointSize = 0.0; vW = 0.0; return; }',
    '  vec4 cp = uVP * vec4(s.xyz, 1.0);',
    '  gl_Position = cp;',
    '  float d = max(cp.w, 0.15);',
    '  float rw = (0.0090 + 0.0080*hash(id*7+3)) + uGrow*age;',
    '  float pf = 1.0;',
    '  if (s.w < 0.0) { rw *= uPuffGrow; pf = uPuffFade; }',
    '  gl_PointSize = clamp(uPx * rw / d, 1.0, 260.0);',
    // Smoke is a participating medium, not a surface.  Lambert-shading it
    // against a fake normal leaves every particle whose lamp is behind it lit
    // by ambient alone, which paints a DARK plume in the one view where you
    // stand inside the smoke.  Scatter isotropically instead.
    '  vec3 lit = vec3(0.052,0.053,0.064);',
    '  for (int i = 0; i < 4; i++){',
    '    if (i >= uLampN) break;',
    '    vec3 dd = uLampP[i] - s.xyz;',
    '    lit += uLampC[i] * (0.26 / (0.30 + dot(dd,dd)));',
    '  }',
    '  float tint = 0.86 + 0.28*hash(id);',
    '  vRad = lit * tint;',
    '  vW = pf * f / (1.0 + uGrow*age*22.0);',
    '}'
  ].join('\n');

  const SMOKE_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec3 vRad; in float vW;',
    'out vec4 outC;',
    'void main(){',
    '  vec2 q = gl_PointCoord - 0.5;',
    '  float r2 = dot(q,q)*4.0;',
    '  if (r2 > 1.0) discard;',
    '  float w = exp(-2.6*r2) * (1.0 - r2*r2) * vW * 0.30;',
    '  outC = vec4(vRad * w, w);',
    '}'
  ].join('\n');

  const LINE_VS = [
    '#version 300 es',
    'layout(location=0) in vec3 aPos;',
    'uniform mat4 uVP;',
    'void main(){ gl_Position = uVP * vec4(aPos,1.0); }'
  ].join('\n');
  const LINE_FS = [
    '#version 300 es',
    'precision highp float;',
    'uniform vec3 uCol;',
    'out vec4 outC;',
    'void main(){ outC = vec4(uCol,1.0); }'
  ].join('\n');

  const FLAME_VS = [
    '#version 300 es',
    'layout(location=0) in vec2 aXY;',
    'uniform mat4 uVP; uniform vec3 uPos; uniform vec3 uRight; uniform vec3 uUp;',
    'uniform vec2 uSize;',
    'out vec2 vQ;',
    'void main(){ vQ = aXY;',
    '  vec3 w = uPos + uRight*(aXY.x*uSize.x) + uUp*(aXY.y*0.5+0.5)*uSize.y;',
    '  gl_Position = uVP * vec4(w,1.0); }'
  ].join('\n');
  const FLAME_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vQ; out vec4 outC;',
    'uniform float uT; uniform float uLean; uniform float uAlive;',
    'void main(){',
    '  float y = vQ.y*0.5+0.5;',
    '  float lean = uLean * y * y;',
    '  float x = vQ.x - lean;',
    '  float w = (0.40 + 0.16*sin(uT*7.3+y*5.0)) * pow(max(1.0-y,0.0), 0.62) * (0.35+0.95*y);',
    '  float d = abs(x) / max(w, 1e-3);',
    '  float core = exp(-6.5*d*d) * uAlive;',
    '  float halo = exp(-1.7*d*d) * uAlive;',
    '  vec3 c = mix(vec3(1.0,0.62,0.16), vec3(1.0,0.95,0.80), pow(core,1.6));',
    '  vec3 col = c*core*2.4 + vec3(0.9,0.42,0.10)*halo*0.30;',
    '  float a = clamp(core + halo*0.30, 0.0, 1.0);',
    '  outC = vec4(col*a, a);',
    '}'
  ].join('\n');

  const COMPOSE_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUV; out vec4 outC;',
    'uniform sampler2D uScene; uniform sampler2D uSmoke;',
    'uniform float uK; uniform float uExpose;',
    'vec3 aces(vec3 x){',
    '  return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);',
    '}',
    'void main(){',
    '  ivec2 c = ivec2(gl_FragCoord.xy);',
    '  vec3 scene = texelFetch(uScene, c, 0).rgb;',
    '  vec4 sm = texelFetch(uSmoke, c, 0);',
    '  float D = sm.a * uK;',
    '  float T = exp(-D);',
    '  vec3 lit = sm.a > 1e-6 ? sm.rgb / sm.a : vec3(0.0);',
    '  vec3 col = scene*T + lit*(1.0-T);',
    '  col = aces(col * uExpose);',
    '  float v = 1.0 - 0.30*pow(length(vUV-0.5)*1.42, 2.4);',
    '  col *= v;',
    '  float dth = fract(52.9829189*fract(0.06711056*gl_FragCoord.x + 0.00583715*gl_FragCoord.y));',
    '  col += (dth - 0.5)/255.0;',
    '  outC = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* ── the metre-mark texture (drawn with canvas 2d, uploaded once) ─────── */

  function marksTexture(gl, hallLen, halfW) {
    const W = 1024, H = 512;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    // u = z/12, v = (x+2.7)/5.4  -> canvas x = u*W, y = v*H
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let m = 1; m <= Math.floor(hallLen); m++) {
      const u = m / 12, px = u * W;
      const major = (m % 5 === 0);
      c.fillStyle = major ? 'rgba(226,178,96,1)' : 'rgba(150,158,172,0.72)';
      const barLen = major ? 42 : 24;
      c.fillRect(px - 2, ((-halfW + 2.7) / 5.4) * H, 4, barLen);
      c.fillRect(px - 2, ((halfW + 2.7) / 5.4) * H - barLen, 4, barLen);
      if (major) {
        c.save();
        c.translate(px, ((-halfW + 2.7) / 5.4) * H + 74);
        c.rotate(-Math.PI / 2);
        c.font = '600 34px ui-monospace, Menlo, monospace';
        c.fillStyle = 'rgba(226,178,96,0.95)';
        c.fillText(String(m), 0, 0);
        c.restore();
      }
    }
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return t;
  }

  /* ── the renderer ────────────────────────────────────────────────────── */

  function Renderer(canvas, geom, kernelGlsl) {
    const gl = canvas.getContext('webgl2', {
      antialias: false, alpha: false, depth: false,
      powerPreference: 'high-performance', preserveDrawingBuffer: false
    });
    if (!gl) throw new Error('WebGL2 is not available in this browser.');
    if (!gl.getExtension('EXT_color_buffer_float')) {
      throw new Error('EXT_color_buffer_float is not available.');
    }
    this.gl = gl; this.canvas = canvas; this.geom = geom;
    this.scale = 1;
    this.W = 2; this.H = 2;

    this.pScene = program(gl, SCENE_VS, SCENE_FS, 'scene');
    this.pAdvect = program(gl, FSQ_VS, advectFS(kernelGlsl), 'advect');
    this.pSmoke = program(gl, SMOKE_VS, SMOKE_FS, 'smoke');
    this.pLine = program(gl, LINE_VS, LINE_FS, 'line');
    this.pFlame = program(gl, FLAME_VS, FLAME_FS, 'flame');
    this.pCompose = program(gl, FSQ_VS, COMPOSE_FS, 'compose');

    // full-screen quad
    this.quadVAO = gl.createVertexArray();
    gl.bindVertexArray(this.quadVAO);
    const qb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.flameVAO = gl.createVertexArray();
    gl.bindVertexArray(this.flameVAO);
    const fb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1,  1,-1,  1,1,  -1,-1,  1,1,  -1,1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.emptyVAO = gl.createVertexArray();

    // particle pool
    this.posTex = [
      tex2D(gl, PW, PH, gl.RGBA32F, gl.RGBA, gl.FLOAT),
      tex2D(gl, PW, PH, gl.RGBA32F, gl.RGBA, gl.FLOAT)
    ];
    const zeros = new Float32Array(PW * PH * 4);
    for (const t of this.posTex) {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, PW, PH, gl.RGBA, gl.FLOAT, zeros);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.src = 0;
    this.posFBO = [gl.createFramebuffer(), gl.createFramebuffer()];
    for (let i = 0; i < 2; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.posFBO[i]);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.posTex[i], 0);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.shot = 0;
    this.spawnBuf = new Float32Array(PW * BLOCK * 4);

    // segment textures
    this.segA = tex2D(gl, 1024, MAXSEG / 1024, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    this.segB = tex2D(gl, 1024, MAXSEG / 1024, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    this.segBufA = new Float32Array(MAXSEG * 4);
    this.segBufB = new Float32Array(MAXSEG * 4);
    this.segN = 0;

    // hall geometry
    const mb = buildHall(geom);
    this.hallVAO = gl.createVertexArray();
    gl.bindVertexArray(this.hallVAO);
    const mk = (loc, arr, n) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0);
    };
    mk(0, mb.pos, 3); mk(1, mb.nrm, 3); mk(2, mb.col, 3); mk(3, mb.mat, 1);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(mb.idx), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    this.hallCount = mb.idx.length;

    // dynamic line buffer (filament overlay)
    this.lineVAO = gl.createVertexArray();
    gl.bindVertexArray(this.lineVAO);
    this.lineBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, 4 * 3 * 4096, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.lineScratch = new Float32Array(3 * 4096);

    this.marks = marksTexture(gl, geom.hallLen, geom.halfW);
    this.resize(canvas.clientWidth || 800, canvas.clientHeight || 600, 1);
  }

  Renderer.prototype.resize = function (cssW, cssH, scale) {
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(2, Math.round(cssW * dpr * scale));
    const H = Math.max(2, Math.round(cssH * dpr * scale));
    if (W === this.W && H === this.H) return;
    this.W = W; this.H = H; this.scale = scale;
    this.canvas.width = W; this.canvas.height = H;

    if (this.sceneFBO) {
      gl.deleteFramebuffer(this.sceneFBO); gl.deleteFramebuffer(this.smokeFBO);
      gl.deleteTexture(this.sceneTex); gl.deleteTexture(this.smokeTex); gl.deleteTexture(this.depthTex);
    }
    this.sceneTex = tex2D(gl, W, H, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    this.smokeTex = tex2D(gl, W, H, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    this.depthTex = tex2D(gl, W, H, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
    this.sceneFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneTex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTex, 0);
    this.smokeFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.smokeFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.smokeTex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  /** Spawn one block of particles.  `fill(i, out4)` writes x,y,z,w. */
  Renderer.prototype.spawn = function (count, fill) {
    const gl = this.gl;
    const rows = BLOCK, cap = PW * rows;
    const buf = this.spawnBuf;
    buf.fill(0);
    const n = Math.min(count, cap);
    const o = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      fill(i, o);
      buf[4 * i] = o[0]; buf[4 * i + 1] = o[1]; buf[4 * i + 2] = o[2]; buf[4 * i + 3] = o[3];
    }
    const y0 = this.shot * rows;
    for (let k = 0; k < 2; k++) {
      gl.bindTexture(gl.TEXTURE_2D, this.posTex[k]);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y0, PW, rows, gl.RGBA, gl.FLOAT, buf);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.shot = (this.shot + 1) % SHOTS;
    return n;
  };

  Renderer.prototype.setSegments = function (list) {
    // list: array of {q: Float64Array, M, gamma, delta}
    const A = this.segBufA, B = this.segBufB;
    let n = 0;
    for (let s = 0; s < list.length; s++) {
      const S = list[s], k = S.gamma / (4 * Math.PI), d2 = S.delta * S.delta;
      for (let i = 0; i < S.M && n < MAXSEG; i++) {
        const j = (i + 1) % S.M;
        A[4 * n] = S.q[3 * i]; A[4 * n + 1] = S.q[3 * i + 1]; A[4 * n + 2] = S.q[3 * i + 2]; A[4 * n + 3] = k;
        B[4 * n] = S.q[3 * j]; B[4 * n + 1] = S.q[3 * j + 1]; B[4 * n + 2] = S.q[3 * j + 2]; B[4 * n + 3] = d2;
        n++;
      }
    }
    for (let i = n; i < MAXSEG; i++) { A[4 * i + 3] = 0; B[4 * i + 3] = 1; }
    const gl = this.gl, rows = MAXSEG / 1024;
    gl.bindTexture(gl.TEXTURE_2D, this.segA);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, rows, gl.RGBA, gl.FLOAT, A);
    gl.bindTexture(gl.TEXTURE_2D, this.segB);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, rows, gl.RGBA, gl.FLOAT, B);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.segN = n;
  };

  Renderer.prototype.advect = function (o) {
    const gl = this.gl, p = this.pAdvect;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.posFBO[1 - this.src]);
    gl.viewport(0, 0, PW, PH);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    gl.useProgram(p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.posTex[this.src]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.segA);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.segB);
    gl.uniform1i(p.u.uPos, 0); gl.uniform1i(p.u.uSegA, 1); gl.uniform1i(p.u.uSegB, 2);
    gl.uniform1i(p.u.uSegN, this.segN);
    gl.uniform1f(p.u.uTime, o.time);
    gl.uniform1f(p.u.uDt, o.dt);
    gl.uniform1f(p.u.uLife, o.life);
    gl.uniform1i(p.u.uSub, o.sub);
    gl.uniform3fv(p.u.uPuffO, o.puffO);
    gl.uniform3fv(p.u.uPuffN, o.puffN);
    gl.uniform4fv(p.u.uPuff, o.puff);
    gl.uniform1f(p.u.uSwirl, o.swirl);
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.src = 1 - this.src;
  };

  Renderer.prototype.frame = function (o) {
    const gl = this.gl, W = this.W, H = this.H;
    const lampP = new Float32Array(12), lampC = new Float32Array(12);
    for (let i = 0; i < o.lamps.length && i < 4; i++) {
      lampP.set(o.lamps[i].p, i * 3);
      lampC.set(o.lamps[i].c, i * 3);
    }
    const nL = Math.min(o.lamps.length, 4);

    // --- pass 1: the hall.  Unbind the depth texture from every unit first.
    for (let u = 0; u < 4; u++) { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, null); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFBO);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.014, 0.015, 0.021, 1);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.BLEND);
    
    let p = this.pScene;
    gl.useProgram(p);
    gl.uniformMatrix4fv(p.u.uVP, false, o.vp);
    gl.uniform3fv(p.u.uLampP, lampP); gl.uniform3fv(p.u.uLampC, lampC);
    gl.uniform1i(p.u.uLampN, nL);
    gl.uniform3fv(p.u.uEye, o.eye);
    gl.uniform1f(p.u.uFog, o.fog);
    gl.uniform1f(p.u.uNearCut, o.nearCut === undefined ? 0.45 : o.nearCut);
    gl.uniform1f(p.u.uCeil, this.geom.ceil - 0.02);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.marks);
    gl.uniform1i(p.u.uMarks, 0);
    gl.bindVertexArray(this.hallVAO);
    gl.drawElements(gl.TRIANGLES, this.hallCount, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
    

    // the candle flame, a billboard, alpha over the hall
    if (o.flame) {
      p = this.pFlame;
      gl.useProgram(p);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniformMatrix4fv(p.u.uVP, false, o.vp);
      gl.uniform3fv(p.u.uPos, o.flame.pos);
      gl.uniform3fv(p.u.uRight, o.camRight);
      gl.uniform3fv(p.u.uUp, [0, 1, 0]);
      gl.uniform2fv(p.u.uSize, o.flame.size);
      gl.uniform1f(p.u.uT, o.time);
      gl.uniform1f(p.u.uLean, o.flame.lean);
      gl.uniform1f(p.u.uAlive, o.flame.alive);
      gl.bindVertexArray(this.flameVAO);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    // the filament overlay
    if (o.lines && o.lines.length) {
      p = this.pLine;
      gl.useProgram(p);
      gl.uniformMatrix4fv(p.u.uVP, false, o.vp);
      gl.bindVertexArray(this.lineVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
      for (const ln of o.lines) {
        const n = Math.min(ln.pts.length / 3, 4096);
        for (let i = 0; i < 3 * n; i++) this.lineScratch[i] = ln.pts[i];
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.lineScratch, 0, 3 * n);
        gl.uniform3fv(p.u.uCol, ln.col);
        gl.drawArrays(ln.loop ? gl.LINE_LOOP : gl.LINE_STRIP, 0, n);
      }
      gl.bindVertexArray(null);
    }

    // --- pass 2: smoke, into its own colour buffer over the shared depth
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.smokeFBO);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.depthMask(false);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    p = this.pSmoke;
    gl.useProgram(p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.posTex[this.src]);
    gl.uniform1i(p.u.uPos, 0);
    gl.uniformMatrix4fv(p.u.uVP, false, o.vp);
    gl.uniform3fv(p.u.uEye, o.eye);
    gl.uniform1f(p.u.uTime, o.time);
    gl.uniform1f(p.u.uLife, o.life);
    gl.uniform1f(p.u.uPx, H * o.pxScale);
    gl.uniform1f(p.u.uGrow, o.grow);
    gl.uniform1f(p.u.uPuffFade, o.puffFade === undefined ? 1 : o.puffFade);
    gl.uniform1f(p.u.uPuffGrow, o.puffGrow === undefined ? 1 : o.puffGrow);
    gl.uniform3fv(p.u.uLampP, lampP); gl.uniform3fv(p.u.uLampC, lampC);
    gl.uniform1i(p.u.uLampN, nL);
    gl.bindVertexArray(this.emptyVAO);
    gl.drawArrays(gl.POINTS, 0, o.particles);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.depthMask(true);

    // --- pass 3: compose to the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.DEPTH_TEST);
    p = this.pCompose;
    gl.useProgram(p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.smokeTex);
    gl.uniform1i(p.u.uScene, 0); gl.uniform1i(p.u.uSmoke, 1);
    gl.uniform1f(p.u.uK, o.absorb);
    gl.uniform1f(p.u.uExpose, o.expose);
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  /* ── the hall, built once ────────────────────────────────────────────── */

  function buildHall(g) {
    const mb = new MeshBuilder();
    const L = g.hallLen, W = g.halfW, Hh = g.ceil;
    const floorC = [0.205, 0.190, 0.172];
    const wallC = [0.118, 0.118, 0.138];
    const dadoC = [0.20, 0.145, 0.086];
    const brass = [0.72, 0.52, 0.21];
    const wood = [0.26, 0.152, 0.078];

    // floor / ceiling / walls / back wall.  mat 4 = shell: drawn only from
    // inside, so orbiting out of the hall opens it like a doll's house.
    mb.quadN([-W, 0, -1.2], [W, 0, -1.2], [W, 0, L], [-W, 0, L], [0, 1, 0], floorC, 2);
    mb.quadN([-W, Hh, L], [W, Hh, L], [W, Hh, -1.2], [-W, Hh, -1.2], [0, -1, 0], [0.038,0.038,0.046], 4);
    mb.quadN([-W, 0, L], [W, 0, L], [W, Hh, L], [-W, Hh, L], [0, 0, -1], wallC, 0);
    mb.quadN([-W, 0, -1.2], [-W, 0, L], [-W, Hh, L], [-W, Hh, -1.2], [1, 0, 0], wallC, 4);
    mb.quadN([W, 0, L], [W, 0, -1.2], [W, Hh, -1.2], [W, Hh, L], [-1, 0, 0], wallC, 4);
    mb.quadN([-W, 0, -1.2], [-W, Hh, -1.2], [W, Hh, -1.2], [W, 0, -1.2], [0, 0, 1], wallC, 4);
    // dado rail, skirting, and pilasters — the rhythm that gives the hall depth
    for (const sx of [-1, 1]) {
      mb.box([sx * (W - 0.03), 0.92, L / 2 - 0.6], [0.035, 0.05, L / 2 + 0.6], dadoC, 0);
      mb.box([sx * (W - 0.035), 0.075, L / 2 - 0.6], [0.04, 0.075, L / 2 + 0.6], dadoC, 0);
      for (let z = 0.6; z < L; z += 1.8) {
        mb.box([sx * (W - 0.045), Hh / 2, z], [0.05, Hh / 2, 0.075], [0.155, 0.148, 0.162], 0);
        mb.box([sx * (W - 0.055), Hh - 0.10, z], [0.06, 0.055, 0.10], dadoC, 0);
      }
    }
    // the painted target on the back wall
    for (let k = 1; k <= 3; k++) {
      const r = 0.24 * k;
      const seg = 64;
      for (let i = 0; i < seg; i++) {
        const t0 = 2 * Math.PI * i / seg, t1 = 2 * Math.PI * (i + 1) / seg;
        const ri = r - 0.016;
        mb.quad(
          [g.axisX + r * Math.cos(t0), g.axisY + r * Math.sin(t0), L - 0.004],
          [g.axisX + ri * Math.cos(t0), g.axisY + ri * Math.sin(t0), L - 0.004],
          [g.axisX + ri * Math.cos(t1), g.axisY + ri * Math.sin(t1), L - 0.004],
          [g.axisX + r * Math.cos(t1), g.axisY + r * Math.sin(t1), L - 0.004],
          k === 2 ? [0.30, 0.13, 0.10] : [0.18, 0.175, 0.185], 0);
      }
    }

    // hanging lamps
    for (const lz of g.lampZ) {
      mb.box([g.axisX, Hh - 0.16, lz], [0.012, 0.16, 0.012], [0.09, 0.09, 0.10], 5);
      // a cone shade: a tube in y, so build it by hand as a ring of quads
      const seg = 20, r0 = 0.045, r1 = 0.20, y0 = Hh - 0.34, y1 = Hh - 0.50;
      for (let i = 0; i < seg; i++) {
        const t0 = 2 * Math.PI * i / seg, t1 = 2 * Math.PI * (i + 1) / seg;
        mb.quad(
          [g.axisX + r0 * Math.cos(t0), y0, lz + r0 * Math.sin(t0)],
          [g.axisX + r0 * Math.cos(t1), y0, lz + r0 * Math.sin(t1)],
          [g.axisX + r1 * Math.cos(t1), y1, lz + r1 * Math.sin(t1)],
          [g.axisX + r1 * Math.cos(t0), y1, lz + r1 * Math.sin(t0)],
          [0.16, 0.13, 0.10], 5);
      }
      // the bulb, emissive: a horizontal disc facing down
      const seg2 = 18, br = 0.085;
      const ci = mb.vert([g.axisX, y1 + 0.004, lz], [0, -1, 0], [2.6, 2.05, 1.42], 5.9);
      for (let i = 0; i < seg2; i++) {
        const t0 = 2 * Math.PI * i / seg2, t1 = 2 * Math.PI * (i + 1) / seg2;
        const a = mb.vert([g.axisX + br * Math.cos(t0), y1 + 0.004, lz + br * Math.sin(t0)],
          [0, -1, 0], [1.5, 1.15, 0.78], 5.9);
        const b = mb.vert([g.axisX + br * Math.cos(t1), y1 + 0.004, lz + br * Math.sin(t1)],
          [0, -1, 0], [1.5, 1.15, 0.78], 5.9);
        mb.idx.push(ci, a, b);
      }
    }

    // the cannon: barrel + face plate with an aperture + a stand
    const cz0 = g.cannonZ - 0.62, cz1 = g.cannonZ;
    mb.tube(g.axisX, g.axisY, cz0, cz1, 0.30, 0.30, 40, wood, 0);
    // hoops
    for (const hz of [cz0 + 0.07, cz1 - 0.07]) {
      mb.tube(g.axisX, g.axisY, hz - 0.022, hz + 0.022, 0.315, 0.315, 40, brass, 3);
    }
    // the rear diaphragm (a shallow dish)
    mb.disc(g.axisX, g.axisY, cz0 - 0.002, 0.298, 40, [0.10, 0.10, 0.12], 0, true);
    // the face plate: an annulus between the aperture and the barrel
    const seg = 48;
    for (let i = 0; i < seg; i++) {
      const t0 = 2 * Math.PI * i / seg, t1 = 2 * Math.PI * (i + 1) / seg;
      const ri = g.apertureMax, ro = 0.30;
      mb.quad(
        [g.axisX + ro * Math.cos(t0), g.axisY + ro * Math.sin(t0), cz1],
        [g.axisX + ri * Math.cos(t0), g.axisY + ri * Math.sin(t0), cz1],
        [g.axisX + ri * Math.cos(t1), g.axisY + ri * Math.sin(t1), cz1],
        [g.axisX + ro * Math.cos(t1), g.axisY + ro * Math.sin(t1), cz1],
        brass, 3);
    }
    // stand
    mb.box([g.axisX, (g.axisY - 0.31) / 2, g.cannonZ - 0.31], [0.05, (g.axisY - 0.31) / 2, 0.05], [0.10,0.10,0.115], 0);
    mb.box([g.axisX, 0.03, g.cannonZ - 0.31], [0.34, 0.03, 0.34], [0.10,0.10,0.115], 0);

    // the candle and its stand
    mb.box([g.candle[0], (g.candle[1] - 0.17) / 2, g.candle[2]], [0.011, (g.candle[1] - 0.17) / 2, 0.011], [0.60,0.44,0.19], 3);
    mb.box([g.candle[0], 0.012, g.candle[2]], [0.075, 0.012, 0.075], [0.60,0.44,0.19], 3);
    // the candle body: a vertical cylinder, built as quads
    const cs = 18, cr = 0.021, cy0 = g.candle[1] - 0.16, cy1 = g.candle[1] - 0.012;
    for (let i = 0; i < cs; i++) {
      const t0 = 2 * Math.PI * i / cs, t1 = 2 * Math.PI * (i + 1) / cs;
      mb.quad(
        [g.candle[0] + cr * Math.cos(t0), cy0, g.candle[2] + cr * Math.sin(t0)],
        [g.candle[0] + cr * Math.cos(t1), cy0, g.candle[2] + cr * Math.sin(t1)],
        [g.candle[0] + cr * Math.cos(t1), cy1, g.candle[2] + cr * Math.sin(t1)],
        [g.candle[0] + cr * Math.cos(t0), cy1, g.candle[2] + cr * Math.sin(t0)],
        [0.62, 0.58, 0.47], 0);
    }
    return mb;
  }

  return {
    Renderer, mLookAt, mPerspective, mMul, mIdent,
    PW, PH, SHOTS, BLOCK, MAXSEG
  };
})();
