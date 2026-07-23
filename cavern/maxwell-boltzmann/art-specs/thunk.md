# Art asset — the weight-landing thunk (sound)

The sound of a gym-plate dropping onto the lid: a heavy, damped **thunk** — mass meeting
metal, no ring-out. The placeholder is a two-oscillator sine/triangle blip. This asset
replaces it with a real weighted impact whose body scales with the plate's weight.

## Art direction

- **A short, damped, low impact.** A fast body of low frequency (a soft ~60–120 Hz thud)
  with a brief mid transient (the plate face slapping the lid), decaying to silence in
  ~150–300 ms. Felt, not brittle. NO long boom, NO metallic ring, NO reverb — the gas
  swallows it. Think a heavy plate set down firmly on a steel bar.
- **`weight` maps to depth + heft.** A heavier plate → lower fundamental, a touch longer
  and louder. `weight` is passed (e.g. 80/110/150); map it to pitch/decay so a big plate
  lands with more gravity than a small one.
- Deterministic; peak ≲ 0.45 into the muted-aware master so it never clips. No samples.

## EXACT API the candidate code must expose

Install a builder as **`window.LidSfx.thunk`**:

```js
window.LidSfx = window.LidSfx || {};
window.LidSfx.thunk = function (o) {
  // o = { ctx, dest, when, dur, gain, weight, seed }
  //   dur    : target length (s), ~0.25
  //   gain   : 0..1 peak
  //   weight : the plate's weight (heavier → lower/longer)
  // Schedule ONE impact into dest, start at `when`, done by ~when+dur. Do not touch dest.gain.
};
```

WAV bench: render one thunk at `weight≈120`, `dur≈0.25`.

## How it wires in

The winner replaces the `thunk:` method in the inline `Sfx` object in
`cavern/maxwell-boltzmann/lid.html`; it is already called from `endDrag` when a plate
lands on the lid, with the plate's weight. Honour `ws:pref:muted`.
