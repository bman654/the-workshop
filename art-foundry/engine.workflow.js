export const meta = {
  name: 'art-foundry',
  description: 'General in-house art-asset engine: per-asset K takes -> judges -> synth, any medium (visual/sound)',
  phases: [
    { title: 'forge', detail: 'build each asset in the batch: K takes -> judges -> synth into the live tree' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════════
   ART FOUNDRY ENGINE — the ONE general child workflow fun-forever calls to forge
   in-house creative assets (gate reps, exhibit visuals, ambience sounds). Same
   proven loop per asset: K takes -> judges -> synth. The MEDIUM supplies how a
   candidate renders into artifacts + what the judge consumes.

   args (object): {
     medium:        'visual-gate' | 'visual-exhibit' | 'sound'   (default 'visual-gate')
     contextRoot:   repo root holding the-gate/, tools/, art-foundry/  (default /tmp/gate-worktree)
     assets:        [ assetSpec ]  — batch (clamped to <=15). assetSpec: {key|id, title, K, judgeK,
                    brief, geometry?, judgeFocus, module?, drawFn?, siblings?, extraQS?, iface?, wireNote?,
                    durSec? (sound), previewHarness? (visual-exhibit, per-asset override)}
     previewHarness: (visual-exhibit) path to a builder-supplied render harness, OR per-asset on the spec
                    (sound needs none — art-foundry/render-wav.sh + sfx-bench.html are the universal bench)
     outRoot:       scratch root for takes/shots (default /tmp/art-foundry)
   }
   B0 LOCK: this is a CHILD workflow — it must NOT call workflow() (nesting throws). It builds via
   agent()/parallel() only; fun-forever (top level) is the sole workflow() caller.
   ═══════════════════════════════════════════════════════════════════════════ */

let _raw = args
if (typeof _raw === 'string') { try { _raw = JSON.parse(_raw) } catch (e) { _raw = {} } }
const A = (_raw && typeof _raw === 'object' && !Array.isArray(_raw)) ? _raw : {}
const CONTEXT_ROOT = A.contextRoot || '/tmp/gate-worktree'
const MEDIUM_ID = A.medium || 'visual-gate'
const OUT_ROOT = A.outRoot || '/tmp/art-foundry'

// ── INLINE MIRROR of art-foundry/engine-core.mjs (KEEP IN SYNC — workflows can't import) ──
const CAPS = { maxK: 3, maxAssets: 15 }
function clampK(k) { const n = Math.floor(Number(k)); return Number.isFinite(n) ? Math.max(1, Math.min(CAPS.maxK, n)) : 1 }
function clampJudgeK(k) { const n = Math.floor(Number(k)); return Number.isFinite(n) ? Math.max(1, Math.min(CAPS.maxK, n)) : 1 }
function clampAssets(list) { const arr = Array.isArray(list) ? list : []; return { assets: arr.slice(0, CAPS.maxAssets), dropped: Math.max(0, arr.length - CAPS.maxAssets) } }
const MEDIA = {
  'visual-gate': {
    id: 'visual-gate', label: 'visual — a gate-scene asset (SVG draw fn in the front-door gate)', artifact: 'image', proven: true,
    renderCommand(ctx) { const qs = ctx.extraQS ? ` "${ctx.extraQS}"` : ''; return `GATE_SRC=${ctx.contextRoot} gtimeout 150 bash ${ctx.contextRoot}/gate-foundry/render-take.sh ${ctx.scratch} ${ctx.module} ${ctx.candidate} ${ctx.port} ${ctx.outdir}${qs}` },
    judgeArtifacts(outdir) { return [`${outdir}/idle-night.png`, `${outdir}/idle-day.png`, `${outdir}/open-night.png`] },
    judgeVerb: 'VIEW (Read) every PNG shot',
  },
  'visual-exhibit': {
    id: 'visual-exhibit', label: 'visual — an exhibit asset rendered in ITS OWN context via a builder-supplied preview harness', artifact: 'image', proven: false,
    renderCommand(ctx) { return `bash ${ctx.previewHarness} ${ctx.candidate} ${ctx.outdir} ${ctx.port}` },
    judgeArtifacts(outdir) { return [`${outdir}/preview.png`] },
    judgeVerb: 'VIEW (Read) every preview shot rendered in the exhibit context',
  },
  'sound': {
    id: 'sound', label: 'sound — a WebAudio asset rendered offline to WAV, judged via the audio-lens analysis', artifact: 'audio', proven: true,
    renderCommand(ctx) { const dur = ctx.durSec ? ` ${ctx.durSec}` : ''; return `GATE_SRC=${ctx.contextRoot} gtimeout 200 bash ${ctx.contextRoot}/art-foundry/render-wav.sh ${ctx.scratch} ${ctx.candidate} ${ctx.port} ${ctx.outdir}${dur}` },
    judgeArtifacts(outdir) { return [`${outdir}/asset.wav`, `${outdir}/analysis.txt`] },
    judgeVerb: 'READ the audio-lens analysis (you cannot hear — the analysis IS how you judge) + note the WAV path',
  },
}
function resolveMedium(id) { const m = MEDIA[id]; if (!m) throw new Error(`unknown medium '${id}' — known: ${Object.keys(MEDIA).join(', ')}`); return m }
function normalizeAsset(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Error('asset spec must be an object')
  const key = spec.key || spec.id
  if (!key) throw new Error('asset spec needs a key or id')
  if (!spec.title) throw new Error(`asset '${key}' needs a title`)
  return { key, title: spec.title, K: clampK(spec.K ?? CAPS.maxK), judgeK: clampJudgeK(spec.judgeK ?? 2), tier: spec.tier || 'ASSET', brief: spec.brief || '', geometry: spec.geometry || '', judgeFocus: spec.judgeFocus || '', module: spec.module || null, drawFn: spec.drawFn || null, siblings: spec.siblings || null, extraQS: spec.extraQS || null, iface: spec.iface || null, wireNote: spec.wireNote || null, durSec: Number.isFinite(Number(spec.durSec)) && Number(spec.durSec) > 0 ? Number(spec.durSec) : null, previewHarness: spec.previewHarness || null }
}
function normalizeBatch(list) { const { assets, dropped } = clampAssets(list); return { assets: assets.map(normalizeAsset), dropped } }
// ── END MIRROR ────────────────────────────────────────────────────────────────

const MEDIUM = resolveMedium(MEDIUM_ID)

// ── prompt builders — thin POINTERS to art-foundry/prompts/*.md + a JSON context ──
// (workflow scripts can't read files; every SUBAGENT can — same pattern as fun-forever's seatPrompt.)
function preamble(promptFile) {
  return [
    'You are ONE seat in The Orrery Estate\'s in-house ART FOUNDRY (cwd = the repo root,',
    '/Users/brandon/dev/general/creative-space). FIRST read this file IN FULL with the Read tool and follow it',
    'as your standing instructions, THEN act on the JSON context below:',
    '  • art-foundry/prompts/' + promptFile + '   — your foundry role brief (medium-aware)',
    'ALWAYS-ON SAFETY: you are a workflow subagent with NO Agent/Task tool — do your OWN work this turn, never',
    'delegate, never release the turn or arm a Monitor (it ends your run + loses uncommitted work). Stay in the',
    'repo + /tmp; never edit CLAUDE.md; test only on a SERVED origin, never file://.',
  ].join('\n')
}

function mediumCtxFor(asset, paths) {
  return { contextRoot: CONTEXT_ROOT, module: asset.module, candidate: paths.candidate, port: paths.port, outdir: paths.outdir, scratch: paths.scratch, extraQS: asset.extraQS, previewHarness: asset.previewHarness || A.previewHarness, durSec: asset.durSec }
}

function takePrompt(asset, i, paths) {
  const mctx = mediumCtxFor(asset, paths)
  return [
    preamble('foundry-smith.md'), '',
    'ROLE: FOUNDRY SMITH — take #' + i + ' of ' + asset.K + ' for "' + asset.title + '" (medium: ' + MEDIUM.id + ').', '',
    'YOUR CONTEXT for this take (JSON — the foundry-smith.md brief refers to these fields):',
    JSON.stringify({
      take: i, of: asset.K, medium: MEDIUM.id, mediumLabel: MEDIUM.label, artifactKind: MEDIUM.artifact,
      contextRoot: CONTEXT_ROOT, asset,
      paths: { candidate: paths.candidate, scratch: paths.scratch, outdir: paths.outdir, port: paths.port },
      renderCommand: MEDIUM.renderCommand(mctx),
      judgeArtifacts: MEDIUM.judgeArtifacts(paths.outdir),
      previewHarness: mctx.previewHarness || null,
    }, null, 2),
  ].join('\n')
}

function judgePrompt(asset, takes, n) {
  const list = takes.map(t => `  TAKE ${t.take}: candidate=${t.candidatePath}\n    artifacts: ${(t.artifacts || []).join(' , ')}` +
    (t.animated && t.animShots && t.animShots.length ? `\n    MOTION frames (this take ANIMATES — view ALL): ${t.animShots.join(' , ')}` : '') +
    `\n    self-notes: ${t.notes}`).join('\n')
  return [
    preamble('foundry-judge.md'), '',
    'ROLE: FOUNDRY JUDGE #' + n + ' for "' + asset.title + '" (medium: ' + MEDIUM.id + '). Judge BLIND of identity — only the art.', '',
    'YOUR CONTEXT (JSON):',
    JSON.stringify({
      judge: n, medium: MEDIUM.id, artifactKind: MEDIUM.artifact, judgeVerb: MEDIUM.judgeVerb,
      contextRoot: CONTEXT_ROOT, asset: { key: asset.key, title: asset.title, tier: asset.tier, brief: asset.brief, judgeFocus: asset.judgeFocus },
      takes: takes.map(t => ({ take: t.take, candidatePath: t.candidatePath, artifacts: t.artifacts, animated: t.animated, animShots: t.animShots, notes: t.notes })),
    }, null, 2), '',
    'THE TAKES:', list,
  ].join('\n')
}

function synthPrompt(asset, takes, judges, paths) {
  const mctx = mediumCtxFor(asset, { ...paths, candidate: '-' }) // synth renders from the LIVE tree after install
  return [
    preamble('foundry-synth.md'), '',
    'ROLE: FOUNDRY SYNTHESIZER + final builder for "' + asset.title + '" (medium: ' + MEDIUM.id + ').', '',
    'YOUR CONTEXT (JSON):',
    JSON.stringify({
      medium: MEDIUM.id, artifactKind: MEDIUM.artifact, contextRoot: CONTEXT_ROOT, asset,
      takes: takes.map(t => ({ take: t.take, candidatePath: t.candidatePath, artifacts: t.artifacts, notes: t.notes, animated: t.animated })),
      judges: judges.map((j, k) => ({ judge: k + 1, winner: j.winner, graftNotes: j.graftNotes, verdict: j.overallVerdict })),
      paths: { outdir: paths.outdir, scratch: paths.scratch, port: paths.port },
      finalRenderCommand: MEDIUM.renderCommand(mctx),
      judgeArtifacts: MEDIUM.judgeArtifacts(paths.outdir),
    }, null, 2),
  ].join('\n')
}

// ── schemas (generalized over media — artifacts is a path list, not gate-specific shots) ──
const TAKE_SCHEMA = {
  type: 'object',
  properties: {
    take: { type: 'integer' }, candidatePath: { type: 'string' },
    artifacts: { type: 'array', items: { type: 'string' }, description: 'the rendered artifact paths a judge consumes (e.g. the 3 PNGs, or the WAV + analysis.txt).' },
    iterations: { type: 'integer' }, interfacePreserved: { type: 'boolean' },
    animated: { type: 'boolean' }, animShots: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['take', 'candidatePath', 'artifacts', 'interfacePreserved', 'notes'],
}
const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    ranking: { type: 'array', items: { type: 'object', properties: { take: { type: 'integer' }, score: { type: 'number' }, strengths: { type: 'string' }, weaknesses: { type: 'string' } }, required: ['take', 'score', 'strengths', 'weaknesses'] } },
    winner: { type: 'integer' }, graftNotes: { type: 'string' }, overallVerdict: { type: 'string' },
  },
  required: ['ranking', 'winner', 'graftNotes', 'overallVerdict'],
}
const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    artifacts: { type: 'array', items: { type: 'string' }, description: 'the FINAL rendered artifact paths (the deliverables).' },
    interfacePreserved: { type: 'boolean' }, forgeClean: { type: 'boolean' },
    changesFromWinner: { type: 'string' }, summary: { type: 'string' },
  },
  required: ['artifacts', 'interfacePreserved', 'summary'],
}

function range(n) { return Array.from({ length: n }, (_, k) => k + 1) }

async function buildAsset(asset, assetIdx) {
  const base = 8820 + assetIdx * 10
  const dir = `${OUT_ROOT}/${asset.key}`
  phase('forge')
  log(`=== ${asset.key} (${asset.tier}, medium=${MEDIUM.id}, K=${asset.K}) — forging ${asset.K} takes ===`)
  const takes = (await parallel(range(asset.K).map(i => () =>
    agent(takePrompt(asset, i, { candidate: `${dir}/take-${i}.js`, scratch: `${dir}/scratch-${i}`, outdir: `${dir}/take-${i}/out`, port: base + i }),
      { label: `${asset.key}:take-${i}`, phase: 'forge', schema: TAKE_SCHEMA, agentType: 'general-purpose', effort: 'high' })
  ))).filter(Boolean)
  if (takes.length === 0) { log(`${asset.key}: NO takes returned — skipping`); return { asset: asset.key, status: 'FAILED-takes' } }

  const judges = (await parallel(range(asset.judgeK).map(n => () =>
    agent(judgePrompt(asset, takes, n), { label: `${asset.key}:judge-${n}`, phase: 'forge', schema: JUDGE_SCHEMA, agentType: 'general-purpose', effort: 'high' })
  ))).filter(Boolean)
  const safeJudges = judges.length ? judges : [{ winner: takes[0].take, graftNotes: '(no judge returned)', overallVerdict: '' }]
  log(`${asset.key}: winners = ${safeJudges.map(j => 't' + j.winner).join(', ')}`)

  const final = await agent(synthPrompt(asset, takes, safeJudges, { outdir: `${dir}/final`, scratch: `${dir}/final-scratch`, port: base + 9 }),
    { label: `${asset.key}:synth`, phase: 'forge', schema: FINAL_SCHEMA, agentType: 'general-purpose', effort: 'high' })
  log(`${asset.key}: synth done — forgeClean=${final?.forgeClean} interfacePreserved=${final?.interfacePreserved}`)
  return { asset: asset.key, takes: takes.map(t => ({ take: t.take, iterations: t.iterations, artifacts: t.artifacts, notes: t.notes })), judges: safeJudges, final }
}

// ── run ─────────────────────────────────────────────────────────────────────
const { assets, dropped } = normalizeBatch(A.assets)
if (dropped > 0) log(`⚠️ asset batch clamped to ${CAPS.maxAssets} — ${dropped} asset(s) DROPPED (build fewer, richer assets)`)
if (assets.length === 0) { log('art-foundry: no assets in the batch — nothing to forge'); return { status: 'NO-ASSETS', medium: MEDIUM.id, built: [] } }
log(`art-foundry: forging ${assets.length} asset(s) in medium '${MEDIUM.id}' (context ${CONTEXT_ROOT})`)

// Build each asset through its full take->judge->synth chain. pipeline() so asset B's takes can start
// while asset A is still judging/synthesizing (no barrier); each chain is one buildAsset call.
const results = await pipeline(assets.map((a, i) => ({ a, i })),
  ({ a, i }) => buildAsset(a, i)
)
return { status: 'DONE', medium: MEDIUM.id, built: assets.map(a => a.key), dropped, results: results.filter(Boolean) }
