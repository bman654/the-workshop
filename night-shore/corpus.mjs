/* ============================================================================
   A MESSAGE, CAST TO THE TIDE · corpus.mjs — the baked DRIFT-POOL

   The sea does not always send your own words home. Sometimes it sends
   another voice — a line that washed in from somewhere, that has been
   at sea a long time. These are those lines: authored, in the estate's
   own register (the verse-oracle's voice), never foraged. About fifty
   short fragments, each meant to sound like the house talking to itself
   at low tide. This is CONTENT, not filler — a line that does not sound
   like the estate makes the whole payoff fall flat.

   The picker is NO-REPEAT until exhausted: a returning stranger's line is
   drawn from the pool without repeating a line already received, and only
   once every line has come ashore does the pool reset. Pure + injectable
   (a caller passes the already-received set + an RNG), so the Node twin
   can prove the no-repeat law without a screen.
   ============================================================================ */

// ── the drift-pool: ~50 short fragments in the estate's voice ────────────────
export const DRIFT_POOL = [
  "The lighthouse counts nobody, and keeps counting.",
  "Every wave is the last one, and then another is.",
  "I wrote your name in the wet sand and lent it to the tide.",
  "The moon does not own the water it silvers.",
  "A bottle is a room with one window, going nowhere slowly.",
  "The harbour keeps a light for ships that sank in other weather.",
  "Salt remembers the shape of everything it dries on.",
  "Low tide is the sea telling you where it has been.",
  "I have been adrift so long I forget which shore was mine.",
  "The gulls know a secret and will not stop saying it.",
  "Somewhere a window is warm and does not know it is a promise.",
  "The tide comes in like an apology it means every time.",
  "Cork floats because it refuses to be certain.",
  "Count the stars twice; you will lose the same one.",
  "A cast is a question you throw where you cannot follow.",
  "The sea keeps no ledger and forgives nothing.",
  "Whoever you were writing to, the water read it first.",
  "Foam is the sea practising the word 'stay'.",
  "Night water holds the sky the way a cupped hand holds rain.",
  "I skipped once, twice, and then agreed to sink.",
  "The buoy tolls for no one and everyone answers.",
  "A shore is only the argument the sea keeps losing.",
  "Glass, given enough tide, becomes a kind of forgiveness.",
  "Some lines take years to arrive and mean it more for waiting.",
  "The drowned bell still keeps the hour it went under.",
  "The far light blinks; it is learning to say goodnight.",
  "I carried your message the long way, past three storms.",
  "Every horizon is a door the sea leaves ajar.",
  "The moon-track is a road that only holds the light.",
  "Barnacles are the sea's way of keeping what it finds.",
  "Whatever you meant, the salt has underlined it.",
  "A wave breaks so the next one has somewhere to be.",
  "The tide went out and took my certainty with it.",
  "Nobody owns the dark between two lighthouses.",
  "I am the reply to a letter you have not sent yet.",
  "The sand keeps every footprint for exactly one tide.",
  "Water is patient because it has already won.",
  "The night is a long shelf and the moon is the only lamp.",
  "Cast far and you wait longer for the same small answer.",
  "The sea rehearses your name until it sounds like weather.",
  "A cork holds its breath so the words inside can keep theirs.",
  "Everything the shore forgets, the deep water learns.",
  "The last star to rise is the first the tide erases.",
  "I bobbed for a hundred nights and read your line each one.",
  "The harbour is a hand the sea keeps almost shaking.",
  "Adrift is only anchored to something farther off.",
  "The wet sand mirrors the moon and asks for nothing back.",
  "Send a bottle; the tide will decide what it becomes.",
  "The swell is the sea breathing in its sleep.",
  "Whoever finds this, the finding was the message.",
  "Low and slow, the water carries what it cannot keep."
];

// ── the no-repeat picker (pure; caller injects received-set + rng) ───────────
// `received` is a Set/array of indices already drawn. Returns {index, text}.
// Once every index has been received, the pool resets (received treated empty).
export function pickCorpus(received, rng) {
  const used = new Set(
    Array.isArray(received) ? received : (received ? Array.from(received) : [])
  );
  const n = DRIFT_POOL.length;
  // build the pool of not-yet-received indices; reset when exhausted
  let pool = [];
  for (let i = 0; i < n; i++) if (!used.has(i)) pool.push(i);
  const exhausted = pool.length === 0;
  if (exhausted) { pool = []; for (let i = 0; i < n; i++) pool.push(i); }
  const r = (typeof rng === 'function' ? rng() : Math.random());
  const k = Math.min(pool.length - 1, Math.max(0, Math.floor(r * pool.length)));
  const index = pool[k];
  return { index, text: DRIFT_POOL[index], reset: exhausted };
}

export const CORPUS_SIZE = DRIFT_POOL.length;
