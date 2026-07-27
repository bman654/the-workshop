/* ═══════════════════════════════════════════════════════════════════════════
   THE THUNDERHEAD — render.js
   The night, the storm, and the flash inside it.  WebGL2.

   PASSES
     1  scene   — one full-screen ray per pixel at 0.55x into an HDR RGBA16F
                  buffer: sky, stars, a ray-marched cumulonimbus (density from
                  an RG8 3-D noise texture), the plain below, all of it lit by
                  up to two moving flash lights that shadow themselves through
                  the cloud.
     2  blit    — that buffer up to full resolution
     3  channel — every segment of the flash as an instanced camera-facing
                  quad, additive, in HDR.  The same buffer carries the
                  AFTERGLOW and the SOUND FRONT: a bright band that runs along
                  the channel at the speed of sound while you listen.
     4  bloom   — quarter-res down, separable blur, added back
     5  compose — filmic tonemap, rain, grain, vignette

   LANDMINES OBEYED (see LANDMINES.md)
     · every attribute location is pinned with layout(location=)
     · float textures are never LINEAR-filtered; the noise volume is RG8
     · the volumetric march is dithered with an interleaved gradient, offset
       per frame by the golden ratio
     · a downsample computes its uv from the TARGET size
     · everything written to a float target is NaN-guarded
   ═══════════════════════════════════════════════════════════════════════════ */

const CB = 1850;         // cloud base, m
const CTOP = 6600;       // cloud top, m

/* ── shader sources ───────────────────────────────────────────────────────── */

const VS_QUAD = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUV;
void main(){ vUV = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }`;

const FS_SCENE = `#version 300 es
precision highp float; precision highp sampler3D;
in vec2 vUV; out vec4 frag;

uniform sampler3D uNoise;
uniform vec3  uCam, uFwd, uRight, uUp;
uniform vec2  uRes;
uniform float uTanHalf, uAspect, uTime, uFrame;
uniform vec3  uL0, uL1;          // flash light positions (world)
uniform float uI0, uI1;          // flash light intensities
uniform float uSteps;
uniform vec2  uStorm;            // storm axis, world x/z
uniform float uHaze, uMoonI;
uniform vec3  uMoon;             // direction TO the moon

const float CB   = ${CB}.0;
const float CTOP = ${CTOP}.0;
const vec3  MOONC = vec3(0.72, 0.80, 1.00);

float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }

/* the storm's silhouette: a flat-based deck, a tower up the middle, an anvil */
float shape(vec3 p){
  float h = p.y;
  float r = length(p.xz - uStorm);
  float base = smoothstep(CB, CB+300., h);
  float deck = base * (1.0 - smoothstep(2400., 3300., h))
             * (1.0 - smoothstep(1500., 3600., r));
  float towerR = 620. + 0.46*max(0., h-CB);
  float tower = (1.0 - smoothstep(towerR*0.42, towerR*1.12, r))
              * base * (1.0 - smoothstep(CTOP-1100., CTOP, h));
  float anvilH = smoothstep(4100., 4900., h) * (1.0 - smoothstep(CTOP-900., CTOP, h));
  float anvil = anvilH * (1.0 - smoothstep(1500., 3900., r));
  /* a low, torn shelf of scud hanging under the base */
  float scud = (1.0 - smoothstep(CB-520., CB+40., h)) * smoothstep(CB-680., CB-460., h)
             * (1.0 - smoothstep(1200., 3000., r));
  return clamp(max(max(max(deck*0.72, tower), anvil*0.86), scud*0.55), 0., 1.);
}

float density(vec3 p){
  float s = shape(p);
  if (s <= 0.004) return 0.;
  vec3 q = p*0.00046 + vec3(uTime*0.0026, -uTime*0.0013, uTime*0.0018);
  vec2 n = texture(uNoise, q).rg;
  float d = n.r*1.15 - 0.42;
  d -= (1.0-s)*1.15;                                  // the edge is eroded, not cut
  d += (n.g-0.5)*0.44;
  d -= 0.30*smoothstep(CB+140., CB-320., p.y);        // ragged underside
  return clamp(d*2.3, 0., 1.);
}

/* optical depth along a direction, for shadowing inside the cloud */
float shadow(vec3 p, vec3 dir, float far, float k){
  float step = far/3.0, t = step*0.5, tau = 0.;
  for (int i=0;i<3;i++){ tau += density(p + dir*t)*step; t += step; }
  return exp(-tau*k);
}

vec3 skyColour(vec3 rd){
  float up = clamp(rd.y, 0., 1.);
  vec3 c = mix(vec3(0.0225,0.0300,0.0520), vec3(0.0055,0.0090,0.0235), pow(up,0.42));
  /* the moon and its halo */
  float md = max(dot(rd, uMoon), 0.0);
  c += MOONC * uMoonI * (0.55*pow(md, 2400.0) + 0.075*pow(md, 40.0) + 0.022*pow(md, 5.0));
  /* a town somewhere off past the ridge */
  c += vec3(0.045,0.030,0.017) * pow(clamp(1.0-abs(rd.y)*7.0,0.,1.), 4.0)
     * (0.30 + 0.70*smoothstep(-0.4, 0.9, rd.x));
  /* stars */
  vec2 sp = vec2(atan(rd.z,rd.x)*3.0, rd.y*6.0);
  vec2 cell = floor(sp*22.0);
  float h = hash21(cell);
  if (h > 0.972 && rd.y > 0.02) {
    vec2 f = fract(sp*22.0) - vec2(hash21(cell+7.1), hash21(cell+3.3));
    float st = exp(-dot(f,f)*260.0) * (0.4+0.6*hash21(cell+11.7));
    c += vec3(0.9,0.93,1.0)*st*0.5*smoothstep(0.02,0.30,rd.y);
  }
  return c;
}

void main(){
  vec2 uv = (vUV*2.0-1.0);
  vec3 rd = normalize(uFwd + uRight*uv.x*uTanHalf*uAspect + uUp*uv.y*uTanHalf);
  vec3 ro = uCam;
  vec3 sky = skyColour(rd);

  /* --- the ridge, nine kilometres out ------------------------------------ */
  vec3 col = sky;
  const float RD = 9000.0;
  float horiz = length(rd.xz);
  float azr = atan(rd.z, rd.x);
  float rh = 130.0 + 175.0*texture(uNoise, vec3(azr*0.55, 0.11, 0.63)).r
                   +  70.0*texture(uNoise, vec3(azr*2.30, 0.44, 0.29)).g;
  float yAt = ro.y + rd.y * (RD/max(horiz, 1e-4));
  bool onRidge = (horiz > 1e-4) && (yAt < rh) && (rd.y > -0.02);
  if (onRidge) {
    float rim = smoothstep(rh, rh-55.0, yAt);
    col = mix(vec3(0.0070,0.0090,0.0140), vec3(0.0022,0.0030,0.0052), rim);
    col += MOONC * uMoonI * 0.020 * (1.0-rim);
  }

  /* --- the plain --------------------------------------------------------- */
  float groundT = 1e9;
  if (rd.y < -0.0005) {
    float t = -(ro.y) / rd.y;
    if (t > 0.0 && t < 60000.0) {
      groundT = t;
      vec3 g = ro + rd*t;
      float n0 = texture(uNoise, vec3(g.xz*0.00035, 0.31)).r;
      float n1 = texture(uNoise, vec3(g.xz*0.0055, 0.72)).g;
      vec3 alb = mix(vec3(0.020,0.026,0.024), vec3(0.042,0.050,0.044), n0*0.65+n1*0.35);
      /* moonlight on wet grass, and a little skylight */
      vec3 lit = alb * (0.050 + 0.30*uMoonI*max(uMoon.y,0.0));
      vec3 hm = normalize(uMoon - rd);
      lit += MOONC * uMoonI * pow(max(hm.y,0.0), 26.0) * 0.10 * (0.4+0.6*n1);
      for (int i=0;i<2;i++){
        vec3 L = i==0 ? uL0 : uL1; float I = i==0 ? uI0 : uI1;
        if (I <= 0.0) continue;
        vec3 d = L - g; float r2 = max(dot(d,d), 1.0); vec3 ld = d*inversesqrt(r2);
        lit += alb * I * max(ld.y,0.0) * 5.5e6 / r2;
        vec3 h2 = normalize(ld - rd);
        lit += vec3(0.72,0.80,1.0) * I * pow(max(h2.y,0.0), 34.0) * 2.2e6 / r2 * (0.35+0.65*n1);
      }
      float fog = 1.0 - exp(-t*uHaze*1.6);
      col = mix(lit, vec3(0.0062,0.0080,0.0132), clamp(fog,0.,1.));
    }
  }

  /* --- the storm --------------------------------------------------------- */
  float cloudTrans = 1.0;
  float t0 = 1e9, t1 = -1e9;
  if (abs(rd.y) > 1e-5) {
    float ta = (CB-420. - ro.y)/rd.y, tb = (CTOP - ro.y)/rd.y;
    t0 = min(ta,tb); t1 = max(ta,tb);
  }
  t0 = max(t0, 0.0);
  t1 = min(t1, min(groundT, 46000.0));
  if (t1 > t0) {
    int NS = int(uSteps);
    float dt = (t1-t0) / float(NS);
    float dith = fract(52.9829189*fract(0.06711056*gl_FragCoord.x + 0.00583715*gl_FragCoord.y)
                       + uFrame*0.61803399);
    float t = t0 + dt*dith;
    vec3 acc = vec3(0.0);
    float trans = 1.0;
    float mu = dot(rd, uMoon);
    float hg = 0.16 + 0.85*pow(max(mu,0.0), 5.0);      // forward scattering
    for (int i=0;i<96;i++){
      if (i>=NS || trans < 0.010) break;
      vec3 p = ro + rd*t;
      float d = density(p);
      if (d > 0.003) {
        float sigma = d*0.0042;
        float a = 1.0 - exp(-sigma*dt);
        float hf = clamp((p.y-CB)/(CTOP-CB), 0., 1.);
        /* ambient: a cloud lit only by the sky is dark below and pale on top */
        vec3 lum = mix(vec3(0.0032,0.0044,0.0085), vec3(0.014,0.018,0.030), hf*hf);
        /* the moon, shadowed through however much cloud it had to cross: this
           is what makes a night storm a MASS and not a black plate */
        lum += MOONC * uMoonI * hg * shadow(p, uMoon, 2600.0, 0.0026);
        for (int k=0;k<2;k++){
          vec3 L = k==0 ? uL0 : uL1; float I = k==0 ? uI0 : uI1;
          if (I <= 0.0) continue;
          vec3 dv = L - p; float r2 = max(dot(dv,dv), 900.0);
          vec3 ld = dv*inversesqrt(r2);
          lum += vec3(0.80,0.86,1.0) * I
               * shadow(p, ld, min(sqrt(r2), 1600.0), 0.0030) * 7.0e6 / r2;
        }
        float hz = exp(-t*uHaze*0.55);
        acc += trans * a * mix(sky*0.9, lum, hz);
        trans *= (1.0 - a);
      }
      t += dt;
    }
    col = col*trans + acc;
    cloudTrans = trans;
  }

  if (any(isnan(col)) || any(isinf(col))) col = vec3(0.0);
  frag = vec4(max(col, 0.0), clamp(cloudTrans, 0.0, 1.0));
}`;

const FS_BLIT = `#version 300 es
precision highp float; in vec2 vUV; out vec4 frag;
uniform sampler2D uTex;
void main(){ frag = texture(uTex, vUV); }`;

const VS_SEG = `#version 300 es
layout(location=0) in vec2 aCorner;      // (-1..1, -1..1)
layout(location=1) in vec3 aA;
layout(location=2) in vec3 aB;
layout(location=3) in vec3 aParam;       // w, distanceToListener, birth (0..1)
uniform mat4 uVP;
uniform vec3 uCam;
uniform float uPix;                      // world metres per pixel at 1 m depth
uniform float uGlow, uGhost, uFront, uFrontW, uCore, uReveal;
out vec2 vLocal; out float vBright; out float vHot;
void main(){
  if (aParam.z > uReveal) { gl_Position = vec4(2.,2.,2.,1.); vLocal=vec2(0.); vBright=0.; vHot=0.; return; }
  vec3 a = aA, b = aB;
  vec3 mid = (a+b)*0.5;
  float depth = max(length(mid - uCam), 1.0);
  float rad = uPix * depth * (0.85 + 2.3*aParam.x);
  vec3 dir = b - a; float len = max(length(dir), 0.001); dir /= len;
  vec3 toCam = normalize(uCam - mid);
  vec3 side = cross(dir, toCam);
  float sl = length(side);
  side = sl > 1e-4 ? side/sl : normalize(cross(dir, vec3(0.,1.,0.)+vec3(0.001)));
  vec3 p = mix(a,b, aCorner.y*0.5+0.5) + dir*aCorner.y*rad*1.2 + side*aCorner.x*rad*3.4;
  gl_Position = uVP * vec4(p, 1.0);
  vLocal = vec2(aCorner.x*3.4, 0.0);
  /* the sound front: a band running outward at the speed of sound */
  float df = abs(aParam.y - uFront) / max(uFrontW, 1.0);
  float front = uFront > 0.0 ? exp(-df*df) : 0.0;
  vBright = uGlow*(0.28 + 0.72*aParam.x) + uGhost*(0.12+0.5*aParam.x) + front*1.9*(0.3+0.7*aParam.x);
  vHot = uCore;
}`;

const FS_SEG = `#version 300 es
precision highp float;
in vec2 vLocal; in float vBright; in float vHot; out vec4 frag;
uniform sampler2D uScene;     // the scene pass; alpha is how much cloud is in front
uniform vec2 uInvRes;
void main(){
  /* A flash inside a cloud does not draw a sharp line on top of it — the cloud
     lights up instead.  There is no depth buffer here (the channel is additive
     HDR), so the occlusion comes from the transmittance the scene pass already
     computed along this exact ray, carried in its alpha. */
  float occ = texture(uScene, gl_FragCoord.xy * uInvRes).a;
  float r = abs(vLocal.x);
  float core = exp(-r*r*11.0);
  float halo = exp(-r*r*0.70)*0.30;
  vec3 c = vec3(0.62,0.74,1.00)*halo + vec3(1.0,0.97,0.95)*core*vHot;
  vec3 o = c * vBright * 9.0 * (0.055 + 0.945*occ);
  if (any(isnan(o)) || any(isinf(o))) o = vec3(0.0);
  frag = vec4(o, 1.0);
}`;

const FS_DOWN = `#version 300 es
precision highp float; in vec2 vUV; out vec4 frag;
uniform sampler2D uTex; uniform vec2 uSrcTexel; uniform float uThresh;
void main(){
  vec3 s = vec3(0.0);
  s += texture(uTex, vUV + uSrcTexel*vec2(-1.,-1.)).rgb;
  s += texture(uTex, vUV + uSrcTexel*vec2( 1.,-1.)).rgb;
  s += texture(uTex, vUV + uSrcTexel*vec2(-1., 1.)).rgb;
  s += texture(uTex, vUV + uSrcTexel*vec2( 1., 1.)).rgb;
  s *= 0.25;
  s = max(s - uThresh, 0.0);
  frag = vec4(s, 1.0);
}`;

const FS_BLUR = `#version 300 es
precision highp float; in vec2 vUV; out vec4 frag;
uniform sampler2D uTex; uniform vec2 uDir;
void main(){
  vec3 s = texture(uTex, vUV).rgb * 0.227;
  s += (texture(uTex, vUV+uDir*1.3846).rgb + texture(uTex, vUV-uDir*1.3846).rgb) * 0.316;
  s += (texture(uTex, vUV+uDir*3.2308).rgb + texture(uTex, vUV-uDir*3.2308).rgb) * 0.070;
  frag = vec4(s, 1.0);
}`;

const FS_COMPOSE = `#version 300 es
precision highp float; in vec2 vUV; out vec4 frag;
uniform sampler2D uHDR, uBloomA, uBloomB;
uniform float uExposure, uTime, uRain, uFlashNow, uVig;
uniform vec2 uRes;

vec3 aces(vec3 x){
  const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
}
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }

void main(){
  vec3 c = texture(uHDR, vUV).rgb;
  c += texture(uBloomA, vUV).rgb * 0.55;
  c += texture(uBloomB, vUV).rgb * 0.85;

  /* rain: near-vertical streaks, lit by whatever the sky is doing right now */
  if (uRain > 0.001) {
    float amt = 0.0;
    for (int L=0; L<3; L++){
      float sc = 1.0 + float(L)*1.30;
      float sp = 1500.0 + float(L)*900.0;
      vec2 q = vec2(vUV.x*uRes.x/uRes.y*sc*54.0 + float(L)*13.7,
                    vUV.y*sc*42.0 - uTime*sp/uRes.y*sc*2.6 + float(L)*7.3);
      vec2 cell = floor(q); vec2 f = fract(q);
      float h = hash21(cell);
      if (h > 0.72) {
        float dx = abs(f.x - 0.5 - (h-0.72)*1.6);
        float streak = exp(-dx*dx*700.0) * smoothstep(0.0,0.30,f.y) * smoothstep(1.0,0.42,f.y);
        amt += streak * (0.30 + 0.70*hash21(cell+2.3)) / sc;
      }
    }
    c += vec3(0.55,0.62,0.80) * amt * uRain * (0.055 + 2.4*uFlashNow);
  }

  c = aces(c * uExposure);
  c = pow(c, vec3(1.0/2.2));
  float v = 1.0 - uVig*dot(vUV-0.5, vUV-0.5)*1.35;
  c *= clamp(v, 0.0, 1.0);
  c += (hash21(vUV*uRes + fract(uTime)*137.0) - 0.5) * 0.016;
  frag = vec4(c, 1.0);
}`;

/* ── plumbing ─────────────────────────────────────────────────────────────── */

function compile(gl, type, src, name) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(name + ': ' + gl.getShaderInfoLog(s));
  return s;
}
function program(gl, vs, fs, name) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, name + '.vs'));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, name + '.fs'));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(name + ' link: ' + gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name);
  }
  return { p: p, u: u };
}
function target(gl, w, h, fmt) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texStorage2D(gl.TEXTURE_2D, 1, fmt || gl.RGBA16F, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const f = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex: t, fb: f, w: w, h: h };
}

/* a tileable 3-D value-noise volume, two channels: billow and detail */
function makeNoiseVolume(gl, N) {
  const data = new Uint8Array(N * N * N * 2);
  const lat = {};
  function latt(L, seed) {
    const key = L + ':' + seed;
    if (lat[key]) return lat[key];
    const a = new Float32Array(L * L * L);
    let s = seed >>> 0;
    for (let i = 0; i < a.length; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      a[i] = (s >>> 8) / 16777216;
    }
    lat[key] = a; return a;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function sample(L, seed, x, y, z) {
    const a = latt(L, seed);
    const fx = x * L, fy = y * L, fz = z * L;
    const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
    const tx = smooth(fx - ix), ty = smooth(fy - iy), tz = smooth(fz - iz);
    const g = (i, j, k) => a[(((k % L) + L) % L) * L * L + (((j % L) + L) % L) * L + (((i % L) + L) % L)];
    const c00 = g(ix, iy, iz) * (1 - tx) + g(ix + 1, iy, iz) * tx;
    const c10 = g(ix, iy + 1, iz) * (1 - tx) + g(ix + 1, iy + 1, iz) * tx;
    const c01 = g(ix, iy, iz + 1) * (1 - tx) + g(ix + 1, iy, iz + 1) * tx;
    const c11 = g(ix, iy + 1, iz + 1) * (1 - tx) + g(ix + 1, iy + 1, iz + 1) * tx;
    const c0 = c00 * (1 - ty) + c10 * ty, c1 = c01 * (1 - ty) + c11 * ty;
    return c0 * (1 - tz) + c1 * tz;
  }
  const OCT_A = [[4, 11], [8, 23], [16, 47], [32, 97]];
  const OCT_B = [[16, 131], [32, 197], [64, 251]];
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, w = z / N;
    let a = 0, amp = 0.5, tot = 0;
    for (const [L, sd] of OCT_A) {
      const n = sample(L, sd, u, v, w);
      a += amp * (1 - Math.abs(2 * n - 1));         // billow
      tot += amp; amp *= 0.5;
    }
    a /= tot;
    let b = 0; amp = 0.5; tot = 0;
    for (const [L, sd] of OCT_B) { b += amp * sample(L, sd, u, v, w); tot += amp; amp *= 0.5; }
    b /= tot;
    const i = (z * N * N + y * N + x) * 2;
    data[i] = Math.max(0, Math.min(255, Math.round(a * 255)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(b * 255)));
  }
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_3D, t);
  gl.texStorage3D(gl.TEXTURE_3D, 1, gl.RG8, N, N, N);
  gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, N, N, N, gl.RG, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.REPEAT);
  return t;
}

/* ── 4x4 matrices, column-major ───────────────────────────────────────────── */
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}
function lookAt(eye, at, up) {
  const zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
  let zl = Math.hypot(zx, zy, zz) || 1;
  const z = [zx / zl, zy / zl, zz / zl];
  let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]];
  let xl = Math.hypot(x[0], x[1], x[2]) || 1; x = [x[0] / xl, x[1] / xl, x[2] / xl];
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return new Float32Array([
    x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
    -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
    -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1]);
}
function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}

/* ── the renderer ─────────────────────────────────────────────────────────── */
function makeRenderer(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false,
    powerPreference: 'high-performance', preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL2 is not available');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('no float render targets');
  const dbg = /[?&]gldbg=1/.test(location.search);

  const progScene = program(gl, VS_QUAD, FS_SCENE, 'scene');
  const progBlit = program(gl, VS_QUAD, FS_BLIT, 'blit');
  const progSeg = program(gl, VS_SEG, FS_SEG, 'seg');
  const progDown = program(gl, VS_QUAD, FS_DOWN, 'down');
  const progBlur = program(gl, VS_QUAD, FS_BLUR, 'blur');
  const progComp = program(gl, VS_QUAD, FS_COMPOSE, 'compose');

  const quadVB = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVB);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const quadVAO = gl.createVertexArray();
  gl.bindVertexArray(quadVAO);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  /* instanced segments */
  const cornerVB = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerVB);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const instVB = gl.createBuffer();
  const segVAO = gl.createVertexArray();
  gl.bindVertexArray(segVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerVB);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instVB);
  const STRIDE = 9 * 4;
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, STRIDE, 0); gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, STRIDE, 12); gl.vertexAttribDivisor(2, 1);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, STRIDE, 24); gl.vertexAttribDivisor(3, 1);
  gl.bindVertexArray(null);

  const noise = makeNoiseVolume(gl, 64);

  let W = 0, H = 0, sceneScale = 0.55;
  let hdr = null, half = null, bA = null, bB = null, bC = null;
  let instCount = 0;

  function alloc(w, h) {
    W = w; H = h;
    for (const t of [hdr, half, bA, bB, bC]) if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); }
    hdr = target(gl, W, H);
    half = target(gl, Math.max(2, Math.round(W * sceneScale)), Math.max(2, Math.round(H * sceneScale)));
    const bw = Math.max(2, W >> 2), bh = Math.max(2, H >> 2);
    bA = target(gl, bw, bh); bB = target(gl, bw, bh);
    bC = target(gl, Math.max(2, W >> 4), Math.max(2, H >> 4));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (w === canvas.width && h === canvas.height && hdr) return;
    canvas.width = w; canvas.height = h;
    alloc(w, h);
  }

  function setQuality(scale) {
    sceneScale = Math.max(0.30, Math.min(0.85, scale));
    alloc(W, H);
  }

  function uploadSegments(arr, n) {
    gl.bindBuffer(gl.ARRAY_BUFFER, instVB);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
    instCount = n;
  }

  function fullscreen(prog) {
    gl.useProgram(prog.p);
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function draw(S) {
    resize();
    const aspect = W / H;
    const tanHalf = Math.tan(S.fov * 0.5);
    const eye = S.eye, at = S.at;
    const fwd = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]];
    let fl = Math.hypot(fwd[0], fwd[1], fwd[2]) || 1;
    fwd[0] /= fl; fwd[1] /= fl; fwd[2] /= fl;
    /* right-handed basis: with fwd = (0,0,-1) this must give right = (+1,0,0).
       Get the sign wrong and the ray-marched pass is mirrored AND flipped while
       the rasterised channel is not — which reads as a cloud that has fallen to
       the bottom of the sky, not as a camera bug. */
    let right = [-fwd[2], 0, fwd[0]];
    let rl = Math.hypot(right[0], right[1], right[2]) || 1;
    right = [right[0] / rl, right[1] / rl, right[2] / rl];
    const up = [right[1] * fwd[2] - right[2] * fwd[1], right[2] * fwd[0] - right[0] * fwd[2],
                right[0] * fwd[1] - right[1] * fwd[0]];

    /* 1 · scene */
    gl.bindFramebuffer(gl.FRAMEBUFFER, half.fb);
    gl.viewport(0, 0, half.w, half.h);
    gl.disable(gl.BLEND);
    gl.useProgram(progScene.p);
    const u = progScene.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, noise);
    gl.uniform1i(u.uNoise, 0);
    gl.uniform3f(u.uCam, eye[0], eye[1], eye[2]);
    gl.uniform3f(u.uFwd, fwd[0], fwd[1], fwd[2]);
    gl.uniform3f(u.uRight, right[0], right[1], right[2]);
    gl.uniform3f(u.uUp, up[0], up[1], up[2]);
    gl.uniform2f(u.uRes, half.w, half.h);
    gl.uniform1f(u.uTanHalf, tanHalf);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform1f(u.uTime, S.time);
    gl.uniform1f(u.uFrame, S.frame % 64);
    gl.uniform3f(u.uL0, S.l0[0], S.l0[1], S.l0[2]);
    gl.uniform3f(u.uL1, S.l1[0], S.l1[1], S.l1[2]);
    gl.uniform1f(u.uI0, S.i0); gl.uniform1f(u.uI1, S.i1);
    gl.uniform1f(u.uSteps, S.steps);
    gl.uniform2f(u.uStorm, S.storm[0], S.storm[1]);
    gl.uniform1f(u.uMoonI, S.moonI);
    gl.uniform3f(u.uMoon, S.moon[0], S.moon[1], S.moon[2]);
    gl.uniform1f(u.uHaze, S.haze);
    fullscreen(progScene);

    /* 2 · up to full res */
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdr.fb);
    gl.viewport(0, 0, W, H);
    gl.useProgram(progBlit.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, half.tex);
    gl.uniform1i(progBlit.u.uTex, 0);
    fullscreen(progBlit);

    /* 3 · the channel */
    if (instCount > 0 && (S.glow > 0.001 || S.ghost > 0.001 || S.front > 0)) {
      const proj = perspective(S.fov, aspect, 4, 60000);
      const view = lookAt(eye, at, [0, 1, 0]);
      const vp = mul(proj, view);
      gl.useProgram(progSeg.p);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.uniformMatrix4fv(progSeg.u.uVP, false, vp);
      gl.uniform3f(progSeg.u.uCam, eye[0], eye[1], eye[2]);
      gl.uniform1f(progSeg.u.uPix, 2.0 * tanHalf / H);
      gl.uniform1f(progSeg.u.uGlow, S.glow);
      gl.uniform1f(progSeg.u.uGhost, S.ghost);
      gl.uniform1f(progSeg.u.uFront, S.front);
      gl.uniform1f(progSeg.u.uFrontW, S.frontW);
      gl.uniform1f(progSeg.u.uCore, S.core);
      gl.uniform1f(progSeg.u.uReveal, S.reveal);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, half.tex);
      gl.uniform1i(progSeg.u.uScene, 0);
      gl.uniform2f(progSeg.u.uInvRes, 1 / W, 1 / H);
      gl.bindVertexArray(segVAO);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instCount);
      gl.bindVertexArray(null);
      gl.disable(gl.BLEND);
    }

    /* 4 · bloom */
    gl.bindFramebuffer(gl.FRAMEBUFFER, bA.fb);
    gl.viewport(0, 0, bA.w, bA.h);
    gl.useProgram(progDown.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hdr.tex);
    gl.uniform1i(progDown.u.uTex, 0);
    gl.uniform2f(progDown.u.uSrcTexel, 1 / W, 1 / H);
    gl.uniform1f(progDown.u.uThresh, S.bloomThresh);
    fullscreen(progDown);

    const blur = (src, dst, dx, dy) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.viewport(0, 0, dst.w, dst.h);
      gl.useProgram(progBlur.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(progBlur.u.uTex, 0);
      gl.uniform2f(progBlur.u.uDir, dx / dst.w, dy / dst.h);
      fullscreen(progBlur);
    };
    blur(bA, bB, 1, 0); blur(bB, bA, 0, 1);
    /* a second, wider octave */
    gl.bindFramebuffer(gl.FRAMEBUFFER, bC.fb);
    gl.viewport(0, 0, bC.w, bC.h);
    gl.useProgram(progDown.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bA.tex);
    gl.uniform1i(progDown.u.uTex, 0);
    gl.uniform2f(progDown.u.uSrcTexel, 1 / bA.w, 1 / bA.h);
    gl.uniform1f(progDown.u.uThresh, 0.0);
    fullscreen(progDown);

    /* 5 · compose */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(progComp.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hdr.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bA.tex);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, bC.tex);
    gl.uniform1i(progComp.u.uHDR, 0);
    gl.uniform1i(progComp.u.uBloomA, 1);
    gl.uniform1i(progComp.u.uBloomB, 2);
    gl.uniform1f(progComp.u.uExposure, S.exposure);
    gl.uniform1f(progComp.u.uTime, S.time);
    gl.uniform1f(progComp.u.uRain, S.rain);
    gl.uniform1f(progComp.u.uFlashNow, S.flashNow);
    gl.uniform1f(progComp.u.uVig, 0.62);
    gl.uniform2f(progComp.u.uRes, W, H);
    fullscreen(progComp);

    if (dbg) {
      const e = gl.getError();
      if (e) console.warn('gl error after frame:', e.toString(16));
    }
  }

  return { gl: gl, draw: draw, resize: resize, uploadSegments: uploadSegments,
           setQuality: setQuality, get size() { return [W, H]; },
           get sceneScale() { return sceneScale; } };
}

export { makeRenderer, CB, CTOP };
