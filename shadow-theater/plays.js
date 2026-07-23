/* ============================================================================
   plays.js — THE COMPANY'S REPERTOIRE.  [in-house]  Sets window.PLAYS.

   Three short wordless plays, each pure DATA the Director stages on the standing
   Shadow Theater. A play is:
     { id, title, blurb, dur,
       cast:  [ids visible while it plays],
       setup: a getState-shaped snapshot applied HARD under the fallen curtain,
       cues:  ordered { at, do, args } — a verb from the Director's frozen table,
       finalState: the closing tableau (hard) — reduced-motion jump + the twin's anchor }

   AUTHORING CONTRACT (so the payoff-liveness twin can isolate each cue): every cue's
   `at` is unique and consecutive cues differ by ≥ 0.05 s, and each cue is a GENUINE
   change on its channel (never a no-op) so its effect is observably landed. The
   dramatic HOLD beats are simply GAPS between cues (2 s eclipse / 1.5 s pounce-gather
   / 2.5 s nest-reveal) where the springs settle and the tableau breathes.

   The grow-by-data promise: to add a play, append an object here — no engine change.
   ============================================================================ */
"use strict";
(function (root) {

  /* ── PLAY 1 — "Crane Takes the Moon" ──────────────────────────────────────────
     The literal title as the hero merge: the crane rises to the moon and sweeps its
     wing UP and OVER the pierced disc — the two shadows MIN-union to solid black, an
     eclipse held for two full beats, then the wing eases back and the moon re-lights
     as the crane crests and glides off. A dusk→night wash; the far hills rise on the
     wide reveal; the lamp dollies in for the eclipse and pulls back after. */
  var crane = {
    id: 'crane', title: 'Crane Takes the Moon',
    blurb: 'A wing sweeps up, and for two beats the moon goes dark.',
    dur: 22,
    cast: ['hills', 'moon', 'vee', 'reed', 'crane'],
    setup: {
      lampD: 480, backdropPhase: 0.55, curtainDown: false,
      puppets: [
        { id: 'moon',  x: 0.62, y: 0.24, depth: 0.05, artic: {} },
        { id: 'crane', x: 0.30, y: 0.55, depth: 0.30, artic: { wing: 0.10 } },
        { id: 'vee',   x: 0.52, y: 0.18, depth: 0.02, artic: {} },
        { id: 'reed',  x: 0.82, y: 0.72, depth: 0.08, artic: { sway: 0.10 } }
      ]
    },
    cues: [
      { at: 0.50, do: 'wash',  args: [0.72] },                       // the dusk deepens as the house opens
      { at: 1.00, do: 'flat',  args: ['hills', 1] },                 // the far hills rise on the wide reveal
      { at: 2.50, do: 'pos',   args: ['crane', 0.40, 0.50] },        // the crane wades forward
      { at: 3.50, do: 'artic', args: ['crane', 'wing', 0.35] },      // lifts a wing, testing the air
      { at: 4.50, do: 'lamp',  args: [360] },                        // the lamp dollies in — all looms
      { at: 5.50, do: 'wash',  args: [0.90] },                       // night falls
      { at: 6.50, do: 'pos',   args: ['crane', 0.58, 0.40] },        // rises toward the moon
      { at: 7.50, do: 'depth', args: ['crane', 0.50] },             // looms as it nears the lamp
      { at: 8.50, do: 'artic', args: ['crane', 'wing', 0.88] },      // ★ the wing sweeps up and OVER the moon
      // ── 2 s eclipse hold ──
      { at: 11.00, do: 'wash',  args: [1.00] },                      // deepest night at the eclipse
      { at: 11.50, do: 'pos',   args: ['vee', 0.34, 0.16] },         // the far vee drifts across
      { at: 13.50, do: 'artic', args: ['crane', 'wing', 0.50] },     // the wing eases back — the moon re-lights
      { at: 14.50, do: 'pos',   args: ['crane', 0.62, 0.34] },       // the crane crests, moon-lit
      { at: 15.50, do: 'lamp',  args: [460] },                       // the lamp pulls back a touch
      { at: 16.50, do: 'depth', args: ['crane', 0.34] },
      { at: 17.50, do: 'pos',   args: ['crane', 0.72, 0.30] },       // glides off toward the moon
      { at: 18.50, do: 'artic', args: ['crane', 'wing', 0.28] },     // settles
      { at: 19.50, do: 'wash',  args: [0.85] }                       // the night holds — TABLEAU
    ],
    finalState: {
      lampD: 460, backdropPhase: 0.85, curtainDown: false,
      puppets: [
        { id: 'moon',  x: 0.62, y: 0.24, depth: 0.05, artic: {} },
        { id: 'crane', x: 0.72, y: 0.30, depth: 0.34, artic: { wing: 0.28 } },
        { id: 'vee',   x: 0.34, y: 0.16, depth: 0.02, artic: {} },
        { id: 'reed',  x: 0.82, y: 0.72, depth: 0.08, artic: { sway: 0.10 } },
        { id: 'hills', x: 0.50, y: 0.99, depth: 0.03, artic: {} }
      ]
    }
  };

  /* ── PLAY 2 — "Fox at the Reed-Bank" ──────────────────────────────────────────
     The near bank slides in as cover; the fox creeps low along it, gathers, and
     POUNCES — and a crane hidden in the reeds FLUSHES, wings bursting up, and escapes
     toward the moon while the fox lands empty. A 1.5 s pounce-gather hold before the
     spring. */
  var fox = {
    id: 'fox', title: 'Fox at the Reed-Bank',
    blurb: 'A low creep, a gather, a pounce — and the reeds burst into wings.',
    dur: 21,
    cast: ['bank', 'moon', 'reed', 'crane', 'fox'],
    setup: {
      lampD: 480, backdropPhase: 0.70, curtainDown: false,
      puppets: [
        { id: 'moon',  x: 0.72, y: 0.22, depth: 0.05, artic: {} },
        { id: 'reed',  x: 0.70, y: 0.70, depth: 0.08, artic: { sway: 0.15 } },
        { id: 'crane', x: 0.72, y: 0.60, depth: 0.22, artic: { wing: 0.10 } },
        { id: 'fox',   x: -0.10, y: 0.62, depth: 0.20, artic: { look: 0.45 } }
      ]
    },
    cues: [
      { at: 0.50, do: 'flat',  args: ['bank', 1] },                  // the near bank slides in — cover
      { at: 1.50, do: 'pos',   args: ['fox', 0.18, 0.62] },          // the fox creeps in behind it
      { at: 2.50, do: 'artic', args: ['fox', 'look', 0.28] },        // head low, stalking
      { at: 3.50, do: 'lamp',  args: [420] },                        // the light tightens
      { at: 4.50, do: 'pos',   args: ['fox', 0.34, 0.63] },          // closer
      { at: 5.50, do: 'wash',  args: [0.85] },                       // dusk deepens
      { at: 6.50, do: 'pos',   args: ['fox', 0.50, 0.64] },          // near the reeds
      { at: 7.50, do: 'artic', args: ['reed', 'sway', 0.45] },       // the reeds stir — something is there
      { at: 8.50, do: 'artic', args: ['fox', 'look', 0.14] },        // gathers, head lowest
      // ── 1.5 s pounce-gather hold ──
      { at: 10.00, do: 'depth', args: ['fox', 0.36] },              // coils — looms
      { at: 10.50, do: 'pos',   args: ['fox', 0.62, 0.50] },         // ★ the POUNCE — up and forward
      { at: 11.00, do: 'artic', args: ['fox', 'look', 0.80] },       // head snaps up
      { at: 11.50, do: 'artic', args: ['crane', 'wing', 0.92] },     // ★ the crane FLUSHES — wings burst
      { at: 12.00, do: 'pos',   args: ['crane', 0.72, 0.35] },       // bolts upward
      { at: 12.50, do: 'depth', args: ['crane', 0.46] },            // looms as it climbs
      { at: 13.50, do: 'pos',   args: ['crane', 0.84, 0.22] },       // escapes toward the moon
      { at: 14.50, do: 'pos',   args: ['fox', 0.60, 0.60] },         // the fox lands, empty
      { at: 15.50, do: 'depth', args: ['fox', 0.20] },
      { at: 16.50, do: 'artic', args: ['fox', 'look', 0.55] },       // watches it go
      { at: 17.50, do: 'artic', args: ['crane', 'wing', 0.42] },     // the crane glides off
      { at: 18.50, do: 'lamp',  args: [470] },                       // the light eases back
      { at: 19.50, do: 'wash',  args: [0.75] }                       // settle — TABLEAU
    ],
    finalState: {
      lampD: 470, backdropPhase: 0.75, curtainDown: false,
      puppets: [
        { id: 'moon',  x: 0.72, y: 0.22, depth: 0.05, artic: {} },
        { id: 'reed',  x: 0.70, y: 0.70, depth: 0.08, artic: { sway: 0.45 } },
        { id: 'crane', x: 0.84, y: 0.22, depth: 0.46, artic: { wing: 0.42 } },
        { id: 'fox',   x: 0.60, y: 0.60, depth: 0.20, artic: { look: 0.55 } },
        { id: 'bank',  x: 0.50, y: 1.00, depth: 0.05, artic: {} }
      ]
    }
  };

  /* ── PLAY 3 — "Willow's Secret" ───────────────────────────────────────────────
     The willow's fronds sweep aside — and behind them, occluded until now, a nest of
     two nestlings. They stir, a parent returns out of the far vee and settles at the
     nest, and the fronds fall half-back over the secret. A 2.5 s reveal hold. (No
     slide-in flat here — the reveal is OCCLUSION, the willow uncovering the nest.) */
  var willow = {
    id: 'willow', title: "Willow's Secret",
    blurb: 'The fronds part, and a small kept thing is stirring.',
    dur: 21,
    cast: ['moon', 'nest', 'willow', 'reed', 'vee'],
    setup: {
      lampD: 480, backdropPhase: 0.60, curtainDown: false,
      puppets: [
        { id: 'moon',   x: 0.70, y: 0.24, depth: 0.05, artic: {} },
        { id: 'nest',   x: 0.34, y: 0.50, depth: 0.06, artic: { stir: 0.0 } },
        { id: 'willow', x: 0.28, y: 0.14, depth: 0.12, artic: { sway: 0.0 } },
        { id: 'reed',   x: 0.82, y: 0.72, depth: 0.08, artic: { sway: 0.10 } },
        { id: 'vee',    x: 0.52, y: 0.16, depth: 0.02, artic: {} }
      ]
    },
    cues: [
      { at: 0.50, do: 'wash',  args: [0.70] },                       // evening
      { at: 1.50, do: 'artic', args: ['willow', 'sway', 0.25] },     // the tree stirs
      { at: 2.50, do: 'lamp',  args: [430] },                        // the lamp leans toward the willow
      { at: 3.50, do: 'artic', args: ['willow', 'sway', 0.45] },     // fronds sway more
      { at: 4.50, do: 'pos',   args: ['willow', 0.34, 0.14] },       // the crown leans over
      { at: 5.50, do: 'artic', args: ['willow', 'sway', 0.72] },     // ★ the fronds sweep aside — the reveal begins
      { at: 6.50, do: 'pos',   args: ['nest', 0.36, 0.50] },         // the nest edges into the light
      { at: 7.50, do: 'artic', args: ['nest', 'stir', 0.40] },       // the nestlings stir
      // ── 2.5 s reveal hold ──
      { at: 10.00, do: 'wash',  args: [0.85] },                      // night settles on the secret
      { at: 10.50, do: 'artic', args: ['nest', 'stir', 0.70] },      // they shift, hungry
      { at: 11.50, do: 'pos',   args: ['vee', 0.42, 0.18] },         // a parent returns out of the vee
      { at: 12.50, do: 'pos',   args: ['vee', 0.38, 0.30] },         // descends toward the nest
      { at: 13.50, do: 'pos',   args: ['vee', 0.36, 0.40] },         // nearer
      { at: 14.50, do: 'artic', args: ['nest', 'stir', 0.92] },      // the nestlings reach up
      { at: 15.50, do: 'artic', args: ['willow', 'sway', 0.40] },    // the fronds begin to fall back
      { at: 16.50, do: 'pos',   args: ['vee', 0.35, 0.45] },         // the parent at the nest
      { at: 17.50, do: 'lamp',  args: [470] },                       // the lamp pulls back, tender
      { at: 18.50, do: 'artic', args: ['willow', 'sway', 0.22] },    // fronds settle — the secret half-hidden again
      { at: 19.50, do: 'wash',  args: [0.75] }                       // TABLEAU
    ],
    finalState: {
      lampD: 470, backdropPhase: 0.75, curtainDown: false,
      puppets: [
        { id: 'moon',   x: 0.70, y: 0.24, depth: 0.05, artic: {} },
        { id: 'nest',   x: 0.36, y: 0.50, depth: 0.06, artic: { stir: 0.92 } },
        { id: 'willow', x: 0.34, y: 0.14, depth: 0.12, artic: { sway: 0.22 } },
        { id: 'reed',   x: 0.82, y: 0.72, depth: 0.08, artic: { sway: 0.10 } },
        { id: 'vee',    x: 0.35, y: 0.45, depth: 0.02, artic: {} }
      ]
    }
  };

  root.PLAYS = [crane, fox, willow];
  root.PLAYS.byId = function (id) { for (var i = 0; i < root.PLAYS.length; i++) if (root.PLAYS[i].id === id) return root.PLAYS[i]; return null; };

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
