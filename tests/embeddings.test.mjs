import { extract, assertTrue, done } from './harness.mjs';
const code = extract('// @embed-words-start', '// @embed-words-end');
// eval() here runs trusted source extracted from our own repo's ai_intuition_lab.html
// (delimited by the @embed-words-start/@embed-words-end markers), not untrusted input.
// This matches the established harness pattern (tests/harness.mjs extract()) used to test
// single-file, dependency-free JS embedded in the app without a bundler. THEME is shimmed
// here because the marker block's only external reference is THEME.colors.*.
const { EMBED_WORDS, cosineSim } = eval(`(() => { const THEME={colors:{blue:1,green:2,yellow:3,purple:4,red:5,gray:6}}; ${code}; return { EMBED_WORDS, cosineSim }; })()`);
const words = Object.keys(EMBED_WORDS);
assertTrue(words.length >= 30, 'at least 30 words');
assertTrue(EMBED_WORDS.king.vec.length === EMBED_WORDS.queen.vec.length, 'vectors share dimensionality');
assertTrue(Math.abs(cosineSim(EMBED_WORDS.king.vec, EMBED_WORDS.king.vec) - 1) < 1e-9, 'self-sim = 1');
assertTrue(cosineSim(EMBED_WORDS.king.vec, EMBED_WORDS.queen.vec) >
           cosineSim(EMBED_WORDS.king.vec, EMBED_WORDS.computer.vec), 'king~queen > king~computer');
done();
