/* ═══════════════════════════════════════════════════════════════════════════
   ART FOUNDRY — engine-core.mjs
   The TESTED pure core of the general in-house art-asset engine.

   The engine builds ANY in-house creative asset (a gate rep, an exhibit's fish,
   an ambience sound) by the same proven loop: K takes → judges → synth. What
   DIFFERS per asset is the MEDIUM — how a candidate is RENDERED into artifacts
   and what the JUDGE consumes. This module holds the medium registry, the render
   recipes, the caps, and asset normalization — the deterministic pieces worth a
   Node twin (engine-core.test.mjs).

   ── KEEP IN SYNC ────────────────────────────────────────────────────────────
   Workflow scripts cannot `import`, so art-foundry/engine.workflow.js INLINES a
   MIRROR of MEDIA + the helpers below. If you change one, change BOTH and re-run
   engine-core.test.mjs. (The house inline-the-core + Node-twin idiom — same as
   gate-foundry/rep-spec.mjs ↔ the inline templating in the foundry workflow.)
   ═══════════════════════════════════════════════════════════════════════════ */

// ── CAPS (Brandon, Adjustment 6): generous on purpose, but bounded. ───────────
export const CAPS = {
  maxK: 3,        // at most 3 takes per art asset (complex → up to 3; simple → 1)
  maxAssets: 15,  // at most 15 art assets per build ("fewer, richer" > "many shallow")
}

export function clampK(k) {
  const n = Math.floor(Number(k))
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.min(CAPS.maxK, n))
}

export function clampJudgeK(k) {
  const n = Math.floor(Number(k))
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.min(CAPS.maxK, n))
}

// Trim an asset batch to the cap; report how many were dropped so the caller can LOG it
// (a silent truncation reads as "built everything" when it didn't — Adjustment 6 / no-silent-caps).
export function clampAssets(list) {
  const arr = Array.isArray(list) ? list : []
  return { assets: arr.slice(0, CAPS.maxAssets), dropped: Math.max(0, arr.length - CAPS.maxAssets) }
}

// ── MEDIA registry — each medium says how a take RENDERS + what the JUDGE reads. ─
// renderCommand(ctx) returns the bash a smith/synth runs to turn a candidate into
// artifacts. ctx fields: contextRoot, module, candidate ('-' = render from the live
// tree), port, outdir, scratch, extraQS, previewHarness, wavBench.
export const MEDIA = {
  'visual-gate': {
    id: 'visual-gate',
    label: 'visual — a gate-scene asset (SVG draw fn in the front-door gate)',
    artifact: 'image',
    proven: true, // lifted verbatim from the shipped gate-foundry/foundry.workflow.js
    renderCommand(ctx) {
      const qs = ctx.extraQS ? ` "${ctx.extraQS}"` : ''
      return `GATE_SRC=${ctx.contextRoot} gtimeout 150 bash ${ctx.contextRoot}/gate-foundry/render-take.sh `
        + `${ctx.scratch} ${ctx.module} ${ctx.candidate} ${ctx.port} ${ctx.outdir}${qs}`
    },
    judgeArtifacts(outdir) { return [`${outdir}/idle-night.png`, `${outdir}/idle-day.png`, `${outdir}/open-night.png`] },
    judgeVerb: 'VIEW (Read) every PNG shot',
  },
  'visual-exhibit': {
    id: 'visual-exhibit',
    label: 'visual — an exhibit asset, rendered in ITS OWN context via a builder-supplied preview harness',
    artifact: 'image',
    proven: false, // first exercised in B3 (exhibit-art flow)
    renderCommand(ctx) {
      // previewHarness: a builder-supplied script that renders the asset slot IN the exhibit → preview.png in outdir.
      // It receives (candidate, outdir, port) so it can swap the candidate art into the slot and screenshot it.
      return `bash ${ctx.previewHarness} ${ctx.candidate} ${ctx.outdir} ${ctx.port}`
    },
    judgeArtifacts(outdir) { return [`${outdir}/preview.png`] },
    judgeVerb: 'VIEW (Read) every preview shot rendered in the exhibit context',
  },
  'sound': {
    id: 'sound',
    label: 'sound — a WebAudio asset rendered offline to WAV, judged via the audio-lens analysis',
    artifact: 'audio',
    proven: true, // B3: lifts the proven the-gate/audio-bench.html flow; an agent can't hear → judges the analysis
    renderCommand(ctx) {
      // OfflineAudioContext is BROWSER-only, so the candidate cannot render in pure Node. render-wav.sh
      // is the audio analog of render-take.sh: it serves art-foundry/sfx-bench.html with the candidate
      // copied in, renders the WebAudio offline to a WAV via agent-browser, then runs the in-house
      // audio-lens CLI to write analysis.txt — the spectral/level report the (deaf) judge READS.
      const dur = ctx.durSec ? ` ${ctx.durSec}` : '' // render-wav.sh defaults to 3s when omitted
      return `GATE_SRC=${ctx.contextRoot} gtimeout 200 bash ${ctx.contextRoot}/art-foundry/render-wav.sh `
        + `${ctx.scratch} ${ctx.candidate} ${ctx.port} ${ctx.outdir}${dur}`
    },
    judgeArtifacts(outdir) { return [`${outdir}/asset.wav`, `${outdir}/analysis.txt`] },
    judgeVerb: 'READ the audio-lens analysis (you cannot hear — the analysis IS how you judge) + note the WAV path',
  },
}

export function resolveMedium(id) {
  const m = MEDIA[id]
  if (!m) throw new Error(`unknown medium '${id}' — known: ${Object.keys(MEDIA).join(', ')}`)
  return m
}

// ── normalizeAsset — validate + clamp one asset spec the engine will build. ───
// Accepts both the gate-rep spec shape ({id/key, title, K, brief, geometry, judgeFocus,
// module, drawFn, siblings, extraQS, iface}) and a leaner exhibit-art spec.
export function normalizeAsset(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Error('asset spec must be an object')
  const key = spec.key || spec.id
  if (!key) throw new Error('asset spec needs a key or id')
  if (!spec.title) throw new Error(`asset '${key}' needs a title`)
  return {
    key,
    title: spec.title,
    K: clampK(spec.K ?? CAPS.maxK),
    judgeK: clampJudgeK(spec.judgeK ?? 2),
    tier: spec.tier || 'ASSET',
    brief: spec.brief || '',
    geometry: spec.geometry || '',
    judgeFocus: spec.judgeFocus || '',
    module: spec.module || null,
    drawFn: spec.drawFn || null,
    siblings: spec.siblings || null,
    extraQS: spec.extraQS || null,
    iface: spec.iface || null,
    wireNote: spec.wireNote || null, // exhibit-art: how this asset wires into the system
    specFile: spec.specFile || null, // exhibit-art: path to the full asset contract (read by smith/judge/synth) — the deliverable is CODE, not a wav/png
    durSec: Number.isFinite(Number(spec.durSec)) && Number(spec.durSec) > 0 ? Number(spec.durSec) : null, // sound: render length (s); render-wav.sh defaults 3
    previewHarness: spec.previewHarness || null, // visual-exhibit/sound: a per-asset render harness override
  }
}

// Normalize a whole batch: clamp to ≤15 + normalize each. Returns {assets, dropped}.
export function normalizeBatch(list) {
  const { assets, dropped } = clampAssets(list)
  return { assets: assets.map(normalizeAsset), dropped }
}
