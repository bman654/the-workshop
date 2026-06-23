export const meta = {
  name: 'rep-essence-survey',
  description: 'Blind essence-survey: which 3 estate rooms deserve bespoke front-gate reps',
  phases: [
    { title: 'survey', detail: '4 independent blind surveyors nominate rooms by distinct lenses' },
    { title: 'tally', detail: 'aggregate nominations + propose a 3-rep slate covering the aspect shapes' },
  ],
}

const POOL = '/tmp/gate-foundry/room-pool.json'

// Distinct SELECTION LENSES (criteria diversity, NOT pre-named answers — keep it blind).
const LENSES = [
  { n: 1, lens: 'MOST VISUALLY ICONIC AS A FRONT-ELEVATION SILHOUETTE — which rooms have an instantly recognizable physical form/instrument/structure that would read at a glance as a small drawn object in a grounds slot?' },
  { n: 2, lens: 'MOST THEMATICALLY CENTRAL TO AN ORRERY/CELESTIAL-MECHANICS ESTATE — which rooms best embody the estate\'s soul (clockwork, optics, waves, computation, celestial) so their rep feels like the estate\'s signature?' },
  { n: 3, lens: 'BEST ASPECT-SHAPE COVERAGE — the slot is aspect-flexible (VERTICAL tower / HORIZONTAL pond-or-low-wide / LOW-WIDE MOUND). Which rooms naturally want each shape, so a set of 3 gives compositional variety rather than three similar blobs?' },
  { n: 4, lens: 'MOST INTRIGUING TO A FIRST-TIME VISITOR — which rooms, shown as the gate\'s featured rep, would most make a newcomer curious to enter and explore that room?' },
]

const NOM_SCHEMA = {
  type: 'object',
  properties: {
    surveyor: { type: 'integer' },
    nominations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          room: { type: 'string' },
          repConcept: { type: 'string' },
          aspect: { type: 'string', enum: ['vertical', 'horizontal', 'mound'] },
          recognizability: { type: 'number' },
          rationale: { type: 'string' },
        },
        required: ['id', 'room', 'repConcept', 'aspect', 'recognizability', 'rationale'],
      },
    },
  },
  required: ['surveyor', 'nominations'],
}

function surveyorPrompt(L) {
  return `You are blind surveyor #${L.n} choosing which estate rooms deserve a BESPOKE front-elevation
"rep" (a small drawn representation) displayed in a grounds slot at "The Orrery Estate" front gate.
Right now only ONE room (the Cairn, a stack of polished stones) has a bespoke rep; every other room
falls back to a generic glyph plinth. We will hand-build a few more bespoke reps; your job is to
nominate the best candidates — INDEPENDENTLY, by your own judgment. Do NOT assume any particular
rooms are "obvious"; evaluate the whole pool fresh.

READ the full room pool (74 rooms, each with id/room/glyph/accent/district): ${POOL}
(cat it or read it). Each entry: id (the piece), room (display name), glyph (emoji), accent (hex),
district. Use the room NAME + glyph + your knowledge of what such a room contains to imagine its
physical essence.

YOUR LENS: ${L.lens}

A great rep is: recognizable at a glance as a small drawn FRONT-ELEVATION object (an instrument,
structure, terrain feature, or fixture) — NOT a flat icon; estate-styled (it'll be drawn in the
house brass/stone idiom, palette-swapped, lit from above); and fits one of three SLOT shapes —
VERTICAL (tall+narrow, e.g. a tower/armillary), HORIZONTAL (wide+short, e.g. a pond/table), or
LOW-WIDE MOUND (squat, e.g. a rocky outcrop with a cave mouth). The slot bottom-aligns on a ground
line; min ~Cairn size, max ~2x.

Nominate your TOP 4 rooms (most deserving first). For each: id, room, a one-line repConcept (what
the drawn object IS), aspect (vertical|horizontal|mound), recognizability (0-10, how unmistakably it
reads as that object), and a one-line rationale tied to YOUR lens. Be discriminating.

Return via StructuredOutput: surveyor=${L.n}; nominations (4).`
}

const SLATE_SCHEMA = {
  type: 'object',
  properties: {
    tally: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, room: { type: 'string' }, votes: { type: 'integer' }, avgRecognizability: { type: 'number' }, aspects: { type: 'string' } }, required: ['id', 'room', 'votes'] } },
    recommendedSlate: {
      type: 'array',
      items: { type: 'object', properties: { id: { type: 'string' }, room: { type: 'string' }, repConcept: { type: 'string' }, aspect: { type: 'string' }, repColorsHint: { type: 'string' } }, required: ['id', 'room', 'repConcept', 'aspect'] },
    },
    reasoning: { type: 'string' },
    runnersUp: { type: 'array', items: { type: 'string' } },
  },
  required: ['tally', 'recommendedSlate', 'reasoning'],
}

function tallyPrompt(noms) {
  const blob = noms.map(s => `SURVEYOR ${s.surveyor}:\n` + s.nominations.map(x => `  - ${x.id} (${x.room}) [${x.aspect}, rec ${x.recognizability}] ${x.repConcept} :: ${x.rationale}`).join('\n')).join('\n\n')
  return `You are the survey synthesizer. Four blind surveyors (different lenses) nominated estate rooms
for bespoke front-gate reps. Aggregate their picks and propose a SLATE OF 3 to hand-build (the Cairn
already exists, so these are 3 ADDITIONAL reps).

THE NOMINATIONS:
${blob}

Also read the pool for accent colors if useful: ${POOL}

Tally votes per room id (how many surveyors nominated it) + average recognizability + which aspects
were suggested. Then propose a SLATE OF 3 that:
- favors high vote-count + high recognizability, BUT
- COVERS THE THREE ASPECT SHAPES (ideally one vertical, one horizontal, one low-wide mound) so the
  three reps give compositional VARIETY rather than three similar silhouettes, AND
- spreads across districts/themes where possible (not three near-identical rooms).
For each slate pick give: id, room, a crisp repConcept (the drawn object), aspect, and a repColorsHint
(suggested non-neutral colors the rep should bring via the rep.swatch*/rep.glow* slots — e.g. a pond's
blues, a forge's emissive orange — using the room's accent as a starting point; or "neutral/estate
brass" if it doesn't need custom colors).

Return via StructuredOutput: tally, recommendedSlate (3), reasoning (why these 3 over the runners-up +
how they cover the aspect shapes), runnersUp (a few ids worth a 4th rep later).`
}

phase('survey')
log('Blind essence-survey: 4 surveyors nominating bespoke-rep rooms by distinct lenses')
const noms = (await parallel(LENSES.map(L => () =>
  agent(surveyorPrompt(L), { label: `surveyor-${L.n}`, phase: 'survey', schema: NOM_SCHEMA, agentType: 'general-purpose', effort: 'medium' })
))).filter(Boolean)
log(`Surveyors returned: ${noms.length}/4`)

phase('tally')
const slate = await agent(tallyPrompt(noms), { label: 'tally', phase: 'tally', schema: SLATE_SCHEMA, agentType: 'general-purpose', effort: 'high' })

return { status: 'DONE', surveyors: noms, slate }
