#!/usr/bin/env bash
# Self-test for sign.sh's cycle derivation. Proves claims a-e against TEMP
# fixtures in a throwaway dir — never touches the real ledger/ or inbox/.
#
# The falsifiable claim: a fresh agent that knows nothing can run
#   sign.sh <role> <name> <koan>           (3 args, NO cycle)
# and land the RIGHT cycle. Specifically:
#   (a) funlog present  -> drop.cycle == max N in "===== fun cycle #N ====="
#   (b) no funlog        -> drop.cycle == max(cycle) over ledger.jsonl + inbox
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

# ---- (a) funlog present -> max N header wins ----
fl="$sandbox/funlog.txt"
{
  echo '===== fun cycle #1 ====='
  echo 'noise noise'
  echo '===== fun cycle #7 ====='
  echo '===== fun cycle #3 ====='   # out of order on purpose; MAX must win, not last
} > "$fl"
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
check "(a) funlog max N=7 wins over order" "7" "$(drop_cycle)"

# (a') funlog wins EVEN when ledger/inbox carry a different number (priority 2 > 3)
echo '{"cycle":99,"role":"x","name":"x","koan":"x","ts":"t"}' > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$fl" "$sign" director "Tester" "a koan" >/dev/null
check "(a') funlog (7) beats ledger (99)" "7" "$(drop_cycle)"
: > "$sandbox/ledger.jsonl"   # restore empty ledger for the next cases

# ---- (b) no funlog -> max(cycle) over ledger.jsonl + inbox ----
missing="$sandbox/no-such-funlog.txt"
{
  echo '{"cycle":4,"role":"a","name":"a","koan":"a","ts":"t"}'
  echo '{"cycle":9,"role":"b","name":"b","koan":"b","ts":"t"}'
  echo '{"cycle":2,"role":"c","name":"c","koan":"c","ts":"t"}'
} > "$sandbox/ledger.jsonl"
reset_inbox
WORKSHOP_FUNLOG="$missing" "$sign" director "Tester" "a koan" >/dev/null
check "(b) no funlog -> ledger max (9)" "9" "$(drop_cycle)"

# (b') an inbox drop signed THIS cycle before us must also count (ledger=9, inbox=11)
reset_inbox
echo '{"cycle":11,"role":"builder","name":"Early","koan":"k","ts":"t"}' \
  > "$inbox/builder-early.json"
WORKSHOP_FUNLOG="$missing" "$sign" director "Tester" "a koan" >/dev/null
# now two drops exist (the seeded one + ours); read OURS (the non-"Early" one)
got="$(jq -rs 'map(select(.name=="Tester"))[0].cycle' "$inbox"/*.json)"
check "(b') no funlog -> ledger+inbox max (11)" "11" "$got"
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
