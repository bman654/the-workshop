#!/usr/bin/env bash
# Self-test for sign.sh's cycle derivation. Proves claims a-e against TEMP
# fixtures in a throwaway dir — never touches the real ledger/ or inbox/.
#
# Read the depth from the BEDROCK, not the falling leaves (Brandon, cycle #14):
# the DURABLE ledger+inbox is PRIMARY; the ephemeral funlog is a FALLBACK only.
#
# The falsifiable claim: a fresh agent that knows nothing can run
#   sign.sh <role> <name> <koan>           (3 args, NO cycle)
# and land the RIGHT cycle. Specifically (NEW priority order):
#   (a) ledger/inbox bedrock present -> drop.cycle == max(cycle) over ledger.jsonl + inbox
#   (a') when ledger says one number and funlog says a DIFFERENT one, the LEDGER WINS
#        (the bedrock outranks the leaves — the inverse of the old order's claim)
#   (b) ledger+inbox bare, funlog present -> FALLBACK: drop.cycle == max N "===== fun cycle #N ====="
#   (b') a fresh-checkout inbox drop alone (no ledger) is itself bedrock and outranks the funlog
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

# ---- (a) ledger/inbox bedrock present -> max(cycle) over ledger.jsonl + inbox wins ----
# A funlog exists here too, carrying a LOWER number, to prove the bedrock is consulted
# FIRST and the funlog is not even reached when the bedrock has a stone.
fl="$sandbox/funlog.txt"
{
  echo '===== fun cycle #1 ====='
  echo 'noise noise'
  echo '===== fun cycle #7 ====='
  echo '===== fun cycle #3 ====='   # out of order on purpose; the funlog must NOT win here
} > "$fl"
{
  echo '{"cycle":4,"role":"a","name":"a","koan":"a","ts":"t"}'
  echo '{"cycle":9,"role":"b","name":"b","koan":"b","ts":"t"}'   # out of order on purpose
  echo '{"cycle":2,"role":"c","name":"c","koan":"c","ts":"t"}'
} > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
check "(a) ledger bedrock max=9 wins over order (and over funlog 7)" "9" "$(drop_cycle)"

# (a') THE FLIP: when ledger says one number and funlog a DIFFERENT one, the LEDGER WINS.
# This is the exact INVERSE of the old order's claim ("funlog(7) beats ledger(99)").
echo '{"cycle":99,"role":"x","name":"x","koan":"x","ts":"t"}' > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
check "(a') LEDGER (99) beats funlog (7) — bedrock over leaves" "99" "$(drop_cycle)"
: > "$sandbox/ledger.jsonl"   # restore empty ledger for the next cases

# ---- (b) ledger+inbox bare, funlog present -> FALLBACK to max N funlog header ----
# Empty ledger + empty inbox; the funlog is the only depth left, so it is consulted.
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
check "(b) bare bedrock -> funlog fallback max N=7" "7" "$(drop_cycle)"

# (b') a fresh-checkout inbox drop alone (no ledger) is itself bedrock and outranks
#      the funlog: inbox=11 must win over funlog=7 (the inbox is part of the bedrock).
reset_inbox
echo '{"cycle":11,"role":"builder","name":"Early","koan":"k","ts":"t"}' \
  > "$inbox/builder-early.json"
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
# now two drops exist (the seeded one + ours); read OURS (the non-"Early" one)
got="$(jq -rs 'map(select(.name=="Tester"))[0].cycle' "$inbox"/*.json)"
check "(b') inbox bedrock (11) beats funlog (7), no ledger" "11" "$got"
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

echo
echo "$pass/$total ✓"
[ "$pass" -eq "$total" ]
