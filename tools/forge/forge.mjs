#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   forge — the Lantern build-inliner (zero-dependency Node ESM).

   The workshop ships self-contained, double-clickable tales: one HTML file with
   the engine + a world inlined, no deps, no network. "Self-contained" is a
   property of the SHIPPED ARTIFACT, not the process. forge runs AUTHOR-SIDE: it
   reads a `<tale>.src.html` template carrying HTML-comment directives —
       <!-- forge:include <relpath> -->
   — and replaces each with the named source file's contents, emitting the
   self-contained `<tale>.html`. The engine then lives in exactly ONE canonical
   place (engine/lantern.js) and is inlined into each tale, never forked per tale.

   See adventure/ADVENTURE.SPEC.md §7 (forge) and §5 (the self-contained artifact).

   Beyond forge:include (own-line, inlines a script), forge folds two INLINE
   (substring) directives so a page can carry its own binary + data:
     <!-- forge:asset <relpath> -->  → a bare data:<mime>;base64,… URI in place
                                       (drops into src="…" / url(…))
     <!-- forge:json  <relpath> -->  → a validated JSON literal, emitted verbatim
   An asset over 4 MiB encoded ships with a warning (--strict makes it fatal);
   over 24 MiB is always fatal.

   CLI:
     forge <file.src.html> [more.src.html ...]   build the named src files
     forge --all [root]                          build every *.src.html under root (recursive)
     forge --check <file.src.html | --all [root]>  build in memory, diff vs on-disk
                                                   .html; exit 1 if any drift
     forge [--check] --strict …                  an oversized-asset warning ⇒ failure
     forge --help                                usage
   ═══════════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';

const DIRECTIVE = /^[ \t]*<!--[ \t]*forge:include[ \t]+(.+?)[ \t]*-->[ \t]*$/;

/* The INLINE directives — substring tokens, NOT line-anchored, so they drop into
   an attribute or mid-statement (`<audio src="<!-- forge:asset v.mp3 -->">` or
   `const T = <!-- forge:json piece.json -->;`). GLOBAL flag + non-greedy `(.+?)`
   so multiple tokens on one line each fold. Unlike forge:include (which owns its
   whole line and replaces it 1:1), these splice a value into the line the author
   wrote. A line-anchored include line can never also carry an inline token — the
   include regex requires the directive be the WHOLE line — so the passes don't
   collide. */
const ASSET = /<!--[ \t]*forge:asset[ \t]+(.+?)[ \t]*-->/g;
const JSONLIT = /<!--[ \t]*forge:json[ \t]+(.+?)[ \t]*-->/g;

/* The frozen MIME allow-table for forge:asset. An unknown extension is a hard
   error (see inlineAsset): it's almost always an author pointing at the wrong
   sibling, and failing at build beats silently shipping a non-playable
   data:application/octet-stream. Audio is the writ's need; the image rows are
   cheap table data (not branches) serving the named-future <img src> use. */
const MIME = Object.freeze({
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.m4a':  'audio/mp4',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
});

/* Size policy for an inlined asset (on the BASE64-ENCODED length):
   - HARD ceiling: always fatal, even without --strict (never silently ship a
     giant page).
   - WARN: ~3 MiB raw; matches the voice README's "couple of MB" target. Under
     --strict it's fatal; otherwise forge ships it with a yellow stderr warning
     (the tool informs, the author decides). */
const HARD_BYTES = 24 * 1024 * 1024;   // 24 MiB encoded → ALWAYS fatal
const WARN_BYTES = 4 * 1024 * 1024;    // 4 MiB encoded (~3 MiB raw) → warn / --strict-fatal

const SKIP_DIRS = new Set(['.git', 'node_modules']);

/* A forge-level error we present cleanly (no raw stack at the user). */
class ForgeError extends Error {}

/* Resolve an extension to its MIME type, or throw listing the allow-table. */
function mimeFor(rel) {
  const ext = path.extname(rel).toLowerCase();
  const mime = MIME[ext];
  if (!mime) {
    throw new ForgeError(
      'forge:asset unknown extension "' + ext + '" for "' + rel + '".\n' +
      '  Known: ' + Object.keys(MIME).join(', ') + '.');
  }
  return mime;
}

/* forge:asset — read a sibling file as BINARY (no encoding; routing it through
   readText's utf8+CRLF path would corrupt the bytes), base64-encode it, enforce
   the size policy, and return the BARE `data:<mime>;base64,<…>` string. The author
   owns the surrounding quotes/element, so the value drops straight into an
   `<audio src="…">`, a CSS `url(…)`, or a future `<img src>`. The encoded blob is
   pure single-line ASCII (no CR/LF), so the fold is a pure function of the bytes —
   --check sees no drift, and editing the asset's bytes turns --check red. */
function inlineAsset(incPath, rel, srcFile, strict) {
  if (!fs.existsSync(incPath)) {
    throw new ForgeError(
      'forge:asset target not found: "' + rel + '"\n' +
      '  (resolved to ' + incPath + ', relative to ' + srcFile + ')');
  }
  const mime = mimeFor(rel);                       // throws on unknown ext before any read
  let bytes;
  try { bytes = fs.readFileSync(incPath); }        // BINARY read — no 'utf8'
  catch (e) { throw new ForgeError('forge:asset cannot read "' + rel + '": ' + e.message); }
  const b64 = bytes.toString('base64');
  const encoded = b64.length;
  if (encoded > HARD_BYTES) {
    throw new ForgeError(
      'forge:asset "' + rel + '" is ' + (encoded / 1048576).toFixed(1) +
      ' MiB base64-encoded — over the ' + (HARD_BYTES / 1048576) +
      ' MiB hard ceiling. Refusing to inline (a page this heavy is a mistake).');
  }
  if (encoded > WARN_BYTES) {
    const msg = 'forge:asset "' + rel + '" is ' + (encoded / 1048576).toFixed(1) +
      ' MiB base64-encoded (over the ' + (WARN_BYTES / 1048576) + ' MiB warn line).';
    if (strict) throw new ForgeError(msg + ' (--strict: a warning is a failure.)');
    console.error('  ⚠ ' + msg + ' Inlining anyway (pass --strict to refuse).');
  }
  return 'data:' + mime + ';base64,' + b64;
}

/* forge:json — JSON.parse the file to validate it (fail the build loud on bad
   JSON), then emit the file's ORIGINAL text VERBATIM (CRLF→LF normalized like
   every include). We deliberately do NOT re-serialize: the fold stays a pure
   passthrough so --check sees no drift. The page owns the wrapping, e.g.
   `const TIMING = <!-- forge:json piece.json -->;`. */
function inlineJson(incPath, rel, srcFile) {
  if (!fs.existsSync(incPath)) {
    throw new ForgeError(
      'forge:json target not found: "' + rel + '"\n' +
      '  (resolved to ' + incPath + ', relative to ' + srcFile + ')');
  }
  const text = readText(incPath);                  // utf8 + CRLF→LF (a JSON literal IS text)
  try { JSON.parse(text); }
  catch (e) { throw new ForgeError('forge:json invalid JSON in "' + rel + '": ' + e.message); }
  return text.replace(/\n$/, '');                  // trim one trailing newline; emit verbatim
}

/* ── Strip the dual-use module guard + leading `export ` + bare top-level `import`s
   from an included .js / .mjs so the inline is clean in a browser. The guard is
   inert there but ugly; a bare `export` is a syntax error in a non-module <script>;
   and a top-level `import … from '…'` re-declares symbols that a SIBLING include
   already inlined (one core importing another's slab into the same page) — so we
   drop it. We remove: any `if (typeof module !== 'undefined' && module.exports)`
   guard (single-line or multi-line `{ … }` block); a leading `export ` keyword on
   declarations; and a whole-line static `import` statement (`import … from '…';`,
   `import '…';`, default / namespace / named forms). Dynamic `import(…)` calls are
   NOT line-anchored static imports and are left untouched. */
const STATIC_IMPORT = /^[ \t]*import\b(?:[^'"]*\bfrom\b)?\s*['"][^'"]+['"]\s*;?[ \t]*$/;
function stripModuleGuard(src) {
  const lines = src.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // drop a whole-line static ES import (its symbols come from a sibling include)
    if (STATIC_IMPORT.test(line)) continue;
    // drop a named re-export list `export { … };` (single-line or multi-line block).
    // It has no meaning in an inlined script, and is illegal if the inline sits in a
    // nested scope (e.g. a parent core wrapped in a scoping IIFE). Declarations keep
    // their value (the `export ` keyword is stripped below); only the list form goes.
    if (/^[ \t]*export\s*\{/.test(line)) {
      let inBraces = false, j = i;
      for (; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') inBraces = true;
          else if (ch === '}') inBraces = false;
        }
        if (!inBraces && /\}/.test(lines[j])) break;   // closing brace seen on this line
      }
      i = j; // skip through the closing line of the export list
      continue;
    }
    // drop a default re-export of an already-bound expression: `export default Foo;`
    // (NOT a declaration — `export default function/class/…` keeps its value and is
    // handled by the leading-`export `-strip below). Like the `export { … }` list, a
    // bare `export default <expr>;` has no meaning in an inlined classic <script> and
    // is a SYNTAX ERROR there, so we drop the whole line. The negative lookahead
    // excludes the declaration forms so they still inline (with `export ` stripped).
    if (/^[ \t]*export\s+default\s+(?!(const|let|var|function|class|async)\b)/.test(line)) {
      // consume through the statement's terminating `;` (handles a multi-line expr).
      let j = i;
      while (j < lines.length && !/;[ \t]*$/.test(lines[j])) j++;
      i = j; // skip through the line ending the default-export statement
      continue;
    }
    const guardStart = /^\s*if\s*\(\s*typeof\s+module\s*!==\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)/;
    if (guardStart.test(line)) {
      // Consume the whole guard. If it closes on the same line (balanced braces),
      // that's one line; otherwise consume until braces balance.
      let depth = 0, seenBrace = false, j = i;
      for (; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { depth++; seenBrace = true; }
          else if (ch === '}') depth--;
        }
        if (seenBrace && depth <= 0) break;
      }
      i = j; // skip through the guard's closing line
      continue;
    }
    // strip a leading `export ` on declarations (export const/function/let/var/class/default)
    line = line.replace(/^(\s*)export\s+(?=(default\s+)?(const|let|var|function|class|async)\b)/, '$1');
    out.push(line);
  }
  return out.join('\n');
}

/* Read the engine's LANTERN_VERSION for the banner stamp (graceful fallback). */
function readEngineVersion(srcDir) {
  const candidate = path.join(srcDir, 'engine', 'lantern.js');
  try {
    const m = fs.readFileSync(candidate, 'utf8').match(/LANTERN_VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (m) return m[1];
  } catch { /* fall through */ }
  return null;
}

/* Normalize CRLF→LF for processing; we emit LF. */
function readText(file) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); }
  catch (e) { throw new ForgeError('cannot read "' + file + '": ' + e.message); }
  return raw.replace(/\r\n/g, '\n');
}

/* Run the INLINE passes (forge:asset, forge:json) over one text block, splicing
   each token's value in place. Tallies the substitutions into `tally` so the
   directive-count guard knows an asset-only page is valid. Used on every non-
   include line AND over the content of an included partial (so a directive INSIDE
   an include still folds). */
function applyInline(text, srcDir, srcFile, strict, tally) {
  let out = text.replace(ASSET, (_full, rel) => {
    rel = rel.trim();
    tally.asset++;
    return inlineAsset(path.resolve(srcDir, rel), rel, srcFile, strict);
  });
  out = out.replace(JSONLIT, (_full, rel) => {
    rel = rel.trim();
    tally.json++;
    return inlineJson(path.resolve(srcDir, rel), rel, srcFile);
  });
  return out;
}

/* Build one .src.html → the inlined HTML string (does not write).
   `strict` makes a size WARNing fatal (default: warn + ship). */
function buildOne(srcFile, strict = false) {
  if (!/\.src\.html$/.test(srcFile)) {
    throw new ForgeError('"' + srcFile + '" is not a *.src.html file.');
  }
  if (!fs.existsSync(srcFile)) {
    throw new ForgeError('input not found: "' + srcFile + '".');
  }
  const srcDir = path.dirname(srcFile);
  const text = readText(srcFile);
  const lines = text.split('\n');

  let includeCount = 0;
  const tally = { asset: 0, json: 0 };
  const outLines = [];
  for (const line of lines) {
    const m = line.match(DIRECTIVE);
    if (!m) {
      // a non-include line may carry inline forge:asset / forge:json tokens
      outLines.push(applyInline(line, srcDir, srcFile, strict, tally));
      continue;
    }

    const rel = m[1].trim();
    const incPath = path.resolve(srcDir, rel);
    if (!fs.existsSync(incPath)) {
      throw new ForgeError(
        'forge:include target not found: "' + rel + '"\n' +
        '  (resolved to ' + incPath + ', relative to ' + srcFile + ')');
    }
    let content = readText(incPath);
    if (/\.[cm]?js$/.test(incPath)) content = stripModuleGuard(content);
    // An inline directive INSIDE an included partial still folds.
    content = applyInline(content, srcDir, srcFile, strict, tally);
    // Inline verbatim (trim a single trailing newline so the block sits flush;
    // the directive line itself is replaced 1:1).
    outLines.push(content.replace(/\n$/, ''));
    includeCount++;
  }

  // An asset-only or json-only .src.html (no include) is valid.
  if (includeCount + tally.asset + tally.json === 0) {
    throw new ForgeError(
      'no forge directives found in "' + srcFile + '".\n' +
      '  Add lines like:  <!-- forge:include engine/lantern.js -->\n' +
      '  or inline tokens: <!-- forge:asset voice.mp3 -->  /  <!-- forge:json timing.json -->');
  }

  // Banner: inject after <!DOCTYPE html> (case-insensitive) if present, else as
  // the very first line.
  const version = readEngineVersion(srcDir);
  const stamp = version ? ' Engine: lantern v' + version : '';
  const banner = '<!-- GENERATED BY forge — do not edit directly. Edit the .src.html + ' +
    'the included sources, then re-run: node tools/forge/forge.mjs ' +
    path.basename(srcFile) + '.' + stamp + ' -->';

  let body = outLines.join('\n');
  const doctype = body.match(/^([ \t]*<!doctype html>[ \t]*)(\r?\n)?/i);
  if (doctype) {
    const head = body.slice(0, doctype[0].length);
    const rest = body.slice(doctype[0].length);
    body = head.replace(/\n?$/, '\n') + banner + '\n' + rest;
  } else {
    body = banner + '\n' + body;
  }

  // Preserve a single trailing newline.
  return body.replace(/\n*$/, '\n');
}

/* The on-disk output path for a given .src.html. */
function outPathFor(srcFile) {
  return srcFile.replace(/\.src\.html$/, '.html');
}

/* Recursively find every *.src.html under root (skipping .git, node_modules). */
function findSrcFiles(root) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const ent of entries) {
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        walk(path.join(dir, ent.name));
      } else if (ent.isFile() && ent.name.endsWith('.src.html')) {
        out.push(path.join(dir, ent.name));
      }
    }
  };
  walk(root);
  return out.sort();
}

/* Resolve the default root: the cwd's git root, or '.'. */
function defaultRoot() {
  let dir = process.cwd();
  while (true) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

/* ── --audit-seen: dogfood the one mechanical rule in DESIGNING.md ───────────
   Every front-door PLACES page MUST drop its own `ws:seen:<id>` breadcrumb, so
   a DIRECT visit (deep-link / bookmark) registers for the Survey of Heaven and
   the Undercroft — not only a click from the map. The front door drops the
   breadcrumb on click, but that misses anyone who lands on a room page directly.

   This audit parses the (id, href) pairs straight out of `index.src.html`'s
   PLACES array (so it stays correct as the estate grows — no hardcoded map),
   resolves each href to its target .html, and checks the file contains the
   literal `ws:seen:<id>`. It is a SOFT warning: it reports offenders but exits 0
   by default (pass `--strict` to exit 1 so CI can gate on it). */
function parsePlaces(srcText) {
  // Pull every `{ ... id:"x" ... href:"y/index.html" ... }` PLACES entry.
  // PLACES entries are the only objects carrying BOTH an id: and an href:.
  const places = [];
  const re = /id\s*:\s*["']([^"']+)["'][^]*?href\s*:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(srcText)) !== null) {
    const id = m[1];
    const href = m[2];
    // skip external links + the colophon/source footer links (PLACES hrefs are
    // local <folder>/index.html paths)
    if (/^https?:/i.test(href)) continue;
    places.push({ id, href });
  }
  return places;
}

function auditSeen(root, strict) {
  const srcFile = path.join(root, 'index.src.html');
  if (!fs.existsSync(srcFile)) {
    console.error('forge --audit-seen: no index.src.html at ' + root);
    return 1;
  }
  const src = readText(srcFile);
  // Restrict to the PLACES array BODY only. Bounding at the array's closing `];`
  // matters: parsePlaces lazily pairs each `id:` with the NEXT `href:`, so any
  // `id:"sky:"+wingId`-style construct in the rendering code AFTER the array would
  // otherwise steal a downstream href and manufacture a phantom room. (Adding a
  // PLACES entry shifts the id/href pairing parity and can expose this — caught
  // #71 when the new gnomon entry conjured a bogus `sky:` → hours/index.html row.)
  const start = src.indexOf('const PLACES');
  let slice = start >= 0 ? src.slice(start) : src;
  const end = slice.indexOf('\n];');
  if (end >= 0) slice = slice.slice(0, end);
  const places = parsePlaces(slice);
  if (!places.length) {
    console.error('forge --audit-seen: parsed 0 PLACES entries — parser may be stale.');
    return 1;
  }

  let bad = 0;
  for (const { id, href } of places) {
    const target = path.resolve(root, href);
    if (!fs.existsSync(target)) {
      console.error('  ✗ ' + id + ' — target page MISSING (' + href + ')');
      bad++; continue;
    }
    const html = fs.readFileSync(target, 'utf8');
    if (html.includes('ws:seen:' + id)) {
      console.log('  ✓ ' + id + ' — drops ws:seen:' + id);
    } else {
      console.error('  ⚠ ' + id + ' — ' + href + ' never drops ws:seen:' + id +
        '  (a direct visit will not register for the Survey of Heaven / Undercroft)');
      bad++;
    }
  }
  if (bad) {
    console.error('\nforge --audit-seen: ' + bad + ' of ' + places.length +
      ' front-door page(s) miss their ws:seen breadcrumb.' +
      (strict ? '' : '  (soft warning — pass --strict to fail.)'));
    return strict ? 1 : 0;
  }
  console.log('\nforge --audit-seen: all ' + places.length +
    ' front-door page(s) drop their breadcrumb. ✓');
  return 0;
}

const USAGE = `forge — the Lantern build-inliner (zero-dependency).

Inlines a tale's engine + world into a self-contained, double-clickable .html.
The build runs author-side; the shipped .html stays fully self-contained.

Usage:
  node tools/forge/forge.mjs <file.src.html> [more.src.html ...]
      Build the named source files → sibling .html.

  node tools/forge/forge.mjs --all [root]
      Find & build every **/*.src.html under root (default: repo/git root).

  node tools/forge/forge.mjs --check <file.src.html | --all [root]>
      Build in memory and compare to the on-disk .html. Reports drift and
      exits 1 if any shipped file is stale; exits 0 if all are current.

  node tools/forge/forge.mjs --audit-seen [root] [--strict]
      Check every front-door PLACES page drops its own ws:seen:<id> breadcrumb
      (so direct visits register for the Survey of Heaven / Undercroft, not just
      map clicks). Soft warning by default; --strict exits 1 on any offender.

  --strict (BUILD / --check): treat an oversized-asset WARNING as a failure.
      An asset over 4 MiB encoded is shipped with a yellow warning by default;
      --strict refuses it. The 24 MiB hard ceiling is fatal regardless.

  node tools/forge/forge.mjs --help

Directives:
  <!-- forge:include <relpath> -->   (own line) inline a source file verbatim.
  <!-- forge:asset <relpath> -->     (inline) emit a bare data:<mime>;base64,…
                                     URI — drop it inside src="…" / url(…).
  <!-- forge:json <relpath> -->      (inline) validate + emit a JSON literal
                                     verbatim, e.g. const T = <!-- forge:json t.json -->;
  <relpath> resolves relative to the .src.html's own directory.`;

function main(argv) {
  const args = argv.slice(2);

  if (!args.length || args[0] === '--help' || args[0] === '-h') {
    console.log(USAGE);
    return 0;
  }

  // --audit-seen mode: dogfood the ws:seen breadcrumb rule (DESIGNING.md).
  if (args[0] === '--audit-seen') {
    const rest = args.slice(1);
    const strict = rest.includes('--strict');
    const rootArg = rest.find(a => a !== '--strict');
    const root = rootArg ? path.resolve(rootArg) : defaultRoot();
    return auditSeen(root, strict);
  }

  // --check mode: build in memory, diff against the on-disk .html.
  if (args[0] === '--check') {
    let rest = args.slice(1);
    const strict = rest.includes('--strict');
    rest = rest.filter(a => a !== '--strict');     // strip the global flag from the file list
    let files;
    if (rest[0] === '--all' || rest.length === 0) {
      files = findSrcFiles(rest[1] ? path.resolve(rest[1]) : defaultRoot());
    } else {
      files = rest.map(f => path.resolve(f));
    }
    if (!files.length) { console.log('forge --check: no .src.html files found.'); return 0; }

    let drift = 0;
    for (const f of files) {
      const out = outPathFor(f);
      let built, current;
      try { built = buildOne(f, strict); }
      catch (e) { console.error('  ✗ ' + rel(f) + ' — build error: ' + e.message); drift++; continue; }
      try { current = fs.readFileSync(out, 'utf8').replace(/\r\n/g, '\n'); }
      catch { console.error('  ✗ ' + rel(out) + ' — MISSING (run forge to generate it)'); drift++; continue; }
      if (built === current) {
        console.log('  ✓ ' + rel(out) + ' — current');
      } else {
        console.error('  ✗ ' + rel(out) + ' — STALE (differs from a fresh build; re-run forge)');
        drift++;
      }
    }
    if (drift) {
      console.error('\nforge --check: ' + drift + ' file(s) drifted. Re-run forge to regenerate.');
      return 1;
    }
    console.log('\nforge --check: all ' + files.length + ' file(s) current.');
    return 0;
  }

  // BUILD mode (--all or named files). --strict is a global flag here too.
  const strict = args.includes('--strict');
  const buildArgs = args.filter(a => a !== '--strict');
  let files;
  if (buildArgs[0] === '--all') {
    files = findSrcFiles(buildArgs[1] ? path.resolve(buildArgs[1]) : defaultRoot());
    if (!files.length) { console.log('forge --all: no .src.html files found.'); return 0; }
  } else {
    files = buildArgs.map(f => path.resolve(f));
  }

  let built = 0;
  for (const f of files) {
    let html;
    try { html = buildOne(f, strict); }
    catch (e) { console.error('forge: ' + e.message); return 1; }
    const out = outPathFor(f);
    try { fs.writeFileSync(out, html); }
    catch (e) { console.error('forge: cannot write "' + out + '": ' + e.message); return 1; }
    console.log('forge: ' + rel(f) + ' → ' + rel(out));
    built++;
  }
  console.log('forge: built ' + built + ' file(s).');
  return 0;
}

/* Pretty relative path from cwd (cosmetic; falls back to absolute). */
function rel(p) {
  const r = path.relative(process.cwd(), p);
  return (r && !r.startsWith('..')) ? r : p;
}

process.exit(main(process.argv));
