/* ═══════════════════════════════════════════════════════════════════════════
   tours.js — the Grand Tour thread data (authored, not generated).

   WS2 / DESIGN §2. This module is forge-included alongside the tour engine
   (tour.js) into the front door + every stop page. It defines the ordered
   docent threads a visitor can walk, plus the EXTRA_STOPS allow-list of estate
   front-matter pages that live OUTSIDE the manifest.

   ── T0.1 status: FIXTURE DATA ────────────────────────────────────────────────
   These are TWO tiny FIXTURE threads over real estate pages, marked
   `fixture: true`, that exist only to prove the schema + `tour-check` gate. The
   captions here are throwaway scaffolding (clearly labelled "Fixture stop —"),
   NOT the register-critical prose — Fable authors the five real threads in
   Appendix A and T3.1 REPLACES this whole array with them verbatim. The
   `fixture: true` flag tells tour-check to SKIP the docent-sentinel presence
   check for a thread's stop pages (the includes are swept in later, in W2), so
   the gate is green now over pages that do not yet carry the docent.

   ── Dual-use module (the ws.js idiom) ────────────────────────────────────────
   In a browser this attaches `TOURS` / `EXTRA_STOPS` / `DOCENT_SENTINEL`
   globals; under Node it exports them (tour-check.mjs `require`s this file).
   forge strips the trailing `module.exports` guard when it inlines the file, so
   the shipped `<script>` is clean. Comments inside a forge-included block use
   the block-comment form ONLY, never a multi-line `<!-- -->` (the forge
   landmine that silently kills the inlined script).

   ── The docent sentinel ──────────────────────────────────────────────────────
   `DOCENT_SENTINEL` is the canonical marker string that `tour-check` looks for
   in a shipped stop page to prove the docent include is present (the
   forgotten-include gate, DESIGN §5/§8). It is defined HERE (this module is
   co-included with the engine on every stop page, so its literal lands in the
   forged HTML); the engine (tour.js, T0.2) also carries it. Never change the
   literal without updating tour-check and every shipped page in the same commit.

   Vanilla ES5-ish, zero-dependency, no Math.random / Date.* (DESIGN §1
   determinism). Schema: DESIGN §2.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* The forgotten-include gate's marker (DESIGN §5/§8). */
  var DOCENT_SENTINEL = 'grand-tour-docent';

  /* ── EXTRA_STOPS — the allow-list of non-manifest front-matter stop pages ────
     (DESIGN §2/§9). Each entry: an `anchor` (a top-level district id — the
     lit-path structure the front-door overlay pins this stop to, §6) and a
     one-line `justification`. Every entry must exist on disk (tour-check). */
  var EXTRA_STOPS = {
    'colophon.html': {
      anchor: 'manor',
      justification: 'the estate colophon — a maker front-matter page outside the manifest (DESIGN §2/§9).'
    },
    'ledger/face.html': {
      anchor: 'outbuilding',
      justification: "the Makers' Cairn face — a records page outside the manifest; keeps the Shed company (DESIGN §2/§9)."
    }
  };

  /* ── TOURS — FIXTURE threads only (T0.1). Replaced verbatim in T3.1. ──────────
     Schema (DESIGN §2): { id, title, tagline, minutes, start, stops[] }.
     A stop is one of:
       • waypoint  { href:'index.html', at:'<districtId>', title, caption, dwell? }
       • exhibit   { href:'<dir>/index.html', room:'<roomId>', title, caption,
                     dwell?, hold?, beats? }
       • extra     { href:'<EXTRA_STOPS key>', title, caption, ... }  (anchor from
                     the EXTRA_STOPS entry, or an explicit stop.anchor)
     The last stop is the FINALE (no auto-advance). `hold:true` = watch-forever
     (no countdown, §1). `beats:'act'` = a bespoke __tourAct performance (§4). */
  var TOURS = [
    {
      id: 'fixture-a',
      fixture: true,
      title: 'Fixture — Light Sampler',
      tagline: 'a tiny fixture thread over real optics pages (schema + gate proof only)',
      minutes: 2,
      start: 'index.html',
      stops: [
        { href: 'index.html', at: 'opticks',
          title: 'Fixture — The Estate from Above',
          caption: 'Fixture stop — front-door waypoint overture; anchored at the opticks district. Placeholder prose, replaced by Appendix A in T3.1.',
          dwell: 12000 },
        { href: 'rainbow/index.html', room: 'hall-of-mirrors',
          title: 'Fixture — The Rainbow',
          caption: 'Fixture stop — an exhibit stop with a per-stop dwell override. Placeholder prose.',
          dwell: 20000 },
        { href: 'iridescence/index.html', room: 'hall-of-mirrors',
          title: 'Fixture — Iridescence',
          caption: 'Fixture stop — a HOLD stop (no countdown; the docent waits). Placeholder prose.',
          hold: true },
        { href: 'cavern/double-slit/index.html', room: 'physics-lab',
          title: 'Fixture — The Double Slit',
          caption: 'Fixture stop — an ACT stop (bespoke performance) and the FINALE. Placeholder prose.',
          beats: 'act' }
      ]
    },
    {
      id: 'fixture-b',
      fixture: true,
      title: 'Fixture — Chance & Records Sampler',
      tagline: 'a tiny fixture thread with a mid-thread waypoint and an EXTRA_STOPS page',
      minutes: 2,
      start: 'galton/index.html',
      stops: [
        { href: 'galton/index.html', room: 'workbench',
          title: 'Fixture — The Galton Board',
          caption: 'Fixture stop — an exhibit start (the plaque page for this thread). Placeholder prose.' },
        { href: 'index.html', at: 'number',
          title: 'Fixture — The Number Garden',
          caption: 'Fixture stop — a mid-thread front-door waypoint, anchored at the number district. Placeholder prose.',
          dwell: 10000 },
        { href: 'buffon/index.html', room: 'numbers-room',
          title: "Fixture — Buffon's Needles",
          caption: 'Fixture stop — a plain exhibit stop. Placeholder prose.' },
        { href: 'colophon.html',
          title: 'Fixture — The Colophon',
          caption: 'Fixture stop — an EXTRA_STOPS page (outside the manifest) and the FINALE. Placeholder prose.' }
      ]
    }
  ];

  /* ── browser globals ──────────────────────────────────────────────────────── */
  if (root) {
    root.TOURS = TOURS;
    root.EXTRA_STOPS = EXTRA_STOPS;
    root.DOCENT_SENTINEL = DOCENT_SENTINEL;
  }

  /* dual-use module guard (forge strips exactly this braced single line) */
  if (typeof module !== 'undefined' && module.exports) { module.exports = { TOURS: TOURS, EXTRA_STOPS: EXTRA_STOPS, DOCENT_SENTINEL: DOCENT_SENTINEL }; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
