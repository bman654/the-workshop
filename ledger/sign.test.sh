#!/usr/bin/env bash
# Self-test for sign.sh's cycle derivation (v3 — the GIT-DEPTH rewrite). Proves
# the derivation against TEMP fixtures in throwaway dirs — never touches the real
# ledger/ or inbox/.
#
# THE DERIVATION UNDER TEST (sign.sh derive_cycle, [cycle] omitted):
#   cycle = ( git rev-list --count HEAD ) + 1   — the own-commit depth of the
#           UPCOMING commit, where this cycle's collated stones will live. At sign
#           time HEAD is the last landed commit; the new mark is sealed in the next.
#   FALLBACK (non-git sandbox / no HEAD / git absent): the legacy derivation
#           max(bedrock floor, live funlog), then a 0 sentinel — kept so the test
#           stays hermetic and sign.sh works outside a checkout.
#   OVERRIDE: an explicit [cycle] $4 beats both paths, used verbatim.
#
# The falsifiable claims:
#   (G)  in a git sandbox, a fresh agent that knows nothing can run
#          sign.sh <role> <name> <koan>          (3 args, NO cycle)
#        and land cycle == rev-list+1 — the depth of the commit the mark will live in.
#   (G2) that derivation ADVANCES: add one commit, sign again -> cycle is +1 (the
#        monotonic, freeze-proof property the bug fix is about — git depth always
#        marches, unlike the old self-referential max that froze at 30).
#   (G3) git depth IGNORES the ledger's own .cycle values entirely: a sandbox whose
#        ledger is poisoned with cycle:30 (the freeze) still derives the true depth,
#        not 30. (The exact poison the bug names — broken at the source.)
#   (F)  in a NON-git sandbox the fallback fires: max(bedrock, funlog); empty -> 0.
#   (D)  an explicit [cycle] overrides BOTH the git path and the fallback.
#   (E)  emitted JSON is valid, uniquely named, and collate.sh ingests it unchanged.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
real_sign="$here/sign.sh"
real_collate="$here/collate.sh"

pass=0; total=0
check() { # check <label> <expected> <actual>
  total=$((total + 1))
  if [ "$2" = "$3" ]; then
    pass=$((pass + 1))
    printf '  ok   %s\n' "$1"
  else
    printf '  FAIL %s — expected [%s] got [%s]\n' "$1" "$2" "$3"
  fi
}

# Read the single drop's .cycle from an inbox (asserts exactly one drop exists).
drop_cycle() { # drop_cycle <inbox-dir>
  local files
  files=("$1"/*.json)
  if [ "${#files[@]}" -ne 1 ] || [ ! -f "${files[0]}" ]; then
    printf 'ERR:%d-drops' "${#files[@]}"
    return
  fi
  jq -r '.cycle' "${files[0]}"
}
reset_inbox() { rm -f "$1"/*.json 2>/dev/null || true; }

# ════════════════════════════════════════════════════════════════════════════
#  (G) THE LIVE GIT-DEPTH PATH — a tiny real git repo sandbox.
#  We git-init a sandbox, copy the REAL sign.sh in (so its $dir resolves to the
#  sandbox AND `git -C "$dir"` finds THIS repo, not the workshop), and assert the
#  derived cycle equals the sandbox's own rev-list+1.
# ════════════════════════════════════════════════════════════════════════════
gsb="$(mktemp -d "${TMPDIR:-/tmp}/sign-git.XXXXXX")"
trap 'rm -rf "$gsb"' EXIT
(
  cd "$gsb"
  git init -q
  git config user.email t@t.t
  git config user.name Tester
  # build a known history so rev-list --count HEAD is a fixed, knowable number
  for i in 1 2 3 4 5; do
    echo "commit $i" > "file$i.txt"
    git add -A
    git commit -q -m "commit $i"
  done
)
cp "$real_sign" "$gsb/sign.sh"; chmod +x "$gsb/sign.sh"
mkdir -p "$gsb/inbox"; : > "$gsb/ledger.jsonl"
git -C "$gsb" add -A >/dev/null 2>&1; git -C "$gsb" commit -q -m "add sign harness"

gdepth="$(git -C "$gsb" rev-list --count HEAD)"   # the sandbox's own HEAD depth
expect_g="$((gdepth + 1))"                        # the upcoming commit's depth
# A funlog + a poisoned ledger that the OLD derivation would have used — the git
# path must IGNORE both and return rev-list+1.
gfl="$gsb/funlog.txt"; printf '===== fun cycle #999 =====\n' > "$gfl"
reset_inbox "$gsb/inbox"
WORKSHOP_FUNLOG="$gfl" "$gsb/sign.sh" director "Tester" "a koan" >/dev/null
check "(G) git sandbox: cycle == rev-list(HEAD)+1 (own depth of next commit)" \
  "$expect_g" "$(drop_cycle "$gsb/inbox")"

# (G2) ADVANCES: one more commit -> derived cycle is +1 (git depth always marches).
echo "one more" > "$gsb/advance.txt"
git -C "$gsb" add -A >/dev/null 2>&1; git -C "$gsb" commit -q -m "advance the trail"
expect_g2="$(( $(git -C "$gsb" rev-list --count HEAD) + 1 ))"
check "(G2) one more commit -> derived cycle advances by exactly 1" \
  "$((expect_g + 1))" "$expect_g2"          # sanity: the depth really did +1
reset_inbox "$gsb/inbox"
WORKSHOP_FUNLOG="$gfl" "$gsb/sign.sh" director "Tester" "a koan" >/dev/null
check "(G2) and the new sign records the advanced depth" \
  "$expect_g2" "$(drop_cycle "$gsb/inbox")"

# (G3) git depth IGNORES a poisoned ledger (the cycle-30 freeze at its source).
# Poison the sandbox ledger with cycle:30; the git path still derives true depth.
printf '{"cycle":30,"role":"frozen","name":"Stuck","koan":"frozen at 30","ts":"t"}\n' \
  > "$gsb/ledger.jsonl"
reset_inbox "$gsb/inbox"
WORKSHOP_FUNLOG="$gfl" "$gsb/sign.sh" director "Tester" "a koan" >/dev/null
check "(G3) poisoned ledger (cycle:30) ignored — still rev-list+1, not 30" \
  "$expect_g2" "$(drop_cycle "$gsb/inbox")"
: > "$gsb/ledger.jsonl"

# (D-git) explicit [cycle] overrides EVEN the git path.
reset_inbox "$gsb/inbox"
WORKSHOP_FUNLOG="$gfl" "$gsb/sign.sh" director "Tester" "a koan" 42 >/dev/null
check "(D) explicit 42 overrides the git-depth derivation" \
  "42" "$(drop_cycle "$gsb/inbox")"

# ════════════════════════════════════════════════════════════════════════════
#  (F) THE FALLBACK PATH — a NON-git sandbox (mktemp under TMPDIR is not a repo,
#  so `git rev-list --count HEAD` fails and sign.sh falls back to the legacy
#  max(bedrock, funlog) derivation). We prove the fallback still works.
# ════════════════════════════════════════════════════════════════════════════
fsb="$(mktemp -d "${TMPDIR:-/tmp}/sign-fallback.XXXXXX")"
trap 'rm -rf "$gsb" "$fsb"' EXIT
# guard: this sandbox MUST NOT be inside any git repo, or the fallback won't fire
if git -C "$fsb" rev-parse --git-dir >/dev/null 2>&1; then
  echo "  SKIP fallback tests — sandbox $fsb is unexpectedly inside a git repo" >&2
else
  cp "$real_sign" "$fsb/sign.sh"; chmod +x "$fsb/sign.sh"
  mkdir -p "$fsb/inbox"; : > "$fsb/ledger.jsonl"
  finbox="$fsb/inbox"

  # (F-a) bedrock HIGHER than funlog -> bedrock max wins (it's a max, not a precedence)
  ffl="$fsb/funlog.txt"
  { echo '===== fun cycle #7 ====='; echo '===== fun cycle #3 ====='; } > "$ffl"
  { echo '{"cycle":4,"role":"a","name":"a","koan":"a","ts":"t"}'
    echo '{"cycle":9,"role":"b","name":"b","koan":"b","ts":"t"}'
    echo '{"cycle":2,"role":"c","name":"c","koan":"c","ts":"t"}'; } > "$fsb/ledger.jsonl"
  reset_inbox "$finbox"
  WORKSHOP_FUNLOG="$ffl" "$fsb/sign.sh" director "Tester" "a koan" >/dev/null
  check "(F-a) fallback: max(bedrock 9, funlog 7) -> 9" "9" "$(drop_cycle "$finbox")"

  # (F-b) bedrock bare, funlog present -> max(0, funlog) == funlog (funlog supplies it)
  : > "$fsb/ledger.jsonl"; reset_inbox "$finbox"
  WORKSHOP_FUNLOG="$ffl" "$fsb/sign.sh" director "Tester" "a koan" >/dev/null
  check "(F-b) fallback: max(bedrock 0, funlog 7) -> 7" "7" "$(drop_cycle "$finbox")"

  # (F-c) both empty (missing funlog + empty ledger/inbox) -> 0 sentinel
  missing="$fsb/no-such-funlog.txt"
  : > "$fsb/ledger.jsonl"; reset_inbox "$finbox"
  WORKSHOP_FUNLOG="$missing" "$fsb/sign.sh" director "Tester" "a koan" >/dev/null
  check "(F-c) fallback: no funlog + empty ledger/inbox -> 0" "0" "$(drop_cycle "$finbox")"

  # (F-d) explicit [cycle] overrides the fallback too
  echo '{"cycle":9,"role":"b","name":"b","koan":"b","ts":"t"}' > "$fsb/ledger.jsonl"
  reset_inbox "$finbox"
  WORKSHOP_FUNLOG="$missing" "$fsb/sign.sh" director "Tester" "a koan" 42 >/dev/null
  check "(F-d) explicit 42 overrides the fallback (ledger 9)" "42" "$(drop_cycle "$finbox")"
fi

# ════════════════════════════════════════════════════════════════════════════
#  (E) emitted JSON valid + unique filename + collate.sh ingests unchanged.
#  Run in the NON-git fallback sandbox so the derived cycle is a known constant
#  (collate's own depth.txt refresh is exercised by sign.test's forge leg / the
#  collate test; here we only assert sign->collate field fidelity & seq).
# ════════════════════════════════════════════════════════════════════════════
csb="$(mktemp -d "${TMPDIR:-/tmp}/sign-collate.XXXXXX")"
trap 'rm -rf "$gsb" "$fsb" "$csb"' EXIT
cp "$real_sign" "$csb/sign.sh"; chmod +x "$csb/sign.sh"
cp "$real_collate" "$csb/collate.sh"; chmod +x "$csb/collate.sh"
mkdir -p "$csb/inbox"; : > "$csb/ledger.jsonl"
# two derived-cycle drops (no cycle arg); non-git sandbox -> fallback -> funlog=5
cfl="$csb/funlog.txt"; echo '===== fun cycle #5 =====' > "$cfl"
WORKSHOP_FUNLOG="$cfl" "$csb/sign.sh" director "Alpha" "first"  >/dev/null
WORKSHOP_FUNLOG="$cfl" "$csb/sign.sh" builder  "Beta"  "second" >/dev/null
count_json() { local g=("$1"/*.json); [ -e "${g[0]}" ] && printf '%d' "${#g[@]}" || printf '0'; }
check "(E) two signs -> two UNIQUE drop files" "2" "$(count_json "$csb/inbox")"
valid="yes"
for f in "$csb"/inbox/*.json; do
  jq -e 'has("cycle") and has("role") and has("name") and has("koan") and has("ts") and .cycle==5' \
    "$f" >/dev/null 2>&1 || valid="no"
done
check "(E) drops valid JSON, shape intact, cycle==5 (fallback)" "yes" "$valid"
( cd "$csb" && bash collate.sh >/dev/null 2>&1 )
check "(E) collate.sh ingested both lines" "2" "$(grep -c . "$csb/ledger.jsonl")"
check "(E) collate assigned sequential seq" '1,2' "$(jq -rs 'map(.seq) | @csv' "$csb/ledger.jsonl")"
check "(E) collate preserved derived cycle (5)" "5" "$(jq -rs 'map(.cycle) | unique | @csv' "$csb/ledger.jsonl")"
check "(E) collate cleared the inbox" "0" "$(count_json "$csb/inbox")"

# ════════════════════════════════════════════════════════════════════════════
#  (C) collate RE-FORGES the served face (kept from the prior suite, cycle #53).
#  collate must rebuild ledger/face.html so the served page is never stale, and
#  the rebuilt face must inline the just-collated mark verbatim. Mirror the real
#  layout: <root>/ledger/{sign,collate,face.src} + <root>/tools/forge/forge.mjs.
# ════════════════════════════════════════════════════════════════════════════
xsb="$(mktemp -d "${TMPDIR:-/tmp}/sign-forge.XXXXXX")"
trap 'rm -rf "$gsb" "$fsb" "$csb" "$xsb"' EXIT
mkdir -p "$xsb/ledger" "$xsb/tools/forge"
cp "$real_sign"    "$xsb/ledger/sign.sh";    chmod +x "$xsb/ledger/sign.sh"
cp "$real_collate" "$xsb/ledger/collate.sh"; chmod +x "$xsb/ledger/collate.sh"
cp "$here/face.src.html" "$xsb/ledger/face.src.html"
cp "$here/../tools/forge/forge.mjs" "$xsb/tools/forge/forge.mjs"
mkdir -p "$xsb/ledger/inbox"
# a non-empty starting ledger so face.src's depth/stones invariants hold (founder
# cycle is the founding commit depth under the new semantics — any positive int
# >= the min works for the face invariants; we use 306 to mirror reality).
printf '{"seq":1,"cycle":306,"role":"architect","name":"Origin","koan":"the first stone","ts":"2026-01-01T00:00:00Z"}\n' \
  > "$xsb/ledger/ledger.jsonl"
printf '306\n' > "$xsb/ledger/depth.txt"
( cd "$xsb" && node tools/forge/forge.mjs ledger/face.src.html >/dev/null 2>&1 )
md5of() { md5 -q "$1" 2>/dev/null || md5sum "$1" 2>/dev/null | cut -d' ' -f1; }
face_before="$(md5of "$xsb/ledger/face.html")"
# the forge leg sandbox is also NON-git (mktemp), so sign uses the fallback path;
# a funlog gives a known cycle. The mark's cycle value is immaterial to leg (C).
xfl="$xsb/funlog.txt"; echo '===== fun cycle #8 =====' > "$xfl"
WORKSHOP_FUNLOG="$xfl" "$xsb/ledger/sign.sh" builder "ForgeProbe" "the page must follow the data" >/dev/null
( cd "$xsb/ledger" && bash collate.sh >/dev/null 2>&1 )
face_after="$(md5of "$xsb/ledger/face.html")"
check "(C) collate re-forged face.html (content changed)" "changed" \
  "$([ "$face_before" != "$face_after" ] && echo changed || echo SAME)"
check "(C) re-forged face inlines the new mark" "yes" \
  "$(grep -q 'the page must follow the data' "$xsb/ledger/face.html" && echo yes || echo no)"
( cd "$xsb" && node tools/forge/forge.mjs --check ledger/face.src.html >/dev/null 2>&1 )
check "(C) forge --check: face.html CURRENT after collate" "0" "$?"

# ════════════════════════════════════════════════════════════════════════════
#  (GC) COLLATE IS THE AUTHORITATIVE STAMPER — the mid-cycle-split fix.
#  Two makers sign at DIFFERENT HEADs (a human commits between them, the way a
#  push / PR-merge lands mid-cycle). Their sign-time estimates DISAGREE — but
#  collate stamps every folded stone with ONE depth (rev-list(HEAD)+1 at collate
#  time), so co-committed makers share their commit's depth and the record stays
#  monotonic. This is the bug that scattered #56's stones across 394/395/397.
# ════════════════════════════════════════════════════════════════════════════
gcsb="$(mktemp -d "${TMPDIR:-/tmp}/sign-gcollate.XXXXXX")"
trap 'rm -rf "$gsb" "$fsb" "$csb" "$xsb" "$gcsb"' EXIT
(
  cd "$gcsb"
  git init -q; git config user.email t@t.t; git config user.name Tester
  for i in 1 2 3; do echo "c$i" > "f$i"; git add -A; git commit -q -m "c$i"; done
)
cp "$real_sign" "$gcsb/sign.sh"; chmod +x "$gcsb/sign.sh"
cp "$real_collate" "$gcsb/collate.sh"; chmod +x "$gcsb/collate.sh"
mkdir -p "$gcsb/inbox"; : > "$gcsb/ledger.jsonl"
git -C "$gcsb" add -A >/dev/null 2>&1; git -C "$gcsb" commit -q -m "harness"
gcfl="$gcsb/funlog.txt"; printf '===== fun cycle #1 =====\n' > "$gcfl"
# maker A signs at the current HEAD (early in the cycle)
WORKSHOP_FUNLOG="$gcfl" "$gcsb/sign.sh" director "Early" "signed first" >/dev/null
# HEAD MOVES mid-cycle — a human commits — so A's sign-time estimate is now stale
echo "interloper" > "$gcsb/mid.txt"; git -C "$gcsb" add -A >/dev/null 2>&1
git -C "$gcsb" commit -q -m "a human commits mid-cycle"
# maker B signs at the NEW HEAD (late) — its estimate differs from A's
WORKSHOP_FUNLOG="$gcfl" "$gcsb/sign.sh" publisher "Late" "signed after the shove" >/dev/null
check "(GC) sign-time estimates SPLIT across a mid-cycle HEAD move (the bug)" "2" \
  "$(jq -rs 'map(.cycle)|unique|length' "$gcsb"/inbox/*.json)"
gc_expect=$(( $(git -C "$gcsb" rev-list --count HEAD) + 1 ))
( cd "$gcsb" && bash collate.sh >/dev/null 2>&1 )
check "(GC) collate stamps ALL stones ONE uniform depth (the fix)" "1" \
  "$(jq -rs 'map(.cycle)|unique|length' "$gcsb/ledger.jsonl")"
check "(GC) and that depth is the upcoming commit's (rev-list+1)" "$gc_expect" \
  "$(jq -rs 'map(.cycle)|unique[0]' "$gcsb/ledger.jsonl")"

echo
echo "$pass/$total ✓"
[ "$pass" -eq "$total" ]
