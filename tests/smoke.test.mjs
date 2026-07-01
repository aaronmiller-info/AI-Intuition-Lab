import { loadHTML, assertTrue, done } from './harness.mjs';
const src = loadHTML();
assertTrue(src.includes('<title>'), 'file has a <title>');
assertTrue(src.includes('tabRenders'), 'tabRenders registry exists');
assertTrue(src.length > 100000, 'file is non-trivial');
done();
