// ============================================================================
//  tools/cdp/pointer.mjs — a REAL pointer, for verifying a page in a browser.
//
//  WHY THIS EXISTS. Two things that look like a click are not one:
//
//    · `element.click()` / `dispatchEvent` are SYNTHETIC. They are blind to
//      pointer capture, hit-testing and z-order, so they report success on a
//      build that is genuinely broken for a human.
//    · `agent-browser mouse down` ignores the cursor and presses at (0,0), so a
//      press/move/release "drag" fires `pointermove` on your canvas and no
//      `pointerdown` at all — it looks like your drag handler is broken when it
//      is fine.
//
//  The only honest way is CDP `Input.dispatchMouseEvent`, and the catch that
//  costs the hour is that `agent-browser get cdp-url` hands you the BROWSER
//  endpoint, which has no Input domain. You must `Target.getTargets` →
//  `Target.attachToTarget {flatten:true}` and send every input command with that
//  sessionId. This module does exactly that and nothing else.
//
//  Node 22+ has a global WebSocket, so this needs no dependency.
//
//  USE (module):
//      import { pointer } from '../tools/cdp/pointer.mjs';
//      const p = await pointer(cdpUrl, 'the-answering-room');   // url substring
//      await p.drag(700, 500, 900, 560);      // a genuine press-move-release
//      await p.click(420, 300);               // a genuine click
//      await p.wheel(700, 500, 0, -240);      // a genuine scroll
//      await p.close();
//
//  USE (cli):
//      node tools/cdp/pointer.mjs "<ws://…browser…>" <urlMatch> drag  x1 y1 x2 y2
//      node tools/cdp/pointer.mjs "<ws://…browser…>" <urlMatch> click x  y
//      node tools/cdp/pointer.mjs "<ws://…browser…>" <urlMatch> wheel x  y  dx dy
// ============================================================================

/** Open one CDP socket and give it request/response semantics. */
function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  let nextId = 1;
  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', () => res());
    ws.addEventListener('error', (e) => rej(new Error('CDP socket failed: ' + url + ' — ' + (e.message || e.type))));
  });
  ws.addEventListener('message', (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.method + ': ' + msg.error.message));
      else resolve(msg.result);
    }
  });
  const send = (method, params = {}, sessionId) => ready.then(() => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
  }));
  return { ws, send, ready };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Attach to the page target whose URL contains `urlMatch` (or the first page if
 * omitted) and return a pointer that dispatches genuine input events to it.
 */
export async function pointer(browserWsUrl, urlMatch = '') {
  const { ws, send } = connect(browserWsUrl);
  const { targetInfos } = await send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page' && t.url.includes(urlMatch));
  if (!pages.length) {
    ws.close();
    throw new Error('no page target matching ' + JSON.stringify(urlMatch) + ' — open ones: ' +
      targetInfos.filter((t) => t.type === 'page').map((t) => t.url).join(', '));
  }
  const { sessionId } = await send('Target.attachToTarget', { targetId: pages[0].targetId, flatten: true });
  const input = (params) => send('Input.dispatchMouseEvent', params, sessionId);

  /** A genuine press → n moves → release. Every event carries the real position. */
  async function drag(x1, y1, x2, y2, { steps = 12, button = 'left', pauseMs = 12 } = {}) {
    await input({ type: 'mouseMoved', x: x1, y: y1, button: 'none', buttons: 0 });
    await input({ type: 'mousePressed', x: x1, y: y1, button, buttons: 1, clickCount: 1 });
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      await input({ type: 'mouseMoved', x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, button, buttons: 1 });
      await sleep(pauseMs);
    }
    await input({ type: 'mouseReleased', x: x2, y: y2, button, buttons: 0, clickCount: 1 });
    return { from: [x1, y1], to: [x2, y2], steps };
  }

  async function click(x, y, { button = 'left', clickCount = 1 } = {}) {
    await input({ type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
    await input({ type: 'mousePressed', x, y, button, buttons: 1, clickCount });
    await sleep(20);
    await input({ type: 'mouseReleased', x, y, button, buttons: 0, clickCount });
    return { at: [x, y], clickCount };
  }

  const dblclick = (x, y) => click(x, y, { clickCount: 1 }).then(() => click(x, y, { clickCount: 2 }));

  async function move(x, y) { await input({ type: 'mouseMoved', x, y, button: 'none', buttons: 0 }); return { at: [x, y] }; }

  async function wheel(x, y, dx = 0, dy = -240) {
    await input({ type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
    await input({ type: 'mouseWheel', x, y, deltaX: dx, deltaY: dy, buttons: 0 });
    return { at: [x, y], delta: [dx, dy] };
  }

  return { drag, click, dblclick, move, wheel, sessionId, url: pages[0].url, close: () => ws.close() };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const [wsUrl, urlMatch, verb, ...rest] = process.argv.slice(2);
  if (!wsUrl || !verb) {
    console.error('usage: node tools/cdp/pointer.mjs <browser-ws-url> <url-substring> <drag|click|dblclick|move|wheel> …coords');
    process.exit(2);
  }
  const n = rest.map(Number);
  const p = await pointer(wsUrl, urlMatch || '');
  const out = verb === 'drag' ? await p.drag(n[0], n[1], n[2], n[3])
    : verb === 'click' ? await p.click(n[0], n[1])
    : verb === 'dblclick' ? await p.dblclick(n[0], n[1])
    : verb === 'move' ? await p.move(n[0], n[1])
    : verb === 'wheel' ? await p.wheel(n[0], n[1], n[2] || 0, n[3] || -240)
    : (() => { throw new Error('unknown verb ' + verb); })();
  console.log(JSON.stringify({ target: p.url, ...out }));
  p.close();
}
