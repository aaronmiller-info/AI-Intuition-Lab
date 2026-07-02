import { extract, assertTrue, done } from './harness.mjs';
// eval() here runs trusted source extracted from our own repo's ai_intuition_lab.html
// (delimited by the @story-tree-start/@story-tree-end markers), not untrusted input.
// This matches the established harness pattern (tests/harness.mjs extract()) used to
// test single-file, dependency-free JS embedded in the app without a bundler.
const STORY_TREE = eval(`(() => { ${extract('// @story-tree-start', '// @story-tree-end')}; return STORY_TREE; })()`);
// Every node's probs sum ~1 and its children keys are all real tokens in probs.
// Skip the __root__ pointer (its value is a node-key string, not a node).
for (const [key, node] of Object.entries(STORY_TREE)) {
  if (key === '__root__') continue;
  const sum = node.probs.reduce((a, p) => a + p.prob, 0);
  assertTrue(Math.abs(sum - 1) < 0.02, `${key}: probs sum to ~1`);
  for (const t of Object.keys(node.children || {})) {
    assertTrue(node.probs.some(p => p.token === t), `${key}: child "${t}" is an offered token`);
  }
}
// Following top-probability tokens must reach a stop within 12 hops (no infinite loop).
let key = STORY_TREE.__root__ ? STORY_TREE.__root__ : Object.keys(STORY_TREE)[0];
let hops = 0, node = STORY_TREE[key];
while (node && hops < 12) {
  const top = node.probs.slice().sort((a, b) => b.prob - a.prob)[0].token;
  if (top === '<|end|>') break;
  key = (node.children && node.children[top]) || null;
  node = key ? STORY_TREE[key] : null;
  hops++;
}
assertTrue(hops < 12, 'greedy path terminates');
done();
