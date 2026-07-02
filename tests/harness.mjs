import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML_PATH = join(ROOT, 'ai_intuition_lab.html');

export function loadHTML() {
  return readFileSync(HTML_PATH, 'utf8');
}

// Extracts JS source between two exact marker comment lines, e.g.
// extract('// @bpe-start', '// @bpe-end')
export function extract(startMarker, endMarker) {
  const src = loadHTML();
  const s = src.indexOf(startMarker);
  const e = src.indexOf(endMarker);
  if (s === -1) throw new Error(`marker not found: ${startMarker}`);
  if (e === -1) throw new Error(`marker not found: ${endMarker}`);
  return src.slice(s + startMarker.length, e);
}

let failures = 0;
export function assertEq(actual, expected, label) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) { failures++; console.error(`FAIL ${label}\n  actual:   ${a}\n  expected: ${b}`); }
  else console.log(`ok ${label}`);
}
export function assertTrue(cond, label) {
  if (!cond) { failures++; console.error(`FAIL ${label}`); }
  else console.log(`ok ${label}`);
}
export function done() {
  if (failures > 0) { console.error(`${failures} failure(s)`); process.exit(1); }
  console.log('all passed');
}
