/* ============================================================================
   playbill.js — THE PAPER PROGRAMME.  [in-house]  Sets window.Playbill.

   A parchment programme pinned to the set, top-left over the dark spandrel — it reads
   as a card tacked to the proscenium, not a floating HUD. Tap a title and the theatre
   stages that play; tap "Free Play" to return to the sandbox. While a play runs the
   programme tucks aside, dims the un-chosen titles, and shows what is NOW PLAYING; at
   intermission it re-pins full.

   Pure DOM + CSS (no canvas cost, arms no sound — honours the page's sound-hush idiom).
   Transitions are gated behind prefers-reduced-motion.

   API:
     Playbill.mount(stagewrapEl, plays[{id,title,sub}])  // adds an implicit 'free' row
     Playbill.onPick(cb)                                 // cb(id | 'free') on a title tap
     Playbill.setNowPlaying(id | null)                   // id → tuck-aside; null → re-pin full
   ============================================================================ */
"use strict";
(function (root) {

  var CSS = '' +
    '.stpb{position:absolute;left:14px;top:12px;z-index:4;width:min(38%,232px);' +
      'padding:13px 15px 12px;border-radius:5px;transform:rotate(-1.4deg);transform-origin:top left;' +
      'font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;color:#2a1c0e;' +
      'background:linear-gradient(150deg,#efe0c2,#e7d3ab 46%,#dcc79b);' +
      'box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 -14px 26px rgba(120,86,40,.16) inset,0 12px 24px -10px rgba(0,0,0,.6);' +
      'border:1px solid rgba(150,116,64,.5);cursor:default;' +
      'transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .5s,width .5s;}' +
    '.stpb::after{content:"";position:absolute;inset:0;border-radius:5px;pointer-events:none;' +
      'background:radial-gradient(120% 80% at 20% -10%,rgba(255,246,225,.5),rgba(0,0,0,0) 60%),' +
      'radial-gradient(140% 120% at 110% 120%,rgba(120,80,30,.22),rgba(0,0,0,0) 55%);mix-blend-mode:multiply;opacity:.5;}' +
    '.stpb .kick{font:600 8.5px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.26em;text-transform:uppercase;' +
      'color:#7a5a24;text-shadow:0 1px 0 rgba(255,250,235,.5);margin:0 0 2px;}' +
    '.stpb h4{margin:0 0 9px;font-weight:600;font-size:16px;letter-spacing:.01em;color:#3a2510;' +
      'border-bottom:1px solid rgba(122,90,36,.34);padding-bottom:7px;}' +
    '.stpb ol{list-style:none;margin:0;padding:0;counter-reset:pb;}' +
    '.stpb li{position:relative;counter-increment:pb;padding:6px 4px 6px 22px;border-radius:3px;cursor:pointer;' +
      'transition:background .18s,opacity .35s,color .18s;}' +
    '.stpb li::before{content:counter(pb,upper-roman) ".";position:absolute;left:2px;top:6px;' +
      'font:600 10px/1.3 ui-monospace,monospace;color:#9a7534;opacity:.85;}' +
    '.stpb li .t{font-size:13.5px;font-weight:600;color:#33210f;display:block;line-height:1.22;}' +
    '.stpb li .s{font-size:10px;font-style:italic;color:#6d5326;opacity:.9;display:block;margin-top:1px;line-height:1.28;}' +
    '.stpb li:hover{background:rgba(122,90,36,.13);}' +
    '.stpb li:hover .t{color:#1c1206;}' +
    '.stpb li.free{margin-top:7px;padding-top:9px;border-top:1px dashed rgba(122,90,36,.4);}' +
    '.stpb li.free .t{font-style:italic;font-weight:600;color:#5a4320;}' +
    '.stpb .np{display:none;font:600 8px/1.3 ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase;' +
      'color:#8a3b1e;margin:0 0 6px;}' +
    '.stpb.playing{width:min(30%,182px);opacity:.9;transform:rotate(-1.4deg) scale(.9);}' +
    '.stpb.playing .np{display:block;}' +
    '.stpb.playing li{opacity:.32;}' +
    '.stpb.playing li.now{opacity:1;background:rgba(122,90,36,.16);}' +
    '.stpb.playing li.free{opacity:.7;}' +
    '@media (max-width:560px){.stpb{width:min(52%,180px);left:9px;top:8px;padding:9px 10px;}' +
      '.stpb h4{font-size:13px;margin-bottom:6px;}.stpb li .t{font-size:11.5px;}.stpb li .s{display:none;}}' +
    '@media (prefers-reduced-motion:reduce){.stpb,.stpb li{transition:none;}}';

  var root_el = null, pickCb = null, injected = false;

  function injectCSS() {
    if (injected) return; injected = true;
    var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
  }

  function mount(stagewrapEl, plays) {
    if (!stagewrapEl) return;
    injectCSS();
    if (root_el && root_el.parentNode) root_el.parentNode.removeChild(root_el);
    root_el = document.createElement('div');
    root_el.className = 'stpb';
    root_el.setAttribute('aria-label', "Tonight's programme");
    var html = '<p class="kick">The Toy Theatre</p><h4>Tonight&rsquo;s Programme</h4><p class="np">Now Playing</p><ol>';
    for (var i = 0; i < plays.length; i++) {
      var p = plays[i];
      html += '<li data-id="' + esc(p.id) + '" role="button" tabindex="0">' +
        '<span class="t">' + esc(p.title) + '</span>' +
        (p.sub ? '<span class="s">' + esc(p.sub) + '</span>' : '') + '</li>';
    }
    html += '<li class="free" data-id="free" role="button" tabindex="0"><span class="t">Free Play</span>' +
      '<span class="s">the lamp, the silk, your own hands</span></li></ol>';
    root_el.innerHTML = html;
    stagewrapEl.appendChild(root_el);
    // one delegated handler for tap + keyboard; NEVER touches audio
    root_el.addEventListener('click', function (e) { var li = closestLi(e.target); if (li) fire(li.getAttribute('data-id')); });
    root_el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var li = closestLi(e.target); if (li) { e.preventDefault(); fire(li.getAttribute('data-id')); }
    });
  }

  function closestLi(el) { while (el && el !== root_el) { if (el.tagName === 'LI') return el; el = el.parentNode; } return null; }
  function fire(id) { if (pickCb) pickCb(id); }
  function onPick(cb) { pickCb = cb; }

  function setNowPlaying(id) {
    if (!root_el) return;
    var lis = root_el.querySelectorAll('li');
    for (var i = 0; i < lis.length; i++) lis[i].classList.toggle('now', id != null && lis[i].getAttribute('data-id') === id);
    root_el.classList.toggle('playing', id != null);
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  root.Playbill = { mount: mount, onPick: onPick, setNowPlaying: setNowPlaying, __forged: true };

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
