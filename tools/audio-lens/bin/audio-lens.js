#!/usr/bin/env node
/* ============================================================================
   Audio Lens — headless, zero-dependency audio analysis CLI.
   The screenshot-equivalent for sound: render/inspect audio as numbers + a
   spectrogram PNG you can screenshot-read. Verify generated audio: in tune?
   right tempo? clipping? silent?
   ============================================================================ */

import { writeFileSync } from "node:fs";
import { analyze, hzToNote } from "../src/analyzers.js";
import { SIGNALS, SR } from "../src/generators.js";
import { readWav, writeWav } from "../src/wav.js";
import { spectrogramPng, waveformPng, rmsPng } from "../src/render.js";
import { runSelfTests } from "../test/self-tests.js";

const SIGNAL_IDS = Object.keys(SIGNALS);

/* ---- minimal argv parser (no dependency) ---------------------------------- */
function parseArgs(argv) {
  const out = { _: [], flags: {} };
  // flags that take a value
  const valueFlags = new Set([
    "--signal", "--fft", "--hop", "--silence-db", "--resample",
    "--spectrogram", "--waveform", "--rms-png", "--write-wav",
  ]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h") {
      out.flags["--help"] = true;
    } else if (a.startsWith("--")) {
      if (valueFlags.has(a)) {
        const v = argv[i + 1];
        if (v === undefined) die(`flag ${a} requires a value`);
        out.flags[a] = v;
        i++;
      } else {
        out.flags[a] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function die(msg, code = 2) {
  process.stderr.write("audio-lens: " + msg + "\n");
  process.exit(code);
}

function usage() {
  return `audio-lens — headless, zero-dependency audio analyzer

USAGE
  audio-lens analyze <file.wav> [flags]      full JSON analysis of a WAV
  audio-lens analyze --signal <id> [flags]   analyze a built-in test signal
  audio-lens self-test [--json]              run the 12 self-tests (trust anchor)

SIGNAL IDS
  ${SIGNAL_IDS.join("  ")}

GLOBAL FLAGS
  --signal <id>          use a built-in signal instead of a WAV file
  --fft <1024|2048|4096> FFT size (default 2048)
  --hop <256|512|1024>   hop size (default 512)
  --silence-db <dBFS>    silence threshold for silence-ratio (default -60)
  --resample <hz>        opt-in resample to <hz> (default: native rate)
  --json                 JSON output (default)
  --human                terse human-readable output

IMAGE FLAGS (each takes an output path)
  --spectrogram <png>    write a log-frequency spectrogram PNG
  --waveform <png>       write a waveform PNG
  --rms-png <png>        write an RMS/loudness PNG

QUERY FLAGS (print just the answer)
  --clips                is it clipping?
  --silence-ratio        fraction of (near-)silent samples
  --pitch                monophonic pitch / note
  --tempo                tempo (BPM) from onsets
  --centroid             spectral centroid (Hz)
  --peaks                top-3 spectral peaks as notes
  --peak                 peak level (dBFS)
  --rms                  mean RMS (dBFS)

UTILITY
  --write-wav <path>     write the (signal/resampled) samples to a 16-bit WAV

EXAMPLES
  audio-lens self-test
  audio-lens analyze --signal sine440 --pitch
  audio-lens analyze song.wav --tempo --human
  audio-lens analyze --signal chirp --spectrogram /tmp/chirp.png
`;
}

/* ---- naive linear resampler (opt-in) -------------------------------------- */
function resampleLinear(samples, srcRate, dstRate) {
  if (srcRate === dstRate) return samples;
  const ratio = dstRate / srcRate;
  const outLen = Math.max(1, Math.round(samples.length * ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = i / ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(samples.length - 1, i0 + 1);
    const f = srcPos - i0;
    out[i] = samples[i0] * (1 - f) + samples[i1] * f;
  }
  return out;
}

/* ---- formatting helpers --------------------------------------------------- */
function r(n, d = 1) {
  if (n == null || Number.isNaN(n)) return null;
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}
function noteStr(note, f0) {
  if (!note) return "none";
  const cents = `${note.cents >= 0 ? "+" : ""}${note.cents}c`;
  return `${note.name} ${cents} (${r(f0, 1)} Hz)`;
}

function printJson(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

/* ---- query-flag handlers -------------------------------------------------- */
const QUERIES = {
  "--clips": (a, human) => {
    const json = { clips: a.clipping, clipPct: r(a.peak.clipPct, 2), clipped: a.peak.clipped };
    const text = a.clipping ? `yes ${r(a.peak.clipPct, 2)}%` : "no";
    return { json, text };
  },
  "--silence-ratio": (a, human) => {
    const json = { silenceRatio: r(a.silenceRatio, 4), silenceDb: a.silenceDb };
    return { json, text: a.silenceRatio.toFixed(3) };
  },
  "--pitch": (a, human) => {
    if (!a.f0 || !a.monoNote) return { json: { f0: null }, text: "none" };
    const json = { f0: r(a.f0, 1), note: a.monoNote.name, cents: a.monoNote.cents };
    return { json, text: noteStr(a.monoNote, a.f0) };
  },
  "--tempo": (a, human) => {
    if (!a.tempo) return { json: { tempo: null, onsets: a.onsets.length }, text: "none" };
    const json = { tempo: r(a.tempo, 1), onsets: a.onsets.length };
    return { json, text: `${r(a.tempo, 1)} BPM` };
  },
  "--centroid": (a, human) => {
    const json = { centroid: r(a.centroid, 1), firstHalf: r(a.centroid1, 1), secondHalf: r(a.centroid2, 1) };
    return { json, text: `${r(a.centroid, 0)} Hz` };
  },
  "--peaks": (a, human) => {
    const peaks = a.peakNotes.map(p => ({ freq: r(p.freq, 1), note: p.name, cents: p.cents }));
    const json = { peaks };
    const text = peaks.length
      ? peaks.map(p => `${p.note}${p.cents >= 0 ? "+" : ""}${p.cents}c`).join(" ")
      : "none";
    return { json, text };
  },
  "--peak": (a, human) => {
    const json = { peakDb: r(a.peak.peakDb, 2) };
    return { json, text: `${r(a.peak.peakDb, 1)} dBFS` };
  },
  "--rms": (a, human) => {
    const json = { meanRms: r(a.meanRms, 2) };
    return { json, text: `${r(a.meanRms, 1)} dBFS` };
  },
};

/* ---- full analyze JSON (heavy arrays dropped) ----------------------------- */
function fullJson(a) {
  return {
    sampleRate: a.sampleRate,
    fftSize: a.fftSize,
    hopSize: a.hopSize,
    durationSec: r(a.samples.length / a.sampleRate, 4),
    numSamples: a.samples.length,
    numFrames: a.frames.length,
    peak: { peakDb: r(a.peak.peakDb, 2), peak: r(a.peak.peak, 4), clipped: a.peak.clipped, clipPct: r(a.peak.clipPct, 4) },
    clipping: a.clipping,
    meanRms: r(a.meanRms, 2),
    centroid: r(a.centroid, 1),
    centroid1: r(a.centroid1, 1),
    centroid2: r(a.centroid2, 1),
    onsets: a.onsets.length,
    onsetTimes: a.onsets.map(t => r(t, 3)),
    tempo: a.tempo ? r(a.tempo, 1) : null,
    f0: a.f0 ? r(a.f0, 1) : null,
    monoNote: a.monoNote ? { name: a.monoNote.name, cents: a.monoNote.cents, midi: a.monoNote.midi } : null,
    peaks: a.peakNotes.map(p => ({ freq: r(p.freq, 1), note: p.name, cents: p.cents })),
    silenceRatio: r(a.silenceRatio, 4),
    silenceDb: a.silenceDb,
  };
}

/* ---- self-test command ---------------------------------------------------- */
function cmdSelfTest(flags) {
  const { passCount, total, rows } = runSelfTests();
  if (flags["--json"]) {
    printJson({
      passed: passCount,
      total,
      ok: passCount === total,
      tests: rows.map(t => ({ signal: t.signal, check: t.check, expected: t.expected, measured: t.measured, result: t.ok ? "PASS" : "FAIL" })),
    });
  } else {
    // print a Signal/Check/Expected/Measured/Result table
    const head = ["Signal", "Check", "Expected", "Measured", "Result"];
    const data = rows.map(t => [t.signal, t.check, t.expected, t.measured, t.ok ? "PASS" : "FAIL"]);
    const all = [head, ...data];
    const widths = head.map((_, c) => Math.max(...all.map(row => String(row[c]).length)));
    const sep = "  ";
    const fmtRow = (row) => row.map((cell, c) => String(cell).padEnd(widths[c])).join(sep);
    const lines = [];
    lines.push(fmtRow(head));
    lines.push(widths.map(w => "-".repeat(w)).join(sep));
    for (const row of data) lines.push(fmtRow(row));
    lines.push("");
    lines.push(`${passCount}/${total} passed` + (passCount === total ? "  — all green" : "  — SEE FAILURES"));
    process.stdout.write(lines.join("\n") + "\n");
  }
  process.exit(passCount === total ? 0 : 1);
}

/* ---- analyze command ------------------------------------------------------ */
function cmdAnalyze(parsed) {
  const { flags } = parsed;
  const human = !!flags["--human"];

  const fftSize = flags["--fft"] ? parseInt(flags["--fft"], 10) : 2048;
  const hopSize = flags["--hop"] ? parseInt(flags["--hop"], 10) : 512;
  if (![1024, 2048, 4096].includes(fftSize)) die(`--fft must be one of 1024|2048|4096 (got ${flags["--fft"]})`);
  if (![256, 512, 1024].includes(hopSize)) die(`--hop must be one of 256|512|1024 (got ${flags["--hop"]})`);
  const silenceDb = flags["--silence-db"] != null && flags["--silence-db"] !== true
    ? parseFloat(flags["--silence-db"]) : -60;
  if (Number.isNaN(silenceDb)) die(`--silence-db must be a number`);

  // resolve samples + sample rate
  let samples, sampleRate, sourceLabel;
  const fileArg = parsed._[1]; // analyze <file>
  if (flags["--signal"]) {
    const id = flags["--signal"];
    if (!SIGNALS[id]) die(`unknown signal '${id}'. Valid: ${SIGNAL_IDS.join(", ")}`);
    samples = SIGNALS[id].make();
    sampleRate = SR;
    sourceLabel = id;
  } else if (fileArg) {
    let wav;
    try { wav = readWav(fileArg); }
    catch (e) { die(e.message, 1); }
    samples = wav.samples;
    sampleRate = wav.sampleRate;
    sourceLabel = fileArg;
  } else {
    die("analyze needs a <file.wav> or --signal <id>");
  }

  // opt-in resample
  if (flags["--resample"]) {
    const dst = parseInt(flags["--resample"], 10);
    if (!(dst > 0)) die(`--resample must be a positive integer (got ${flags["--resample"]})`);
    samples = resampleLinear(samples, sampleRate, dst);
    sampleRate = dst;
  }

  // short-WAV guard: need at least one full FFT frame
  if (samples.length < fftSize) {
    die(`input too short: ${samples.length} samples < one FFT frame (${fftSize}). ` +
        `Use a smaller --fft or a longer input.`, 1);
  }

  // utility: write WAV (proves wav.js reads what we write)
  if (flags["--write-wav"]) {
    writeWav(flags["--write-wav"], samples, sampleRate);
  }

  const a = analyze(samples, sampleRate, fftSize, hopSize, silenceDb);

  // image flags
  let wroteImage = false;
  if (flags["--spectrogram"]) { writeFileSync(flags["--spectrogram"], spectrogramPng(a.frames, sampleRate, fftSize)); wroteImage = true; }
  if (flags["--waveform"]) { writeFileSync(flags["--waveform"], waveformPng(samples)); wroteImage = true; }
  if (flags["--rms-png"]) { writeFileSync(flags["--rms-png"], rmsPng(a.rms)); wroteImage = true; }

  // query flags — print just the answer (first matching query wins ordering)
  const activeQueries = Object.keys(QUERIES).filter(q => flags[q]);
  if (activeQueries.length > 0) {
    if (human) {
      const parts = activeQueries.map(q => QUERIES[q](a, true).text);
      process.stdout.write(parts.join("  ") + "\n");
    } else if (activeQueries.length === 1) {
      printJson(QUERIES[activeQueries[0]](a, false).json);
    } else {
      // merge multiple query JSON objects
      const merged = {};
      for (const q of activeQueries) Object.assign(merged, QUERIES[q](a, false).json);
      printJson(merged);
    }
    return;
  }

  // if only image flags were given, report the write paths instead of full JSON
  if (wroteImage && !flags["--json"]) {
    const written = [];
    if (flags["--spectrogram"]) written.push(`spectrogram → ${flags["--spectrogram"]}`);
    if (flags["--waveform"]) written.push(`waveform → ${flags["--waveform"]}`);
    if (flags["--rms-png"]) written.push(`rms → ${flags["--rms-png"]}`);
    if (human) { process.stdout.write(written.join("\n") + "\n"); return; }
    // default JSON: still emit full analysis but note the images
    const j = fullJson(a);
    j.images = written;
    printJson(j);
    return;
  }

  // full analysis
  if (human) {
    const j = fullJson(a);
    const lines = [
      `source       ${sourceLabel}`,
      `sampleRate   ${j.sampleRate} Hz   fft ${j.fftSize}/hop ${j.hopSize}`,
      `duration     ${j.durationSec} s  (${j.numSamples} samples, ${j.numFrames} frames)`,
      `peak         ${j.peak.peakDb} dBFS`,
      `clipping     ${j.clipping ? `YES ${j.peak.clipPct}% (${j.peak.clipped} samp)` : "no"}`,
      `mean RMS     ${j.meanRms} dBFS`,
      `centroid     ${j.centroid} Hz  (${j.centroid1} → ${j.centroid2})`,
      `onsets       ${j.onsets}`,
      `tempo        ${j.tempo != null ? j.tempo + " BPM" : "—"}`,
      `pitch        ${a.monoNote ? noteStr(a.monoNote, a.f0) : "none"}`,
      `peaks        ${j.peaks.length ? j.peaks.map(p => `${p.note}${p.cents >= 0 ? "+" : ""}${p.cents}c`).join(" ") : "—"}`,
      `silenceRatio ${j.silenceRatio} (@ ${j.silenceDb} dBFS)`,
    ];
    process.stdout.write(lines.join("\n") + "\n");
  } else {
    printJson(fullJson(a));
  }
}

/* ---- main ----------------------------------------------------------------- */
function main() {
  const argv = process.argv.slice(2);
  const parsed = parseArgs(argv);
  const cmd = parsed._[0];

  const helpRequested = flagsHasHelp(parsed);
  if (!cmd || helpRequested) {
    process.stdout.write(usage());
    // explicit --help/-h is success; bare invocation (no command) is usage error
    process.exit(helpRequested ? 0 : 1);
  }

  switch (cmd) {
    case "self-test":
      return cmdSelfTest(parsed.flags);
    case "analyze":
      return cmdAnalyze(parsed);
    default:
      die(`unknown command '${cmd}'. Try: analyze, self-test (or run with no args for help)`);
  }
}

function flagsHasHelp(parsed) {
  return parsed.flags["--help"] || parsed.flags["-h"];
}

main();
