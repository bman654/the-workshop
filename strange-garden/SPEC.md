# Strange Garden — House Style & Piece Spec

Every piece is **one self-contained `.html` file** in `pieces/` — inline CSS + JS, **zero
external dependencies, no build step, no network calls**. It must run by double-clicking the
file. Target modern Chrome/Safari.

## Aesthetic

A dark "natural-history catalogue of strange life" feel. The art is the hero (full-bleed
canvas). Chrome is minimal, quiet, and elegant.

- Background: near-black `#0a0b0f`. Canvas fills the viewport.
- Typography: system UI for body; a mono accent for labels/numbers
  (`ui-monospace, "SF Mono", Menlo, monospace`).
- Accent color per piece (a single tasteful hue) — pick one that suits the system.
- Control panel: a floating, semi-transparent, blurred glass panel
  (`backdrop-filter: blur(12px)`), top-left or top-right, ~260px wide, collapsible.
- Subtle, no neon-soup. Let the generative system provide the color.

## Required UI in every piece

1. **Full-window canvas**, DPR-aware (use `devicePixelRatio`, resize handler).
2. **Control panel** with sliders/toggles for the system's key parameters, live-updating.
3. **Buttons:** `Restart/Reseed`, `Pause/Play`, `Save PNG` (downloads the canvas).
4. **Title + one-line description** of the system in the panel.
5. **FPS / particle count** readout (small, mono, bottom corner).
6. **Keyboard:** `Space` = pause, `r` = reseed, `h` = hide/show panel, `s` = save PNG.
7. Graceful: pause `requestAnimationFrame` when `document.hidden`.

## Performance

- Pick particle/agent counts so it holds ~50–60 fps on a laptop. Add a count slider.
- Prefer typed arrays (`Float32Array`) for particle state. Avoid per-frame allocations.
- For very-large-agent systems (Physarum), it's fine to use WebGL or an offscreen
  `ImageData` buffer, but a clean Canvas2D version that looks great is preferred for
  maintainability — only reach for WebGL if Canvas2D can't hit the look/perf.

## HTML skeleton (copy this)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PIECE NAME — Strange Garden</title>
<style>
  :root { --accent: #7fd1c7; }
  * { box-sizing: border-box; }
  html,body { margin:0; height:100%; background:#0a0b0f; overflow:hidden;
    font-family: system-ui, sans-serif; color:#e6e8ee; }
  #c { display:block; width:100vw; height:100vh; }
  #panel { position:fixed; top:16px; left:16px; width:260px; padding:16px;
    background:rgba(18,20,28,.66); backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,.08); border-radius:14px;
    box-shadow:0 8px 40px rgba(0,0,0,.5); font-size:13px; transition:opacity .2s; }
  #panel.hidden { opacity:0; pointer-events:none; }
  #panel h1 { font-size:14px; margin:0 0 2px; letter-spacing:.02em; }
  #panel .desc { font-size:11px; opacity:.6; margin:0 0 12px; line-height:1.4; }
  #panel label { display:block; font-size:11px; opacity:.75; margin:10px 0 3px;
    font-family:ui-monospace,Menlo,monospace; display:flex; justify-content:space-between; }
  #panel input[type=range] { width:100%; accent-color:var(--accent); }
  .row { display:flex; gap:8px; margin-top:14px; }
  button { flex:1; padding:7px; font-size:12px; cursor:pointer; color:#e6e8ee;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
    border-radius:8px; }
  button:hover { background:rgba(255,255,255,.12); }
  #hud { position:fixed; bottom:10px; right:14px; font:11px ui-monospace,Menlo,monospace;
    opacity:.4; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="panel">
  <h1>Piece Name</h1>
  <p class="desc">One-line description of the system.</p>
  <!-- sliders here -->
  <div class="row"><button id="reseed">Reseed</button><button id="pause">Pause</button></div>
  <div class="row"><button id="save">Save PNG</button></div>
</div>
<div id="hud"></div>
<script>
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let W,H,DPR;
function resize(){ DPR=Math.min(devicePixelRatio||1,2);
  W=cv.width=innerWidth*DPR; H=cv.height=innerHeight*DPR;
  cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px'; }
addEventListener('resize', resize); resize();
// ... system state, init(), step(dt), draw() ...
let paused=false, last=performance.now(), fps=0;
function loop(now){ const dt=Math.min((now-last)/1000,.05); last=now;
  if(!paused && !document.hidden){ step(dt); draw(); }
  fps += ((1/Math.max(dt,1e-4))-fps)*0.1;
  hud.textContent = `${fps.toFixed(0)} fps`;
  requestAnimationFrame(loop); }
document.getElementById('pause').onclick=()=>paused=!paused;
document.getElementById('reseed').onclick=()=>init();
document.getElementById('save').onclick=()=>{ const a=document.createElement('a');
  a.download='strange-garden.png'; a.href=cv.toDataURL('image/png'); a.click(); };
addEventListener('keydown',e=>{ if(e.key===' '){paused=!paused;e.preventDefault();}
  if(e.key==='r')init(); if(e.key==='h')panel.classList.toggle('hidden');
  if(e.key==='s')document.getElementById('save').click(); });
const panel=document.getElementById('panel'), hud=document.getElementById('hud');
init(); requestAnimationFrame(loop);
</script>
</body>
</html>
```

## Gallery integration

The gallery (`index.html`) discovers pieces from a small `pieces.json` manifest (array of
`{file, name, blurb, accent}`). When you add a piece, add an entry to `pieces.json`.

## Verification (deputies must do this)

After writing a piece, verify it actually renders using the `agent-browser` skill:
open `file://` path, wait ~3s, screenshot, confirm the canvas shows the system animating
(not blank/error). Save the screenshot to `assets/thumbs/<piece>.png` for the gallery.
Check the browser console for errors.
