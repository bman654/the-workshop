# ✦ Feats of Light — earned achievements + a hidden capstone (2026-06-13 `/fun`, Opus 4.8, ultracode)

> **✅ COMPLETE & SHIPPED (2026-06-13).** All built, end-to-end QA PASS on a served origin, pushed.
> 9 feats on the Hall pieces → 3 surfaces (Hall ribbon N/9 · Survey "The Optician" constellation 41/41 ·
> hidden capstone **The Light Mixer** = Undercroft secret #12, unlocked by all 9). Worktrees + heartbeat
> retired, tree clean. This file is the build record; the head-pointer is NOTES.md.

*Brandon's nudge: "add earned badges from interacting — setting the perfect rainbow, centering the
spyglass, solving the mirror maze… or move some to the Undercroft." My call: DON'T move the public
pieces (the Hall is a complete public wing). Instead add **earned "Feats of Light"** + a **hidden
Undercroft capstone** for mastering them all. This deepens the metagame without hiding good public work.*

## The design
- Each of the **9 new Hall pieces** gets ONE meaningful, skill-based **feat**: doing the optics thing
  correctly (not just opening the page). On success it drops a raise-only breadcrumb
  **`ws:flag:earned-<flag>`** and shows a consistent gilt **"✦ Feat of Light earned"** toast. A small
  persistent **feat-goal chip** in each topbar states the goal + lights ✓ when earned (the on-ramp, per
  memory hidden-features-need-an-on-ramp).
- The **Hall index** gains a **"✦ Feats of Light — N/9 earned"** ribbon (reads `ws:flag:earned-*` from
  localStorage), listing earned feats; at 9/9 a faint hint toward the Undercroft (NOT a spelled-out map).
- **Survey of Heaven hook (Brandon, 2026-06-13):** the feats must ALSO feed the front-door star
  metagame. Plan: a new **Hall constellation** on the estate map — each earned feat **kindles a star**,
  and earning all 9 **completes a named asterism** (with a name + one-line myth, like the 6 companion-wing
  constellations), driven by the same `ws:flag:earned-*` flags. Touches `tools/sky/sky.js` (CATALOG +
  a feats-driven asterism; today the wings key off `ws:seen` pairs — add a feats group keyed off
  `ws:flag:earned-*`) + `index.src.html` render + the sky self-test (22/22 today) + forge. Keep POI
  label-overlaps at 0 (two-pass solver). **Read `tools/sky/sky.js` first** to mirror its asterism model.
- The **hidden capstone (Undercroft secret #12):** unlocked when all 9 feats earned — a new piece,
  **"The Light Mixer" / Newton's Wheel** (additive colour SYNTHESIS — spin a spectral disc → white;
  overlap RGB spotlights → secondaries+white — the recombination counterpart to the Spectroscope's
  analysis). Self-test: time-averaged disc colour integrates to near-neutral; additive mix laws exact.
  Add a `SECRETS` row to `undercroft/index.html`; raises the secret count **11 → 12** (update the hidden
  inventory in NOTES). **Test on a SERVED origin** (localStorage is origin-keyed; `file://` won't work).

## The 9 feats (flag = `ws:flag:earned-<flag>`)
| piece dir | flag | label | condition (skill) |
|---|---|---|---|
| rainbow | rainbow | Found the rainbow ray | land impact-param on the min-deviation (Descartes) ray (~42°) |
| halo | halo | Found the 22° halo | align ice-crystal ray to its 60°-prism minimum deviation (22°) |
| spyglass | spyglass | Brought it into focus | reach the in-focus/centered config (natural "focused" moment) |
| camera-obscura | camera | Found the sharpest pinhole | set pinhole within tol of the marked optimal d_opt |
| spectroscope | spectroscope | Read the spectrum | identify a line/element (align Hα to a mark, or name a source) |
| polariser | polariser | Crossed them to darkness | analyser to full extinction (θ≈90°, I≈0) [+revive via 3rd] |
| anamorphosis | anamorphosis | Resolved the mirror | align eye-height/radius so the reconstruction resolves |
| iridescence | iridescence | Matched the colour | tune film thickness/ring to a target colour/order |
| mirror-maze | maze | Solved the maze | genuine PLAYER solve (all gems lit, NOT "show solution") |

## Shared helper (every piece pastes this; consistent UX)
```js
function earnFeat(id,label){var k='ws:flag:earned-'+id,fresh=false;
  try{if(!localStorage.getItem(k)){localStorage.setItem(k,String(Date.now()));fresh=true;}}catch(e){}
  if(fresh)showFeatToast(label);}
function showFeatToast(label){var t=document.createElement('div');t.className='feat-toast';
  t.innerHTML='<span class="feat-star">✦</span> Feat of Light earned<br><b>'+label+'</b>';
  document.body.appendChild(t);requestAnimationFrame(function(){t.classList.add('show');});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},600);},3800);}
```

## Execution
- **Phase 1 (workflow `hall-feats-of-light`):** 9 worktree-isolated agents, each instruments one piece
  (shared helper + the feat condition + the goal-chip), browser-verifies the feat actually FIRES (drives
  the UI to meet the condition → sees the toast + confirms `localStorage['ws:flag:earned-<flag>']` set),
  keeps the self-test green + console clean, stages the final file to **`/tmp/feats-of-light/<id>.html`**,
  returns structured {dir,flag,earned_verified,selftest,console_clean,staged_path,notes}.
- **Lead integration:** copy each staged file onto main, commit, QA-sweep (all 9 feats fire).
- **Phase 2 (lead + 1 deputy):** Hall ribbon; build the hidden capstone piece; wire the Undercroft
  SECRETS unlock; **serve + test the full chain on an origin** (earn 9 → capstone reveals). Docs:
  NOTES (hidden inventory 11→12 + feats system), worklog, light README touch. Push. Retire worktrees +
  heartbeat. **Spoiler etiquette:** the capstone trail/contents stay OUT of the chat summary to Brandon.

## Resume hint
If interrupted: check `/tmp/feats-of-light/` for staged instrumented pieces + `git log`. NOTES head-pointer
reflects the prior clean Hall state (11 pieces shipped). This phase ADDS feats + 1 hidden secret.
