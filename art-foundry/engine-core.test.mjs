#!/usr/bin/env node
// ── Node twin for the art-foundry engine core ─────────────────────────────────
// Run: node art-foundry/engine-core.test.mjs   (exit 0 = all green). Pure logic.
// Guards the deterministic pieces engine.workflow.js inlines: the caps clamps, the
// MEDIA render recipes (path interpolation — where a typo silently blanks a render),
// and asset normalization.

import { CAPS, clampK, clampJudgeK, clampAssets, MEDIA, resolveMedium, normalizeAsset, normalizeBatch } from './engine-core.mjs'

let pass = 0, fail = 0
function ok(cond, msg) { if (cond) { pass++ } else { fail++; console.error('  ✗ ' + msg) } }
function throws(fn, msg) { try { fn(); fail++; console.error('  ✗ (expected throw) ' + msg) } catch (e) { pass++ } }

// ── caps ──────────────────────────────────────────────────────────────────────
ok(CAPS.maxK === 3, 'maxK is 3')
ok(CAPS.maxAssets === 15, 'maxAssets is 15')
ok(clampK(5) === 3, 'clampK(5) → 3 (cap)')
ok(clampK(1) === 1, 'clampK(1) → 1')
ok(clampK(0) === 1, 'clampK(0) → 1 (floor)')
ok(clampK(-2) === 1, 'clampK(-2) → 1 (floor)')
ok(clampK(2) === 2, 'clampK(2) → 2 (passthrough)')
ok(clampK('3') === 3, 'clampK numeric string → 3')
ok(clampK(undefined) === 1, 'clampK(undefined) → 1')
ok(clampK(NaN) === 1, 'clampK(NaN) → 1')
ok(clampJudgeK(9) === 3, 'clampJudgeK caps at 3')
ok(clampJudgeK(2) === 2, 'clampJudgeK(2) → 2')

// ── clampAssets ─────────────────────────────────────────────────────────────
const big = Array.from({ length: 20 }, (_, i) => ({ key: 'a' + i, title: 't' + i }))
const c = clampAssets(big)
ok(c.assets.length === 15, 'clampAssets trims 20 → 15')
ok(c.dropped === 5, 'clampAssets reports 5 dropped')
const small = clampAssets([{ key: 'x', title: 'x' }])
ok(small.assets.length === 1 && small.dropped === 0, 'clampAssets passes a small batch unchanged, 0 dropped')
ok(clampAssets(null).assets.length === 0, 'clampAssets(null) → empty, no throw')
ok(clampAssets(undefined).dropped === 0, 'clampAssets(undefined) → 0 dropped')

// ── MEDIA registry ────────────────────────────────────────────────────────────
ok(Object.keys(MEDIA).length === 3, 'three media registered')
ok(resolveMedium('visual-gate').proven === true, 'visual-gate is proven')
ok(resolveMedium('visual-exhibit').proven === false, 'visual-exhibit unproven (B3)')
ok(resolveMedium('sound').artifact === 'audio', 'sound artifact is audio')
throws(() => resolveMedium('nope'), 'unknown medium throws')

// ── visual-gate renderCommand — must match the proven render-take.sh invocation ─
const vgCtx = { contextRoot: '/tmp/gate-worktree', module: 'the-gate/scene.js', candidate: '/tmp/x/take-1.js', port: 8821, outdir: '/tmp/x/take-1/shots', scratch: '/tmp/x/scratch-1', extraQS: 'room=firmament' }
const vg = resolveMedium('visual-gate').renderCommand(vgCtx)
ok(vg.includes('GATE_SRC=/tmp/gate-worktree'), 'visual-gate sets GATE_SRC to contextRoot')
ok(vg.includes('/tmp/gate-worktree/gate-foundry/render-take.sh'), 'visual-gate calls render-take.sh at contextRoot')
ok(vg.includes('the-gate/scene.js') && vg.includes('/tmp/x/take-1.js') && vg.includes('8821') && vg.includes('/tmp/x/take-1/shots'), 'visual-gate interpolates module/candidate/port/outdir')
ok(vg.includes('"room=firmament"'), 'visual-gate appends quoted extraQS')
const vgNoQS = resolveMedium('visual-gate').renderCommand({ ...vgCtx, extraQS: null })
ok(!vgNoQS.includes('""') && !vgNoQS.trimEnd().endsWith('"'), 'visual-gate omits extraQS quotes when absent')
const vgArt = resolveMedium('visual-gate').judgeArtifacts('/tmp/x/final')
ok(vgArt.length === 3 && vgArt[0].endsWith('/idle-night.png') && vgArt[2].endsWith('/open-night.png'), 'visual-gate judge sees 3 named shots')

// ── visual-exhibit renderCommand — wraps a builder-supplied harness ─────────────
const ve = resolveMedium('visual-exhibit').renderCommand({ previewHarness: '/tmp/ex/preview.sh', candidate: '/tmp/ex/take-2.js', outdir: '/tmp/ex/out', port: 8990 })
ok(ve.includes('/tmp/ex/preview.sh') && ve.includes('/tmp/ex/take-2.js') && ve.includes('/tmp/ex/out') && ve.includes('8990'), 'visual-exhibit invokes the preview harness with candidate/outdir/port')
ok(resolveMedium('visual-exhibit').judgeArtifacts('/tmp/ex/out')[0].endsWith('/preview.png'), 'visual-exhibit judge sees preview.png')

// ── sound renderCommand — WAV render + audio-lens analysis ──────────────────────
const sc = resolveMedium('sound').renderCommand({ contextRoot: '/tmp/g', candidate: '/tmp/s/take.js', outdir: '/tmp/s/out' })
ok(sc.includes('/tmp/g/art-foundry/wav-bench.mjs'), 'sound defaults the WAV bench beside the engine')
ok(sc.includes('/tmp/s/take.js') && sc.includes('/tmp/s/out/asset.wav'), 'sound renders candidate → asset.wav')
ok(sc.includes('audio-lens') && sc.includes('/tmp/s/out/analysis.txt'), 'sound pipes the WAV through audio-lens → analysis.txt')
const scOverride = resolveMedium('sound').renderCommand({ contextRoot: '/tmp/g', candidate: '/c.js', outdir: '/o', wavBench: '/custom/bench.mjs' })
ok(scOverride.includes('/custom/bench.mjs') && !scOverride.includes('art-foundry/wav-bench.mjs'), 'sound honors a ctx.wavBench override')
const sArt = resolveMedium('sound').judgeArtifacts('/o')
ok(sArt.length === 2 && sArt[0].endsWith('/asset.wav') && sArt[1].endsWith('/analysis.txt'), 'sound judge gets the WAV + the analysis')

// ── normalizeAsset ──────────────────────────────────────────────────────────
const na = normalizeAsset({ id: 'firmament-rep', title: 'The Firmament rep', K: 5, judgeK: 9, brief: 'an armillary', aspect: 'vertical' })
ok(na.key === 'firmament-rep', 'normalizeAsset takes id as key')
ok(na.K === 3, 'normalizeAsset clamps K 5 → 3')
ok(na.judgeK === 3, 'normalizeAsset clamps judgeK 9 → 3')
ok(na.title === 'The Firmament rep', 'normalizeAsset keeps the title')
ok(normalizeAsset({ key: 'k', title: 't' }).K === 3, 'normalizeAsset defaults K to maxK when absent')
ok(normalizeAsset({ key: 'k', title: 't' }).judgeK === 2, 'normalizeAsset defaults judgeK to 2')
throws(() => normalizeAsset(null), 'normalizeAsset(null) throws')
throws(() => normalizeAsset([]), 'normalizeAsset(array) throws')
throws(() => normalizeAsset({ title: 'no key' }), 'normalizeAsset without key/id throws')
throws(() => normalizeAsset({ key: 'k' }), 'normalizeAsset without title throws')

// ── normalizeBatch ──────────────────────────────────────────────────────────
const nb = normalizeBatch(Array.from({ length: 18 }, (_, i) => ({ key: 'a' + i, title: 'T' + i, K: 2 })))
ok(nb.assets.length === 15 && nb.dropped === 3, 'normalizeBatch clamps to 15 + reports 3 dropped')
ok(nb.assets.every(a => a.K === 2), 'normalizeBatch normalizes every asset')

if (fail) { console.error(`\n✗ engine-core.test.mjs: ${fail} FAILED, ${pass} passed`); process.exit(1) }
console.log(`\n✓ engine-core.test.mjs: ${pass}/${pass} passed`)
