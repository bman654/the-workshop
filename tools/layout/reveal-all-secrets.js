/* reveal-all-secrets — light EVERY hidden/earned feature so the map can be analysed
   in its fully-revealed state (any map screenshot/critique MUST run this first, or it
   will not compose for the constellations + Undercroft that appear only once earned).

   USAGE: paste the IIFE below into `agent-browser eval` on the served index.html
   (same origin), then reload the page. It derives the breadcrumb set at RUNTIME from
   the page's own `PLACES` + `Sky.CATALOG`, so it never goes stale when rooms/stars are
   added. Lights: every front-door room, every catalog star (wing + field + the nine
   Feats of Light + the Automaton/Furnace bench-crumbs), and the whole Undercroft stair. */
(function revealAllSecrets(){
  // wipe any prior ws:* so the survey renders as a fresh "seen everything" state
  for (var i = localStorage.length - 1; i >= 0; i--) {
    var k = localStorage.key(i);
    if (k && k.indexOf('ws:') === 0) localStorage.removeItem(k);
  }
  var seen = new Set();
  // every front-door room id (drops ws:seen:<id> on first visit → lights its POI lamp + star)
  if (typeof PLACES !== 'undefined') PLACES.forEach(function (p) { if (p.id) seen.add(p.id); });
  // every catalog star: plain ids kindle from ws:seen; feat-<X> pseudo-ids from ws:flag:earned-<X>
  if (typeof Sky !== 'undefined' && Sky.CATALOG) Object.keys(Sky.CATALOG).forEach(function (id) {
    if (id.indexOf('feat-') === 0) localStorage.setItem('ws:flag:earned-' + id.slice(5), '1');
    else seen.add(id);
  });
  seen.add('undercroft-rune');               // render the Undercroft as the WHOLE, navigable stair
  seen.forEach(function (id) { localStorage.setItem('ws:seen:' + id, '1'); });
  return 'revealed ' + seen.size + ' seen + every feat — now reload the page';
})()
