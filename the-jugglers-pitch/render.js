/* ============================================================================
   render.js — THE JUGGLER'S PITCH, drawn.

   A fairground green at dusk, WebGL2, four passes:

     1. a full-screen ray-march of everything solid — the ground, the two
        light poles, and the juggler herself as a dozen tapered capsules —
        into an HDR target.  It writes gl_FragDepth from the SAME
        view-projection matrix the raster passes use, so the two agree.
        (LANDMINES: a hand-rolled camera basis in one pass and a matrix in
        the other is how you flip a scene.)
     2. a forward pass for the things that GLOW: the bulbs on the catenary,
        the balls, and their long-exposure trails.  Additive, depth-tested
        against pass 1, never depth-writing.
     3. two octaves of bloom.
     4. tonemap.  Every emitter is scaled by one factor 1/(1+max(rgb)) so a
        bright ball never changes hue on its way to white.  (LANDMINES again.)

   The figure is lit by the string lights above her and, genuinely, by the
   balls in her hands: each ball is a point light, so a five-ball pattern
   throws a moving warm glow across her face.
   ============================================================================ */

/* ── tiny mat4 ─────────────────────────────────────────────────────────────── */
const M4 = {
  ident: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
  mul(a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
      o[i * 4 + j] = s;
    }
    return o;
  },
  perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
    o[0] = f / aspect; o[5] = f; o[11] = -1;
    o[10] = (far + near) / (near - far); o[14] = 2 * far * near / (near - far);
    return o;
  },
  lookAt(eye, at, up) {
    const z = norm(sub(eye, at)), x = norm(cross(up, z)), y = cross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
    ]);
  },
  invert(m) {
    const a = m, o = new Float32Array(16);
    const b00=a[0]*a[5]-a[1]*a[4], b01=a[0]*a[6]-a[2]*a[4], b02=a[0]*a[7]-a[3]*a[4];
    const b03=a[1]*a[6]-a[2]*a[5], b04=a[1]*a[7]-a[3]*a[5], b05=a[2]*a[7]-a[3]*a[6];
    const b06=a[8]*a[13]-a[9]*a[12], b07=a[8]*a[14]-a[10]*a[12], b08=a[8]*a[15]-a[11]*a[12];
    const b09=a[9]*a[14]-a[10]*a[13], b10=a[9]*a[15]-a[11]*a[13], b11=a[10]*a[15]-a[11]*a[14];
    let det = b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
    if (!det) return M4.ident();
    det = 1 / det;
    o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*det;  o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*det;
    o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*det; o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*det;
    o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*det;  o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*det;
    o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*det; o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*det;
    o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*det;  o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*det;
    o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*det; o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*det;
    o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*det; o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*det;
    o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*det; o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*det;
    return o;
  },
};
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const dot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = (a) => { const l = Math.hypot(a[0],a[1],a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };

/* ── the pitch's furniture, in metres ──────────────────────────────────────── */
export const PITCH = {
  poleX: 3.45, poleZ: -0.55, poleTop: 3.12, poleR: 0.052,
  sagTo: 2.34,              // the lowest point of the near light string
  bulbs: 19,
  trodden: 1.55,            // radius of the worn circle she stands in
};

/** The catenary constant a with y = top + a*(cosh(x/a) - cosh(X/a)) sagging to sagTo. */
export function catenaryA(halfSpan, sag) {
  let lo = 0.02, hi = 400;
  for (let i = 0; i < 90; i++) {
    const a = 0.5 * (lo + hi);
    const s = a * (Math.cosh(halfSpan / a) - 1);
    if (s > sag) lo = a; else hi = a;
  }
  return 0.5 * (lo + hi);
}
export function catenaryY(x, halfSpan, top, a) {
  return top - a * (Math.cosh(halfSpan / a) - Math.cosh(x / a));
}

/* ── shaders ───────────────────────────────────────────────────────────────── */
const VS_FULL = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
out vec2 vNdc;
void main(){ vNdc = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FS_SCENE = `#version 300 es
precision highp float;
in vec2 vNdc;
layout(location=0) out vec4 oCol;

uniform mat4 uInvVP, uVP;
uniform vec3 uEye;
uniform float uTime;
uniform vec3 uJoint[16];      /* the figure's joints, in world metres */
uniform vec3 uBall[10];       /* ball positions -- they light her */
uniform vec3 uBallCol[10];
uniform int  uNBalls;
uniform float uPoleX, uPoleTop, uPoleR, uCatA, uCatTop;
uniform float uTrodden;
uniform float uGlow;          /* how bright the balls burn */

const float PI = 3.14159265;

/* joint indices, matching JOINT_ORDER in the JS */
#define J_HEAD 0
#define J_NECK 1
#define J_SHR  2
#define J_SHL  3
#define J_ELR  4
#define J_ELL  5
#define J_HDR  6
#define J_HDL  7
#define J_HIPR 8
#define J_HIPL 9
#define J_KNR  10
#define J_KNL  11
#define J_FTR  12
#define J_FTL  13

float sdSphere(vec3 p, vec3 c, float r){ return length(p-c) - r; }

float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba,ba);
  float rr = r1 - r2; float a2 = l2 - rr*rr; float il2 = 1.0/l2;
  vec3 pa = p - a; float y = dot(pa,ba); float z = y - l2;
  vec3 xp = pa*l2 - ba*y; float x2 = dot(xp,xp);
  float y2 = y*y*l2; float z2 = z*z*l2;
  float k = sign(rr)*rr*rr*x2;
  if (sign(z)*a2*z2 > k) return sqrt(x2 + z2)*il2 - r2;
  if (sign(y)*a2*y2 < k) return sqrt(x2 + y2)*il2 - r1;
  return (sqrt(x2*a2*il2) + y*rr)*il2 - r1;
}

float segDist(vec3 p, vec3 a, vec3 b){
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba*h);
}

float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

/* A trunk is much wider than it is deep, so the torso, shoulders and hips are
   evaluated in a squashed space (z x 1.62) and the distance divided back by the
   largest scale -- an honest underestimate, which is all a march needs. */
const vec3 TRUNK = vec3(1.0, 1.0, 1.62);
float sdTrunkCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  return sdRoundCone(p*TRUNK, a*TRUNK, b*TRUNK, r1, r2) / TRUNK.z;
}

/* the juggler */
float sdFigure(vec3 p){
  vec3 hipM = 0.5*(uJoint[J_HIPR] + uJoint[J_HIPL]);
  vec3 shM  = 0.5*(uJoint[J_SHR]  + uJoint[J_SHL]);
  float d = sdTrunkCone(p, hipM, shM, 0.150, 0.168);            /* torso */
  d = smin(d, sdTrunkCone(p, uJoint[J_SHL], uJoint[J_SHR], 0.100, 0.100), 0.055); /* shoulders */
  d = smin(d, sdTrunkCone(p, uJoint[J_HIPL], uJoint[J_HIPR], 0.116, 0.116), 0.06); /* hips */
  d = smin(d, sdRoundCone(p, shM, uJoint[J_NECK], 0.062, 0.048), 0.05);
  d = smin(d, sdSphere(p, uJoint[J_HEAD], 0.104), 0.035);
  /* a knot of hair, so the head reads as a head from behind */
  d = smin(d, sdSphere(p, uJoint[J_HEAD] + vec3(0.0, 0.052, -0.086), 0.058), 0.03);
  d = smin(d, sdRoundCone(p, uJoint[J_SHR], uJoint[J_ELR], 0.056, 0.044), 0.03);
  d = smin(d, sdRoundCone(p, uJoint[J_SHL], uJoint[J_ELL], 0.056, 0.044), 0.03);
  d = smin(d, sdRoundCone(p, uJoint[J_ELR], uJoint[J_HDR], 0.043, 0.034), 0.025);
  d = smin(d, sdRoundCone(p, uJoint[J_ELL], uJoint[J_HDL], 0.043, 0.034), 0.025);
  d = smin(d, sdSphere(p, uJoint[J_HDR], 0.047), 0.02);
  d = smin(d, sdSphere(p, uJoint[J_HDL], 0.047), 0.02);
  d = smin(d, sdRoundCone(p, uJoint[J_HIPR], uJoint[J_KNR], 0.088, 0.064), 0.04);
  d = smin(d, sdRoundCone(p, uJoint[J_HIPL], uJoint[J_KNL], 0.088, 0.064), 0.04);
  d = smin(d, sdRoundCone(p, uJoint[J_KNR], uJoint[J_FTR], 0.062, 0.046), 0.03);
  d = smin(d, sdRoundCone(p, uJoint[J_KNL], uJoint[J_FTL], 0.062, 0.046), 0.03);
  d = smin(d, sdRoundCone(p, uJoint[J_FTR], uJoint[J_FTR] + vec3(0.012,-0.012,0.135), 0.05, 0.036), 0.02);
  d = smin(d, sdRoundCone(p, uJoint[J_FTL], uJoint[J_FTL] + vec3(-0.012,-0.012,0.135), 0.05, 0.036), 0.02);
  return d;
}

/* The poles are two finite cylinders, intersected ANALYTICALLY.  Marching an
   SDF that contained them would force every ground ray in the frame into the
   step loop (their bound is three and a half metres wide); this way the march
   only ever runs inside a one-metre sphere around the juggler. */
float poleHit(vec3 ro, vec3 rd, out vec3 pn){
  float best = 1e9;
  pn = vec3(0.0, 1.0, 0.0);
  for (int k = 0; k < 2; k++){
    float cx = (k == 0) ? uPoleX : -uPoleX;
    vec2 o = vec2(ro.x - cx, ro.z + 0.55);
    vec2 d = vec2(rd.x, rd.z);
    float a = dot(d, d);
    if (a < 1e-9) continue;
    float b = dot(o, d), c = dot(o, o) - uPoleR*uPoleR;
    float disc = b*b - a*c;
    if (disc <= 0.0) continue;
    float t = (-b - sqrt(disc)) / a;
    if (t <= 0.02) continue;
    float y = ro.y + rd.y*t;
    if (y < 0.0 || y > uPoleTop) continue;
    if (t < best){
      best = t;
      vec2 nn = normalize(o + d*t);
      pn = normalize(vec3(nn.x, 0.0, nn.y));
    }
  }
  return best;
}

vec3 normalFig(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0009;
  return normalize(
    e.xyy*sdFigure(p + e.xyy) + e.yyx*sdFigure(p + e.yyx) +
    e.yxy*sdFigure(p + e.yxy) + e.xxx*sdFigure(p + e.xxx));
}

/* soft shadow of the FIGURE only -- the poles are thin and behind her */
float shadow(vec3 ro, vec3 rd, float tmax){
  if (length(ro - vec3(0.0, 0.95, 0.02)) > 4.2) return 1.0;
  float res = 1.0, t = 0.05;
  for (int i = 0; i < 30; i++){
    if (t > tmax) break;
    float h = sdFigure(ro + rd*t);
    if (h < 0.0009) return 0.0;
    res = min(res, 10.0*h/t);
    t += clamp(h, 0.016, 0.34);
  }
  return clamp(res, 0.0, 1.0);
}

float ao(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.014 + 0.055*float(i);
    o += (h - sdFigure(p + n*h)) * s;
    s *= 0.72;
  }
  return clamp(1.0 - 1.7*o, 0.0, 1.0);
}

float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash21(i), b = hash21(i+vec2(1,0)), c = hash21(i+vec2(0,1)), d = hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s += a*vnoise(p); p*=2.03; a*=0.5;} return s; }

/* the lamps we shade by: two representative bulbs on the near string */
vec3 lampPos(int i){
  float x = mix(-uPoleX*0.55, uPoleX*0.55, float(i)/3.0);
  float y = uCatTop - uCatA*(cosh(uPoleX/uCatA) - cosh(x/uCatA));
  return vec3(x, y, -0.55);
}

vec3 skyColour(vec3 rd){
  float up = clamp(rd.y*0.5 + 0.5, 0.0, 1.0);
  vec3 high = vec3(0.020, 0.035, 0.082);
  vec3 low  = vec3(0.140, 0.112, 0.118);
  vec3 c = mix(low, high, pow(up, 0.70));
  float az = atan(rd.x, -rd.z);
  float horizon = exp(-max(rd.y, 0.0)*7.0);
  /* the last of the sun, away behind her left shoulder */
  c += vec3(0.46, 0.20, 0.07) * horizon * exp(-pow((az + 2.15)*1.0, 2.0)) * 0.95;
  /* and the rest of the fair, glowing over the hedge to the right */
  c += vec3(0.36, 0.21, 0.09) * horizon * exp(-pow((az - 1.25)*1.4, 2.0)) * 0.70;

  /* early stars -- a fine grid, or they come out as grey bricks */
  vec2 sp = floor(vec2(az, rd.y) * 430.0);
  float st = pow(hash21(sp), 240.0) * smoothstep(0.03, 0.30, rd.y);
  c += vec3(0.80, 0.86, 1.0) * st * 3.4;

  /* the far side of the fair: a wheel, still turning */
  vec2 fw = vec2(az + 0.60, rd.y - 0.112);
  float rr = length(fw);
  if (rr < 0.19){
    float ang = atan(fw.y, fw.x) + uTime * 0.075;
    float rim = exp(-pow((rr - 0.098)/0.0035, 2.0));
    float hub = exp(-pow(rr/0.006, 2.0));
    float spoke = exp(-pow(sin(ang*8.0)*30.0, 2.0)) * smoothstep(0.100, 0.0, rr);
    float cars = pow(max(0.0, cos(ang*16.0)), 90.0) * exp(-pow((rr - 0.098)/0.0055, 2.0));
    c += vec3(1.0, 0.58, 0.22) * (rim*0.52 + hub*0.55 + spoke*0.13);
    c += vec3(1.0, 0.84, 0.46) * cars * 1.7;
  }

  /* a hedge and a treeline, with the tents of the fair among them */
  float sil = fbm(vec2(az*2.6 + 4.0, 0.0)) * 0.085
            + fbm(vec2(az*9.0, 2.0)) * 0.022 + 0.010;
  float ridge = smoothstep(sil + 0.0032, sil - 0.0032, rd.y);
  c = mix(c, vec3(0.016, 0.021, 0.029), ridge * step(-0.075, rd.y));
  /* strung lights along the far side: round dots, not dashes */
  float cell = 190.0;
  float ci = floor(az * cell);
  float cx = (ci + 0.5) / cell;
  float jy = sil - 0.006 - 0.010 * hash21(vec2(ci, 11.0));
  float dd = length(vec2((az - cx) * 1.0, rd.y - jy)) / 0.0019;
  float lampOn = step(0.915, hash21(vec2(ci, 7.0)));
  c += vec3(1.0, 0.60, 0.26) * lampOn * exp(-dd*dd) * 2.6;
  return c;
}

void main(){
  vec4 pn = uInvVP * vec4(vNdc, -1.0, 1.0);
  vec4 pf = uInvVP * vec4(vNdc,  1.0, 1.0);
  vec3 ro = pn.xyz / pn.w;
  vec3 rd = normalize(pf.xyz/pf.w - ro);

  /* The green ends at a hedge.  Anything shallower than this is not more
     grass receding into the dark -- it is the hedge and the trees behind it,
     which the sky function draws.  Without the cut, forty metres of fogged
     grass sits between the horizon and the treeline and reads as a dead sky. */
  float tGround = (rd.y < -0.030) ? (-ro.y / rd.y) : 1e9;
  if (tGround < 0.0) tGround = 1e9;

  /* the poles, exactly */
  vec3 poleN;
  float tPole = poleHit(ro, rd, poleN);

  /* the juggler, marched inside a tight sphere that no ground ray enters */
  vec3 bc = vec3(0.0, 0.95, 0.02); float br = 1.05;
  vec3 oc = ro - bc;
  float bb = dot(oc, rd), cc = dot(oc, oc) - br*br;
  float disc = bb*bb - cc;
  float tFig = 1e9;
  if (disc > 0.0){
    float sq = sqrt(disc);
    float t0 = max(-bb - sq, 0.02), t1 = min(-bb + sq, min(tGround, tPole));
    float t = t0;
    for (int i = 0; i < 96; i++){
      if (t > t1) break;
      float d = sdFigure(ro + rd*t);
      if (d < 0.0008){ tFig = t; break; }
      t += d;
    }
  }
  float tSolid = min(tFig, tPole);

  vec3 col;
  float tHit;
  vec3 lampA = lampPos(1), lampB = lampPos(2);

  if (tSolid < tGround){
    vec3 p = ro + rd*tSolid;
    bool isPole = (tPole <= tFig);
    vec3 n = isPole ? poleN : normalFig(p);
    if (dot(n, uEye - p) < 0.0) n = -n;
    tHit = tSolid;
    vec3 albedo = isPole ? vec3(0.16, 0.128, 0.10) : vec3(0.40, 0.30, 0.30);
    if (!isPole){
      /* clothes: a dark waistcoat over a warm shirt, trousers below */
      float h = p.y;
      vec3 shirt = vec3(0.44, 0.15, 0.115);     /* a red shirt, sleeves rolled */
      vec3 vest  = vec3(0.058, 0.048, 0.072);   /* a dark waistcoat over it */
      vec3 legs  = vec3(0.048, 0.044, 0.062);
      vec3 skinC = vec3(0.60, 0.40, 0.30);
      albedo = mix(legs, vest, smoothstep(0.93, 0.99, h));
      /* a collar of shirt above the waistcoat */
      albedo = mix(albedo, shirt, smoothstep(1.40, 1.435, h) * (1.0 - smoothstep(1.455, 1.49, h)));
      /* the sleeves are shirt; below the elbow she is bare */
      float ua = min(segDist(p, uJoint[J_SHR], uJoint[J_ELR]),
                     segDist(p, uJoint[J_SHL], uJoint[J_ELL]));
      albedo = mix(albedo, shirt, smoothstep(0.098, 0.062, ua));
      float fd = min(segDist(p, uJoint[J_ELR], uJoint[J_HDR]),
                     segDist(p, uJoint[J_ELL], uJoint[J_HDL]));
      albedo = mix(albedo, skinC, smoothstep(0.082, 0.048, fd));
      /* head, hair, and just enough of a face to be a person */
      albedo = mix(albedo, skinC, smoothstep(1.45, 1.51, h));
      vec3 hp = p - uJoint[J_HEAD];
      float hair = smoothstep(0.024, -0.016, hp.z*0.92 - hp.y*0.62 - 0.014);
      albedo = mix(albedo, vec3(0.070, 0.048, 0.040), hair * smoothstep(1.47, 1.52, h));
      if (hp.z > 0.02){
        float eye = min(length(hp - vec3( 0.036, 0.014, 0.094)),
                        length(hp - vec3(-0.036, 0.014, 0.094)));
        albedo = mix(albedo, vec3(0.045, 0.035, 0.033), smoothstep(0.016, 0.009, eye));
        float mouth = length((hp - vec3(0.0, -0.048, 0.092)) * vec3(0.55, 2.4, 1.0));
        albedo = mix(albedo, vec3(0.30, 0.16, 0.14), smoothstep(0.032, 0.018, mouth) * 0.7);
      }
    }
    float occ = isPole ? 0.85 : ao(p, n);
    vec3 lit = vec3(0.0);
    /* the string lights */
    for (int k = 0; k < 2; k++){
      vec3 L = (k == 0) ? lampA : lampB;
      vec3 dl = L - p; float r = length(dl); dl /= r;
      float sh = shadow(p + n*0.008, dl, r - 0.1);
      lit += vec3(1.0, 0.72, 0.40) * max(dot(n, dl), 0.0) * sh * 3.1 / (0.8 + r*r);
    }
    /* the balls she is juggling */
    for (int k = 0; k < 10; k++){
      if (k >= uNBalls) break;
      vec3 dl = uBall[k] - p; float r = length(dl); dl /= max(r, 1e-4);
      lit += uBallCol[k] * uGlow * max(dot(n, dl), 0.0) * 0.155 / (0.13 + r*r);
    }
    /* sky fill + the warm horizon bounce */
    lit += vec3(0.072, 0.104, 0.190) * (0.42 + 0.58*n.y) * occ * 2.7;
    lit += vec3(0.13, 0.065, 0.028) * max(-n.y, 0.0) * occ * 0.5;
    /* the rest of the fair, off to the right, throws a low warm wash */
    vec3 fairDir = normalize(vec3(0.80, 0.22, 0.56));
    lit += vec3(0.20, 0.115, 0.055) * max(dot(n, fairDir), 0.0) * occ * 0.60;
    /* rim from the fair behind */
    float rim = pow(1.0 - max(dot(n, normalize(uEye - p)), 0.0), 3.0);
    lit += vec3(0.52, 0.40, 0.30) * rim * 0.62 * occ;
    col = albedo * lit;
  } else if (tGround < 1e8){
    vec3 p = ro + rd*tGround;
    tHit = tGround;
    float r = length(p.xz);
    float g = fbm(p.xz * 5.5) * 0.5 + fbm(p.xz * 21.0) * 0.22;
    vec3 grass = mix(vec3(0.042, 0.075, 0.034), vec3(0.108, 0.150, 0.060), g);
    vec3 earth = mix(vec3(0.115, 0.086, 0.058), vec3(0.180, 0.140, 0.096), g);
    /* the worn ring she has stood in all evening, with a scuffed edge */
    float edge = uTrodden * (1.0 + 0.10*fbm(vec2(atan(p.z, p.x)*2.4, 1.7)));
    vec3 albedo = mix(earth, grass, smoothstep(edge*0.86, edge*1.16, r));
    vec3 n = vec3(0.0, 1.0, 0.0);
    /* a little bumpiness so the ground is not a mirror-flat plate */
    n = normalize(n + vec3(fbm(p.xz*13.0 + 3.1) - 0.5, 0.0, fbm(p.xz*13.0 + 9.7) - 0.5) * 0.28);
    vec3 lit = vec3(0.0);
    for (int k = 0; k < 2; k++){
      vec3 L = (k == 0) ? lampA : lampB;
      vec3 dl = L - p; float rr = length(dl); dl /= rr;
      float sh = shadow(p + vec3(0.0, 0.006, 0.0), dl, rr - 0.1);
      lit += vec3(1.0, 0.70, 0.38) * max(dot(n, dl), 0.0) * sh * 3.4 / (0.9 + rr*rr);
    }
    for (int k = 0; k < 10; k++){
      if (k >= uNBalls) break;
      vec3 dl = uBall[k] - p; float rr = length(dl); dl /= max(rr, 1e-4);
      lit += uBallCol[k] * uGlow * max(dot(n, dl), 0.0) * 0.14 / (0.20 + rr*rr);
    }
    /* CONTACT OCCLUSION -- the sky the body blocks.  This is what actually
       plants her on the grass at any camera angle; a cast shadow alone is
       invisible whenever the camera is on the lit side. */
    float occ = 1.0;
    for (int k = 0; k < 4; k++){
      vec3 s = p + vec3(0.0, 0.10 + 0.30*float(k), 0.0);
      occ = min(occ, clamp(sdFigure(s) / (0.16 + 0.42*float(k)), 0.0, 1.0));
    }
    occ = mix(0.31, 1.0, occ);
    lit *= occ;
    lit += vec3(0.040, 0.055, 0.092) * occ;
    col = albedo * lit;
    /* fog the far grass into the treeline */
    float fogA = 1.0 - exp(-tGround * 0.021);
    vec3 far = vec3(0.026, 0.032, 0.041) + vec3(0.075, 0.040, 0.018) * exp(-pow((atan(rd.x, -rd.z) - 1.25)*1.3, 2.0));
    col = mix(col, far, fogA);
  } else {
    col = skyColour(rd);
    tHit = 300.0;
    gl_FragDepth = 0.999999;
    oCol = vec4(col, 1.0);
    return;
  }

  vec4 clip = uVP * vec4(ro + rd*tHit, 1.0);
  gl_FragDepth = clamp(0.5 + 0.5*(clip.z/clip.w), 0.0, 1.0);
  oCol = vec4(col, 1.0);
}
`;

/* glowing points: bulbs and balls */
const VS_GLOW = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aCol;   /* rgb + world radius */
uniform mat4 uVP;
uniform vec3 uEye;
uniform float uH, uTanHalfFov;
out vec4 vCol;
void main(){
  vCol = aCol;
  gl_Position = uVP * vec4(aPos, 1.0);
  float d = max(length(aPos - uEye), 0.05);
  /* gl_PointSize is a DIAMETER in pixels -- see LANDMINES */
  gl_PointSize = clamp(aCol.w * uH / (d * uTanHalfFov), 2.0, 700.0);
}
`;
const FS_GLOW = `#version 300 es
precision highp float;
in vec4 vCol;
layout(location=0) out vec4 oCol;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = length(q);
  if (r > 1.0) discard;
  float core = smoothstep(0.50, 0.40, r);
  float halo = pow(max(0.0, 1.0 - r), 3.0);
  oCol = vec4(vCol.rgb * (core * 1.55 + halo * 0.70), 1.0);
}
`;

/* trails and wires: plain coloured triangles, additively blended */
const VS_LINE = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aCol;
uniform mat4 uVP;
out vec4 vCol;
void main(){ vCol = aCol; gl_Position = uVP * vec4(aPos, 1.0); }
`;
const FS_LINE = `#version 300 es
precision highp float;
in vec4 vCol;
layout(location=0) out vec4 oCol;
void main(){ oCol = vec4(vCol.rgb * vCol.a, 1.0); }
`;

const FS_DOWN = `#version 300 es
precision highp float;
in vec2 vNdc;
uniform sampler2D uSrc;
uniform vec2 uSrcTexel, uDstSize;
uniform float uThresh;
layout(location=0) out vec4 oCol;
void main(){
  /* the UV must come from the TARGET size, not the source -- see LANDMINES */
  vec2 uv = gl_FragCoord.xy / uDstSize;
  vec3 s = vec3(0.0);
  s += texture(uSrc, uv + uSrcTexel*vec2(-1.0,-1.0)).rgb;
  s += texture(uSrc, uv + uSrcTexel*vec2( 1.0,-1.0)).rgb;
  s += texture(uSrc, uv + uSrcTexel*vec2(-1.0, 1.0)).rgb;
  s += texture(uSrc, uv + uSrcTexel*vec2( 1.0, 1.0)).rgb;
  s *= 0.25;
  s = max(s - uThresh, vec3(0.0));
  if (any(isnan(s)) || any(isinf(s))) s = vec3(0.0);
  oCol = vec4(s, 1.0);
}
`;
const FS_BLUR = `#version 300 es
precision highp float;
in vec2 vNdc;
uniform sampler2D uSrc;
uniform vec2 uDir, uDstSize;
layout(location=0) out vec4 oCol;
void main(){
  vec2 uv = gl_FragCoord.xy / uDstSize;
  vec3 s = texture(uSrc, uv).rgb * 0.227;
  s += (texture(uSrc, uv + uDir*1.3846).rgb + texture(uSrc, uv - uDir*1.3846).rgb) * 0.3162;
  s += (texture(uSrc, uv + uDir*3.2308).rgb + texture(uSrc, uv - uDir*3.2308).rgb) * 0.0702;
  oCol = vec4(s, 1.0);
}
`;
const FS_POST = `#version 300 es
precision highp float;
in vec2 vNdc;
uniform sampler2D uScene, uBloomA, uBloomB;
uniform vec2 uSize;
uniform float uBloom, uVig;
layout(location=0) out vec4 oCol;
void main(){
  vec2 uv = gl_FragCoord.xy / uSize;
  vec3 c = texture(uScene, uv).rgb;
  c += (texture(uBloomA, uv).rgb * 0.62 + texture(uBloomB, uv).rgb * 0.38) * uBloom;
  vec2 q = uv*2.0 - 1.0;
  c *= mix(1.0, 1.0 - 0.30*dot(q,q), uVig);
  /* ONE factor for all three channels: an emitter never changes hue on the
     way to white (LANDMINES) */
  c = c / (1.0 + max(max(c.r, c.g), c.b));
  c = pow(clamp(c*1.12, 0.0, 1.0), vec3(1.0/2.2));
  oCol = vec4(c, 1.0);
}
`;

/* ── the renderer ──────────────────────────────────────────────────────────── */
export const JOINT_ORDER = ['head','neck','shoulderR','shoulderL','elbowR','elbowL',
                            'handR','handL','hipR','hipL','kneeR','kneeL','footR','footL'];

export const BALL_COLOURS = [
  [1.00, 0.44, 0.24], [0.38, 0.86, 1.00], [1.00, 0.86, 0.34], [0.62, 1.00, 0.50],
  [1.00, 0.42, 0.72], [0.62, 0.56, 1.00], [0.40, 1.00, 0.82], [1.00, 0.66, 0.34],
  [0.86, 0.98, 1.00], [1.00, 0.30, 0.36],
];

export class Renderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('This room needs WebGL2.');
    this.gl = gl; this.canvas = canvas;
    this.ext = gl.getExtension('EXT_color_buffer_float');
    if (!this.ext) throw new Error('This room needs float render targets (EXT_color_buffer_float).');
    this.progScene = this._prog(VS_FULL, FS_SCENE);
    this.progGlow = this._prog(VS_GLOW, FS_GLOW);
    this.progLine = this._prog(VS_LINE, FS_LINE);
    this.progDown = this._prog(VS_FULL, FS_DOWN);
    this.progBlur = this._prog(VS_FULL, FS_BLUR);
    this.progPost = this._prog(VS_FULL, FS_POST);

    this.quad = gl.createVertexArray();
    gl.bindVertexArray(this.quad);
    const qb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.glowVao = this._dynVao(7);
    this.lineVao = this._dynVao(7);
    this.fbos = {};
    this.catA = catenaryA(PITCH.poleX, PITCH.poleTop - PITCH.sagTo);
    this.size = [0, 0];
  }

  _prog(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error('shader: ' + gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l, i) => (i + 1) + ': ' + l).slice(0, 400).join('\n'));
      }
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const nm = info.name.replace(/\[0\]$/, '');
      u[nm] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  _dynVao(stride) {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride * 4, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride * 4, 12);
    gl.bindVertexArray(null);
    return { vao, buf: b, cap: 0 };
  }

  _upload(dv, arr) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, dv.buf);
    if (arr.length > dv.cap) { gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW); dv.cap = arr.length; }
    else gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr);
  }

  _target(name, w, h, depth) {
    const gl = this.gl;
    const key = name + ':' + w + 'x' + h;
    if (this.fbos[name] && this.fbos[name].key === key) return this.fbos[name];
    if (this.fbos[name]) {
      gl.deleteFramebuffer(this.fbos[name].fb);
      gl.deleteTexture(this.fbos[name].tex);
      if (this.fbos[name].depth) gl.deleteRenderbuffer(this.fbos[name].depth);
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let db = null;
    if (depth) {
      db = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, db);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, db);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return (this.fbos[name] = { key, fb, tex, depth: db, w, h });
  }

  resize(w, h) { this.size = [w, h]; }

  /** The bulbs on the near string, in world space. */
  bulbPositions() {
    const out = [];
    for (let i = 0; i < PITCH.bulbs; i++) {
      const u = (i + 0.5) / PITCH.bulbs;
      const x = -PITCH.poleX + 2 * PITCH.poleX * u;
      out.push([x, catenaryY(x, PITCH.poleX, PITCH.poleTop, this.catA) - 0.055, PITCH.poleZ]);
    }
    return out;
  }

  /**
   * Draw one frame.
   *   scene = { joints, balls:[{pos,colour,radius}], trails:[[..pos..]],
   *             camera:{eye,at,fov}, glow, bloom }
   */
  draw(scene) {
    const gl = this.gl;
    const [W, H] = this.size;
    if (W < 4 || H < 4) return;
    const aspect = W / H;
    const fov = scene.camera.fov;
    const proj = M4.perspective(fov, aspect, 0.06, 400);
    const view = M4.lookAt(scene.camera.eye, scene.camera.at, [0, 1, 0]);
    const vp = M4.mul(proj, view);
    const invVP = M4.invert(vp);

    const main = this._target('main', W, H, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, main.fb);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* pass 1 — the solid world */
    const P = this.progScene;
    gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uInvVP, false, invVP);
    gl.uniformMatrix4fv(P.u.uVP, false, vp);
    gl.uniform3fv(P.u.uEye, scene.camera.eye);
    gl.uniform1f(P.u.uTime, scene.time || 0);
    const jf = new Float32Array(16 * 3);
    JOINT_ORDER.forEach((k, i) => { const j = scene.joints[k]; jf[i*3] = j[0]; jf[i*3+1] = j[1]; jf[i*3+2] = j[2]; });
    gl.uniform3fv(P.u.uJoint, jf);
    const nb = Math.min(10, scene.balls.length);
    const bp = new Float32Array(30), bc = new Float32Array(30);
    for (let i = 0; i < nb; i++) {
      bp[i*3] = scene.balls[i].pos[0]; bp[i*3+1] = scene.balls[i].pos[1]; bp[i*3+2] = scene.balls[i].pos[2];
      bc[i*3] = scene.balls[i].colour[0]; bc[i*3+1] = scene.balls[i].colour[1]; bc[i*3+2] = scene.balls[i].colour[2];
    }
    gl.uniform3fv(P.u.uBall, bp);
    gl.uniform3fv(P.u.uBallCol, bc);
    gl.uniform1i(P.u.uNBalls, nb);
    gl.uniform1f(P.u.uPoleX, PITCH.poleX);
    gl.uniform1f(P.u.uPoleTop, PITCH.poleTop);
    gl.uniform1f(P.u.uPoleR, PITCH.poleR);
    gl.uniform1f(P.u.uCatA, this.catA);
    gl.uniform1f(P.u.uCatTop, PITCH.poleTop);
    gl.uniform1f(P.u.uTrodden, PITCH.trodden);
    gl.uniform1f(P.u.uGlow, scene.glow != null ? scene.glow : 1);
    gl.bindVertexArray(this.quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* pass 2 — the things that glow, additively, depth-tested but not writing */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.depthMask(false);

    const lineData = [];
    const pushSeg = (a, b, up, wA, wB, cA, cB) => {
      const dx = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
      let side = cross(dx, up);
      const l = Math.hypot(side[0], side[1], side[2]);
      if (l < 1e-9) return;
      side = [side[0]/l, side[1]/l, side[2]/l];
      const A0 = [a[0]-side[0]*wA, a[1]-side[1]*wA, a[2]-side[2]*wA];
      const A1 = [a[0]+side[0]*wA, a[1]+side[1]*wA, a[2]+side[2]*wA];
      const B0 = [b[0]-side[0]*wB, b[1]-side[1]*wB, b[2]-side[2]*wB];
      const B1 = [b[0]+side[0]*wB, b[1]+side[1]*wB, b[2]+side[2]*wB];
      const put = (p, c) => lineData.push(p[0], p[1], p[2], c[0], c[1], c[2], c[3]);
      put(A0, cA); put(A1, cA); put(B0, cB);
      put(A1, cA); put(B1, cB); put(B0, cB);
    };
    const eye = scene.camera.eye;
    /* the wire the bulbs hang from */
    const bulbs = this.bulbPositions();
    {
      const wireCol = [0.18, 0.14, 0.10, 1.0];
      const N = 40;
      let prev = null;
      for (let i = 0; i <= N; i++) {
        const x = -PITCH.poleX + 2 * PITCH.poleX * (i / N);
        const p = [x, catenaryY(x, PITCH.poleX, PITCH.poleTop, this.catA), PITCH.poleZ];
        if (prev) {
          const up = norm(sub(eye, p));
          pushSeg(prev, p, up, 0.010, 0.010, wireCol, wireCol);
        }
        prev = p;
      }
      for (const b of bulbs) {
        const top = [b[0], catenaryY(b[0], PITCH.poleX, PITCH.poleTop, this.catA), PITCH.poleZ];
        const up = norm(sub(eye, b));
        pushSeg(top, b, up, 0.006, 0.006, wireCol, wireCol);
      }
    }
    /* the trails */
    for (const tr of scene.trails) {
      const pts = tr.pts;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const fa = i / pts.length, fb = (i + 1) / pts.length;
        const gA = Math.pow(fa, 2.1) * tr.gain, gB = Math.pow(fb, 2.1) * tr.gain;
        const up = norm(sub(eye, b));
        pushSeg(a, b, up, tr.width * (0.35 + 0.65*fa), tr.width * (0.35 + 0.65*fb),
                [tr.colour[0], tr.colour[1], tr.colour[2], gA],
                [tr.colour[0], tr.colour[1], tr.colour[2], gB]);
      }
    }
    if (lineData.length) {
      this._upload(this.lineVao, new Float32Array(lineData));
      const L = this.progLine;
      gl.useProgram(L.p);
      gl.uniformMatrix4fv(L.u.uVP, false, vp);
      gl.bindVertexArray(this.lineVao.vao);
      gl.drawArrays(gl.TRIANGLES, 0, lineData.length / 7);
    }

    /* bulbs and balls as glowing points */
    const gd = [];
    const flick = (i) => 0.86 + 0.14 * Math.sin(scene.time * 2.1 + i * 2.7) * Math.sin(scene.time * 0.71 + i);
    bulbs.forEach((b, i) => {
      const f = flick(i) * (scene.lampsOn === false ? 0.0 : 1.0);
      gd.push(b[0], b[1], b[2], 1.30 * f, 0.77 * f, 0.40 * f, 0.062);
    });
    for (const b of scene.balls) {
      const g = (scene.glow != null ? scene.glow : 1);
      gd.push(b.pos[0], b.pos[1], b.pos[2], b.colour[0]*g, b.colour[1]*g, b.colour[2]*g, b.radius * 2.1);
    }
    if (gd.length) {
      this._upload(this.glowVao, new Float32Array(gd));
      const Gp = this.progGlow;
      gl.useProgram(Gp.p);
      gl.uniformMatrix4fv(Gp.u.uVP, false, vp);
      gl.uniform3fv(Gp.u.uEye, eye);
      gl.uniform1f(Gp.u.uH, H);
      gl.uniform1f(Gp.u.uTanHalfFov, Math.tan(fov / 2));
      gl.bindVertexArray(this.glowVao.vao);
      gl.drawArrays(gl.POINTS, 0, gd.length / 7);
    }

    /* pass 3 — bloom */
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    const w2 = Math.max(2, W >> 2), h2 = Math.max(2, H >> 2);
    const w3 = Math.max(2, W >> 4), h3 = Math.max(2, H >> 4);
    const bA = this._target('bA', w2, h2, false), bAt = this._target('bAt', w2, h2, false);
    const bB = this._target('bB', w3, h3, false), bBt = this._target('bBt', w3, h3, false);
    const blit = (prog, dst, setup) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.viewport(0, 0, dst.w, dst.h);
      gl.useProgram(prog.p);
      setup(prog);
      gl.bindVertexArray(this.quad);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const bind = (tex, unit, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); };
    blit(this.progDown, bA, (p) => {
      bind(main.tex, 0, p.u.uSrc);
      gl.uniform2f(p.u.uSrcTexel, 1 / W, 1 / H);
      gl.uniform2f(p.u.uDstSize, bA.w, bA.h);
      gl.uniform1f(p.u.uThresh, 0.62);
    });
    blit(this.progBlur, bAt, (p) => { bind(bA.tex, 0, p.u.uSrc); gl.uniform2f(p.u.uDir, 1 / bA.w, 0); gl.uniform2f(p.u.uDstSize, bA.w, bA.h); });
    blit(this.progBlur, bA,  (p) => { bind(bAt.tex, 0, p.u.uSrc); gl.uniform2f(p.u.uDir, 0, 1 / bA.h); gl.uniform2f(p.u.uDstSize, bA.w, bA.h); });
    blit(this.progDown, bB, (p) => {
      bind(bA.tex, 0, p.u.uSrc);
      gl.uniform2f(p.u.uSrcTexel, 1 / bA.w, 1 / bA.h);
      gl.uniform2f(p.u.uDstSize, bB.w, bB.h);
      gl.uniform1f(p.u.uThresh, 0.0);
    });
    blit(this.progBlur, bBt, (p) => { bind(bB.tex, 0, p.u.uSrc); gl.uniform2f(p.u.uDir, 1 / bB.w, 0); gl.uniform2f(p.u.uDstSize, bB.w, bB.h); });
    blit(this.progBlur, bB,  (p) => { bind(bBt.tex, 0, p.u.uSrc); gl.uniform2f(p.u.uDir, 0, 1 / bB.h); gl.uniform2f(p.u.uDstSize, bB.w, bB.h); });

    /* pass 4 — to the screen */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    const Po = this.progPost;
    gl.useProgram(Po.p);
    bind(main.tex, 0, Po.u.uScene);
    bind(bA.tex, 1, Po.u.uBloomA);
    bind(bB.tex, 2, Po.u.uBloomB);
    gl.uniform2f(Po.u.uSize, W, H);
    gl.uniform1f(Po.u.uBloom, scene.bloom != null ? scene.bloom : 1.0);
    gl.uniform1f(Po.u.uVig, 1.0);
    gl.bindVertexArray(this.quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }
}

export const _M4 = M4;
