# Landmines

Every one of these cost a maker a real debug cycle. Two minutes here saves an hour.
Nothing else is required reading.

### Before you build

- **Grep [HIDDEN.md](HIDDEN.md) first.** There are 21 secrets with no route from the map.
  A full Enigma machine was once nearly rebuilt from scratch because the maker didn't
  know `undercroft/enigma.html` already existed. Also check [INDEX.md](INDEX.md).

### Forged pages (`*.src.html` → `*.html`)

- Edit the **`.src.html`**, never the built `.html`. Then
  `node tools/forge/forge.mjs <file>.src.html`. Verify everything with
  `node tools/forge/forge.mjs --check --all`.
- Editing a shared include (e.g. `tools/ws/ws.js`) re-stales every page that inlines it →
  `forge.mjs --all`.
- **Never put an HTML comment (`<!-- -->`) in or around a `forge:include` directive.** It
  lands *inside* the generated `<script>` and silently kills the entire inlined script —
  no console error, headless included. Use `/* */`. Diagnose by `node --check`-ing the
  extracted script.

### Verifying in a browser

- **A synthetic click lies.** `element.click()` and `dispatchEvent` are blind to
  pointer-capture and hit-testing — they report success on a build that is genuinely
  broken for a human. Verify with a true input-level click (agent-browser `click`, CDP).
- **Don't navigate from a `click` on an SVG `<g>`.** The pointerdown and pointerup
  hit-targets differ, so the bubbled `click` fires on an ancestor. Navigate from
  `pointerup` / `endDrag`.
- **Headless cannot deliver a pointer event to a canvas.** Any liveness check that waits
  on a canvas tap never fires, so a dead interaction sails through green. Call the piece's
  real entry function directly and assert the state changed.
- `python -m http.server` sends no cache headers, so Chrome serves you the *old* HTML after
  a re-forge. Cache-bust with `?v=N`.

### Estate-wide conventions

- **One mute for the whole estate:** the single shared key `ws:pref:muted` via `WS`. Never
  invent a per-page mute. (Companion sound prefs: `ws:pref:air`, `ws:pref:air-bg`.)
- **A new front-door page must drop its `ws:seen:<id>` breadcrumb** — it's the only food the
  sky's star-per-room survey gets. Forgetting it is always a bug.
- **The map is declarative — never pixels.** A room declares `{district, tier, wing}` and
  `tools/layout/layout.js` owns every coordinate. Before any map screenshot, run
  `node tools/layout/reveal-all-secrets.js` or the hidden features won't compose.
- **A new wing needs its `bornCycle` in `tabularium/core.mjs`'s `WINGS` table**, or it never
  appears in the estate-raising animation.
- `sound-garden/pitch-core.mjs` is the **sole** pitch authority. Don't fork it.
- For a new combinatorial game, reuse `tools/game/adversary.js` + a `tools/game/games/` def.
  Don't fork the engine.
- A page that reads the ledger enrolls in auto-maintenance by shipping a
  `<room>/reclaim.mjs`. Ship that file and the seal keeps it current forever; skip it and
  your counts silently freeze.

### Git

- This repo pushes over **HTTPS + the gh credential helper** (set repo-locally in
  `.git/config`); SSH has no key in agent sessions. `git push origin main` works as-is.
- The seal's push **fails open** on purpose — a locked 1Password must never fail a cycle.
  A later push carries pending commits up. A *non-fast-forward reject* is the one case
  that needs a hand.
