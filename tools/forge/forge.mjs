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

   CLI:
     forge <file.src.html> [more.src.html ...]   build the named src files
     forge --all [root]                          build every *.src.html under root (recursive)
     forge --check <file.src.html | --all [root]>  build in memory, diff vs on-disk
                                                   .html; exit 1 if any drift
     forge --help                                usage
   ═══════════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';

const DIRECTIVE = /^[ \t]*<!--[ \t]*forge:include[ \t]+(.+?)[ \t]*-->[ \t]*$/;
const SKIP_DIRS = new Set(['.git', 'node_modules']);

/* A forge-level error we present cleanly (no raw stack at the user). */
class ForgeError extends Error {}

/* ── Strip the dual-use module guard + leading `export ` from an included .js or
   .mjs so the inline is clean in a browser (the guard is inert there, but ugly,
   and a bare `export` is a syntax error in a non-module <script>). We drop
   any line that is a `if (typeof module !== 'undefined' && module.exports) {...}`
   guard — both the single-line form and a multi-line `{ ... }` block — and strip a
   leading `export ` keyword on declarations. */
function stripModuleGuard(src) {
  const lines = src.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
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

/* Build one .src.html → the inlined HTML string (does not write). */
function buildOne(srcFile) {
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
  const outLines = [];
  for (const line of lines) {
    const m = line.match(DIRECTIVE);
    if (!m) { outLines.push(line); continue; }

    const rel = m[1].trim();
    const incPath = path.resolve(srcDir, rel);
    if (!fs.existsSync(incPath)) {
      throw new ForgeError(
        'forge:include target not found: "' + rel + '"\n' +
        '  (resolved to ' + incPath + ', relative to ' + srcFile + ')');
    }
    let content = readText(incPath);
    if (/\.m?js$/.test(incPath)) content = stripModuleGuard(content);
    // Inline verbatim (trim a single trailing newline so the block sits flush;
    // the directive line itself is replaced 1:1).
    outLines.push(content.replace(/\n$/, ''));
    includeCount++;
  }

  if (includeCount === 0) {
    throw new ForgeError(
      'no forge:include directives found in "' + srcFile + '".\n' +
      '  Add lines like:  <!-- forge:include engine/lantern.js -->');
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

  node tools/forge/forge.mjs --help

Directive (one per line, inside a <script> block in the .src.html):
  <!-- forge:include <relpath> -->
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
    const rest = args.slice(1);
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
      try { built = buildOne(f); }
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

  // --all mode: build everything under root.
  let files;
  if (args[0] === '--all') {
    files = findSrcFiles(args[1] ? path.resolve(args[1]) : defaultRoot());
    if (!files.length) { console.log('forge --all: no .src.html files found.'); return 0; }
  } else {
    files = args.map(f => path.resolve(f));
  }

  let built = 0;
  for (const f of files) {
    let html;
    try { html = buildOne(f); }
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
