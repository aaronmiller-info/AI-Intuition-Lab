import { readFileSync } from 'node:fs';
import { extract, assertEq, assertTrue, done } from './harness.mjs';
const code = extract('// @model-facts-start', '// @model-facts-end');
// eval() here runs trusted source extracted from our own repo's ai_intuition_lab.html
// (delimited by the @model-facts-start/@model-facts-end markers), not untrusted input.
// This matches the established harness pattern (tests/harness.mjs extract()) used to
// test single-file, dependency-free JS embedded in the app without a bundler.
const MODEL_FACTS = eval(`(() => { ${code}; return MODEL_FACTS; })()`);
assertEq(MODEL_FACTS.asOf, 'September 10, 2026', 'as-of stamp');
assertEq(MODEL_FACTS.lookup('ctx.gpt'), '1.05M', 'Astra ctx');
assertEq(MODEL_FACTS.lookup('price.gpt.in'), '$10.00', 'Astra input price');
assertTrue(MODEL_FACTS.lookup('nonexistent.key').includes('??'), 'unknown key is visible, not silent');
const html = readFileSync(new URL('../ai_intuition_lab.html', import.meta.url), 'utf8');
for (const [, key] of html.matchAll(/data-fact="([^"]+)"/g)) {
  assertTrue(!MODEL_FACTS.lookup(key).includes('??'), 'embedded fact resolves: ' + key);
}
done();
