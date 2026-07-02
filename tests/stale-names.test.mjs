import { loadHTML, assertEq, done } from './harness.mjs';

// Forbidden-strings lint: guards against stale/incorrect model-name references
// creeping back into the HTML. Each entry maps a literal string to the exact
// number of times it is allowed to appear in the raw HTML source.
//
// "GPT-5.2" and "Sonnet 4.5" are allowed exactly once each: both appear together
// in the single spec-permitted historical-comparison sentence near line 9445
// ("GPT-5.2 vs GPT-5.5, or Claude Sonnet 4.5 vs Sonnet 5"). Everywhere else,
// current model names should come from the MODEL_FACTS registry via
// data-fact spans, not be hardcoded.
const FORBIDDEN = {
  'GPT-5.2': 1,
  'Sonnet 4.5': 1,
  'GPT 5.2': 0,
  'Gemini 3 Flash': 0,
  'Grok 4.1': 0,
  'Sora': 0,
  'May 2025': 0,
  'GPT-5.6': 0,
  'Gemini 3.5 Pro': 0,
  'Grok 5': 0,
  'Kimi': 0,
  'Mistral Large 3': 0,
};

const html = loadHTML();

function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

for (const [needle, allowed] of Object.entries(FORBIDDEN)) {
  assertEq(countOccurrences(html, needle), allowed, `occurrences of "${needle}"`);
}

done();
