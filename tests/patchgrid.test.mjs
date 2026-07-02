import { extract, assertEq, assertTrue, done } from './harness.mjs';
// eval() here runs trusted source extracted from our own repo's ai_intuition_lab.html
// (delimited by the @patch-fn-start/@patch-fn-end markers), not untrusted input — same
// established harness pattern used by the other tests/*.test.mjs files in this repo.
const patchVectorFor = eval(`(() => { ${extract('// @patch-fn-start', '// @patch-fn-end')}; return patchVectorFor; })()`);
const v = patchVectorFor(2, 3);
assertTrue(Array.isArray(v) && v.length === 6, 'patch vector has 6 dims');
assertEq(patchVectorFor(2, 3), patchVectorFor(2, 3), 'deterministic for same patch');
assertTrue(JSON.stringify(patchVectorFor(2,3)) !== JSON.stringify(patchVectorFor(4,1)), 'different patches differ');
done();
