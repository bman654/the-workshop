/* Node twin — `node hung-line/core.test.mjs` exits 0 iff the MATH CLAIM holds.
   Imports the SAME core.mjs the page inlines and runs the SAME runSelfTest(). */
import { runSelfTest } from './core.mjs';

const r = runSelfTest();
const total = r.pass + r.fail;
if (r.fail === 0) {
  console.log(`As Hangs the Chain — self-test ${r.pass}/${total} ✓`);
  console.log(`  coincidence (funicular == core line of thrust): ${r.coincidence.toExponential(2)}`);
  console.log(`  plain chain max|e| at a≈1.6: ${r.plainMaxE.toFixed(4)}`);
  console.log(`  hinge: worst|e|=${r.hinge.worst.toFixed(3)} @ J${r.hinge.hingeJoint}, standsUp=${r.hinge.standsUp}, moment=${r.hinge.mom.toFixed(3)}`);
  process.exit(0);
} else {
  console.error(`As Hangs the Chain — self-test ${r.pass}/${total} ✗`);
  r.log.forEach((l) => console.error('  ' + l));
  process.exit(1);
}
