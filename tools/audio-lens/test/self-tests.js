/* ============================================================================
   Audio Lens — the 12 self-tests. The TRUST ANCHOR.
   Built-in signals have KNOWN ground truth; these assertions prove the
   analyzers recover them. Ported from web/index.html (TESTS / noStablePitch).

   Runs headless against the DSP core + generators. Fixed params:
     fftSize = 2048, hopSize = 512.

   Usage:
     node test/self-tests.js     → prints a table, exits 0 (all pass) / 1 (fail)
     node --test test/...        → also discovered as node:test cases
     import { runSelfTests }     → programmatic { passCount, total, rows }
   ============================================================================ */

import { pathToFileURL } from "node:url";
import { analyze } from "../src/analyzers.js";
import { SIGNALS, SR } from "../src/generators.js";

const fmt = (n, d) => (n == null || Number.isNaN(n)) ? "—" : Number(n).toFixed(d == null ? 1 : d);

// noise has no single dominant peak: check that top peak isn't hugely above the others
function noStablePitch(a) {
  if (a.peaks.length < 2) return a.f0 === null;
  // ratio of strongest to median peak — broadband noise → low ratio
  const mags = a.peaks.map(p => p.mag).sort((x, y) => y - x);
  return mags[0] / (mags[mags.length - 1] || 1e-9) < 4;
}

export const TESTS = [
  { sig: "sine440", check: "detected pitch = A4 (±30c)", exp: "A4 ±30c",
    run: a => { const n = a.monoNote; return { ok: !!(n && n.name === "A4" && Math.abs(n.cents) <= 30),
      measured: n ? `${n.name} ${n.cents >= 0 ? "+" : ""}${n.cents}c` : "none" }; } },
  { sig: "sine440", check: "centroid 440 (±20%)", exp: "352–528 Hz",
    run: a => ({ ok: a.centroid >= 352 && a.centroid <= 528, measured: `${fmt(a.centroid, 0)} Hz` }) },
  { sig: "sine440", check: "0 onsets", exp: "0",
    run: a => ({ ok: a.onsets.length === 0, measured: `${a.onsets.length}` }) },
  { sig: "sine440", check: "not clipping", exp: "no",
    run: a => ({ ok: !a.clipping, measured: a.clipping ? `${fmt(a.peak.clipPct, 2)}%` : "no" }) },

  { sig: "sine1000", check: "spectral peak 1000 (±3%)", exp: "970–1030 Hz",
    run: a => ({ ok: a.topPeakFreq >= 970 && a.topPeakFreq <= 1030, measured: `${fmt(a.topPeakFreq, 1)} Hz` }) },
  { sig: "sine1000", check: "pitch ≈ B5", exp: "B5",
    run: a => { const n = a.monoNote; return { ok: !!(n && n.name === "B5"), measured: n ? `${n.name} ${n.cents >= 0 ? "+" : ""}${n.cents}c` : "none" }; } },

  { sig: "triad", check: "peaks = {A4, C#5, E5}", exp: "{A4,C#5,E5}",
    run: a => {
      const set = new Set(a.peakNotes.map(p => p.name));
      const want = ["A4", "C#5", "E5"];
      const ok = want.every(w => set.has(w));
      return { ok, measured: "{" + a.peakNotes.map(p => p.name).join(",") + "}" };
    } },

  { sig: "clicks", check: "tempo 120 (±3)", exp: "117–123 BPM",
    run: a => ({ ok: a.tempo >= 117 && a.tempo <= 123, measured: `${fmt(a.tempo, 1)} BPM (${a.onsets.length} onsets)` }) },

  { sig: "chirp", check: "centroid rises (2nd>1st)", exp: "2nd half > 1st",
    run: a => ({ ok: a.centroid2 > a.centroid1, measured: `${fmt(a.centroid1, 0)}→${fmt(a.centroid2, 0)} Hz` }) },

  { sig: "noise", check: "centroid > 3 kHz", exp: ">3000 Hz",
    run: a => ({ ok: a.centroid > 3000, measured: `${fmt(a.centroid, 0)} Hz` }) },
  { sig: "noise", check: "no stable pitch", exp: "none / unstable",
    run: a => ({ ok: a.f0 === null || noStablePitch(a), measured: a.f0 ? `${fmt(a.f0, 0)} Hz?` : "none" }) },

  { sig: "clipped", check: "clipping flagged (>1%)", exp: ">1% clipped",
    run: a => ({ ok: a.clipping && a.peak.clipPct > 1, measured: `${fmt(a.peak.clipPct, 2)}%` }) },
];

/* ---------------------------------------------------------------------------
   Run all tests once. Renders + analyzes each unique signal once (cached).
   Returns { passCount, total, rows:[{signal,check,expected,measured,ok}] }.
   --------------------------------------------------------------------------- */
export function runSelfTests() {
  const fftSize = 2048, hopSize = 512;
  const cache = {};
  const sigIds = [...new Set(TESTS.map(t => t.sig))];
  for (const id of sigIds) {
    const samples = SIGNALS[id].make();
    cache[id] = analyze(samples, SR, fftSize, hopSize);
  }

  const rows = [];
  let passCount = 0;
  for (const t of TESTS) {
    let res;
    try { res = t.run(cache[t.sig]); }
    catch (e) { res = { ok: false, measured: "err: " + e.message }; }
    if (res.ok) passCount++;
    rows.push({
      signal: SIGNALS[t.sig].label,
      check: t.check,
      expected: t.exp,
      measured: res.measured,
      ok: res.ok,
    });
  }
  return { passCount, total: TESTS.length, rows };
}

/* ---------------------------------------------------------------------------
   Standalone runner: print the Signal/Check/Expected/Measured/Result table,
   exit nonzero on any failure.
   --------------------------------------------------------------------------- */
function printTableAndExit() {
  const { passCount, total, rows } = runSelfTests();
  const head = ["Signal", "Check", "Expected", "Measured", "Result"];
  const data = rows.map(t => [t.signal, t.check, t.expected, t.measured, t.ok ? "PASS" : "FAIL"]);
  const all = [head, ...data];
  const widths = head.map((_, c) => Math.max(...all.map(row => String(row[c]).length)));
  const sep = "  ";
  const fmtRow = (row) => row.map((cell, c) => String(cell).padEnd(widths[c])).join(sep);
  const out = [];
  out.push(fmtRow(head));
  out.push(widths.map(w => "-".repeat(w)).join(sep));
  for (const row of data) out.push(fmtRow(row));
  out.push("");
  out.push(`${passCount}/${total} passed` + (passCount === total ? "  — all green" : "  — SEE FAILURES"));
  process.stdout.write(out.join("\n") + "\n");
  process.exit(passCount === total ? 0 : 1);
}

/* ---------------------------------------------------------------------------
   node --test discovery: register one test case per assertion (lazily).
   Only registers when run under the node test runner.
   --------------------------------------------------------------------------- */
async function registerNodeTests() {
  const { test } = await import("node:test");
  const assert = (await import("node:assert/strict")).default;
  const fftSize = 2048, hopSize = 512;
  const cache = {};
  const sigIds = [...new Set(TESTS.map(t => t.sig))];
  for (const id of sigIds) cache[id] = analyze(SIGNALS[id].make(), SR, fftSize, hopSize);
  for (const t of TESTS) {
    test(`${t.sig}: ${t.check}`, () => {
      const res = t.run(cache[t.sig]);
      assert.ok(res.ok, `expected ${t.exp}, measured ${res.measured}`);
    });
  }
}

// Detect how we were invoked.
const runningUnderNodeTest =
  process.env.NODE_TEST_CONTEXT !== undefined ||
  process.argv.some(a => a === "--test") ||
  process.execArgv.some(a => a === "--test");

// Is THIS file the process entrypoint? (vs imported by bin/audio-lens.js)
const isEntrypoint = (() => {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(process.argv[1]).href; }
  catch { return false; }
})();

if (runningUnderNodeTest) {
  await registerNodeTests();
} else if (isEntrypoint) {
  // direct invocation: print the table and exit
  printTableAndExit();
}
// else: imported as a library (e.g. by the CLI) → do nothing on import.
