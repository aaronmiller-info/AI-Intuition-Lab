import { extract, assertEq, assertTrue, done } from './harness.mjs';
const data = extract('// @bpe-data-start', '// @bpe-data-end');
const fn = extract('// @bpe-fn-start', '// @bpe-fn-end');
// eval() here runs trusted source extracted from our own repo's ai_intuition_lab.html
// (delimited by the @bpe-data-start/@bpe-data-end and @bpe-fn-start/@bpe-fn-end markers),
// not untrusted input. This matches the established harness pattern (tests/harness.mjs
// extract()) used to test single-file, dependency-free JS embedded in the app without a bundler.
const bpeTokenize = eval(`(() => { ${data}; ${fn}; return bpeTokenize; })()`);

function roundtrip(w) {
  return bpeTokenize(w).map(t => t.token).join('').replace(/Ġ/g, ' ');
}
// The core guarantee the old engine violated: nothing is ever dropped.
for (const w of ['unhappiness', 'misunderstanding', 'disagreement', 'unfortunately',
                 'antidisestablishmentarianism', 'computerization', 'strawberry', 'Provo']) {
  assertEq(roundtrip(w), w, `lossless: ${w}`);
}
assertEq(roundtrip('Artificial intelligence is transforming thinking.'),
         'Artificial intelligence is transforming thinking.', 'lossless sentence with spaces');
assertTrue(bpeTokenize('unhappiness').length >= 2, 'unhappiness splits into pieces');
done();
