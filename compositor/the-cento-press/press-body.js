/* THE CENTO PRESS — the press itself.
 *
 * A 19th-century cylinder proof press, drawn as a frontal elevation in the
 * exhibit's own warm-dark idiom: blackened cast-iron standards, an oak
 * cabinet under the bed, a PACKED cylinder (steel drum + wrapped tympan,
 * bearer rings proud at each end), and two full-width ink rollers charged
 * with oxblood.
 *
 * Built ONCE per <svg>, then only the moving parts are mutated — the rig sinks
 * a hair under strain, the tympan's bale bar / grippers / stitched seam ride
 * around the drum with `turn`, the nip darkens as the bearers bite, and the
 * rollers switch from dry grey to charged oxblood on `inked`.
 *
 * window.CentoArt.press.draw(svg, {w,h,turn,strain,inked})
 * Emits an empty <g id="chase"> in the bed; the page injects the forme.
 */
(function () {
  "use strict";

  var UID = 0;
  var TAU = Math.PI * 2;

  /* ── geometry (viewBox 0 0 404 292) ───────────────────────────────────── */
  var AX = 147;                      /* the machine's axis of symmetry       */
  var DX0 = 44, DX1 = 250;           /* drum extent                          */
  var DTOP = 56, DBOT = 130;
  var DCY = (DTOP + DBOT) / 2;       /* 93                                   */
  var DR = (DBOT - DTOP) / 2;        /* 37                                   */
  var FX0 = 58, FX1 = 236;           /* tympan face (inside the bearers)     */
  /* the lightening window cored out of the drive standard (local coords) */
  var WIN = 'M27 204 Q20 194 22.5 178 Q25 156 32 152 Q40 155 40 178 L40 194 ' +
    'Q37 208 27 204 Z';

  function n2(v) { return Math.round(v * 100) / 100; }

  /* ── material grain filters ───────────────────────────────────────────── */
  function grain(id, freq, oct, seed, slope, inter) {
    return '<filter id="' + id + '" x="-3%" y="-3%" width="106%" height="106%" ' +
      'color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="' + oct +
      '" seed="' + seed + '" result="n"/>' +
      '<feColorMatrix in="n" type="matrix" result="m" values=' +
      '".34 .34 .34 0 0  .34 .34 .34 0 0  .34 .34 .34 0 0  0 0 0 0 1"/>' +
      '<feComponentTransfer in="m" result="c">' +
      '<feFuncR type="linear" slope="' + slope + '" intercept="' + inter + '"/>' +
      '<feFuncG type="linear" slope="' + slope + '" intercept="' + inter + '"/>' +
      '<feFuncB type="linear" slope="' + slope + '" intercept="' + inter + '"/>' +
      '</feComponentTransfer>' +
      '<feComposite in="c" in2="SourceGraphic" operator="in" result="k"/>' +
      '<feBlend in="k" in2="SourceGraphic" mode="overlay"/>' +
      '</filter>';
  }

  function stops(list) {
    var s = '', i;
    for (i = 0; i < list.length; i++)
      s += '<stop offset="' + list[i][0] + '" stop-color="' + list[i][1] +
        (list[i][2] != null ? '" stop-opacity="' + list[i][2] : '') + '"/>';
    return s;
  }
  function lg(id, x1, y1, x2, y2, list) {
    return '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 +
      '" y2="' + y2 + '">' + stops(list) + '</linearGradient>';
  }

  /* ── bolt heads ───────────────────────────────────────────────────────── */
  function bolt(x, y, r, u) {
    r = r || 2.1;
    return '<g><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#bolt' + u + ')"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="#12100d" ' +
      'stroke-width=".45" opacity=".8"/>' +
      '<path d="M' + n2(x - r * 0.55) + ' ' + n2(y - r * 0.2) + 'L' + n2(x + r * 0.5) + ' ' +
      n2(y + r * 0.25) + '" stroke="#0f0d0b" stroke-width=".5" opacity=".55"/>' +
      '<circle cx="' + n2(x - r * 0.3) + '" cy="' + n2(y - r * 0.34) + '" r="' + n2(r * 0.3) +
      '" fill="#b7a893" opacity=".5"/></g>';
  }
  function boltRow(x0, x1, y, cnt, r, u) {
    var s = '', i;
    for (i = 0; i < cnt; i++) s += bolt(n2(x0 + (x1 - x0) * (i / (cnt - 1))), y, r, u);
    return s;
  }

  /* the medallion's legend: cast letters, deliberately too small to read —
     a ring of raised ticks on the ellipse, the way a foundry mark actually
     survives a century of ink and rag */
  function medallionLetters() {
    var s = '', i, a, rx = 5.4, ry = 7.1, x, y, dx, dy, L;
    for (i = 0; i < 22; i++) {
      if (i > 8 && i < 13) continue;              /* a gap at the base */
      a = -Math.PI / 2 + (i / 22) * TAU;
      x = 30 + Math.cos(a) * rx; y = 150 + Math.sin(a) * ry;
      dx = Math.cos(a) * 1.5; dy = Math.sin(a) * 1.9;
      L = (i % 3 === 0) ? 1.35 : 1;
      s += '<path d="M' + n2(x - dx * L) + ' ' + n2(y - dy * L) + 'L' + n2(x + dx * L) + ' ' +
        n2(y + dy * L) + '" stroke="#0f0d0b" stroke-width="1" stroke-linecap="round" opacity=".6"/>' +
        '<path d="M' + n2(x - dx * L) + ' ' + n2(y - dy * L - 0.45) + 'L' + n2(x + dx * L) + ' ' +
        n2(y + dy * L - 0.45) + '" stroke="#98897240" stroke-width=".7" stroke-linecap="round"/>';
    }
    return s;
  }

  /* a chain wheel — teeth cut round a hub, drawn small enough that it reads as
     a toothed wheel and not as a gear diagram */
  function sprocket(cx, cy, r, teeth, u) {
    var s = '<g><circle cx="' + cx + '" cy="' + cy + '" r="' + n2(r) + '" fill="#1a1613"/>', i, a;
    for (i = 0; i < teeth; i++) {
      a = (i / teeth) * TAU;
      s += '<path d="M' + n2(cx + Math.cos(a) * (r - 0.6)) + ' ' + n2(cy + Math.sin(a) * (r - 0.6)) +
        'L' + n2(cx + Math.cos(a) * (r + 1.5)) + ' ' + n2(cy + Math.sin(a) * (r + 1.5)) +
        '" stroke="#2b251f" stroke-width="1.5" stroke-linecap="round"/>';
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + n2(r * 0.42) + '" fill="url(#stl' + u +
      ')"/><circle cx="' + cx + '" cy="' + cy + '" r="' + n2(r * 0.42) +
      '" fill="none" stroke="#0d0b0a" stroke-width=".5"/>' +
      '<path d="M' + n2(cx - r * 0.7) + ' ' + n2(cy - r * 0.62) + 'A' + n2(r) + ' ' + n2(r) +
      ' 0 0 1 ' + n2(cx + r * 0.6) + ' ' + n2(cy - r * 0.72) +
      '" fill="none" stroke="#a2947e" stroke-width=".6" opacity=".35"/></g>';
    return s;
  }

  /* the chain running up the drive standard, seen through its lightening
     window: two strands off a wheel on the shaft to the drum's journal */
  function chainRun(u) {
    var s = '<g clip-path="url(#win' + u + ')">';
    /* the window's own darkness — you are looking INTO the casting */
    s += '<rect x="16" y="146" width="28" height="62" fill="#080706"/>';
    s += sprocket(32, 112, 6.2, 11, u);
    [[23.5, 189, 25.8, 112], [38.7, 189, 38.2, 112]].forEach(function (t) {
      var d = 'M' + t[0] + ' ' + t[1] + 'L' + t[2] + ' ' + t[3];
      s += '<path d="' + d + '" stroke="#141110" stroke-width="3.4" stroke-linecap="butt"/>' +
        '<path d="' + d + '" stroke="#6e6355" stroke-width="3.4" stroke-dasharray="1.1 2.3" ' +
        'opacity=".5"/>' +
        '<path d="' + d + '" stroke="#a2947e" stroke-width=".5" opacity=".26" ' +
        'transform="translate(-1.3,0)"/>';
    });
    /* a little light spills onto the inside of the window's lower lip */
    s += '<path d="M23 197 Q31 203 39 194" fill="none" stroke="#6c604f" stroke-width=".8" ' +
      'opacity=".3"/>';
    s += '</g>';
    return s;
  }

  /* ── the cast-iron standards. `drive` gets a lightening window with the
       chain running through it; the ink side carries the maker's medallion. ── */
  function standard(u, drive) {
    var body =
      /* outer profile: a flared foot, a waisted column, a nouveau shoulder */
      '<path d="M6 264 L6 250 Q6 240 15 236 L18 218 Q11 202 15 187 Q20 174 20 168 ' +
      'Q12 150 16 131 Q21 114 21 101 Q21 82 33 74 L48 74 L48 264 Z" ' +
      'fill="url(#irC' + u + ')"/>' +
      /* the lit left arris */
      '<path d="M6 264 L6 250 Q6 240 15 236 L18 218 Q11 202 15 187 Q20 174 20 168 ' +
      'Q12 150 16 131 Q21 114 21 101 Q21 82 33 74" fill="none" stroke="#a2947e" ' +
      'stroke-width="1.15" opacity=".55"/>' +
      /* casting parting line down the face */
      '<path d="M31 78 Q28 108 30 132 Q26 152 30 170 Q25 190 30 210 Q28 230 26 240" ' +
      'fill="none" stroke="#171310" stroke-width=".6" opacity=".65"/>' +
      '<path d="M32 78 Q29 108 31 132 Q27 152 31 170 Q26 190 31 210 Q29 230 27 240" ' +
      'fill="none" stroke="#867a68" stroke-width=".45" opacity=".3"/>' +
      (drive
        /* the lightening window: the casting is hollowed where it can be, and
           the drive chain runs up the inside of it */
        ? '<path d="' + WIN + '" fill="#0d0a08"/>' + chainRun(u) +
          '<path d="M27 204 Q20 194 22.5 178 Q25 156 32 152 Q40 155 40 178" fill="none" ' +
          'stroke="#7d715f" stroke-width=".8" opacity=".45"/>' +
          '<path d="M28 205.4 Q21 195 23.5 179" fill="none" stroke="#050404" stroke-width=".9" ' +
          'opacity=".7"/>'
        /* the ink side keeps a pierced lobed void — the room shows through */
        : '<path d="M27 233 Q19 214 23 195 Q26 182 32 181 Q39 182 39 195 L39 224 Q35 240 27 233 Z" ' +
          'fill="#0d0a08"/>' +
          '<path d="M27 233 Q19 214 23 195 Q26 182 32 181 Q39 182 39 195" fill="none" ' +
          'stroke="#7d715f" stroke-width=".7" opacity=".42"/>') +
      /* cast maker's medallion — lettered too small to read, as a casting is.
         One casting carries the mark; the other carries the drive. */
      (drive ? '' :
      '<g><ellipse cx="30" cy="150" rx="10.5" ry="13" fill="url(#irC' + u + ')"/>' +
      '<ellipse cx="30" cy="150" rx="10.5" ry="13" fill="none" stroke="#0f0d0b" stroke-width=".9"/>' +
      '<ellipse cx="30" cy="149.2" rx="10.5" ry="13" fill="none" stroke="#a2947e" ' +
      'stroke-width=".55" opacity=".45"/>' +
      '<ellipse cx="30" cy="150" rx="7.4" ry="9.6" fill="none" stroke="#181410" stroke-width=".55"/>' +
      medallionLetters() +
      '<path d="M30 147.4 l1.5 2.1 2.5.2 -1.9 1.7 .6 2.5 -2.7-1.4 -2.7 1.4 .6-2.5 -1.9-1.7 ' +
      '2.5-.2 z" fill="#8c7f6c" opacity=".38"/>' +
      '<path d="M30 146.9 l1.5 2.1 2.5.2 -1.9 1.7 .6 2.5 -2.7-1.4 -2.7 1.4 .6-2.5 -1.9-1.7 ' +
      '2.5-.2 z" fill="#0f0d0b" opacity=".5"/></g>') +
      bolt(30, 96, 2.3, u) + bolt(24, 253, 2.3, u) + bolt(39, 253, 2.3, u);
    return body;
  }

  /* ── the top bearing housing (left; mirrored right). `cap` adds the
       impression screw the drive side carries above its journal. ────────── */
  function housing(u, cap) {
    var s = '<g>' +
      '<path d="M13 116 L13 88 Q13 74 30 72 L50 72 L50 116 Z" fill="url(#irC' + u + ')"/>' +
      '<path d="M13 88 Q13 74 30 72 L50 72" fill="none" stroke="#b0a289" stroke-width="1.2" ' +
      'opacity=".6"/>' +
      /* the split cap, taken on the journal's own centreline */
      '<path d="M13 93 L50 93" stroke="#12100d" stroke-width=".9" opacity=".85"/>' +
      '<path d="M13 94.1 L50 94.1" stroke="#8b7f6c" stroke-width=".5" opacity=".3"/>' +
      bolt(19, 83, 2.2, u) + bolt(19, 103, 2.2, u) + bolt(45, 103, 2.2, u);

    /* THE JOURNAL BOSS — the drum's axle enters the frame here, and the bolt
       circle round it is what says the drum is journalled and not just laid on */
    s += '<circle cx="35" cy="93" r="11.2" fill="url(#irH' + u + ')"/>' +
      '<circle cx="35" cy="93" r="11.2" fill="none" stroke="#100e0c" stroke-width=".9"/>' +
      '<path d="M25.4 87.4 A11.2 11.2 0 0 1 44 87.8" fill="none" stroke="#bcac91" ' +
      'stroke-width="1.05" opacity=".5"/>';
    var i, a;
    for (i = 0; i < 6; i++) {
      a = -Math.PI / 2 + (i / 6) * TAU + 0.26;
      s += bolt(n2(35 + Math.cos(a) * 7.8), n2(93 + Math.sin(a) * 7.8), 1.5, u);
    }
    s += '<path d="M24.6 93 L45.4 93" stroke="#100e0c" stroke-width=".55" opacity=".5"/>' +
      '<circle cx="35" cy="93" r="4.7" fill="url(#stl' + u + ')"/>' +
      '<circle cx="35" cy="93" r="4.7" fill="none" stroke="#0c0a09" stroke-width=".6"/>' +
      '<circle cx="33.3" cy="91.2" r="1.5" fill="#efe3c8" opacity=".28"/>';

    /* oil cup */
    s += '<rect x="27" y="63.5" width="6.4" height="6" rx="1.6" fill="url(#brs' + u + ')"/>' +
      '<rect x="28.6" y="60.6" width="3.2" height="3.6" rx="1.4" fill="url(#brs' + u + ')"/>' +
      '<path d="M27.6 64.4h5.2" stroke="#2a2018" stroke-width=".5" opacity=".7"/>';

    if (cap) {
      /* the impression screw: what actually sets how hard the drum bears on
         the forme. It caps the standard the ink train no longer stands over. */
      s += '<rect x="22" y="57.6" width="22" height="6" rx="1.3" fill="url(#irH' + u + ')"/>' +
        '<rect x="22" y="57.6" width="22" height="1.2" rx=".6" fill="#c2b295" opacity=".5"/>' +
        '<rect x="24.4" y="63.6" width="17.2" height="2.6" fill="#100e0c" opacity=".45"/>' +
        /* the square-thread stem */
        '<rect x="28.6" y="45" width="9.4" height="13" fill="url(#stl' + u + ')"/>';
      for (i = 0; i < 5; i++)
        s += '<path d="M28.6 ' + n2(47 + i * 2.3) + 'h9.4" stroke="#100e0c" ' +
          'stroke-width=".6" opacity=".5"/>';
      s += '<rect x="28.6" y="45" width="9.4" height="13" fill="none" stroke="#12100d" ' +
        'stroke-width=".5" opacity=".6"/>' +
        /* the collar the screw bears on, and the tommy bar through its head */
        '<rect x="26.4" y="42.2" width="13.8" height="3.6" rx="1" fill="url(#irH' + u + ')"/>' +
        '<rect x="26.4" y="42.2" width="13.8" height="1" rx=".5" fill="#c2b295" opacity=".5"/>' +
        '<rect x="23.4" y="36.6" width="20" height="6" rx="2.8" fill="url(#irH' + u + ')"/>' +
        '<rect x="24.4" y="37" width="18" height="1.4" rx=".7" fill="#c9b997" opacity=".5"/>' +
        bolt(33.3, 39.6, 1.7, u);
    }
    return s + '</g>';
  }

  /* ── the whole markup, built once ─────────────────────────────────────── */
  function markup(u) {
    var s = [], i, x;

    /* ══ defs ══ */
    s.push('<defs>');
    s.push(grain('gIron' + u, '1.15', 3, 9, '.26', '.37'));
    s.push(grain('gOak' + u, '.013 .52', 5, 4, '.44', '.28'));
    s.push(grain('gInk' + u, '.55 1.0', 2, 17, '.20', '.40'));
    s.push('<filter id="blr' + u + '" x="-60%" y="-160%" width="220%" height="420%">' +
      '<feGaussianBlur stdDeviation="5"/></filter>');
    s.push('<filter id="blrS' + u + '" x="-40%" y="-120%" width="180%" height="340%">' +
      '<feGaussianBlur stdDeviation="2"/></filter>');

    /* cast iron: a column lit from the upper LEFT — blackened, matte, never chrome */
    s.push(lg('irC' + u, 0, 0, 1, 0, [[0, '#736758'], [.11, '#443d34'], [.34, '#2a2521'],
      [.66, '#171412'], [.9, '#100e0d'], [1, '#241f1b']]));
    /* cast iron: a horizontal member lit from ABOVE */
    s.push(lg('irH' + u, 0, 0, 0, 1, [[0, '#8b7c67'], [.1, '#4b4339'], [.36, '#282320'],
      [.72, '#141210'], [1, '#26211d']]));
    /* polished steel bearer ring */
    s.push(lg('stl' + u, 0, 0, 0, 1, [[0, '#ded1b6'], [.08, '#a2957f'], [.26, '#544c42'],
      [.5, '#241f1c'], [.8, '#131110'], [1, '#6d6355']]));
    /* the tympan-wrapped drum — a true cylinder: one narrow lit crest,
       a long fall into black, one cool bounce at the underside */
    s.push(lg('tym' + u, 0, 0, 0, 1, [[0, '#5f5648'], [.045, '#8a7c69'], [.1, '#6a5f51'],
      [.24, '#403930'], [.42, '#282320'], [.62, '#171513'], [.8, '#0e0c0b'],
      [.92, '#151312'], [.98, '#2e2822'], [1, '#3d362e']]));
    /* oak */
    s.push(lg('oak' + u, 0, 0, 0, 1, [[0, '#7a5433'], [.22, '#5a3e26'], [.6, '#3a2818'],
      [1, '#1f150e']]));
    s.push(lg('oakP' + u, 0, 0, 0, 1, [[0, '#472f1d'], [.35, '#332314'], [1, '#1c130c']]));
    /* oxblood ink, charged — dark, tacky, barely reflective */
    s.push(lg('oxb' + u, 0, 0, 0, 1, [[0, '#3b1c17'], [.07, '#6d3227'], [.2, '#55201a'],
      [.42, '#3b1310'], [.68, '#210a09'], [.9, '#130606'], [1, '#2a0f0c']]));
    /* dry roller composition */
    s.push(lg('dry' + u, 0, 0, 0, 1, [[0, '#5f5648'], [.07, '#6d6354'], [.3, '#413a32'],
      [.62, '#241f1b'], [.88, '#141211'], [1, '#332c26']]));
    /* brass fittings */
    s.push(lg('brs' + u, 0, 0, 0, 1, [[0, '#d9b672'], [.4, '#9c8350'], [1, '#5e4c2c']]));
    /* the drive shaft */
    s.push(lg('shf' + u, 0, 0, 0, 1, [[0, '#b3a794'], [.2, '#7a7062'], [.55, '#3c3730'],
      [1, '#6a6154']]));
    /* bolt head */
    s.push('<radialGradient id="bolt' + u + '" cx=".34" cy=".3" r=".82">' +
      stops([[0, '#9c9080'], [.5, '#57503f'], [1, '#241f19']]) + '</radialGradient>');
    /* the specular sweep on the drum */
    /* soft top-lit steel under a tympan — cool it off chrome */
    s.push(lg('spc' + u, 0, 0, 0, 1, [[0, '#efe6d6', 0], [.3, '#e6dcc9', .44],
      [.55, '#d5c8b0', .18], [1, '#c8bba4', 0]]));
    /* nip shadow, and the chase recess */
    s.push(lg('nip' + u, 0, 0, 0, 1, [[0, '#000000', .85], [1, '#000000', 0]]));
    s.push(lg('chs' + u, 0, 0, 0, 1, [[0, '#070605'], [.3, '#141010'], [1, '#0c0a09']]));
    /* the room's key + bounce */
    s.push('<radialGradient id="key' + u + '" cx=".1" cy="-.04" r=".88">' +
      stops([[0, '#ffd193', .12], [.42, '#ffbe74', .045], [1, '#ffb060', 0]]) + '</radialGradient>');
    s.push(lg('bnc' + u, 1, 1, 0, 0, [[0, '#8fb4d6', .09], [.42, '#8fb4d6', .02],
      [1, '#8fb4d6', 0]]));
    /* the floor's contact shadow */
    s.push('<radialGradient id="flr' + u + '" cx=".5" cy=".5" r=".5">' +
      stops([[0, '#000000', .8], [.55, '#000000', .45], [1, '#000000', 0]]) + '</radialGradient>');
    /* tympan quilting: circumferential lines stay put as the drum turns */
    s.push('<pattern id="qlt' + u + '" width="23.4" height="10" patternUnits="userSpaceOnUse">' +
      '<rect x="0" y="0" width=".6" height="10" fill="#e7dcc6" opacity=".03"/>' +
      '<rect x="11.7" y="0" width=".5" height="10" fill="#000000" opacity=".07"/>' +
      '</pattern>');
    /* the drive standard's lightening window, so the chain stays inside it */
    s.push('<clipPath id="win' + u + '"><path d="' + WIN + '"/></clipPath>');
    /* the drum's clip, so the tympan features never spill past its ends */
    s.push('<clipPath id="dclp' + u + '"><rect x="' + DX0 + '" y="' + DTOP + '" width="' +
      (DX1 - DX0) + '" height="' + (DBOT - DTOP) + '" rx="9"/></clipPath>');
    /* the rollers' own clips, so the ink's unevenness stays on the roller */
    s.push('<clipPath id="rclp' + u + '_0"><rect x="58" y="23.1" width="80" height="14.8" ' +
      'rx="7.4"/></clipPath>');
    s.push('<clipPath id="rclp' + u + '_1"><rect x="50" y="38.5" width="88" height="18" ' +
      'rx="9"/></clipPath>');
    /* a small flat ink pool reads darker than a roller's lit crown */
    s.push(lg('oxbF' + u, 0, 0, 0, 1, [[0, '#6a2a20'], [.45, '#48150f'], [1, '#26090a']]));
    /* the slab's own film: worked thin, nearly spent — it must not out-shout
       the charged rollers, which are the piece's one true note of oxblood */
    s.push(lg('oxbS' + u, 0, 0, 0, 1, [[0, '#4c1a14'], [.5, '#2c0b08'], [1, '#190505']]));
    s.push('</defs>');

    /* ══ the floor ══ */
    s.push('<ellipse cx="' + (AX + 8) + '" cy="281" rx="152" ry="11" fill="url(#flr' + u + ')"/>');
    s.push('<ellipse cx="' + (AX + 10) + '" cy="279" rx="126" ry="5.5" fill="#000" opacity=".6" ' +
      'filter="url(#blrS' + u + ')"/>');

    /* ══ the FAR side of the machine — darker, lifted, converging ══ */
    s.push('<g opacity=".92" fill="#1a1613">');
    s.push('<path d="M28 246 L28 176 Q26 150 32 128 L32 92 L52 92 L52 246 Z"/>');
    s.push('<path d="M' + (2 * AX - 52) + ' 246 L' + (2 * AX - 52) + ' 92 L' + (2 * AX - 32) +
      ' 92 L' + (2 * AX - 32) + ' 128 Q' + (2 * AX - 26) + ' 150 ' + (2 * AX - 28) + ' 176 L' +
      (2 * AX - 28) + ' 246 Z"/>');
    s.push('<rect x="40" y="120" width="214" height="12" rx="2"/>');
    s.push('</g>');
    s.push('<rect x="40" y="120" width="214" height="4" fill="#4a4238" opacity=".45"/>');

    /* ══ the oak cabinet under the bed ══ */
    s.push('<g filter="url(#gOak' + u + ')">');
    s.push('<rect x="38" y="172" width="218" height="84" fill="url(#oak' + u + ')"/>');
    /* two panelled doors */
    for (i = 0; i < 2; i++) {
      x = 46 + i * 104;
      s.push('<rect x="' + x + '" y="180" width="96" height="66" rx="1.5" fill="url(#oakP' + u +
        ')"/>');
      s.push('<rect x="' + (x + 5) + '" y="185" width="86" height="56" rx="1" fill="url(#oak' + u +
        ')" opacity=".92"/>');
    }
    s.push('</g>');
    /* the joinery reads over the grain: bevels, strap hinges, a pull */
    for (i = 0; i < 2; i++) {
      x = 46 + i * 104;
      s.push('<path d="M' + x + ' 246 L' + x + ' 180 L' + (x + 96) + ' 180" fill="none" ' +
        'stroke="#100b07" stroke-width="1.1" opacity=".8"/>');
      s.push('<path d="M' + (x + 1) + ' 246 L' + (x + 1) + ' 181 L' + (x + 96) + ' 181" ' +
        'fill="none" stroke="#8d6540" stroke-width=".5" opacity=".38"/>');
      s.push('<path d="M' + (x + 5) + ' 241 L' + (x + 91) + ' 241 L' + (x + 91) + ' 185" ' +
        'fill="none" stroke="#8d6540" stroke-width=".55" opacity=".3"/>');
      s.push('<path d="M' + (x + 5) + ' 241 L' + (x + 5) + ' 185 L' + (x + 91) + ' 185" ' +
        'fill="none" stroke="#0e0a06" stroke-width=".8" opacity=".6"/>');
      /* strap hinges */
      s.push('<path d="M' + (x + 2) + ' 191 h26 l4 3 -4 3 h-26 z" fill="#241f19"/>' +
        '<path d="M' + (x + 2) + ' 191 h26 l4 3" fill="none" stroke="#8b7f6c" stroke-width=".5" ' +
        'opacity=".45"/>');
      s.push('<path d="M' + (x + 2) + ' 231 h26 l4 3 -4 3 h-26 z" fill="#241f19"/>' +
        '<path d="M' + (x + 2) + ' 231 h26 l4 3" fill="none" stroke="#8b7f6c" stroke-width=".5" ' +
        'opacity=".45"/>');
      s.push(bolt(x + 8, 194, 1.3, u) + bolt(x + 22, 194, 1.3, u) +
        bolt(x + 8, 234, 1.3, u) + bolt(x + 22, 234, 1.3, u));
      /* the pull */
      s.push('<rect x="' + (x + (i ? 8 : 84)) + '" y="209" width="4" height="9" rx="2" ' +
        'fill="url(#brs' + u + ')"/>');
    }
    /* the shelf shadow the cabinet lives in */
    s.push('<rect x="38" y="172" width="218" height="7" fill="#000" opacity=".45"/>');
    s.push('<rect x="38" y="250" width="218" height="6" fill="#000" opacity=".4"/>');
    /* a shadow gap where the cabinet meets the iron base, so the lower half
       reads as a machine bolted to a plinth and not as a sideboard */
    s.push('<rect x="36" y="242" width="222" height="7" fill="#000" opacity=".5"/>');
    s.push('<rect x="36" y="241.4" width="222" height="1" fill="#0a0705" opacity=".8"/>');

    /* ══ the base plinth ══ */
    s.push('<g filter="url(#gIron' + u + ')">');
    s.push('<rect x="12" y="248" width="270" height="9" rx="1.6" fill="url(#irH' + u + ')"/>');
    s.push('<rect x="18" y="256" width="258" height="19" fill="url(#irH' + u + ')"/>');
    s.push('<rect x="14" y="273" width="266" height="7" rx="1.4" fill="url(#irH' + u + ')"/>');
    s.push('</g>');
    s.push('<rect x="12" y="248" width="270" height="1.5" fill="#b6a78e" opacity=".5"/>');
    s.push('<rect x="18" y="256" width="258" height="1" fill="#8b7f6c" opacity=".28"/>');
    s.push('<rect x="14" y="273" width="266" height="1.2" fill="#a2947e" opacity=".38"/>');
    s.push(boltRow(30, 264, 265, 8, 2.2, u));

    /* ══ the bed casting ══ */
    s.push('<g filter="url(#gIron' + u + ')">');
    s.push('<rect x="24" y="130" width="246" height="46" fill="url(#irH' + u + ')"/>');
    s.push('</g>');
    /* the rails the cylinder runs on */
    s.push('<rect x="24" y="130" width="246" height="1.8" fill="#d3c2a4" opacity=".72"/>');
    s.push('<rect x="24" y="131.8" width="246" height="3" fill="#2b2620" opacity=".5"/>');
    /* the chase recess — a genuine sunk bed */
    s.push('<rect x="30" y="133" width="234" height="33" rx="1" fill="url(#chs' + u + ')"/>');
    /* the recess walls: the near/right walls catch the key, the far ones swallow it */
    s.push('<path d="M30 166 L30 133 L264 133" fill="none" stroke="#050404" stroke-width="1.8"/>');
    s.push('<path d="M31.6 165 L263 165 L263 134.6" fill="none" stroke="#87795f" ' +
      'stroke-width="1" opacity=".55"/>');
    s.push('<rect x="30" y="163.4" width="234" height="2.6" fill="#5b5145" opacity=".45"/>');

    /* ══ THE CHASE — the page lays the forme in here ══ */
    s.push('<g id="chase"></g>');

    /* ══ furniture + quoins locking the forme into the bed ══ */
    s.push('<g>');
    s.push('<rect x="32" y="133.4" width="230" height="4.4" fill="#332d27"/>');
    s.push('<rect x="32" y="133.4" width="230" height=".8" fill="#8b7d69" opacity=".4"/>');
    s.push('<rect x="32" y="136.9" width="230" height=".9" fill="#0a0908" opacity=".8"/>');
    s.push('<rect x="32" y="158.2" width="230" height="5.6" fill="#554c42"/>');
    s.push('<rect x="32" y="158.2" width="230" height=".9" fill="#a3947c" opacity=".5"/>');
    /* the furniture is made of pieces, not one strip */
    for (i = 0; i < 7; i++)
      s.push('<rect x="' + n2(32 + i * 32.9) + '" y="158.2" width=".7" height="5.6" ' +
        'fill="#0d0b0a" opacity=".55"/>');
    /* the quoins: opposed wedges, one pair at each end */
    for (i = 0; i < 2; i++) {
      var qx = i ? 258 : 26, sgn = i ? -1 : 1;
      s.push('<path d="M' + qx + ' 136 l' + (6 * sgn) + ' 0 l' + (-1.6 * sgn) +
        ' 26 l' + (-4.4 * sgn) + ' 0 z" fill="#5a5147"/>');
      s.push('<path d="M' + (qx + 5.4 * sgn) + ' 136 l' + (4.6 * sgn) + ' 0 l' + (1.4 * sgn) +
        ' 26 l' + (-4.4 * sgn) + ' 0 z" fill="#3b352d"/>');
      s.push('<path d="M' + qx + ' 136 l' + (10 * sgn) + ' 0" stroke="#a2947e" ' +
        'stroke-width=".7" opacity=".45"/>');
    }
    s.push('</g>');
    /* the bed's front lip */
    s.push('<rect x="22" y="166" width="250" height="10" rx="1.4" fill="url(#irH' + u + ')"/>');
    s.push('<rect x="22" y="166" width="250" height="1.4" fill="#b8a88f" opacity=".55"/>');
    s.push(boltRow(36, 258, 171, 7, 1.9, u));

    /* ══ the two cast-iron standards ══ */
    s.push('<g filter="url(#gIron' + u + ')">' + standard(u, false) + '</g>');
    s.push('<g filter="url(#gIron' + u + ')" transform="translate(' + (2 * AX) + ',0) scale(-1,1)">' +
      standard(u, true) + '</g>');

    /* ══ the drive: shaft out to the crank the page owns ══ */
    s.push('<g id="drive">');
    s.push('<rect x="256" y="183.4" width="92" height="11.4" rx="3" fill="url(#shf' + u + ')"/>');
    s.push('<rect x="256" y="183.4" width="92" height="1.3" fill="#d3c5aa" opacity=".5"/>');
    s.push('<rect x="256" y="191.6" width="92" height="1.6" fill="#0e0c0a" opacity=".5"/>');
    /* the chain wheel keyed on the shaft — the far end of the run you can see
       through the standard's window */
    s.push(sprocket(263, 189.1, 7.5, 13, u));
    /* the pillow block on the standard's outer face */
    s.push('<g filter="url(#gIron' + u + ')">' +
      '<path d="M272 202 L272 186 Q272 176 284 176 Q296 176 296 186 L296 202 Z" ' +
      'fill="url(#irH' + u + ')"/></g>');
    s.push('<path d="M272 186 Q272 176 284 176 Q296 176 296 186" fill="none" stroke="#b0a289" ' +
      'stroke-width="1" opacity=".5"/>');
    s.push('<rect x="272" y="188.6" width="24" height=".9" fill="#12100d" opacity=".8"/>');
    s.push(bolt(276, 198, 1.8, u) + bolt(292, 198, 1.8, u));
    s.push('<rect x="281" y="169" width="6" height="7" rx="1.6" fill="url(#brs' + u + ')"/>');
    s.push('<rect x="282.6" y="166" width="2.8" height="3.4" rx="1.3" fill="url(#brs' + u + ')"/>');
    /* a keyed collar, so the shaft reads as driven */
    s.push('<rect id="collar" x="308" y="181.4" width="9" height="15.4" rx="1.6" ' +
      'fill="url(#stl' + u + ')"/>');
    s.push('<rect x="308" y="181.4" width="9" height="1.2" fill="#e0d3ba" opacity=".5"/>');
    s.push('</g>');

    /* ══ THE CYLINDER RIG — everything that sinks under strain ══ */
    s.push('<g id="rig">');

    /* the nip: the shadow the drum casts into the bed */
    s.push('<rect id="nipsh" x="30" y="126" width="234" height="9" fill="url(#nip' + u + ')" ' +
      'opacity=".3"/>');
    s.push('<rect id="nipink" x="34" y="127" width="226" height="5" fill="#8e2f26" opacity="0"/>');

    /* --- the ink train, cantilevered off the LEFT frame only ---------------
       It ends at x≈144 so the sheet coming up off the cylinder (x150–246,
       y≤142) has a clear road. The drive lives on the right; the ink lives on
       the left; the machine is asymmetric because its work is. */
    s.push('<g id="inktrain">');
    var cheek = 'M25 78 Q19 58 22.5 41 Q26 22 40.5 17.5 Q52 18 52 29 L52 68 Q52 78 44 78 Z';
    s.push('<g filter="url(#gIron' + u + ')"><path d="' + cheek +
      '" fill="url(#irC' + u + ')"/></g>');
    s.push('<g><path d="M25 78 Q19 58 22.5 41 Q26 22 40.5 17.5 Q52 18 52 29" ' +
      'fill="none" stroke="#9d8f7a" stroke-width=".9" opacity=".4"/>' +
      '<ellipse cx="34" cy="52" rx="4.6" ry="9.5" fill="#0c0a09"/>' +
      '<path d="M29.6 52 Q29.6 43 34 42.5" fill="none" stroke="#7d715f" stroke-width=".6" ' +
      'opacity=".38"/>' + bolt(45, 24.5, 1.7, u) + bolt(31, 72, 1.7, u) + '</g>');
    /* the outboard stay: a slim casting of the same family carrying the far
       journals, dropping away behind the drum */
    s.push('<g filter="url(#gIron' + u + ')">' +
      '<path d="M128.5 22 Q137 19 143.5 23 Q146 44 143 72 L132 72 Q126.5 46 128.5 22 Z" ' +
      'fill="url(#irC' + u + ')"/></g>');
    s.push('<path d="M128.5 22 Q137 19 143.5 23" fill="none" stroke="#9d8f7a" ' +
      'stroke-width=".85" opacity=".42"/>');
    s.push('<path d="M131.6 27 Q129.6 46 131.6 66" fill="none" stroke="#171310" ' +
      'stroke-width=".6" opacity=".6"/>');
    s.push(bolt(136, 24.6, 1.6, u) + bolt(137.5, 66, 1.6, u));

    /* the ink slab — a shallow plate canted on the bracket, with the day's ink
       worked out thin across it and a machined take-off edge along its lip */
    s.push('<g filter="url(#gIron' + u + ')">' +
      '<path d="M31 70 L31 59.2 L9 59.2 L9 63.6 L26 63.6 L26 70 Z" fill="url(#irC' + u + ')"/>' +
      '</g>');
    s.push('<path d="M31 59.2 L9 59.2" fill="none" stroke="#9d8f7a" stroke-width=".7" ' +
      'opacity=".34"/>');
    /* the plate: a top face you can see the ink lying on, and its thickness */
    s.push('<g filter="url(#gIron' + u + ')">' +
      '<path d="M11 55.9 L39 55.9 L39 59.3 L11 59.3 Z" fill="url(#irC' + u + ')"/>' +
      '<path d="M6 53.4 L34 53.4 L39 55.9 L11 55.9 Z" fill="url(#irH' + u + ')"/></g>');
    /* the machined take-off lip catches the key */
    s.push('<path d="M34 53.4 L39 55.9" fill="none" stroke="#cdbc9c" stroke-width=".9" ' +
      'opacity=".62"/>');
    s.push('<path d="M6 53.4 L34 53.4" fill="none" stroke="#b3a48c" stroke-width=".6" ' +
      'opacity=".4"/>');
    s.push('<path d="M11 59.3 L39 59.3" fill="none" stroke="#0b0908" stroke-width=".7" ' +
      'opacity=".55"/>');
    /* the ink itself, worked out thin — a wiped film, not a puddle */
    s.push('<g filter="url(#gInk' + u + ')">' +
      '<path d="M8.6 53.9 L31.8 53.9 L36.4 56.2 Q28 56.4 20.4 56.4 ' +
      'Q15.6 56.4 12.8 56.3 Z" fill="url(#oxbS' + u + ')"/>' +
      '<path d="M14.6 54.5 Q22 54.3 29 54.3 L31 55.2 Q23.4 55.5 17 55.5 Z" ' +
      'fill="#43120d" opacity=".5"/></g>');
    /* two knife strokes where it was worked */
    s.push('<path d="M10.4 54.5 Q19 54.2 30.8 54.3" fill="none" stroke="#8e5749" ' +
      'stroke-width=".5" opacity=".26"/>');
    s.push('<path d="M13.4 55.6 Q22.4 55.3 33.4 55.6" fill="none" stroke="#66332a" ' +
      'stroke-width=".5" opacity=".32"/>');

    /* the two ink rollers, stacked in the cheek and the outboard stay */
    s.push('<g id="rollers">');
    for (i = 0; i < 2; i++) {
      /* the rider is the smaller of the two — a pair, not twins */
      var rcy = i ? 47.5 : 30.5, rr = i ? 9 : 7.4;
      var rx0 = i ? 50 : 58, rw = i ? 88 : 80;
      var y0 = n2(rcy - rr), hh = n2(rr * 2), j, px, NB = 6;
      s.push('<g>');
      /* dry composition */
      s.push('<rect class="rdry" x="' + rx0 + '" y="' + y0 + '" width="' + rw + '" height="' + hh +
        '" rx="' + rr + '" fill="url(#dry' + u + ')"/>');
      /* charged with oxblood — a tacky, UNEVEN film, not a flat red disc */
      s.push('<g class="rink" opacity="0">');
      s.push('<g filter="url(#gInk' + u + ')"><rect x="' + rx0 + '" y="' + y0 + '" width="' + rw +
        '" height="' + hh + '" rx="' + rr + '" fill="url(#oxb' + u + ')"/></g>');
      s.push('<g clip-path="url(#rclp' + u + '_' + i + ')">');
      /* where the ink has taken thick, and where it has run thin */
      for (j = 0; j < NB; j++) {
        px = n2(rx0 + 10 + j * ((rw - 20) / (NB - 1)) + ((j * 37) % 11) - 5);
        s.push('<ellipse cx="' + px + '" cy="' + n2(rcy - rr * 0.12 + ((j * 23) % 7) * 0.3) +
          '" rx="' + n2(4.6 + ((j * 17) % 5) * 1.9) + '" ry="' + n2(rr * 0.6) +
          '" fill="' + (j % 3 === 1 ? '#7d3b2e' : '#1d0706') + '" opacity="' +
          (j % 3 === 1 ? '.16' : '.34') + '"/>');
      }
      s.push('</g>');
      /* one narrow, broken sheen — ink is tacky, not glossy */
      s.push('<rect x="' + (rx0 + 6) + '" y="' + n2(rcy - rr * 0.66) + '" width="' + (rw - 12) +
        '" height="' + n2(rr * 0.14) + '" rx="' + n2(rr * 0.07) +
        '" fill="#d2977a" opacity=".1"/>');
      s.push('<rect x="' + rx0 + '" y="' + n2(rcy + rr * 0.36) + '" width="' + rw + '" height="' +
        n2(rr * 0.64) + '" rx="' + n2(rr * 0.22) + '" fill="#0d0303" opacity=".4"/>');
      s.push('</g>');
      /* the roller's own top-lit edge + the crease under it */
      s.push('<rect x="' + (rx0 + 3) + '" y="' + n2(y0 + rr * 0.08) + '" width="' + (rw - 6) +
        '" height="' + n2(rr * 0.14) + '" rx="' + n2(rr * 0.07) +
        '" fill="#fff0d8" opacity=".1"/>');
      s.push('<rect x="' + rx0 + '" y="' + n2(rcy + rr * 0.8) + '" width="' + rw + '" height="' +
        n2(rr * 0.24) + '" rx="' + n2(rr * 0.12) + '" fill="#000" opacity=".32"/>');
      /* journals */
      s.push('<rect x="' + (rx0 - 7) + '" y="' + n2(rcy - rr * 0.4) + '" width="9" height="' +
        n2(rr * 0.8) + '" rx="1.3" fill="url(#stl' + u + ')"/>');
      s.push('<rect x="' + n2(rx0 + rw - 2) + '" y="' + n2(rcy - rr * 0.4) + '" width="9" ' +
        'height="' + n2(rr * 0.8) + '" rx="1.3" fill="url(#stl' + u + ')"/>');
      s.push('</g>');
    }
    s.push('</g>');   /* rollers */
    s.push('</g>');   /* inktrain */

    /* --- the packed cylinder --- */
    s.push('<g id="cyl">');
    /* drum body: steel core wrapped in tympan */
    s.push('<rect x="' + DX0 + '" y="' + DTOP + '" width="' + (DX1 - DX0) + '" height="' +
      (DBOT - DTOP) + '" rx="9" fill="url(#tym' + u + ')"/>');
    /* quilting + the moving tympan features, clipped to the drum */
    s.push('<g clip-path="url(#dclp' + u + ')">');
    s.push('<rect x="' + DX0 + '" y="' + DTOP + '" width="' + (DX1 - DX0) + '" height="' +
      (DBOT - DTOP) + '" fill="url(#qlt' + u + ')"/>');
    /* the packing seam, stitched */
    s.push('<g id="fSeam" opacity="0"><line x1="' + FX0 + '" y1="0" x2="' + FX1 +
      '" y2="0" stroke="#1a1613" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
      '<line x1="' + FX0 + '" y1="0" x2="' + FX1 + '" y2="0" stroke="#b6a78e" stroke-width="1" ' +
      'stroke-dasharray="2.6 3.4" opacity=".5" vector-effect="non-scaling-stroke"/></g>');
    /* the grippers */
    s.push('<g id="fGrip" opacity="0">');
    for (i = 0; i < 10; i++) {
      x = n2(FX0 + 4 + i * ((FX1 - FX0 - 8) / 9));
      s.push('<rect x="' + n2(x - 2.6) + '" y="-2.6" width="5.2" height="5.2" rx="1.2" ' +
        'fill="#2a2520"/><rect x="' + n2(x - 2.6) + '" y="-2.6" width="5.2" height="1.1" ' +
        'rx=".5" fill="#a2947e" opacity=".45"/>');
    }
    s.push('</g>');
    /* the bale bar that clamps the tympan */
    s.push('<g id="fBale" opacity="0">' +
      '<rect x="' + FX0 + '" y="-3.1" width="' + (FX1 - FX0) + '" height="6.2" rx="1.4" ' +
      'fill="url(#irH' + u + ')"/>' +
      '<rect x="' + FX0 + '" y="-3.1" width="' + (FX1 - FX0) + '" height="1.3" fill="#c4b599" ' +
      'opacity=".5"/>' +
      '<rect x="' + FX0 + '" y="2.2" width="' + (FX1 - FX0) + '" height="1.4" fill="#000" ' +
      'opacity=".4"/>');
    for (i = 0; i < 6; i++) {
      x = n2(FX0 + 12 + i * ((FX1 - FX0 - 24) / 5));
      s.push('<circle cx="' + x + '" cy="0" r="2.1" fill="url(#bolt' + u + ')"/>');
    }
    s.push('</g>');
    /* the drum's own shading, over the features */
    s.push('<rect id="spec" x="' + (DX0 + 2) + '" y="56.6" width="' + (DX1 - DX0 - 4) +
      '" height="15" rx="7" fill="url(#spc' + u + ')" opacity=".5"/>');
    s.push('<rect x="' + DX0 + '" y="119" width="' + (DX1 - DX0) + '" height="11" ' +
      'fill="url(#bnc' + u + ')" opacity=".85"/>');
    s.push('</g>');  /* clip */
    /* the drum's outline + end rounding */
    s.push('<rect x="' + DX0 + '" y="' + DTOP + '" width="' + (DX1 - DX0) + '" height="' +
      (DBOT - DTOP) + '" rx="9" fill="none" stroke="#17130f" stroke-width="1.2" opacity=".85"/>');

    /* bearer rings, proud at each end */
    for (i = 0; i < 2; i++) {
      var bx = i ? DX1 - 15 : DX0 + 1;
      s.push('<g><rect x="' + bx + '" y="' + (DTOP - 3) + '" width="14" height="' +
        (DBOT - DTOP + 6) + '" rx="3.4" fill="url(#stl' + u + ')"/>' +
        '<rect x="' + bx + '" y="' + (DTOP - 3) + '" width="14" height="1.5" rx=".7" ' +
        'fill="#efe3c8" opacity=".55"/>' +
        '<rect x="' + (bx + 2.6) + '" y="' + (DTOP - 3) + '" width="1.1" height="' +
        (DBOT - DTOP + 6) + '" fill="#000" opacity=".3"/>' +
        '<rect x="' + (bx + 10.4) + '" y="' + (DTOP - 3) + '" width="1.1" height="' +
        (DBOT - DTOP + 6) + '" fill="#e6d9bd" opacity=".16"/>' +
        '<rect class="bite" x="' + bx + '" y="' + (DBOT - 1) + '" width="14" height="3" rx="1.2" ' +
        'fill="#fff0d0" opacity="0"/></g>');
    }
    /* packing string, whipped round the tympan just inside each bearer */
    s.push('<rect x="' + (DX0 + 17) + '" y="' + DTOP + '" width="1.6" height="' + (DBOT - DTOP) +
      '" fill="#0f0c0a" opacity=".45"/>');
    s.push('<rect x="' + (DX1 - 18.6) + '" y="' + DTOP + '" width="1.6" height="' + (DBOT - DTOP) +
      '" fill="#0f0c0a" opacity=".45"/>');
    s.push('</g>');  /* cyl */
    s.push('</g>');  /* rig */

    /* ══ the bearing housings, in front of the drum ends ══ */
    s.push('<g filter="url(#gIron' + u + ')">' + housing(u, false) + '</g>');
    s.push('<g filter="url(#gIron' + u + ')" transform="translate(' + (2 * AX) + ',0) scale(-1,1)">' +
      housing(u, true) + '</g>');
    /* the stress glints where the bed meets the standards */
    s.push('<rect class="stress" x="26" y="129" width="18" height="1.6" fill="#ffd9a0" ' +
      'opacity="0"/>');
    s.push('<rect class="stress" x="250" y="129" width="18" height="1.6" fill="#ffd9a0" ' +
      'opacity="0"/>');

    /* The room's own light is NOT laid over the frame as a full-viewBox wash —
       that plated the exhibit's plaster with a hard-edged rectangle. The key
       and the bounce live in the castings' own gradients instead, so the press
       composites onto the shop with nothing behind it but its contact shadow. */

    return s.join('');
  }

  /* ── mount + mutate ───────────────────────────────────────────────────── */
  function mount(svg) {
    var u = '_' + (++UID);
    svg.innerHTML = markup(u);
    var st = {
      u: u,
      rig: svg.querySelector('#rig'),
      cyl: svg.querySelector('#cyl'),
      nipsh: svg.querySelector('#nipsh'),
      nipink: svg.querySelector('#nipink'),
      spec: svg.querySelector('#spec'),
      collar: svg.querySelector('#collar'),
      bale: svg.querySelector('#fBale'),
      grip: svg.querySelector('#fGrip'),
      seam: svg.querySelector('#fSeam'),
      dry: svg.querySelectorAll('.rdry'),
      ink: svg.querySelectorAll('.rink'),
      bite: svg.querySelectorAll('.bite'),
      stress: svg.querySelectorAll('.stress'),
      last: null
    };
    try { Object.defineProperty(svg, '__centoPress', { value: st, configurable: true }); }
    catch (e) { svg.__centoPress = st; }
    return st;
  }

  /* a tympan feature at angle phi rides the FRONT half of the drum, its
     apparent height foreshortening to nothing as it crests or dips */
  function ride(el, phi) {
    var s = Math.sin(phi);
    if (s <= 0.03) { el.setAttribute('opacity', '0'); return; }
    var y = DCY - DR * Math.cos(phi);
    el.setAttribute('opacity', n2(Math.min(1, s * 3.2)));
    el.setAttribute('transform', 'translate(0,' + n2(y) + ') scale(1,' + n2(Math.max(0.06, s)) + ')');
  }

  function update(st, o) {
    var turn = Math.max(0, Math.min(1, +o.turn || 0));
    var strain = Math.max(0, Math.min(1, +o.strain || 0));
    var inked = !!o.inked;
    var i, k = turn + ':' + strain.toFixed(3) + ':' + (inked ? 1 : 0);
    if (k === st.last) return;
    st.last = k;

    var phi = turn * TAU;
    ride(st.bale, phi % TAU);
    ride(st.grip, (phi + 2.35) % TAU);
    ride(st.seam, (phi + 4.12) % TAU);

    /* the machine loads: the rig settles, the nip bites, highlights tighten */
    st.rig.setAttribute('transform', 'translate(0,' + n2(strain * 0.85) + ')');
    st.nipsh.setAttribute('opacity', n2(0.26 + strain * 0.5));
    st.nipsh.setAttribute('height', n2(9 + strain * 4));
    st.spec.setAttribute('opacity', n2(0.44 - strain * 0.09));
    st.spec.setAttribute('height', n2(15 - strain * 3.8));
    st.spec.setAttribute('y', n2(56.6 - strain * 0.5));
    for (i = 0; i < st.bite.length; i++)
      st.bite[i].setAttribute('opacity', n2(strain * 0.42));
    for (i = 0; i < st.stress.length; i++)
      st.stress[i].setAttribute('opacity', n2(strain * 0.5));

    /* the ink: dry composition, or charged oxblood */
    for (i = 0; i < st.ink.length; i++) st.ink[i].setAttribute('opacity', inked ? '1' : '0');
    for (i = 0; i < st.dry.length; i++) st.dry[i].setAttribute('opacity', inked ? '0' : '1');
    st.nipink.setAttribute('opacity', inked ? n2(0.1 + strain * 0.14) : '0');

    /* the shaft's keyed collar turns with the crank */
    st.collar.setAttribute('transform',
      'translate(312.5,189.1) scale(' + n2(0.62 + 0.38 * Math.abs(Math.cos(phi))) +
      ',1) translate(-312.5,-189.1)');
  }

  window.CentoArt = window.CentoArt || {};
  window.CentoArt.press = {
    draw: function (svg, o) {
      if (!svg) return;
      var st = svg.__centoPress;
      if (!st || !st.rig || !st.rig.isConnected) st = mount(svg);
      update(st, o || {});
    }
  };
})();
