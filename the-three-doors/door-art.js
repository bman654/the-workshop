/* ═══════════════════════════════════════════════════════════════════════════
   door-art.js — The Three Doors' forged door SPRITE module (PLACEHOLDER).

   This is the placeholder the art foundry replaces. It defines the EXACT API the
   forged module must expose. The page (index.src.html) inlines this via forge and
   calls THREEDOORS_ART for every door face + the mini-grid glyphs.

   API CONTRACT (the forged module MUST keep these signatures):
     THREEDOORS_ART.drawDoor(state) → an SVG STRING for ONE door face, sized to fill
        its slot (use a viewBox; width/height 100%). state = {
          label : 'A' | 'B' | 'C'   — the engraved door letter
          mode  : 'closed' | 'goat' | 'car'  — closed door, goat revealed, car revealed
          dim   : { w, h }          — the slot's pixel box (for aspect; viewBox-relative draw is fine)
        }
        The wrapper element supplies hover/pick/win/lose glow + the swing transform,
        so the sprite itself should be a static face for the given mode.
     THREEDOORS_ART.glyph(kind) → a tiny inline SVG STRING ('car' | 'goat'),
        ~14px, used decoratively (currently the grid uses CSS dots, but the API is here).

   Estate finish: gold/brass on ink-violet; teal = the car (the prize), muted slate = a goat.
   ═══════════════════════════════════════════════════════════════════════════ */
const THREEDOORS_ART = (function(){
  // a paneled brass door, closed — the default face
  function closedFace(label){
    return `
      <defs>
        <linearGradient id="brass-${label}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e9c97e"/>
          <stop offset="0.5" stop-color="#b8924a"/>
          <stop offset="1" stop-color="#6e5326"/>
        </linearGradient>
        <linearGradient id="brassdk-${label}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#5a4424"/>
          <stop offset="1" stop-color="#2e2212"/>
        </linearGradient>
      </defs>
      <rect x="6" y="4" width="96" height="180" rx="7" fill="url(#brassdk-${label})" stroke="#7d6224" stroke-width="2"/>
      <rect x="11" y="9" width="86" height="170" rx="5" fill="url(#brass-${label})" opacity="0.94"/>
      <rect x="20" y="20" width="68" height="68" rx="4" fill="none" stroke="#6e5326" stroke-width="2.2" opacity="0.7"/>
      <rect x="20" y="100" width="68" height="62" rx="4" fill="none" stroke="#6e5326" stroke-width="2.2" opacity="0.7"/>
      <rect x="20" y="20" width="68" height="68" rx="4" fill="#f5e7c4" opacity="0.06"/>
      <rect x="20" y="100" width="68" height="62" rx="4" fill="#f5e7c4" opacity="0.06"/>
      <text x="54" y="60" text-anchor="middle" font-family="Iowan Old Style, Palatino, Georgia, serif"
            font-size="34" font-weight="700" fill="#3a2c12" opacity="0.55">${label}</text>
      <circle cx="86" cy="96" r="5.5" fill="#f2d995" stroke="#8a6a2e" stroke-width="1"/>
      <circle cx="84.5" cy="94.5" r="1.6" fill="#fff" opacity="0.7"/>`;
  }
  // the open frame — a dark doorway the prize sits inside
  function openFrame(){
    return `
      <rect x="6" y="4" width="96" height="180" rx="7" fill="#0b0907" stroke="#2a2014" stroke-width="2"/>
      <rect x="13" y="11" width="82" height="166" rx="4" fill="#08060a"/>
      <rect x="13" y="11" width="82" height="166" rx="4" fill="url(#vig)" opacity="0.5"/>
      <defs>
        <radialGradient id="vig" cx="0.5" cy="0.45" r="0.7">
          <stop offset="0" stop-color="#1a1410"/>
          <stop offset="1" stop-color="#000"/>
        </radialGradient>
      </defs>`;
  }
  // the CAR — the prize (teal/gold), drawn as a simple in-house roadster glyph
  function carGlyph(){
    return `
      <g transform="translate(54,98)">
        <ellipse cx="0" cy="30" rx="34" ry="6" fill="#000" opacity="0.4"/>
        <path d="M -32 6 L -22 -10 Q -18 -16 -10 -16 L 12 -16 Q 20 -16 26 -8 L 34 4 L 34 16 Q 34 22 28 22 L -28 22 Q -34 22 -34 16 Z"
              fill="#6fd3c4" stroke="#a8eee2" stroke-width="1.5"/>
        <path d="M -18 -10 L -10 -14 L 8 -14 L 16 -10 L 16 0 L -18 0 Z" fill="#0d2b28" opacity="0.85"/>
        <line x1="-1" y1="-12" x2="-1" y2="0" stroke="#6fd3c4" stroke-width="1.3" opacity="0.8"/>
        <circle cx="-18" cy="22" r="8" fill="#16110b" stroke="#c9a24a" stroke-width="2.5"/>
        <circle cx="18" cy="22" r="8" fill="#16110b" stroke="#c9a24a" stroke-width="2.5"/>
        <circle cx="32" cy="2" r="3" fill="#f5e7c4"/>
      </g>
      <text x="54" y="158" text-anchor="middle" font-family="ui-monospace, monospace"
            font-size="9" letter-spacing="1" fill="#6fd3c4" font-weight="700">THE CAR</text>`;
  }
  // a GOAT — the booby prize, a muted slate glyph (horns + beard, unmistakably a goat)
  function goatGlyph(){
    return `
      <g transform="translate(54,98)">
        <ellipse cx="0" cy="30" rx="30" ry="5.5" fill="#000" opacity="0.4"/>
        <ellipse cx="2" cy="6" rx="26" ry="15" fill="#3a4750" stroke="#5a6b76" stroke-width="1.5"/>
        <path d="M -20 -2 Q -30 -2 -32 8 L -26 10 Q -24 2 -18 4 Z" fill="#2c373e"/>
        <ellipse cx="-26" cy="-2" rx="11" ry="9" fill="#46555f" stroke="#5a6b76" stroke-width="1.5"/>
        <path d="M -33 -8 Q -40 -18 -36 -24" fill="none" stroke="#c9a24a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M -22 -10 Q -26 -22 -20 -28" fill="none" stroke="#c9a24a" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="-30" cy="-3" r="1.7" fill="#0b0907"/>
        <path d="M -34 6 L -34 14" stroke="#5a6b76" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <text x="54" y="158" text-anchor="middle" font-family="ui-monospace, monospace"
            font-size="9" letter-spacing="1" fill="#a79ab2" font-weight="700">A GOAT</text>`;
  }

  function drawDoor(state){
    const label = (state && state.label) || 'A';
    const mode = (state && state.mode) || 'closed';
    let inner;
    if (mode === 'closed') inner = closedFace(label);
    else if (mode === 'car') inner = openFrame() + carGlyph();
    else inner = openFrame() + goatGlyph();
    return `<svg viewBox="0 0 108 188" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">${inner}</svg>`;
  }

  function glyph(kind){
    if (kind === 'car')
      return `<svg viewBox="0 0 16 12" width="14" height="11"><path d="M1 8 L3 3 H10 L13 6 V9 H1 Z" fill="#6fd3c4"/></svg>`;
    return `<svg viewBox="0 0 16 12" width="14" height="11"><ellipse cx="8" cy="7" rx="6" ry="4" fill="#3a4750"/></svg>`;
  }

  return { drawDoor, glyph };
})();
