import * as C from './core.mjs';

let pass=0, total=0;
function ok(name, cond, info=''){ total++; if(cond){pass++; console.log('  ✓ '+name+(info?'  ·  '+info:''));} else {console.log('  ✗ '+name+(info?'  ·  '+info:''));} }

console.log('The Coastline Rule — Node cross-check\n');

// 1. Koch curve → log4/log3 ≈ 1.2619
{
  const m=C.measureD(C.koch(6), 1024, 14);
  const err=Math.abs(m.D - C.EXACT.koch);
  ok('Koch curve D measures log4/log3', err<0.06, `D=${m.D.toFixed(4)} vs ${C.EXACT.koch.toFixed(4)} (err ${err.toFixed(4)}, R²=${m.r2.toFixed(4)})`);
}

// 2. Koch snowflake → same closed form
{
  const m=C.measureD(C.snowflake(5), 1024, 14);
  const err=Math.abs(m.D - C.EXACT.snowflake);
  ok('Koch snowflake D measures log4/log3', err<0.07, `D=${m.D.toFixed(4)} vs ${C.EXACT.snowflake.toFixed(4)} (err ${err.toFixed(4)})`);
}

// 3. Sierpiński triangle → log3/log2 ≈ 1.585
{
  const m=C.measureD(C.sierpinski(7, 42), 1024, 14);
  const err=Math.abs(m.D - C.EXACT.sierpinski);
  ok('Sierpiński triangle D measures log3/log2', err<0.06, `D=${m.D.toFixed(4)} vs ${C.EXACT.sierpinski.toFixed(4)} (err ${err.toFixed(4)})`);
}

// 4. Sierpiński carpet → log8/log3 ≈ 1.893
{
  const m=C.measureD(C.carpet(5), 1024, 14);
  const err=Math.abs(m.D - C.EXACT.carpet);
  ok('Sierpiński carpet D measures log8/log3', err<0.06, `D=${m.D.toFixed(4)} vs ${C.EXACT.carpet.toFixed(4)} (err ${err.toFixed(4)})`);
}

// 5. Negative control — a smooth circle is 1-D
{
  const m=C.measureD(C.circle(), 1024, 14);
  ok('circle (smooth curve) measures D ≈ 1', Math.abs(m.D-1)<0.05, `D=${m.D.toFixed(4)}`);
}

// 6. Negative control — a filled disc is a 2-D REGION. Box-counting a solid
//    region converges to D=2 only as ε→0; at finite raster the slope curves
//    gently down at coarse ε, so the global fit lands ~1.88 (a real, well-known
//    finite-size bias). The honest assertions: it's unambiguously area-filling
//    (D > 1.85, above every fractal here) AND the FINEST local slope → 2.
{
  const m=C.measureD(C.disc(), 768, 14);
  const fine=m.points.filter(p=>p.inWindow).slice(0,4);   // finest 4 in-window scales
  let fineSlope=NaN;
  if(fine.length>=2){ const a=fine[0], b=fine[fine.length-1];
    fineSlope=(b.logN-a.logN)/(b.logInvEps-a.logInvEps); }
  ok('filled disc reads as a 2-D region (D>1.85; finest-scale slope → 2)',
     m.D>1.85 && fineSlope>1.9, `global D=${m.D.toFixed(3)}, fine-scale slope=${fineSlope.toFixed(3)}`);
}

// 7. The ordering is right: 1 < Koch < Sierpiński < carpet < 2 (D is a real ruler)
{
  const dk=C.measureD(C.koch(6),1024,14).D;
  const ds=C.measureD(C.sierpinski(7,42),1024,14).D;
  const dc=C.measureD(C.carpet(5),1024,14).D;
  ok('measured dimensions are correctly ORDERED (1<Koch<Sierp<carpet<2)',
     1<dk && dk<ds && ds<dc && dc<2, `${dk.toFixed(3)} < ${ds.toFixed(3)} < ${dc.toFixed(3)}`);
}

// 8. Coastline tracks roughness: rougher H (smaller) ⇒ larger D, both in (1,2)
{
  const smooth=C.measureD(C.coastline(11, 0.8, 3), 1024, 14).D;   // smooth ⇒ D near 1.2
  const rough =C.measureD(C.coastline(11, 0.3, 3), 1024, 14).D;   // rough  ⇒ D near 1.7
  ok('coastline: rougher (smaller H) measures a LARGER D, both in (1,2)',
     rough>smooth && smooth>1 && rough<2, `smooth H=0.8→D=${smooth.toFixed(3)}, rough H=0.3→D=${rough.toFixed(3)}`);
}

// 9. DLA dendrite → empirical ≈ 1.71 (Witten–Sander), measured by the CANONICAL
//    mass–radius estimator M(r) ∝ r^D (the right ruler for a grown cluster).
{
  const d=C.dla(6000, 17);
  const mr=C.massRadiusDimension(d, 14);
  ok('DLA dendrite measures D ≈ 1.71 by mass–radius M(r)∝r^D (Witten–Sander)',
     mr.D>1.6 && mr.D<1.85, `D=${mr.D.toFixed(3)} (${d.points.length} particles, R²=${mr.r2.toFixed(3)})`);
}

// 10. The fit is GOOD — log-log linearity (R² high) for a true self-similar set
{
  const m=C.measureD(C.carpet(5),1024,14);
  ok('the log-log fit is linear for a self-similar set (R² > 0.99)', m.r2>0.99, `R²=${m.r2.toFixed(5)}`);
}

// 11. Seed purity — same seed ⇒ identical measurement (a measurement, not a guess)
{
  const a=C.measureD(C.sierpinski(7, 99),1024,14).D;
  const b=C.measureD(C.sierpinski(7, 99),1024,14).D;
  ok('seed-pure: identical seed ⇒ identical D (bit-for-bit)', a===b, `D=${a.toFixed(6)}`);
}

// 12. FALSIFICATION — a generator claiming a fractal D, if you feed it a single
//     point, must NOT spuriously yield a fractal slope; a point has D≈0.
{
  const m=C.measureD({points:[[0.5,0.5]]}, 512, 12, {auto:false});
  ok('a single point does NOT fake a fractal dimension (D ≈ 0)', Math.abs(m.D)<0.05, `D=${m.D.toFixed(4)}`);
}

console.log(`\n${pass}/${total} ${pass===total?'✓ ALL GREEN':'✗ FAILURES'}`);
process.exit(pass===total?0:1);
