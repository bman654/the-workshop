/* ═══════════════════════════════════════════════════════════════════════════
   THE TAKING-APART TABLE — the parts registry
   ---------------------------------------------------------------------------
   Four instruments, each a list of NAMED PARTS with:

     id      a slug, unique within the instrument
     name    the copperplate name that writes itself onto the shelf
     sub     the small line under it (what the part IS)
     held    the parts that must come off FIRST — a real partial order,
             not a chain. Two or three parts are free at the start; taking
             one opens others.
     lay     the part's height in the stack (0 = flat on the felt). This is
             what the felt's axonometric ROLL fans apart as parts come off.
     home    {x,y,r} pose relative to the instrument's centre, in felt units
     hit     an array of path-`d` strings in the part's OWN local frame.
             The click resolves FRONT-TO-BACK through the seated parts, so a
             hit shape is the part's full silhouette — the part above it takes
             the overlap. (A load-time audit asserts every part is reachable.)
     draw    (D) => SVGGElement, drawn in the part's own local frame

   `D` is the drawing kit the engine hands in: D.el(name, attrs), plus the
   palette. Adding a fifth instrument is: append one object here.
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";

const INSTRUMENTS = (function () {

  /* ── small drawing helpers, shared across instruments ───────────────────── */
  const disc = (r) => `M ${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  const box  = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
  const deg  = (a) => a * Math.PI / 180;

  /* an arm: a tapered bar from the hub out to length L with a boss at the end */
  function armPath(L, w) {
    return `M -14 ${-w} L ${L - 6} ${-w * 0.62} L ${L + 6} 0 L ${L - 6} ${w * 0.62} L -14 ${w} L -20 0 Z`;
  }

  /* ══════════════════════════════════════════════════════════════════════
     I · THE ASTROLABE — brass. Nine parts, the classical holding-order.
     ══════════════════════════════════════════════════════════════════════ */
  const R_AST = 186;
  const astrolabe = {
    id: "astrolabe", title: "The Astrolabe", tag: "brass, nine parts",
    room: { href: "../astrolabe/index.html", label: "the Astrolabe" },
    material: "brass", R: R_AST, cx: 380, cy: 348,
    cap: ["A flat model of the turning sky — the rete is the stars,", "the plate beneath it is your latitude."],
    parts: [
      /* ── the body ── */
      { id: "mater", name: "The Mater", sub: "the mother — limb and womb", held: ["plate", "pin", "throne"], lay: 0,
        home: { x: 0, y: 0, r: 0 }, hit: [disc(R_AST)],
        draw(D) {
          const g = D.el("g"), R = R_AST;
          g.appendChild(D.el("circle", { r: R, fill: "url(#brassface)", stroke: D.BR_D, "stroke-width": 2 }));
          g.appendChild(D.el("circle", { r: R - 26, fill: "rgba(9,7,4,0.62)", stroke: D.BR_D, "stroke-width": 1.4 }));
          for (let a = 0; a < 360; a += 5) {
            const t = deg(a), lg = (a % 30 === 0) ? 20 : (a % 15 === 0 ? 13 : 7);
            g.appendChild(D.el("line", { x1: Math.cos(t) * (R - 4), y1: Math.sin(t) * (R - 4),
              x2: Math.cos(t) * (R - 4 - lg), y2: Math.sin(t) * (R - 4 - lg),
              stroke: D.BR, "stroke-width": a % 30 === 0 ? 1.6 : 0.8, opacity: a % 30 === 0 ? 0.95 : 0.55 }));
          }
          for (let a = 0; a < 360; a += 30) {
            const t = deg(a - 90);
            g.appendChild(D.txt(String(a), Math.cos(t) * (R - 40), Math.sin(t) * (R - 40) + 4,
              { fill: D.BR, "font-size": "11", "font-family": D.MONO, "text-anchor": "middle", opacity: "0.72" }));
          }
          return g;
        } },
      { id: "throne", name: "The Throne", sub: "kursi — the shackle's seat", held: ["ring"], lay: 0,
        home: { x: 0, y: -R_AST - 4, r: 0 }, hit: [box(-36, -30, 36, 9)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: "M -34 6 Q -30 -20 -14 -26 L 14 -26 Q 30 -20 34 6 Z",
            fill: "url(#brassface)", stroke: D.BR_L, "stroke-width": 1.3 }));
          g.appendChild(D.el("path", { d: "M -18 -2 Q 0 -18 18 -2", fill: "none", stroke: D.BR_D, "stroke-width": 1.2 }));
          g.appendChild(D.el("circle", { cy: -20, r: 4.5, fill: "none", stroke: D.BR_L, "stroke-width": 1.4 }));
          return g;
        } },
      { id: "ring", name: "The Ring", sub: "suspension shackle", held: [], lay: 0,
        home: { x: 0, y: -R_AST - 44, r: 0 }, hit: [box(-25, -25, 25, 34)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("circle", { r: 19, fill: "none", stroke: D.BR_L, "stroke-width": 5 }));
          g.appendChild(D.el("circle", { r: 19, fill: "none", stroke: D.BR_D, "stroke-width": 1.4 }));
          g.appendChild(D.el("path", { d: "M -7 17 L -5 30 L 5 30 L 7 17", fill: "none", stroke: D.BR_L, "stroke-width": 3.4 }));
          return g;
        } },
      /* ── the stack ── */
      { id: "plate", name: "The Plate", sub: "tympan cut for one latitude", held: ["horse", "rule", "rete"], lay: 1,
        home: { x: 0, y: 0, r: 0 }, hit: [disc(152)],
        draw(D) {
          const g = D.el("g"), rp = 152;
          g.appendChild(D.el("circle", { r: rp, fill: "rgba(26,20,11,0.95)", stroke: D.BR_D, "stroke-width": 1.6 }));
          for (let i = 1; i <= 7; i++) {          /* almucantars — ornament, not a projection claim */
            const rr = rp * (0.16 + i * 0.115), oy = -rp * 0.30 * (1 - i / 9);
            g.appendChild(D.el("circle", { r: rr, cy: oy, fill: "none", stroke: D.BR, "stroke-width": 0.8, opacity: 0.28 + i * 0.035 }));
          }
          for (let i = 0; i < 12; i++) {
            const a = i * Math.PI / 6;
            g.appendChild(D.el("path", { d: `M 0 ${-rp * 0.30} Q ${Math.cos(a) * rp * 1.15} ${Math.sin(a) * rp * 1.15} 0 ${rp * 0.62}`,
              fill: "none", stroke: D.BR, "stroke-width": 0.6, opacity: "0.20" }));
          }
          g.appendChild(D.el("circle", { r: rp * 0.62, fill: "none", stroke: D.BR_L, "stroke-width": 1.2, opacity: "0.66" }));
          return g;
        } },
      { id: "rete", name: "The Rete", sub: "the star-net, openwork", held: ["horse", "rule"], lay: 2,
        home: { x: 0, y: 0, r: 0 }, hit: [disc(116)],
        draw(D) {
          const g = D.el("g"), rr = 116;
          g.appendChild(D.el("circle", { r: rr, fill: "none", stroke: D.BR_L, "stroke-width": 2.4 }));
          g.appendChild(D.el("circle", { r: rr * 0.62, cx: rr * 0.30, cy: -rr * 0.12, fill: "none", stroke: D.BR, "stroke-width": 2 }));
          const stars = [[-72, -46], [38, -84], [86, 26], [-30, 84], [-96, 18], [54, 74], [-6, -102], [100, -30]];
          for (const [x, y] of stars) {
            const a = Math.atan2(y, x), L = 26;
            g.appendChild(D.el("path", { d: `M ${x - Math.cos(a) * L} ${y - Math.sin(a) * L} Q ${x * 0.72} ${y * 0.72} ${x} ${y}`,
              fill: "none", stroke: D.BR, "stroke-width": 2.1, "stroke-linecap": "round" }));
            g.appendChild(D.el("circle", { cx: x, cy: y, r: 3.2, fill: D.BR_L }));
          }
          g.appendChild(D.el("path", { d: `M ${-rr} 0 L ${rr} 0`, stroke: D.BR, "stroke-width": 1.4, opacity: "0.5" }));
          return g;
        } },
      { id: "alidade", name: "The Alidade", sub: "back sighting bar, with vanes", held: ["horse"], lay: 3,
        home: { x: 0, y: 0, r: -27 }, hit: [box(-178, -30, 178, 11)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: "M -170 -7 L 170 -7 L 178 0 L 170 7 L -170 7 L -178 0 Z",
            fill: "url(#brassbar)", stroke: D.BR_L, "stroke-width": 1.1 }));
          for (const s of [-1, 1]) {
            g.appendChild(D.el("rect", { x: s * 128 - 7, y: -26, width: 14, height: 26, fill: "url(#brassbar)", stroke: D.BR_L, "stroke-width": 1.1 }));
            g.appendChild(D.el("circle", { cx: s * 128, cy: -14, r: 3, fill: "#0b0805" }));
          }
          g.appendChild(D.el("circle", { r: 13, fill: "none", stroke: D.BR_L, "stroke-width": 1.4 }));
          return g;
        } },
      { id: "rule", name: "The Rule", sub: "front index bar", held: ["horse"], lay: 4,
        home: { x: 0, y: 0, r: 53 }, hit: [box(-156, -9.5, 156, 9.5)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: "M -148 -5 L 148 -5 L 156 0 L 148 5 L -148 5 L -156 0 Z",
            fill: "url(#brassbar)", stroke: D.BR_L, "stroke-width": 1.1 }));
          for (let x = -130; x <= 130; x += 20) g.appendChild(D.el("line", { x1: x, y1: -5, x2: x, y2: 5, stroke: D.BR_D, "stroke-width": 0.9 }));
          g.appendChild(D.el("circle", { r: 11, fill: "none", stroke: D.BR_L, "stroke-width": 1.4 }));
          return g;
        } },
      { id: "pin", name: "The Pin", sub: "the axis of all of it", held: ["rule", "alidade", "rete", "plate"], lay: 5,
        home: { x: 0, y: 0, r: 0 }, hit: [disc(21)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("circle", { r: 19, fill: "url(#brassface)", stroke: D.BR_L, "stroke-width": 1.5 }));
          g.appendChild(D.el("circle", { r: 11, fill: "none", stroke: D.BR_D, "stroke-width": 1.2 }));
          g.appendChild(D.el("rect", { x: -3.4, y: -30, width: 6.8, height: 60, fill: "url(#brassbar)", stroke: D.BR_D, "stroke-width": 0.7, opacity: "0.9" }));
          return g;
        } },
      { id: "horse", name: "The Horse", sub: "the wedge that pins the pin", held: [], lay: 6,
        home: { x: 0, y: 0, r: 0 }, hit: [box(-11.5, -40, 11.5, 16)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: "M 0 -22 L 9 -6 L 5 14 L -5 14 L -9 -6 Z", fill: "url(#brassbar)", stroke: D.BR_L, "stroke-width": 1.2 }));
          g.appendChild(D.el("path", { d: "M 0 -22 L 0 -34 M -6 -30 Q 0 -40 6 -30", fill: "none", stroke: D.BR_L, "stroke-width": 1.8, "stroke-linecap": "round" }));
          return g;
        } },
    ],
    /* back-to-front on the felt */
    z: ["mater", "throne", "ring", "plate", "rete", "alidade", "rule", "pin", "horse"],
  };

  /* ══════════════════════════════════════════════════════════════════════
     II · THE VOLVELLE — paper and silk. The hard case: near-concentric
     discs. Their radii step down so every wheel keeps an exposed annulus
     even flat on the felt; the roll then fans them wide open.
     ══════════════════════════════════════════════════════════════════════ */
  const R_VOL = 172;
  function wheelFace(D, r, fill, edge) {
    const g = D.el("g");
    g.appendChild(D.el("circle", { r: r, fill: fill, stroke: edge, "stroke-width": 1.2 }));
    g.appendChild(D.el("circle", { r: r - 6, fill: "none", stroke: edge, "stroke-width": 0.7, opacity: "0.7" }));
    return g;
  }
  const volvelle = {
    id: "volvelle", title: "The Volvelle", tag: "paper and silk, seven parts",
    room: { href: "../volvelle/index.html", label: "the Volvelle" },
    material: "paper", R: R_VOL, cx: 380, cy: 356,
    ink: "rgba(88,62,26,0.55)",   /* a ghost on paper is drawn in ink, not in brass */
    cap: ["A paper computer — wheels inside wheels, turned against", "each other till the answer lines up under the thread."],
    parts: [
      { id: "card", name: "The Card", sub: "the printed ground sheet", held: ["zodiac"], lay: 0,
        home: { x: 0, y: 0, r: 0 }, hit: [box(-190, -190, 190, 190)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("rect", { x: -190, y: -190, width: 380, height: 380, rx: 7,
            fill: "url(#vellum)", stroke: "rgba(196,168,116,0.55)", "stroke-width": 1.3 }));
          g.appendChild(D.el("rect", { x: -178, y: -178, width: 356, height: 356, rx: 4,
            fill: "none", stroke: "rgba(120,92,52,0.45)", "stroke-width": 0.8 }));
          /* a compass rose in each corner, in faded ink */
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            const cx = sx * 152, cy = sy * 152, gg = D.el("g", { transform: `translate(${cx},${cy})`, opacity: "0.42" });
            for (let a = 0; a < 360; a += 45) {
              const t = deg(a), L = (a % 90 === 0) ? 20 : 12;
              gg.appendChild(D.el("line", { x1: 0, y1: 0, x2: Math.cos(t) * L, y2: Math.sin(t) * L,
                stroke: "#6a4f28", "stroke-width": a % 90 === 0 ? 1.3 : 0.7 }));
            }
            g.appendChild(gg);
          }
          g.appendChild(D.txt("TABVLA · MOTVVM", 0, 178,
            { fill: "#6a4f28", "font-size": "12.5", "font-family": D.SERIF, "font-style": "italic", "text-anchor": "middle", opacity: "0.66" }));
          return g;
        } },
      { id: "zodiac", name: "The Zodiac Wheel", sub: "the twelve signs, outermost", held: ["grommet", "hour", "lunar"], lay: 1,
        home: { x: 0, y: 0, r: -14 }, hit: [disc(150)],
        draw(D) {
          const g = wheelFace(D, 150, "url(#paperwheel)", "rgba(122,92,50,0.7)");
          const signs = ["ARI", "TAV", "GEM", "CNC", "LEO", "VIR", "LIB", "SCO", "SGR", "CAP", "AQR", "PSC"];
          for (let i = 0; i < 12; i++) {
            const a = deg(i * 30 - 90);
            g.appendChild(D.el("line", { x1: Math.cos(a) * 150, y1: Math.sin(a) * 150,
              x2: Math.cos(a) * 122, y2: Math.sin(a) * 122, stroke: "rgba(106,79,40,0.66)", "stroke-width": 0.9 }));
            const m = deg(i * 30 - 75);
            const t = D.txt(signs[i], 0, -132, { fill: "#5d4522", "font-size": "12.5", "text-anchor": "middle",
              "font-family": D.SERIF, "letter-spacing": "0.09em" });
            t.setAttribute("transform", `rotate(${i * 30 + 15})`);
            g.appendChild(t);
          }
          g.appendChild(D.el("circle", { r: 122, fill: "none", stroke: "rgba(106,79,40,0.5)", "stroke-width": 0.9 }));
          for (let a = 0; a < 360; a += 2) {           /* the degree scale the wheels above normally hide */
            const u = deg(a), L = a % 10 === 0 ? 9 : 4;
            g.appendChild(D.el("line", { x1: Math.cos(u) * 118, y1: Math.sin(u) * 118,
              x2: Math.cos(u) * (118 - L), y2: Math.sin(u) * (118 - L),
              stroke: "rgba(106,79,40,0.55)", "stroke-width": a % 30 === 0 ? 0.9 : 0.5 }));
          }
          for (const rr of [96, 68, 40]) g.appendChild(D.el("circle", { r: rr, fill: "none", stroke: "rgba(106,79,40,0.30)", "stroke-width": 0.7 }));
          g.appendChild(D.txt("GRADVS", 0, -14, { fill: "#6a4f28", "font-size": "11", "font-family": D.SERIF, "font-style": "italic", "text-anchor": "middle", opacity: "0.7" }));
          g.appendChild(D.txt("ZODIACI", 0, 2, { fill: "#6a4f28", "font-size": "11", "font-family": D.SERIF, "font-style": "italic", "text-anchor": "middle", opacity: "0.7" }));
          return g;
        } },
      { id: "lunar", name: "The Lunar Wheel", sub: "the ages of the moon", held: ["grommet", "hour"], lay: 2,
        home: { x: 0, y: 0, r: 22 }, hit: [disc(114)],
        draw(D) {
          const g = wheelFace(D, 114, "url(#paperwheel2)", "rgba(122,92,50,0.7)");
          for (let i = 0; i < 15; i++) {
            const a = deg(i * 24 - 90), rr = 92, ph = i / 15;
            const gg = D.el("g", { transform: `translate(${Math.cos(a) * rr},${Math.sin(a) * rr})` });
            gg.appendChild(D.el("circle", { r: 9, fill: "#efe0bc", stroke: "rgba(106,79,40,0.7)", "stroke-width": 0.8 }));
            const k = Math.cos(ph * 2 * Math.PI);
            gg.appendChild(D.el("path", { d: `M 0 -9 A 9 9 0 0 ${k < 0 ? 1 : 0} 0 9 A ${Math.abs(k) * 9} 9 0 0 ${k < 0 ? 1 : 0} 0 -9 Z`,
              fill: "#4a3718", opacity: "0.86" }));
            g.appendChild(gg);
          }
          g.appendChild(D.el("circle", { r: 72, fill: "none", stroke: "rgba(106,79,40,0.45)", "stroke-width": 0.8 }));
          for (let i = 0; i < 30; i++) {               /* the thirty days, under the hour wheel */
            const a = deg(i * 12 - 90), rr = 60;
            g.appendChild(D.el("line", { x1: Math.cos(a) * 72, y1: Math.sin(a) * 72, x2: Math.cos(a) * 66, y2: Math.sin(a) * 66,
              stroke: "rgba(106,79,40,0.5)", "stroke-width": i % 5 === 0 ? 0.9 : 0.5 }));
            if (i % 5 === 0) g.appendChild(D.txt(String(i || 30), Math.cos(a) * rr, Math.sin(a) * rr + 3.5,
              { fill: "#5d4522", "font-size": "8.5", "text-anchor": "middle", "font-family": D.MONO }));
          }
          return g;
        } },
      { id: "hour", name: "The Hour Wheel", sub: "twice-twelve, and the pointer's mark", held: ["grommet"], lay: 3,
        home: { x: 0, y: 0, r: -38 }, hit: [disc(78)],
        draw(D) {
          const g = wheelFace(D, 78, "url(#paperwheel)", "rgba(122,92,50,0.7)");
          const num = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
          for (let i = 0; i < 12; i++) {
            const a = deg(i * 30 - 90);
            g.appendChild(D.txt(num[i], Math.cos(a) * 58, Math.sin(a) * 58 + 4,
              { fill: "#5d4522", "font-size": "11", "text-anchor": "middle", "font-family": D.SERIF }));
            g.appendChild(D.el("line", { x1: Math.cos(a) * 78, y1: Math.sin(a) * 78, x2: Math.cos(a) * 70, y2: Math.sin(a) * 70,
              stroke: "rgba(106,79,40,0.66)", "stroke-width": 0.9 }));
          }
          g.appendChild(D.el("circle", { r: 34, fill: "none", stroke: "rgba(106,79,40,0.42)", "stroke-width": 0.8 }));
          for (let i = 0; i < 8; i++) {                /* a small rosette under the grommet */
            const a = deg(i * 45);
            g.appendChild(D.el("path", { d: `M 0 0 Q ${Math.cos(a + 0.34) * 24} ${Math.sin(a + 0.34) * 24} ${Math.cos(a) * 32} ${Math.sin(a) * 32} Q ${Math.cos(a - 0.34) * 24} ${Math.sin(a - 0.34) * 24} 0 0`,
              fill: "none", stroke: "rgba(106,79,40,0.34)", "stroke-width": 0.7 }));
          }
          return g;
        } },
      { id: "grommet", name: "The Grommet", sub: "the brass eyelet holding all four", held: ["knot", "pointer"], lay: 4,
        home: { x: 0, y: 0, r: 0 }, hit: [disc(17)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("circle", { r: 15, fill: "url(#brassface)", stroke: D.BR_L, "stroke-width": 1.3 }));
          g.appendChild(D.el("circle", { r: 7, fill: "#120d07", stroke: D.BR_D, "stroke-width": 1 }));
          return g;
        } },
      { id: "pointer", name: "The Index", sub: "the brass arm that reads the wheels", held: [], lay: 5,
        home: { x: 0, y: 0, r: 128 }, hit: [box(20, -11, 158, 11)],   /* clear of the grommet it pins, so the eyelet stays grabbable */
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: armPath(150, 9), fill: "url(#brassbar)", stroke: D.BR_L, "stroke-width": 1 }));
          g.appendChild(D.el("path", { d: "M 118 -9 L 118 9", stroke: D.BR_D, "stroke-width": 1 }));
          g.appendChild(D.el("circle", { r: 8, fill: "none", stroke: D.BR_L, "stroke-width": 1.3 }));
          return g;
        } },
      { id: "knot", name: "The Thread", sub: "silk, and the knot that stops it", held: [], lay: 6,
        home: { x: 0, y: -152, r: 0 }, hit: [disc(19), box(-6, 0, 6, 152)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: "M 0 4 Q 7 76 -3 152", fill: "none", stroke: "#d9c79a", "stroke-width": 2, opacity: "0.85" }));
          g.appendChild(D.el("circle", { r: 8.5, fill: "#e6d3a4", stroke: "#8d7440", "stroke-width": 1 }));
          g.appendChild(D.el("path", { d: "M -6 -3 Q 0 5 6 -3 M -5 3 Q 0 -5 5 3", fill: "none", stroke: "#8d7440", "stroke-width": 1.1 }));
          return g;
        } },
    ],
    z: ["card", "zodiac", "lunar", "hour", "grommet", "pointer", "knot"],
  };

  /* ══════════════════════════════════════════════════════════════════════
     III · THE ORRERY — brass on divergent axes. Every arm points its own
     way, so the z-order and the hit shapes both have to be honest.
     ══════════════════════════════════════════════════════════════════════ */
  const R_ORR = 198;
  function planetArm(D, L, rad, body, ring) {
    const g = D.el("g");
    g.appendChild(D.el("path", { d: armPath(L, 8), fill: "url(#brassbar)", stroke: D.BR_L, "stroke-width": 1 }));
    for (let x = 30; x < L - 12; x += 26) g.appendChild(D.el("line", { x1: x, y1: -8, x2: x, y2: 8, stroke: D.BR_D, "stroke-width": 0.6, opacity: "0.55" }));
    g.appendChild(D.el("circle", { r: 9, fill: "none", stroke: D.BR_L, "stroke-width": 1.2 }));
    if (ring) {
      g.appendChild(D.el("ellipse", { cx: L, cy: 0, rx: rad * 2.05, ry: rad * 0.62, fill: "none", stroke: D.BR_L, "stroke-width": 2.1, transform: `rotate(-18 ${L} 0)` }));
    }
    g.appendChild(D.el("circle", { cx: L, cy: 0, r: rad, fill: body, stroke: D.BR_L, "stroke-width": 1.1 }));
    g.appendChild(D.el("circle", { cx: L - rad * 0.34, cy: -rad * 0.34, r: rad * 0.34, fill: "#fff", opacity: "0.20" }));
    return g;
  }
  const orrery = {
    id: "orrery", title: "The Orrery", tag: "brass, nine parts",
    room: { href: "../orrery/index.html", label: "the Orrery" },
    material: "brass", R: R_ORR, cx: 380, cy: 348,
    cap: ["Six worlds on six arms, all driven off one crank —", "the arms stack on the column, longest reach lowest."],
    parts: [
      { id: "base", name: "The Base Plate", sub: "the engraved table it all stands on", held: ["saturn", "horizon", "crank"], lay: 0,
        home: { x: 0, y: 0, r: 0 }, hit: [disc(R_ORR)],
        draw(D) {
          const g = D.el("g"), R = R_ORR;
          g.appendChild(D.el("circle", { r: R, fill: "url(#brassface)", stroke: D.BR_D, "stroke-width": 2 }));
          g.appendChild(D.el("circle", { r: R - 30, fill: "rgba(9,7,4,0.55)", stroke: D.BR_D, "stroke-width": 1.2 }));
          for (let a = 0; a < 360; a += 6) {
            const t = deg(a), lg = a % 30 === 0 ? 17 : 8;
            g.appendChild(D.el("line", { x1: Math.cos(t) * (R - 5), y1: Math.sin(t) * (R - 5),
              x2: Math.cos(t) * (R - 5 - lg), y2: Math.sin(t) * (R - 5 - lg),
              stroke: D.BR, "stroke-width": a % 30 === 0 ? 1.4 : 0.7, opacity: a % 30 === 0 ? 0.9 : 0.45 }));
          }
          for (let i = 0; i < 4; i++) {
            const t = deg(i * 90 + 45);
            g.appendChild(D.el("circle", { cx: Math.cos(t) * (R - 52), cy: Math.sin(t) * (R - 52), r: 5, fill: "none", stroke: D.BR, "stroke-width": 1.1, opacity: "0.7" }));
          }
          const mon = ["IAN", "FEB", "MAR", "APR", "MAI", "IVN", "IVL", "AVG", "SEP", "OCT", "NOV", "DEC"];
          for (let i = 0; i < 12; i++) {                /* the calendar the arms normally sweep over */
            const a = deg(i * 30 - 90);
            g.appendChild(D.el("line", { x1: Math.cos(a) * (R - 34), y1: Math.sin(a) * (R - 34),
              x2: Math.cos(a) * (R - 62), y2: Math.sin(a) * (R - 62), stroke: D.BR, "stroke-width": 0.8, opacity: "0.45" }));
            const m = deg(i * 30 - 75);
            const tx = D.txt(mon[i], 0, -(R - 46), { fill: D.BR, "font-size": "10", "font-family": D.SERIF,
              "text-anchor": "middle", opacity: "0.6", "letter-spacing": "0.07em" });
            tx.setAttribute("transform", `rotate(${i * 30 + 15})`);
            g.appendChild(tx);
          }
          for (const rr of [R - 66, R - 104, R - 142]) g.appendChild(D.el("circle", { r: rr, fill: "none", stroke: D.BR, "stroke-width": 0.7, opacity: "0.24" }));
          return g;
        } },
      { id: "horizon", name: "The Horizon Ring", sub: "a loose band, laid over the rim", held: [], lay: 1,
        home: { x: 0, y: 0, r: 0 }, hit: [disc(R_ORR + 12) + " " + disc(R_ORR - 10)],  /* one path, two subpaths → a true annulus under evenodd */
        draw(D) {
          const g = D.el("g"), R = R_ORR;
          g.appendChild(D.el("circle", { r: R + 1, fill: "none", stroke: "url(#brassbar)", "stroke-width": 18 }));
          g.appendChild(D.el("circle", { r: R + 9, fill: "none", stroke: D.BR_L, "stroke-width": 1.1, opacity: "0.8" }));
          g.appendChild(D.el("circle", { r: R - 8, fill: "none", stroke: D.BR_D, "stroke-width": 1.1 }));
          for (let a = 0; a < 360; a += 10) {
            const t = deg(a);
            g.appendChild(D.el("line", { x1: Math.cos(t) * (R + 8), y1: Math.sin(t) * (R + 8),
              x2: Math.cos(t) * (R - 6), y2: Math.sin(t) * (R - 6), stroke: "#2a2011", "stroke-width": 0.8, opacity: "0.6" }));
          }
          return g;
        } },
      { id: "crank", name: "The Crank", sub: "the handle that drives the year", held: [], lay: 0,
        home: { x: 178, y: 92, r: 26 }, hit: [box(-16, -18, 74, 22)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("circle", { r: 13, fill: "url(#brassface)", stroke: D.BR_L, "stroke-width": 1.2 }));
          g.appendChild(D.el("path", { d: "M -6 -6 L 52 -6 L 56 0 L 52 6 L -6 6 Z", fill: "url(#brassbar)", stroke: D.BR_L, "stroke-width": 1 }));
          g.appendChild(D.el("rect", { x: 50, y: -15, width: 12, height: 34, rx: 6, fill: "#2b2114", stroke: D.BR_D, "stroke-width": 1 }));
          return g;
        } },
      { id: "saturn", name: "Saturn's Arm", sub: "the longest reach, and its ring", held: ["jupiter"], lay: 2,
        home: { x: 0, y: 0, r: 197 }, hit: [box(-20, -10, 158, 10), disc(24)],
        draw(D) { const g = planetArm(D, 172, 12, "#c9b083", true); return g; } },
      { id: "jupiter", name: "Jupiter's Arm", sub: "banded, and heavy", held: ["earth"], lay: 3,
        home: { x: 0, y: 0, r: 38 }, hit: [box(-20, -10, 160, 10)],
        draw(D) {
          const g = planetArm(D, 144, 15, "#d3b184", false);
          for (const dy of [-6, 0, 6]) g.appendChild(D.el("path", { d: `M ${144 - 13} ${dy} L ${144 + 13} ${dy}`, stroke: "#8d7247", "stroke-width": 1.6, opacity: "0.6" }));
          return g;
        } },
      { id: "earth", name: "The Earth's Arm", sub: "with its one small moon", held: ["sun", "mercury", "venus"], lay: 4,
        home: { x: 0, y: 0, r: 302 }, hit: [box(-20, -10, 138, 10), disc(22)],
        draw(D) {
          const g = planetArm(D, 116, 11, "#7fa4b8", false);
          g.appendChild(D.el("line", { x1: 116, y1: 0, x2: 116 + 22, y2: -13, stroke: D.BR, "stroke-width": 1.4 }));
          g.appendChild(D.el("circle", { cx: 116 + 22, cy: -13, r: 4.6, fill: "#d8d2c2", stroke: D.BR_L, "stroke-width": 0.8 }));
          return g;
        } },
      { id: "venus", name: "Venus's Arm", sub: "pale, and nearly round", held: ["sun", "mercury"], lay: 5,
        home: { x: 0, y: 0, r: 131 }, hit: [box(-20, -10, 106, 10)],
        draw(D) { return planetArm(D, 86, 10, "#e2cf9f", false); } },
      { id: "mercury", name: "Mercury's Arm", sub: "the shortest, the quickest", held: ["sun"], lay: 6,
        home: { x: 0, y: 0, r: 247 }, hit: [box(-20, -10, 74, 10)],
        draw(D) { return planetArm(D, 56, 8, "#b0a289", false); } },
      { id: "sun", name: "The Sun", sub: "the gilt ball that caps the column", held: [], lay: 7,
        home: { x: 0, y: 0, r: 0 }, hit: [disc(24)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("circle", { r: 21, fill: "url(#sunball)", stroke: D.BR_L, "stroke-width": 1.4 }));
          g.appendChild(D.el("circle", { cx: -7, cy: -7, r: 6.4, fill: "#fff", opacity: "0.30" }));
          for (let a = 0; a < 360; a += 30) {
            const t = deg(a);
            g.appendChild(D.el("line", { x1: Math.cos(t) * 23, y1: Math.sin(t) * 23, x2: Math.cos(t) * 30, y2: Math.sin(t) * 30,
              stroke: D.BR_L, "stroke-width": 1.2, opacity: "0.55" }));
          }
          return g;
        } },
    ],
    z: ["base", "horizon", "crank", "saturn", "jupiter", "earth", "venus", "mercury", "sun"],
  };

  /* ══════════════════════════════════════════════════════════════════════
     IV · THE PLANIMETER — steel and ivory. Not a stack at all: a linkage
     laid open across the felt, two arms hinged at a carriage.
     ══════════════════════════════════════════════════════════════════════ */
  const R_PLA = 190;
  const planimeter = {
    id: "planimeter", title: "The Planimeter", sub: "", tag: "steel and ivory, seven parts",
    room: { href: "../planimeter/index.html", label: "the Planimeter" },
    material: "steel", R: R_PLA, cx: 384, cy: 392,
    cap: ["Trace a shape with the point and the little wheel reads", "off its area. Two arms, one hinge, one wheel."],
    parts: [
      { id: "carriage", name: "The Carriage", sub: "the hinge that joins the two arms", held: ["tracerArm", "poleArm"], lay: 0,
        home: { x: -40, y: -34, r: 0 }, hit: [box(-30, -28, 30, 28)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("rect", { x: -28, y: -26, width: 56, height: 52, rx: 7, fill: "url(#steelface)", stroke: "#cfd6dc", "stroke-width": 1.2 }));
          g.appendChild(D.el("circle", { r: 11, fill: "#171b1f", stroke: "#cfd6dc", "stroke-width": 1.4 }));
          g.appendChild(D.el("circle", { r: 4.5, fill: "#9fb0bd" }));
          for (const dy of [-18, 18]) g.appendChild(D.el("line", { x1: -22, y1: dy, x2: 22, y2: dy, stroke: "#8f9aa4", "stroke-width": 1 }));
          return g;
        } },
      { id: "poleArm", name: "The Pole Arm", sub: "the fixed radius, the one that pivots", held: ["poleWeight"], lay: 1,
        home: { x: -40, y: -34, r: 197 }, hit: [box(-14, -9, 232, 9)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: "M -12 -6 L 220 -5 L 226 0 L 220 5 L -12 6 Z", fill: "url(#steelbar)", stroke: "#cfd6dc", "stroke-width": 1 }));
          for (let x = 20; x < 214; x += 22) g.appendChild(D.el("line", { x1: x, y1: -6, x2: x, y2: 6, stroke: "#7d8890", "stroke-width": 0.7 }));
          g.appendChild(D.el("circle", { r: 8, fill: "none", stroke: "#cfd6dc", "stroke-width": 1.2 }));
          g.appendChild(D.el("circle", { cx: 220, r: 7, fill: "none", stroke: "#cfd6dc", "stroke-width": 1.2 }));
          return g;
        } },
      { id: "poleWeight", name: "The Pole Weight", sub: "the anchor — it never moves", held: [], lay: 1,
        home: { x: -262, y: 34, r: 0 }, hit: [disc(34)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("circle", { r: 32, fill: "url(#steelface)", stroke: "#cfd6dc", "stroke-width": 1.4 }));
          g.appendChild(D.el("circle", { r: 22, fill: "none", stroke: "#8f9aa4", "stroke-width": 1 }));
          g.appendChild(D.el("circle", { r: 6, fill: "#171b1f", stroke: "#cfd6dc", "stroke-width": 1.2 }));
          for (let a = 0; a < 360; a += 45) {
            const t = deg(a);
            g.appendChild(D.el("line", { x1: Math.cos(t) * 24, y1: Math.sin(t) * 24, x2: Math.cos(t) * 30, y2: Math.sin(t) * 30, stroke: "#8f9aa4", "stroke-width": 1.1 }));
          }
          return g;
        } },
      { id: "tracerArm", name: "The Tracer Arm", sub: "the arm you actually steer", held: ["tracerPoint", "wheel"], lay: 2,
        home: { x: -40, y: -34, r: -9 }, hit: [box(-14, -9, 264, 9)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: "M -12 -6 L 252 -5 L 258 0 L 252 5 L -12 6 Z", fill: "url(#steelbar)", stroke: "#cfd6dc", "stroke-width": 1 }));
          for (let x = 20; x <= 240; x += 20) {
            g.appendChild(D.el("line", { x1: x, y1: -6, x2: x, y2: x % 60 === 0 ? 9 : 4, stroke: "#7d8890", "stroke-width": x % 60 === 0 ? 1 : 0.7 }));
          }
          g.appendChild(D.el("circle", { r: 8, fill: "none", stroke: "#cfd6dc", "stroke-width": 1.2 }));
          return g;
        } },
      { id: "wheel", name: "The Measuring Wheel", sub: "it counts only what it cannot slide", held: ["vernier"], lay: 3,
        home: { x: 46, y: -50, r: -9 }, hit: [box(-30, -30, 30, 30)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("ellipse", { rx: 9, ry: 27, fill: "url(#steelface)", stroke: "#e2e8ec", "stroke-width": 1.3 }));
          for (let i = 0; i < 24; i++) {
            const a = deg(i * 15), y = Math.sin(a) * 25, x = Math.cos(a) * 8.4 * 0.55;
            g.appendChild(D.el("line", { x1: x, y1: y, x2: x * 0.55, y2: y * 0.93, stroke: "#6f7a83", "stroke-width": 0.8, opacity: Math.cos(a) > 0 ? 0.9 : 0.25 }));
          }
          g.appendChild(D.el("line", { x1: 0, y1: -27, x2: 0, y2: 27, stroke: "#9fb0bd", "stroke-width": 1 }));
          return g;
        } },
      { id: "tracerPoint", name: "The Tracer Point", sub: "ivory, and sharp enough", held: [], lay: 3,
        home: { x: 214, y: -74, r: -9 }, hit: [box(-16, -16, 16, 40)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("path", { d: "M -11 -14 L 11 -14 L 6 20 L 0 34 L -6 20 Z", fill: "url(#ivory)", stroke: "#e8e2d2", "stroke-width": 1 }));
          g.appendChild(D.el("path", { d: "M -8 -6 L 8 -6 M -7 2 L 7 2", stroke: "#a79b82", "stroke-width": 0.9 }));
          g.appendChild(D.el("circle", { cy: -18, r: 6, fill: "none", stroke: "#e8e2d2", "stroke-width": 1.2 }));
          return g;
        } },
      { id: "vernier", name: "The Vernier", sub: "ten divisions where nine should be", held: [], lay: 4,
        home: { x: 84, y: -56, r: -9 }, hit: [box(-24, -20, 24, 20)],
        draw(D) {
          const g = D.el("g");
          g.appendChild(D.el("rect", { x: -22, y: -17, width: 44, height: 34, rx: 4, fill: "url(#steelface)", stroke: "#e2e8ec", "stroke-width": 1.1 }));
          for (let i = 0; i <= 10; i++) {
            const x = -18 + i * 3.6;
            g.appendChild(D.el("line", { x1: x, y1: -12, x2: x, y2: i % 5 === 0 ? 4 : -2, stroke: "#b9c4cc", "stroke-width": 0.9 }));
          }
          g.appendChild(D.txt("0", -18, 14, { fill: "#b9c4cc", "font-size": "8.5", "font-family": D.MONO, "text-anchor": "middle" }));
          g.appendChild(D.txt("10", 18, 14, { fill: "#b9c4cc", "font-size": "8.5", "font-family": D.MONO, "text-anchor": "middle" }));
          return g;
        } },
    ],
    z: ["carriage", "poleArm", "poleWeight", "tracerArm", "wheel", "vernier", "tracerPoint"],
  };

  return [astrolabe, volvelle, orrery, planimeter];
})();

if (typeof module !== "undefined" && module.exports) module.exports = { INSTRUMENTS };
