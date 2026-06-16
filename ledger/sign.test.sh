#!/usr/bin/env bash
# Self-test for sign.sh's cycle derivation. Proves claims a-e against TEMP
# fixtures in a throwaway dir — never touches the real ledger/ or inbox/.
#
# The derivation is max(bedrock FLOOR, live funlog), then a 0 sentinel (cycle #53):
# the DURABLE ledger+inbox FLOORS the value (survives a funlog wipe — a buried maker
# never regresses) AND the live funlog can ADVANCE it past a STALE bedrock (breaking
# the cycle-30 freeze where 117 marks stamped on a bedrock that could never march).
#
# The falsifiable claim: a fresh agent that knows nothing can run
#   sign.sh <role> <name> <koan>           (3 args, NO cycle)
# and land the RIGHT cycle. Specifically (max-of-both order):
#   (a) ledger/inbox bedrock present, funlog LOWER -> drop.cycle == max(cycle) over
#       ledger.jsonl + inbox (the higher bedrock wins; the funlog does not lower it)
#   (a') when bedrock(99) is HIGHER than funlog(7), the bedrock FLOOR wins -> 99
#        (the inverse of the OLD test, which wrongly asserted "ledger always beats funlog"
#        as a precedence rule rather than a max — see (a'') for the case that exposed the bug)
#   (a'') THE POISON-LOOP REGRESSION: stale bedrock(30) + LIVE funlog(52) -> derived == 52.
#        The live funlog ADVANCES past the frozen bedrock — the exact freeze the bug names.
#   (b) ledger+inbox bare, funlog present -> max(0, funlog) == funlog (the funlog supplies it)
#   (b') a fresh-checkout inbox drop alone (no ledger) is bedrock; max(inbox, funlog) picks
#        the higher — here inbox(11) > funlog(7) -> 11
#   (c) both empty       -> drop.cycle == 0
#   (d) explicit [cycle] -> overrides all of the above
#   (e) emitted JSON is valid, uniquely named, and collate.sh ingests it unchanged
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

# A throwaway sandbox that mirrors sign.sh's layout (script + inbox/ + ledger.jsonl).
# We copy the REAL sign.sh in so its $dir resolves to the sandbox, leaving the
# real ledger/inbox completely untouched.
sandbox="$(mktemp -d "${TMPDIR:-/tmp}/sign-test.XXXXXX")"
trap 'rm -rf "$sandbox"' EXIT
cp "$real_sign" "$sandbox/sign.sh"
chmod +x "$sandbox/sign.sh"
mkdir -p "$sandbox/inbox"
: > "$sandbox/ledger.jsonl"
sign="$sandbox/sign.sh"
inbox="$sandbox/inbox"

reset_inbox() { rm -f "$inbox"/*.json 2>/dev/null || true; }

# Read the single drop's .cycle (asserts exactly one drop exists).
drop_cycle() {
  local files
  files=("$inbox"/*.json)
  if [ "${#files[@]}" -ne 1 ] || [ ! -f "${files[0]}" ]; then
    printf 'ERR:%d-drops' "${#files[@]}"
    return
  fi
  jq -r '.cycle' "${files[0]}"
}

# ---- (a) ledger/inbox bedrock HIGHER than funlog -> bedrock max wins (max-of-both) ----
# The funlog here carries a LOWER number, so max(bedrock, funlog) == the bedrock max.
fl="$sandbox/funlog.txt"
{
  echo '===== fun cycle #1 ====='
  echo 'noise noise'
  echo '===== fun cycle #7 ====='
  echo '===== fun cycle #3 ====='   # out of order on purpose; the funlog max is 7
} > "$fl"
{
  echo '{"cycle":4,"role":"a","name":"a","koan":"a","ts":"t"}'
  echo '{"cycle":9,"role":"b","name":"b","koan":"b","ts":"t"}'   # out of order on purpose
  echo '{"cycle":2,"role":"c","name":"c","koan":"c","ts":"t"}'
} > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
check "(a) max(bedrock 9, funlog 7) -> 9 (bedrock higher, ignores order)" "9" "$(drop_cycle)"

# (a') bedrock(99) HIGHER than funlog(7) -> the bedrock FLOOR wins (99). This INVERTS
# the old test's framing: it asserted "LEDGER always beats funlog" as a precedence rule,
# which is wrong — it's a MAX. Here the bedrock wins only because it is the higher value.
echo '{"cycle":99,"role":"x","name":"x","koan":"x","ts":"t"}' > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
check "(a') max(bedrock 99, funlog 7) -> 99 (bedrock is the higher floor)" "99" "$(drop_cycle)"

# (a'') THE POISON-LOOP REGRESSION (cycle #53): a STALE bedrock(30) with a LIVE,
# HIGHER funlog(52) -> derived == 52. The live funlog ADVANCES past the frozen bedrock.
# Under the OLD bedrock-first order this returned 30 forever (the exact freeze that
# stamped 117 marks at cycle 30 across real cycles ~31→52). max-of-both fixes it.
poisonfl="$sandbox/poison-funlog.txt"
{
  echo '===== fun cycle #50 ====='
  echo '===== fun cycle #52 ====='   # the live loop has marched to 52
  echo '===== fun cycle #51 ====='   # out of order on purpose; funlog max is 52
} > "$poisonfl"
echo '{"cycle":30,"role":"frozen","name":"Stuck","koan":"frozen at 30","ts":"t"}' \
  > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$poisonfl" "$sign" director "Tester" "a koan" >/dev/null
check "(a'') stale bedrock 30 + live funlog 52 -> 52 (funlog ADVANCES past freeze)" "52" "$(drop_cycle)"
: > "$sandbox/ledger.jsonl"   # restore empty ledger for the next cases

# ---- (b) ledger+inbox bare, funlog present -> max(0, funlog) == funlog ----
# Empty ledger + empty inbox -> bedrock 0; the funlog supplies the (higher) value.
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
check "(b) max(bedrock 0, funlog 7) -> 7 (funlog supplies it)" "7" "$(drop_cycle)"

# (b') a fresh-checkout inbox drop alone (no ledger) is bedrock; max(inbox, funlog)
#      picks the higher: inbox=11 > funlog=7 -> 11 (the inbox is part of the bedrock).
reset_inbox
echo '{"cycle":11,"role":"builder","name":"Early","koan":"k","ts":"t"}' \
  > "$inbox/builder-early.json"
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
# now two drops exist (the seeded one + ours); read OURS (the non-"Early" one)
got="$(jq -rs 'map(select(.name=="Tester"))[0].cycle' "$inbox"/*.json)"
check "(b') max(inbox 11, funlog 7) -> 11 (inbox is bedrock, the higher value)" "11" "$got"
reset_inbox

# (b'') no funlog at all + ledger/inbox bedrock -> still the ledger max (the durable
#       path stands alone when the leaves are gone entirely).
missing="$sandbox/no-such-funlog.txt"
{
  echo '{"cycle":4,"role":"a","name":"a","koan":"a","ts":"t"}'
  echo '{"cycle":9,"role":"b","name":"b","koan":"b","ts":"t"}'
  echo '{"cycle":2,"role":"c","name":"c","koan":"c","ts":"t"}'
} > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$missing" "$sign" director "Tester" "a koan" >/dev/null
check "(b'') no funlog -> ledger bedrock max (9)" "9" "$(drop_cycle)"
: > "$sandbox/ledger.jsonl"
reset_inbox

# ---- (c) both empty -> 0 ----
: > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$missing" "$sign" director "Tester" "a koan" >/dev/null
check "(c) no funlog + empty ledger/inbox -> 0" "0" "$(drop_cycle)"

# ---- (d) explicit [cycle] overrides every derivation ----
# d1: overrides a funlog that would otherwise say 7
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" 42 >/dev/null
check "(d1) explicit 42 overrides funlog(7)" "42" "$(drop_cycle)"
# d2: overrides a populated ledger that would otherwise say 9
echo '{"cycle":9,"role":"b","name":"b","koan":"b","ts":"t"}' > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$missing" "$sign" director "Tester" "a koan" 42 >/dev/null
check "(d2) explicit 42 overrides ledger(9)" "42" "$(drop_cycle)"
: > "$sandbox/ledger.jsonl"

# ---- (e) emitted JSON valid + unique filename + collate.sh ingests unchanged ----
# Build a fresh collate sandbox so the REAL ledger is never touched.
csb="$(mktemp -d "${TMPDIR:-/tmp}/sign-collate.XXXXXX")"
cp "$real_sign" "$csb/sign.sh"; chmod +x "$csb/sign.sh"
cp "$real_collate" "$csb/collate.sh"; chmod +x "$csb/collate.sh"
mkdir -p "$csb/inbox"; : > "$csb/ledger.jsonl"
# two derived-cycle drops (no cycle arg), with a funlog so cycle==5
cfl="$csb/funlog.txt"; echo '===== fun cycle #5 =====' > "$cfl"
WORKSHOP_FUNLOG="$cfl" "$csb/sign.sh" director "Alpha" "first" >/dev/null
WORKSHOP_FUNLOG="$cfl" "$csb/sign.sh" builder "Beta"  "second" >/dev/null
count_json() { local g=("$1"/*.json); [ -e "${g[0]}" ] && printf '%d' "${#g[@]}" || printf '0'; }
n_drops="$(count_json "$csb/inbox")"
check "(e) two signs -> two UNIQUE drop files" "2" "$n_drops"
# every drop is valid JSON with the expected shape + derived cycle 5
valid="yes"
for f in "$csb"/inbox/*.json; do
  jq -e 'has("cycle") and has("role") and has("name") and has("koan") and has("ts") and .cycle==5' \
    "$f" >/dev/null 2>&1 || valid="no"
done
check "(e) drops valid JSON, shape intact, cycle==5" "yes" "$valid"
# collate.sh folds them into ledger.jsonl with sequential seq, unchanged fields
( cd "$csb" && bash collate.sh >/dev/null )
ledger_lines="$(grep -c . "$csb/ledger.jsonl")"
check "(e) collate.sh ingested both lines" "2" "$ledger_lines"
seqs="$(jq -rs 'map(.seq) | @csv' "$csb/ledger.jsonl")"
check "(e) collate assigned sequential seq" '1,2' "$seqs"
ingested_cycles="$(jq -rs 'map(.cycle) | unique | @csv' "$csb/ledger.jsonl")"
check "(e) collate preserved derived cycle (5)" "5" "$ingested_cycles"
inbox_emptied="$(count_json "$csb/inbox")"
check "(e) collate cleared the inbox" "0" "$inbox_emptied"
rm -rf "$csb"

# ---- (f) collate RE-FORGES the served face (cycle #53) -----------------------
# The bug: collate refreshed ledger.jsonl + depth.txt but never re-forged face.html,
# so the served page went chronically stale. Prove collate now rebuilds it AND the
# rebuilt face.html inlines the just-collated ledger tail. We build a sandbox that
# mirrors the real layout: <root>/ledger/{sign,collate,face.src}.sh|html +
# <root>/tools/forge/forge.mjs (the REAL forge, copied in), so collate's "$dir/.."
# repo-root resolution finds it exactly as in production.
fsb="$(mktemp -d "${TMPDIR:-/tmp}/sign-forge.XXXXXX")"
mkdir -p "$fsb/ledger" "$fsb/tools/forge"
cp "$real_sign"    "$fsb/ledger/sign.sh";    chmod +x "$fsb/ledger/sign.sh"
cp "$real_collate" "$fsb/ledger/collate.sh"; chmod +x "$fsb/ledger/collate.sh"
cp "$here/face.src.html" "$fsb/ledger/face.src.html"
cp "$here/../tools/forge/forge.mjs" "$fsb/tools/forge/forge.mjs"
mkdir -p "$fsb/ledger/inbox"
# a non-empty starting ledger so depth/stones invariants in face.src hold, + a depth
echo '{"seq":1,"cycle":0,"role":"founder","name":"Origin","koan":"the first stone","ts":"2026-01-01T00:00:00Z"}' \
  > "$fsb/ledger/ledger.jsonl"
printf '5\n' > "$fsb/ledger/depth.txt"
# forge an initial face so we have a baseline to diff against
( cd "$fsb" && node tools/forge/forge.mjs ledger/face.src.html >/dev/null 2>&1 )
face_before="$(cat "$fsb/ledger/face.html" 2>/dev/null | md5 2>/dev/null || cat "$fsb/ledger/face.html" 2>/dev/null | md5sum 2>/dev/null | cut -d' ' -f1)"
# drop a NEW mark, then collate — collate must append it AND re-forge the face
ffl="$fsb/funlog.txt"; echo '===== fun cycle #8 =====' > "$ffl"
WORKSHOP_FUNLOG="$ffl" "$fsb/ledger/sign.sh" builder "ForgeProbe" "the page must follow the data" >/dev/null
( cd "$fsb/ledger" && bash collate.sh >/dev/null 2>&1 )
face_after="$(cat "$fsb/ledger/face.html" 2>/dev/null | md5 2>/dev/null || cat "$fsb/ledger/face.html" 2>/dev/null | md5sum 2>/dev/null | cut -d' ' -f1)"
# (f1) collate changed the served face (it re-forged, not left stale)
check "(f) collate re-forged face.html (content changed)" "changed" \
  "$([ "$face_before" != "$face_after" ] && echo changed || echo SAME)"
# (f2) the rebuilt face inlines the NEW collated mark verbatim (data-bound to the tail)
check "(f) re-forged face inlines the new mark" "yes" \
  "$(grep -q 'the page must follow the data' "$fsb/ledger/face.html" && echo yes || echo no)"
# (f3) and forge --check now reports face.html CURRENT (the exact gate the bug names)
( cd "$fsb" && node tools/forge/forge.mjs --check ledger/face.src.html >/dev/null 2>&1 )
check "(f) forge --check: face.html CURRENT after collate" "0" "$?"
rm -rf "$fsb"

echo
echo "$pass/$total ✓"
[ "$pass" -eq "$total" ]
