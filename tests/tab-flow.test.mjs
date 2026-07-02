import { extract, assertEq, assertTrue, done } from './harness.mjs';
// eval() here runs trusted source extracted from our own repo's ai_intuition_lab.html
// (delimited by the @tab-flow-start/@tab-flow-end markers), not untrusted input.
// This matches the established harness pattern (tests/harness.mjs extract()) used to
// test single-file, dependency-free JS embedded in the app without a bundler.
const TAB_FLOW = eval(`(() => { ${extract('// @tab-flow-start', '// @tab-flow-end')}; return TAB_FLOW; })()`);
assertEq(TAB_FLOW[0].tab, 'tokens', 'flow starts at tokens');
assertEq(TAB_FLOW[TAB_FLOW.length - 1].tab, 'limitations', 'flow ends at limitations');
assertTrue(TAB_FLOW.every(t => t.recap.length === 3), 'every tab has 3 recap bullets');
done();
