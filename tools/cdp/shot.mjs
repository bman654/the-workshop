// ============================================================================
//  tools/cdp/shot.mjs — a CLIPPED screenshot, for looking closely at one part of
//  a page. `agent-browser screenshot` always hands back the whole viewport scaled
//  to a fixed width, which is exactly the wrong thing when the detail you need to
//  judge (a caustic cord, a one-pixel seam, a font) is a small patch of a big
//  picture. CDP's Page.captureScreenshot takes a clip rect and a scale, so a 400×300
//  patch can come back at 3× and actually be legible.
//
//  Like pointer.mjs, the catch is that `agent-browser get cdp-url` returns the
//  BROWSER endpoint; Page lives on a page session, so attach first.
//
//    node tools/cdp/shot.mjs <browser-ws-url> <url-substring> <out.png> [x y w h] [scale]
//    node tools/cdp/shot.mjs "$(agent-browser get cdp-url)" mypage /tmp/a.png 600 400 420 300 3
// ============================================================================
import { writeFileSync } from 'fs';

function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  let nextId = 1;
  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', () => res());
    ws.addEventListener('error', (e) => rej(new Error('CDP socket failed: ' + (e.message || e.type))));
  });
  ws.addEventListener('message', (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id); pending.delete(m.id);
      if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
    }
  });
  const send = (method, params = {}, sessionId) => ready.then(() => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
  }));
  return { ws, send };
}

const [wsUrl, urlMatch, out, ...rest] = process.argv.slice(2);
if (!wsUrl || !out) {
  console.error('usage: node tools/cdp/shot.mjs <browser-ws-url> <url-substring> <out.png> [x y w h] [scale]');
  process.exit(2);
}
const n = rest.map(Number);
const { ws, send } = connect(wsUrl);
const { targetInfos } = await send('Target.getTargets');
const page = targetInfos.find((t) => t.type === 'page' && t.url.includes(urlMatch || ''));
if (!page) { console.error('no page target matching ' + JSON.stringify(urlMatch)); process.exit(1); }
const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
const params = { format: 'png', captureBeyondViewport: false };
if (rest.length >= 4) {
  params.clip = { x: n[0], y: n[1], width: n[2], height: n[3], scale: rest.length >= 5 ? n[4] : 1 };
}
const { data } = await send('Page.captureScreenshot', params, sessionId);
writeFileSync(out, Buffer.from(data, 'base64'));
console.log(JSON.stringify({ out, target: page.url, clip: params.clip || 'viewport' }));
ws.close();
