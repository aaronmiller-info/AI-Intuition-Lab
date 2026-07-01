# AI Intuition Lab Content & Learning-Experience Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved spec `docs/superpowers/specs/2026-07-01-content-overhaul-design.md`: 12-topic architecture with new Reasoning and Agents & Tools tabs, truthful interactives (real BPE tokenizer, path-dependent inference, cosine embeddings), quizzes + recap/next flow + collapsible deep dives, and all dated facts pinned to the verified mid-2026 baseline (spec Appendix A).

**Architecture:** Everything ships inside the single dependency-free file `ai_intuition_lab.html` (~12.8k lines: CSS ≈ lines 1–6700, HTML content ≈ 6700–10260, JS ≈ 10260–end). New JS follows the existing `setupX()` + `tabRenders[tab]` registration pattern and the `THEME` object for colors. A new `MODEL_FACTS` registry becomes the single source of dated facts, populated into `data-fact` spans at load. Repo gains `tests/` (zero-dep Node scripts that extract JS from the HTML between marker comments and assert on it) and `tools/` (offline BPE trainer whose output is pasted into the HTML).

**Tech Stack:** Vanilla HTML/CSS/JS (no dependencies, single file), Node ≥18 for tests (no npm packages), Python 3 stdlib for the offline BPE trainer.

## Global Constraints

- `ai_intuition_lab.html` stays a single file with **zero runtime dependencies**; works offline via `file://`. (Spec §10)
- License CC BY 4.0; do not remove attribution or the sidebar footer. (Spec §10)
- Accept up to ~100KB file growth for the BPE merges table; nothing else may add bulk casually. (Spec §4.1)
- All dated facts (model names, prices, context windows, cutoffs) come **only** from `MODEL_FACTS` / spec Appendix A. Never print anything on the Appendix A.10 do-not-print list (Gemini 3.5 Pro specs, Grok 5 params, Kimi K2.5, Mistral Large 3/Qwen3.x exact figures, GPT-5.6 anything, agent benchmark percentages).
- Emoji stay (prior decision). No localStorage persistence, no URL hash routing (spec §9).
- Match existing code style: `setupX()` functions registered in the `DOMContentLoaded` block; canvas code guards `initCanvas()` against zero-size rects; colors via `THEME`; CSS custom properties in kebab-case.
- Every task ends with the app fully working: open `ai_intuition_lab.html` in a browser, no console errors, all tabs render.
- Do not commit unrelated changes; the working tree may contain a pre-existing modified `ai_intuition_lab.html` — commit only what each task touches. Line numbers in tasks are approximate anchors from the pre-overhaul file; always locate by the quoted snippet, not the number.
- Test command for all Node tests: `node tests/<name>.test.mjs` — exits 0 on pass, non-zero with message on fail. Run `for f in tests/*.test.mjs; do node "$f" || exit 1; done` for the suite.

---

### Task 1: Test harness + smoke test

**Files:**
- Create: `tests/harness.mjs`
- Create: `tests/smoke.test.mjs`

**Interfaces:**
- Produces: `extract(startMarker, endMarker)` → string (JS source between two literal marker comments in the HTML); `loadHTML()` → full file string; `assertEq(actual, expected, label)`, `assertTrue(cond, label)` — used by every later test file.

- [ ] **Step 1: Write the harness**

```js
// tests/harness.mjs
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
```

- [ ] **Step 2: Write the smoke test**

```js
// tests/smoke.test.mjs
import { loadHTML, assertTrue, done } from './harness.mjs';
const src = loadHTML();
assertTrue(src.includes('<title>'), 'file has a <title>');
assertTrue(src.includes('tabRenders'), 'tabRenders registry exists');
assertTrue(src.length > 100000, 'file is non-trivial');
done();
```

- [ ] **Step 3: Run it**

Run: `node tests/smoke.test.mjs`
Expected: `ok` ×3 then `all passed`, exit 0.

- [ ] **Step 4: Commit**

```bash
git add tests/harness.mjs tests/smoke.test.mjs
git commit -m "test: add zero-dep extraction harness for the single-file app"
```

---

### Task 2: MODEL_FACTS registry + data-fact population

**Files:**
- Modify: `ai_intuition_lab.html` (JS: immediately after the `THEME` object, ~line 10312; HTML: Inference context chart ~7675-7692, NN scale chart ~8000-8017, Pre-Training scale ~8814-8831, Limitations cutoff timeline ~9953-9974)
- Create: `tests/model-facts.test.mjs`

**Interfaces:**
- Produces: global `const MODEL_FACTS` (between markers `// @model-facts-start` / `// @model-facts-end`) with the exact shape below; `populateFacts()` which fills every `[data-fact]` element with `MODEL_FACTS.lookup(key)`; later tasks add `data-fact` attributes and rely on both.

- [ ] **Step 1: Write the failing test**

```js
// tests/model-facts.test.mjs
import { extract, assertEq, assertTrue, done } from './harness.mjs';
const code = extract('// @model-facts-start', '// @model-facts-end');
const MODEL_FACTS = eval(`(() => { ${code}; return MODEL_FACTS; })()`);
assertEq(MODEL_FACTS.asOf, 'July 2026', 'as-of stamp');
assertEq(MODEL_FACTS.lookup('ctx.gpt'), '1M', 'GPT-5.5 ctx');
assertEq(MODEL_FACTS.lookup('price.gpt.in'), '$5.00', 'GPT-5.5 input price');
assertTrue(MODEL_FACTS.lookup('nonexistent.key').includes('??'), 'unknown key is visible, not silent');
done();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/model-facts.test.mjs`
Expected: FAIL with `marker not found: // @model-facts-start`.

- [ ] **Step 3: Add the registry to the HTML** (insert directly after the `THEME` closing `};`)

```js
// @model-facts-start
// Single source of truth for every dated fact in the lab (spec Appendix A).
// To refresh next semester: edit values here, update asOf, done.
const MODEL_FACTS = {
  asOf: 'July 2026',
  facts: {
    // Flagship names
    'name.gpt': 'GPT-5.5', 'name.claude': 'Claude Fable 5', 'name.claude.mid': 'Claude Opus 4.8',
    'name.gemini': 'Gemini 3.5 Flash', 'name.grok': 'Grok 4.3',
    'name.gpt.free': 'GPT-5.5 Instant',
    // Context windows (A.2)
    'ctx.gpt': '1M', 'ctx.claude': '1M', 'ctx.gemini': '1M', 'ctx.grok': '1M', 'ctx.haiku': '200K',
    'ctx.industry': '200K–1M+',
    // Pricing per 1M tokens (A.3)
    'price.gpt.in': '$5.00', 'price.gpt.out': '$30.00', 'price.gpt.ratio': '6x',
    'price.cheap.name': 'GPT-5.4-nano', 'price.cheap.in': '$0.20', 'price.cheap.out': '$1.25',
    'price.claude.in': '$5.00', 'price.claude.out': '$25.00',
    'price.gemini.in': '$1.50', 'price.gemini.out': '$9.00',
    // Knowledge cutoffs (A.4)
    'cutoff.gpt': 'December 2025', 'cutoff.claude': 'January 2026', 'cutoff.gemini': 'January 2025',
    'cutoff.example': 'December 2025',
    // Parameter scale (A.6)
    'params.small.name': 'Llama 4 Scout', 'params.small': '109B (17B active)',
    'params.mid.name': 'Llama 4 Maverick', 'params.mid': '~400B (17B active)',
    'params.dense.name': 'Llama 3.1 405B', 'params.dense': '405B dense',
    'params.moe.name': 'DeepSeek V4-Pro', 'params.moe': '1.6T (49B active)',
    // Training scale (A.6)
    'train.tokens': '15T+', 'train.gpus': '16,000+', 'train.cost': '~$170M (est.)',
    // Media (A.7)
    'img.google': 'Nano Banana 2', 'img.openai': 'GPT Image 2', 'img.other': 'Midjourney V8.1',
    'video.models': 'Veo 3.1, Runway Gen-4.5, Kling 3.0',
    'voice.models': 'ChatGPT voice (GPT-Realtime-2), Gemini Live',
    // Tech stats (A.9)
    'vocab.size': '~200,000', 'speed.range': '50–200 tokens per second',
    'layers.range': '30 to ~126', 'dims.range': '4K–16K+',
  },
  lookup(key) { return this.facts[key] ?? `??${key}??`; },
};
// @model-facts-end

function populateFacts() {
  document.querySelectorAll('[data-fact]').forEach(el => {
    el.textContent = MODEL_FACTS.lookup(el.dataset.fact);
  });
  document.querySelectorAll('[data-fact-asof]').forEach(el => {
    el.textContent = MODEL_FACTS.asOf;
  });
}
```

Also add `populateFacts();` inside the `DOMContentLoaded` listener, before `setupTabs();`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/model-facts.test.mjs` → all passed.

- [ ] **Step 5: Convert the four existing dated charts to registry-driven values**

In the **Inference context-window chart** (`scale-comparison` div containing `GPT 5.2` / `Claude Sonnet 4.5` / `Gemini 3 Flash` / `Grok 4.1`), replace the four `scale-item`s with:

```html
<div class="scale-item">
  <div class="scale-number" data-fact="ctx.gpt"></div>
  <div class="scale-label" data-fact="name.gpt"></div>
</div>
<div class="scale-item">
  <div class="scale-number" data-fact="ctx.claude"></div>
  <div class="scale-label" data-fact="name.claude"></div>
</div>
<div class="scale-item">
  <div class="scale-number" data-fact="ctx.gemini"></div>
  <div class="scale-label" data-fact="name.gemini"></div>
</div>
<div class="scale-item">
  <div class="scale-number" data-fact="ctx.haiku"></div>
  <div class="scale-label">Budget models (e.g. Claude Haiku 4.5)</div>
</div>
```

And change the paragraph after it to open with: `As of <span data-fact-asof></span>, a 1M-token window is the frontier standard, with budget models around 200K.` (keep the rest of the paragraph about per-step cost unchanged).

In the **NN scale chart** (`8B / Llama 3` … `500B–1T+ / Frontier models like GPT 5.2`), replace the four items with `data-fact` pairs `params.small`/`params.small.name`, `params.mid`/`params.mid.name`, `params.dense`/`params.dense.name`, `params.moe`/`params.moe.name`; in the paragraph below, replace the sentence starting `Note: Exact sizes for closed-source frontier models` with: `Note: Closed-source frontier labs don't disclose exact sizes. The largest confirmed open dense model is 405B parameters; sparse mixture-of-experts models exceed 1T total parameters (as of <span data-fact-asof></span>).`

In the **Pre-Training scale chart** (`405B / parameters (Llama 3.1)` block), set the four `scale-number`/`scale-label` pairs to: `data-fact="params.dense"`+label `parameters (Llama 3.1 405B)`; `data-fact="train.tokens"`+`tokens of training data`; `data-fact="train.cost"`+`compute cost (third-party estimate)`; `data-fact="train.gpus"`+`GPUs for months`.

In the **Limitations cutoff timeline**, change the hardcoded `~May 2025` label to `<small data-fact="cutoff.example"></small>` and in the `cutoff-note` paragraph replace `a model with a May 2025 cutoff won't have reliable information about events in late 2025` with `a model with a December 2025 cutoff can't know about events in 2026 — the information simply isn't in its weights`.

- [ ] **Step 6: Browser check**

Open the file (or `preview_start` if a server config exists), switch to Inference / Neural Networks / Pre-Training / Limitations tabs: every converted number renders (no `??key??` visible anywhere), console clean.

- [ ] **Step 7: Commit**

```bash
git add ai_intuition_lab.html tests/model-facts.test.mjs
git commit -m "feat: MODEL_FACTS registry as single source of dated facts; convert context/params/scale/cutoff charts"
```

---

### Task 3: Collapsible deep dives with render-on-expand

**Files:**
- Modify: `ai_intuition_lab.html` (all 10 `<div class="deep-dive">` blocks; CSS near other component styles ~line 3000s; JS new `setupDeepDives()`)

**Interfaces:**
- Produces: every deep dive wrapped as `<details class="deep-dive"><summary class="deep-dive-summary">…</summary><div class="deep-dive-body">…</div></details>`; `setupDeepDives()` fires `tabRenders[tab]` when a details in that tab opens (canvases inside get sized). Later tasks (Reasoning/Agents) reuse this exact markup.

- [ ] **Step 1: Convert markup.** For each `<div class="deep-dive">` block: change the wrapper to `<details class="deep-dive">`; replace its `<h3 class="deep-dive-title">🔬 …</h3>` with `<summary class="deep-dive-summary">🔬 Go deeper (optional): <same title text minus the emoji></summary>`; wrap all remaining children in `<div class="deep-dive-body"> … </div>`; close with `</details>`. The Prompting tab has a second `deep-dive-title` (`🏗️ Context Engineering Techniques`) inside the same block — make it a second `<details>` of its own with the same pattern.

- [ ] **Step 2: Add CSS** (next to the existing `.deep-dive` styles):

```css
details.deep-dive > summary.deep-dive-summary {
  cursor: pointer; font-size: 1.15rem; font-weight: 700; padding: 1rem 1.25rem;
  color: var(--text-primary); list-style: none; border-radius: var(--radius-sm);
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
}
details.deep-dive > summary.deep-dive-summary::-webkit-details-marker { display: none; }
details.deep-dive > summary.deep-dive-summary::after {
  content: '▸ expand'; float: right; font-size: 0.8rem; color: var(--text-muted); font-weight: 400;
}
details.deep-dive[open] > summary.deep-dive-summary::after { content: '▾ collapse'; }
details.deep-dive > .deep-dive-body { padding-top: 1rem; }
```

- [ ] **Step 3: Add JS**

```js
function setupDeepDives() {
  document.querySelectorAll('details.deep-dive').forEach(d => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      const section = d.closest('.tab-section');
      const tab = section && section.id.replace('tab-', '');
      // Canvases inside a previously-hidden details have zero size; re-render.
      if (tab && tabRenders[tab]) setTimeout(() => tabRenders[tab](), 50);
      revealInView(section);
    });
  });
}
```

Register `setupDeepDives();` in `DOMContentLoaded`. Also update `markRevealItems()` no change needed (details is a direct child, gets observed as one reveal item).

- [ ] **Step 4: Browser check.** Every tab: deep dive renders collapsed with "Go deeper (optional)"; expanding Pre-Training's deep dive shows the **gradient-descent canvas at correct size** (this is the regression the toggle-rerender exists for); collapsing/expanding is smooth; console clean.

- [ ] **Step 5: Commit**

```bash
git add ai_intuition_lab.html
git commit -m "feat: collapse deep dives by default with render-on-expand for embedded canvases"
```

---

### Task 4: Renumber tabs and re-point cross-references

**Files:**
- Modify: `ai_intuition_lab.html` (nav `~6718-6790`; section headers; cross-reference sentences)

**Interfaces:**
- Produces: final numbering — 01 Tokens, 02 Embeddings, 03 Inference, 04 Neural Networks, 05 Attention, 06 Pre-Training, 07 Fine-Tuning, 08 Prompting, *(09/10 reserved for Tasks 15/16)*, 11 Images & Sound, 12 Limitations. Tab element IDs (`tab-tokens` etc.) are **unchanged** everywhere.

- [ ] **Step 1: Renumber headers and nav labels.** Change `<h2>09: Images & Sound</h2>` → `11: Images & Sound` and `<h2>10: Limitations</h2>` → `12: Limitations`, and the matching sidebar nav button labels. Numbers 01–08 stay as-is.

- [ ] **Step 2: Re-point stale cross-references.** Fix each of these (locate by quoted text):
  - Prompting, chain-of-thought card: `This is why reasoning models (covered in the next tab) are so effective` → `This is why reasoning models are so effective — the **Reasoning** tab covers them in depth.` (becomes literally next after Task 15).
  - Limitations RAG card: `<em>(We'll explore building RAG systems in depth later.)</em>` → `<em>(The <strong>Agents &amp; Tools</strong> tab shows how systems fetch information like this on demand.)</em>` — forward reference, satisfied by Task 16.
  - Attention "Putting It All Together" closing line `The <strong>Pre-Training</strong> tab shows how…` — verify it still matches numbering (no number cited: OK, leave).

- [ ] **Step 3: Browser check.** Sidebar reads 01…08, 11, 12 (temporary gap is expected until Tasks 15–16); all tabs open; console clean.

- [ ] **Step 4: Commit**

```bash
git add ai_intuition_lab.html
git commit -m "refactor: renumber Images & Sound to 11 and Limitations to 12; re-point stale cross-references"
```

---

### Task 5: Recap + "Next topic" footer on all tabs

**Files:**
- Modify: `ai_intuition_lab.html` (CSS; JS new `TAB_FLOW`, `setupTabFooters()`; no per-tab HTML edits — footers are injected)
- Create: `tests/tab-flow.test.mjs`

**Interfaces:**
- Produces: `const TAB_FLOW` (markers `// @tab-flow-start` / `// @tab-flow-end`): ordered array of `{tab, title, recap:[3 strings]}`; `setupTabFooters()` appends to each `.tab-section` a recap card + next button that programmatically clicks the target nav button. Tasks 15/16 add their entries to `TAB_FLOW`.

- [ ] **Step 1: Write the failing test**

```js
// tests/tab-flow.test.mjs
import { extract, assertEq, assertTrue, done } from './harness.mjs';
const TAB_FLOW = eval(`(() => { ${extract('// @tab-flow-start', '// @tab-flow-end')}; return TAB_FLOW; })()`);
assertEq(TAB_FLOW[0].tab, 'tokens', 'flow starts at tokens');
assertEq(TAB_FLOW[TAB_FLOW.length - 1].tab, 'limitations', 'flow ends at limitations');
assertTrue(TAB_FLOW.every(t => t.recap.length === 3), 'every tab has 3 recap bullets');
done();
```

- [ ] **Step 2: Run it** → FAIL (`marker not found`).

- [ ] **Step 3: Implement.** Add to the JS:

```js
// @tab-flow-start
const TAB_FLOW = [
  { tab: 'tokens', title: '01: Tokenization', recap: [
    'LLMs process tokens — subword chunks mapped to ID numbers — not raw text.',
    'BPE builds the vocabulary by repeatedly merging the most frequent pairs.',
    'Everything is billed and measured in tokens (≈ ¾ of an English word each).' ]},
  { tab: 'embed', title: '02: Embedding Space', recap: [
    'Each token ID becomes a vector — thousands of numbers acting as coordinates.',
    'Similar meanings sit at nearby coordinates; distance is learned, not programmed.',
    'Cosine similarity measures the angle between two word-vectors.' ]},
  { tab: 'inference', title: '03: Inference', recap: [
    'Models generate one token at a time, re-reading everything so far at every step.',
    'The output is a probability distribution; temperature controls how it is sampled.',
    'Each chosen token changes all the probabilities that follow it.' ]},
  { tab: 'nn', title: '04: Neural Networks', recap: [
    'A neuron just multiplies inputs by weights, sums, and squashes.',
    'Hidden layers act as learned pattern detectors — nobody programs them.',
    'The logic lives distributed across billions of weights: the black box.' ]},
  { tab: 'attention', title: '05: Attention', recap: [
    'Attention lets every token look directly at every other token.',
    'Query, Key, Value: who is asking, who matches, what they contribute.',
    'A transformer is just attention + feed-forward layers, stacked.' ]},
  { tab: 'training', title: '06: Pre-Training', recap: [
    'Every weight starts random; prediction + correction makes them meaningful.',
    'Loss measures how wrong the prediction was; backprop assigns the blame.',
    'Grammar, facts, and reasoning all emerge from next-token prediction at scale.' ]},
  { tab: 'finetuning', title: '07: Fine-Tuning', recap: [
    'Pre-training gives knowledge; fine-tuning gives behavior.',
    'RLHF turns human preference ratings into a training signal.',
    'Different fine-tuning is why models have different personalities.' ]},
  { tab: 'prompting', title: '08: Prompting', recap: [
    'A prompt is context for prediction — every word shifts the probabilities.',
    'Everything competes for finite context-window space.',
    'Specific prompts activate the right learned patterns.' ]},
  { tab: 'multimodal', title: '11: Images & Sound', recap: [
    'Images and audio become embeddings, just like text tokens.',
    'The pattern is always: divide → embed → attend.',
    'Generated media is now realistic enough that provenance matters.' ]},
  { tab: 'limitations', title: '12: Limitations', recap: [
    'Models predict plausible text, not verified truth.',
    'Confidence and correctness are not correlated.',
    'Grounding (search, RAG, code, citations) is the reliability fix.' ]},
];
// @tab-flow-end

function setupTabFooters() {
  TAB_FLOW.forEach((entry, i) => {
    const section = document.getElementById(`tab-${entry.tab}`);
    if (!section) return;
    const next = TAB_FLOW[i + 1];
    const footer = document.createElement('div');
    footer.className = 'tab-footer';
    footer.innerHTML = `
      <div class="recap-card">
        <h4>✅ You now know</h4>
        <ul>${entry.recap.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
      ${next
        ? `<button class="next-topic-btn" data-next="${next.tab}">Next: ${next.title} →</button>`
        : `<div class="completion-card"><h4>🎓 You made it!</h4><p>You've walked the entire pipeline — from tokens to the limits of what these systems can do. You now understand LLMs better than the vast majority of the people using them. Go use that intuition.</p></div>`}
    `;
    section.appendChild(footer);
  });
  document.querySelectorAll('.next-topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(`.tab-btn[data-tab="${btn.dataset.next}"]`);
      if (target) target.click();
    });
  });
}
```

CSS:

```css
.tab-footer { margin-top: 3rem; }
.recap-card { background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); padding: 1.25rem 1.5rem; }
.recap-card ul { margin: 0.5rem 0 0 1.25rem; }
.recap-card li { margin-bottom: 0.35rem; }
.next-topic-btn { display: block; margin: 1.25rem 0 0 auto; padding: 0.9rem 1.5rem;
  background: var(--accent-primary); color: var(--bg-deep); border: none; font-weight: 700;
  font-size: 1rem; border-radius: var(--radius-sm); cursor: pointer; }
.next-topic-btn:hover { filter: brightness(1.1); }
.completion-card { background: var(--positive-10, var(--bg-elevated)); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); padding: 1.25rem 1.5rem; margin-top: 1.25rem; }
```

Register `setupTabFooters();` in `DOMContentLoaded` (after `populateFacts();`).

- [ ] **Step 4: Run test** → all passed. **Browser check:** each tab ends with recap + Next button; Next navigates and scrolls to top; Limitations shows the completion card; Welcome has no footer (not in TAB_FLOW).

- [ ] **Step 5: Commit**

```bash
git add ai_intuition_lab.html tests/tab-flow.test.mjs
git commit -m "feat: recap + next-topic footers with completion card on the final tab"
```

---

### Task 6: Quiz component + questions for all tabs

**Files:**
- Modify: `ai_intuition_lab.html` (JS `QUIZ_DATA` + `setupQuizzes()`; CSS)
- Create: `tests/quiz-data.test.mjs`

**Interfaces:**
- Consumes: `TAB_FLOW` ordering (quiz renders just above the `.tab-footer`).
- Produces: `const QUIZ_DATA` (markers `// @quiz-data-start` / `// @quiz-data-end`): `{ [tab]: [{q, options:[{text, correct?, feedback}] }] }`; `setupQuizzes()` injects a "🧠 Check your intuition" block per tab. Tasks 15/16 add `reasoning` / `agents` keys.

- [ ] **Step 1: Write the failing test**

```js
// tests/quiz-data.test.mjs
import { extract, assertTrue, done } from './harness.mjs';
const QUIZ_DATA = eval(`(() => { ${extract('// @quiz-data-start', '// @quiz-data-end')}; return QUIZ_DATA; })()`);
const tabs = Object.keys(QUIZ_DATA);
assertTrue(tabs.length >= 10, 'at least 10 tabs have quizzes');
for (const t of tabs) {
  for (const q of QUIZ_DATA[t]) {
    assertTrue(q.options.filter(o => o.correct).length === 1, `${t}: exactly one correct option`);
    assertTrue(q.options.every(o => o.feedback && o.feedback.length > 20), `${t}: every option teaches`);
  }
}
done();
```

- [ ] **Step 2: Run it** → FAIL (`marker not found`).

- [ ] **Step 3: Implement data** (complete content — two questions per tab):

```js
// @quiz-data-start
const QUIZ_DATA = {
  tokens: [
    { q: 'Why do models use subword tokens instead of whole words?', options: [
      { text: 'Whole words would make the vocabulary too small', feedback: 'Other way around — a whole-word vocabulary would be enormous and still miss new words, typos, and rare words.' },
      { text: 'Subwords balance efficiency with the ability to handle any text', correct: true, feedback: 'Right. Common words stay whole; rare words split into reusable pieces, so nothing is ever truly "unknown."' },
      { text: 'Computers can only process short strings', feedback: 'Length isn\'t the issue — computers handle long strings fine. The issue is having a fixed, finite vocabulary that still covers all possible text.' }]},
    { q: 'Roughly how many tokens is a 100-word English paragraph?', options: [
      { text: 'About 35', feedback: 'Too low — that would be ~3 words per token. The rule of thumb runs the other way.' },
      { text: 'About 133', correct: true, feedback: 'Yes — 1 token ≈ ¾ of a word, so ~100 words ≈ ~133 tokens. This is why long prompts cost real money.' },
      { text: 'Exactly 100 — one per word', feedback: 'Close but no: common words are often one token, but many words split, and punctuation costs tokens too.' }]},
  ],
  embed: [
    { q: 'In embedding space, what does it mean when two words are close together?', options: [
      { text: 'They are spelled similarly', feedback: 'Spelling is irrelevant — "dog" and "hound" are far apart in letters but close in embedding space.' },
      { text: 'The model learned they appear in similar contexts, so they mean similar things', correct: true, feedback: 'Exactly. Proximity is learned from co-occurrence across billions of sentences — meaning as location.' },
      { text: 'They have consecutive token IDs', feedback: 'Token IDs are just dictionary positions — ID 5000 and 5001 can be totally unrelated words.' }]},
    { q: 'Cosine similarity between two word-vectors measures…', options: [
      { text: 'The angle between them', correct: true, feedback: 'Right — pointing the same direction = similar meaning, regardless of vector length.' },
      { text: 'How many dimensions they share', feedback: 'All vectors in a model have the same dimensions; what differs is the values, and cosine compares their direction.' },
      { text: 'The difference in their token IDs', feedback: 'IDs are lookup addresses, not meaning. Similarity lives in the vectors, not the IDs.' }]},
  ],
  inference: [
    { q: 'After a model picks a token, what happens next?', options: [
      { text: 'It keeps writing from where it left off, remembering its plan', feedback: 'There is no plan and no memory beyond the text — that\'s the surprising part.' },
      { text: 'The token is appended, and the model re-reads the WHOLE text to predict the next one', correct: true, feedback: 'Yes — the entire story so far is re-processed for every single new token. That\'s the one-word-story loop.' },
      { text: 'It generates the rest of the sentence in one step', feedback: 'Never — generation is strictly one token per step, no matter how long the output.' }]},
    { q: 'At temperature 0, the model…', options: [
      { text: 'Refuses to answer creative questions', feedback: 'Temperature doesn\'t gate what it answers — it changes how the next token is picked.' },
      { text: 'Always picks the single most likely next token', correct: true, feedback: 'Right — "greedy decoding." Same prompt, same output, every time.' },
      { text: 'Becomes more accurate', feedback: 'Tempting, but no: the most likely token isn\'t necessarily the true one. Determinism ≠ correctness.' }]},
  ],
  nn: [
    { q: 'What does a single weight in a neural network do?', options: [
      { text: 'Stores one fact the model knows', feedback: 'Facts aren\'t stored one-per-weight — each fact is smeared across millions of weights, which is why the box is black.' },
      { text: 'Scales how much one input matters to one neuron', correct: true, feedback: 'Exactly — a volume knob. Billions of tuned volume knobs are the whole "intelligence."' },
      { text: 'Decides which words are grammatically valid', feedback: 'No single weight does anything that interpretable; grammar emerges from many weights acting together.' }]},
    { q: 'Why is it hard to explain WHY a model gave a specific answer?', options: [
      { text: 'Companies keep the reasons secret', feedback: 'Even with full access to every weight, the difficulty remains — this is a research problem, not a secrecy problem.' },
      { text: 'The logic is distributed across billions of weights, not written as rules', correct: true, feedback: 'Right — that\'s the interpretability problem. Nobody wrote the logic; it was learned into the numbers.' },
      { text: 'The model changes its weights with every conversation', feedback: 'Weights are frozen after training — your chats don\'t change them. The opacity comes from distribution, not change.' }]},
  ],
  attention: [
    { q: 'What does attention let each token do?', options: [
      { text: 'Look directly at every other token and weigh what matters', correct: true, feedback: 'Yes — direct connections, any distance. This is the transformer\'s superpower over older architectures.' },
      { text: 'Remember previous conversations', feedback: 'Attention works only within the current context window — there is no memory across conversations.' },
      { text: 'Check facts against a database', feedback: 'No database — attention only mixes information already present in the context.' }]},
    { q: '"The trophy doesn\'t fit in the suitcase because it is too small." What must attention figure out?', options: [
      { text: 'That "it" means the suitcase — using MEANING, not position', correct: true, feedback: 'Right — swap "small" for "big" and the referent flips. Position and grammar alone can\'t solve this.' },
      { text: 'That "it" means the trophy, the nearest noun', feedback: 'Nearest-noun fails here: too *small* to fit must be the container. That\'s why attention needs semantics.' },
      { text: 'Nothing — pronouns are skipped', feedback: 'Pronouns are exactly where attention earns its keep — resolving them is essential to understanding.' }]},
  ],
  training: [
    { q: 'Before pre-training starts, the model\'s billions of weights are…', options: [
      { text: 'Copied from an older model', feedback: 'That happens in some workflows (distillation), but the canonical story — and the mind-blowing one — is pure randomness.' },
      { text: 'Completely random numbers', correct: true, feedback: 'Yes. Everything the model "knows" was carved out of noise by trillions of predict-check-adjust steps.' },
      { text: 'Programmed with grammar rules first', feedback: 'Nobody programs any rules — grammar emerges from prediction alone. That\'s the whole point.' }]},
    { q: 'What does the "loss" measure during training?', options: [
      { text: 'How much money the training run costs', feedback: 'Great guess given the bills, but no — loss is a math score, not a dollar figure.' },
      { text: 'How wrong the model\'s prediction was', correct: true, feedback: 'Right — high loss = confident and wrong. Every weight update exists to nudge this number down.' },
      { text: 'How many tokens were deleted from the data', feedback: 'Nothing is deleted — loss compares the model\'s predicted probabilities to the actual next token.' }]},
  ],
  finetuning: [
    { q: 'What\'s the key difference between pre-training and fine-tuning signals?', options: [
      { text: 'Pre-training predicts real text; fine-tuning optimizes for judged response quality', correct: true, feedback: 'Exactly — "what comes next in the world\'s text" vs "what response do raters prefer."' },
      { text: 'Fine-tuning uses more data than pre-training', feedback: 'Reversed — pre-training uses trillions of tokens; fine-tuning uses comparatively tiny curated sets.' },
      { text: 'Pre-training is done by humans, fine-tuning by machines', feedback: 'Both are automated loops; the difference is where the training signal comes from.' }]},
    { q: 'Two assistants use similar architectures but "feel" totally different. Most likely cause?', options: [
      { text: 'Different fine-tuning data and alignment choices', correct: true, feedback: 'Right — personality is mostly a post-training artifact, which is why each provider\'s model feels distinct.' },
      { text: 'One has a bigger context window', feedback: 'Context size changes how much they can read, not their manner and values.' },
      { text: 'One is connected to the internet', feedback: 'Tool access changes what they can look up, not their persona.' }]},
  ],
  prompting: [
    { q: 'A very long conversation exceeds the context window. What happens?', options: [
      { text: 'The model summarizes everything perfectly and continues', feedback: 'Some products do inject summaries, but that\'s app engineering — the model itself just loses whatever no longer fits.' },
      { text: 'Old conversation turns get dropped; the model has no idea they existed', correct: true, feedback: 'Right — the whiteboard gets erased. (Well-built systems keep the system prompt and trim old turns.)' },
      { text: 'The model slows down but remembers everything', feedback: 'There\'s no overflow storage — outside the window means gone, period.' }]},
    { q: 'Why does "I\'m a beginner learning Python for data analysis — explain list comprehensions with a sales-data example" beat "Tell me about Python"?', options: [
      { text: 'Longer prompts always get better answers', feedback: 'Length isn\'t the mechanism — a long rambling prompt can do worse. Specificity is the mechanism.' },
      { text: 'It steers probabilities toward exactly the relevant patterns', correct: true, feedback: 'Yes — audience, goal, topic, and format each activate patterns from training, narrowing the distribution to useful outputs.' },
      { text: 'It uses politer wording', feedback: 'Politeness is fine but does little — information content is what shifts the distribution.' }]},
  ],
  multimodal: [
    { q: 'How does an image get into an LLM\'s context?', options: [
      { text: 'It\'s converted to a text description first', feedback: 'That\'s how it worked before true multimodality — modern models embed the pixels directly, no text middleman.' },
      { text: 'It\'s sliced into patches, and each patch becomes an embedding vector', correct: true, feedback: 'Right — divide → embed → attend. After embedding, the transformer can\'t tell patches from word-tokens.' },
      { text: 'The model runs OCR and reads any text in it', feedback: 'It can read text in images, but that\'s a byproduct — the whole image becomes embeddings, text or not.' }]},
    { q: 'Why does generating an image usually take longer than generating a sentence?', options: [
      { text: 'Diffusion needs many denoising passes; text needs one pass per token', correct: true, feedback: 'Right — a diffusion model runs the network dozens of times to sharpen noise into an image.' },
      { text: 'Images are stored on slower hard drives', feedback: 'Storage isn\'t the bottleneck — the repeated neural-network passes are.' },
      { text: 'Image models are illegal to run quickly', feedback: 'No such rule — it\'s pure computation cost.' }]},
  ],
  limitations: [
    { q: 'A model states a "fact" very confidently. What does that confidence tell you?', options: [
      { text: 'The fact is probably true', feedback: 'This is THE trap. Confidence reflects pattern-fit, not truth — fluent nonsense scores high too.' },
      { text: 'Almost nothing — plausibility and truth are different things', correct: true, feedback: 'Right — the model optimizes "sounds like what comes next," and false things can sound exactly right.' },
      { text: 'The fact was in its training data', feedback: 'Not necessarily — models fluently fill gaps with invented specifics. That\'s what a hallucination is.' }]},
    { q: 'Which is the most reliable way to get accurate current information from an AI system?', options: [
      { text: 'Ask it to promise not to hallucinate', feedback: 'A promise doesn\'t add a fact-checker — the architecture is unchanged. Grounding does.' },
      { text: 'Ground it: let it search, retrieve documents, or run code, then answer from those', correct: true, feedback: 'Right — verified context beats memorized patterns. This is why tools + RAG are the reliability play.' },
      { text: 'Raise the temperature so it explores more', feedback: 'Temperature adds randomness, which is the opposite of what accuracy needs.' }]},
  ],
};
// @quiz-data-end
```

- [ ] **Step 4: Implement the component**

```js
function setupQuizzes() {
  Object.entries(QUIZ_DATA).forEach(([tab, questions]) => {
    const section = document.getElementById(`tab-${tab}`);
    if (!section) return;
    const quiz = document.createElement('div');
    quiz.className = 'quiz-block';
    quiz.innerHTML = `<h3 class="quiz-title">🧠 Check your intuition</h3>` + questions.map((q, qi) => `
      <div class="quiz-q" data-q="${qi}">
        <p class="quiz-question">${q.q}</p>
        <div class="quiz-options">
          ${q.options.map((o, oi) => `<button class="quiz-opt" data-oi="${oi}">${o.text}</button>`).join('')}
        </div>
        <div class="quiz-feedback" hidden></div>
      </div>`).join('');
    const footer = section.querySelector('.tab-footer');
    footer ? section.insertBefore(quiz, footer) : section.appendChild(quiz);

    quiz.querySelectorAll('.quiz-q').forEach((qEl, qi) => {
      qEl.querySelectorAll('.quiz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const opt = questions[qi].options[parseInt(btn.dataset.oi)];
          qEl.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('picked', 'right', 'wrong'));
          btn.classList.add('picked', opt.correct ? 'right' : 'wrong');
          const fb = qEl.querySelector('.quiz-feedback');
          fb.hidden = false;
          fb.innerHTML = `${opt.correct ? '✓' : '↺'} ${opt.feedback}`;
          fb.className = 'quiz-feedback ' + (opt.correct ? 'good' : 'retry');
        });
      });
    });
  });
}
```

CSS:

```css
.quiz-block { margin-top: 3rem; background: var(--bg-panel); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); padding: 1.5rem; }
.quiz-title { margin-bottom: 1rem; }
.quiz-q { margin-bottom: 1.5rem; }
.quiz-question { font-weight: 600; margin-bottom: 0.6rem; }
.quiz-options { display: flex; flex-direction: column; gap: 0.5rem; }
.quiz-opt { text-align: left; padding: 0.7rem 1rem; background: var(--bg-card);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.9rem; }
.quiz-opt:hover { border-color: var(--accent-primary); }
.quiz-opt.right { border-color: var(--positive); background: var(--positive-10, var(--bg-elevated)); }
.quiz-opt.wrong { border-color: var(--negative); }
.quiz-feedback { margin-top: 0.6rem; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.9rem; }
.quiz-feedback.good { background: var(--positive-10, var(--bg-elevated)); }
.quiz-feedback.retry { background: var(--bg-elevated); }
```

Register `setupQuizzes();` in `DOMContentLoaded` **after** `setupTabFooters();` (it inserts before the footer).

- [ ] **Step 5: Run test** (`node tests/quiz-data.test.mjs`) → all passed. **Browser check:** wrong answers show teaching feedback (no buzzer styling dominating), right answers confirm; picking a second option after the first works.

- [ ] **Step 6: Commit**

```bash
git add ai_intuition_lab.html tests/quiz-data.test.mjs
git commit -m "feat: check-your-intuition quizzes with teaching feedback on all existing tabs"
```

---

### Task 7: Real tiny-BPE tokenizer (replaces the broken rule engine)

**Files:**
- Create: `tools/train_bpe.py` (already scaffolded in repo — verify present)
- Modify: `ai_intuition_lab.html` (replace `setupTokenizer()` internals ~11223-11463; Tokenization prose ~6874, 6999-7007, 7009-7031; vocab claim ~6874)
- Create: `tests/tokenizer.test.mjs`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: globals `BPE_MERGES` (array of `"a b"` rank-ordered strings) and `BPE_VOCAB` (object token→id) between `// @bpe-data-start` / `// @bpe-data-end`; and a `bpeTokenize(text)` → `[{token, isContinuation}]` between `// @bpe-fn-start` / `// @bpe-fn-end` that is **lossless** (joined tokens, with `Ġ`→space, reproduce the input). The `Ġ` char (`Ġ`) marks a leading space.

- [ ] **Step 1: Generate the merge data.** Run the trainer (already in repo at `tools/train_bpe.py`):

```bash
python3 tools/train_bpe.py --merges 5000 > /tmp/bpe.js
# stderr prints "merges: N, vocab: M" — expect a few hundred to a few thousand
```

If a richer demo is wanted, extend the `CORPUS` string in the trainer with more public-domain text and re-run. Copy the whole `/tmp/bpe.js` output (the `// @bpe-data-start … // @bpe-data-end` block) to paste in Step 3.

- [ ] **Step 2: Write the failing test** (this is the regression test for the old bug):

```js
// tests/tokenizer.test.mjs
import { extract, assertEq, assertTrue, done } from './harness.mjs';
const data = extract('// @bpe-data-start', '// @bpe-data-end');
const fn = extract('// @bpe-fn-start', '// @bpe-fn-end');
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/tokenizer.test.mjs`
Expected: FAIL (`marker not found: // @bpe-data-start`).

- [ ] **Step 4: Paste the generated data into the HTML.** Inside `setupTokenizer()`, delete the old `bpeVocab` object (the giant one-liner ~11232) and the entire `subwordRules` array + the rule/recursive-fallback body of `tokenize()`. In their place, first paste the `// @bpe-data-start … // @bpe-data-end` block from Step 1 at the top of `setupTokenizer()` (or at top-level script scope — either works; keep it above the function that uses it).

- [ ] **Step 5: Add the runtime tokenizer** between markers (replace the old `tokenize`):

```js
// @bpe-fn-start
const _bpeRank = new Map(BPE_MERGES.map((s, i) => [s, i]));
// GPT-style pre-tokenization: keep a leading space attached to the next word.
const _bpePretok = /'s|'t|'re|'ve|'m|'ll|'d| ?[A-Za-z]+| ?\d+| ?[^\sA-Za-z\d]+|\s+/g;
function _bpeMergeWord(sym) {
  let symbols = Array.from(sym);
  while (symbols.length > 1) {
    let best = null, bestRank = Infinity, bestI = -1;
    for (let i = 0; i < symbols.length - 1; i++) {
      const key = symbols[i] + ' ' + symbols[i + 1];
      const r = _bpeRank.get(key);
      if (r !== undefined && r < bestRank) { bestRank = r; best = key; bestI = i; }
    }
    if (best === null) break;
    symbols = symbols.slice(0, bestI)
      .concat([symbols[bestI] + symbols[bestI + 1]])
      .concat(symbols.slice(bestI + 2));
  }
  return symbols;
}
// Returns [{token, isContinuation}] — lossless (join + Ġ→space rebuilds input).
function bpeTokenize(text) {
  const pieces = text.match(_bpePretok) || [];
  const out = [];
  for (const piece of pieces) {
    if (/^\s+$/.test(piece)) continue;      // standalone spaces fold into next word
    const marked = piece.replace(/ /g, 'Ġ');
    _bpeMergeWord(marked).forEach((t, i) => out.push({ token: t, isContinuation: i > 0 }));
  }
  return out;
}
function bpeTokenId(token) {
  if (BPE_VOCAB[token] !== undefined) return BPE_VOCAB[token];
  let hash = 0;
  for (let i = 0; i < token.length; i++) { hash = ((hash << 5) - hash) + token.charCodeAt(i); hash |= 0; }
  return 50000 + Math.abs(hash % 50000);
}
// @bpe-fn-end
```

- [ ] **Step 6: Rewire the render.** In `setupTokenizer()`'s `render()`, change the token/id source from `tokenize(text)` / `getTokenId` to `bpeTokenize(text)` / `bpeTokenId`. Display each token with `token.replace(/Ġ/g, '␣')` (visible-space glyph) so leading spaces are legible; keep the existing continuation-token blue styling driven by `isContinuation`. Update the legend text to: "Blue tokens continue a word; ␣ marks a leading space (real tokenizers attach spaces to the following token)."

- [ ] **Step 7: Run test to verify it passes**

Run: `node tests/tokenizer.test.mjs` → all passed (every `lossless:` line ok).

- [ ] **Step 8: Fix the prose to match reality.** In the "Why subword tokenization matters" paragraph, change `Real models like GPT-4 use ~100k tokens` → `Real models use large vocabularies — around <span data-fact="vocab.size"></span> tokens for current frontier models`. Rewrite the "Try These Experiments" box to describe what the demo *actually* produces now (run each word in the browser and transcribe the real split), removing any claim that isn't true. Keep the "simplified for education / try a real tokenizer" note and its external link.

- [ ] **Step 9: Browser check.** Tokenize each experiment word: pieces reassemble to the original (no dropped letters); leading spaces show as ␣; IDs render; console clean.

- [ ] **Step 10: Commit**

```bash
git add tools/train_bpe.py ai_intuition_lab.html tests/tokenizer.test.mjs
git commit -m "feat: replace broken rule tokenizer with real lossless tiny-BPE; fix vocab-size prose"
```

---

### Task 8: Inference — one-word-story game (path-dependent generation)

**Files:**
- Modify: `ai_intuition_lab.html` (Inference tab HTML ~7419-7615: intro, controls, add mode toggle; `setupInference()` ~10501-10917; CSS)
- Create: `tests/inference-tree.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `const STORY_TREE` (markers `// @story-tree-start` / `// @story-tree-end`) — a branching continuation map keyed by the running text (or by a shallow path key), each node = `{ probs: [{token, prob}], children: {token: nextKey} }`, with a documented convergence fallback so tail branches still terminate at `<|end|>`. Reuses existing `applyTemperature`/`sampleToken`.

- [ ] **Step 1: Reframe the tab copy.** Replace the Inference intro-summary and the autoregressive-section intro with the one-word-story framing (spec §4.2): "LLMs play a party game — read the whole story so far, add one word, pass it on — except the model plays every turn itself, and it re-reads everything each time." Remove the sentences in the tab that depend on neural-network/attention internals; where the pipeline shows the model box, label it "🧠 Neural network — billions of calculations (we open this box in the next two tabs)". Keep the temperature explainer.

- [ ] **Step 2: Add the mode toggle to the HTML** (above the pipeline, inside `.inference-main`):

```html
<div class="story-mode-toggle">
  <button class="mode-btn active" id="mode-you">🎮 You be the model</button>
  <button class="mode-btn" id="mode-watch">▶ Watch the model play</button>
</div>
```

- [ ] **Step 3: Write the failing test** (tree integrity — every path terminates):

```js
// tests/inference-tree.test.mjs
import { extract, assertTrue, done } from './harness.mjs';
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
```

- [ ] **Step 4: Run it** → FAIL (`marker not found`).

- [ ] **Step 5: Author the branching tree.** Replace the linear `generationSequence` with a small `STORY_TREE`. Use short path keys. Provide at least 2 genuine branch points (the sampled token selects the next node), and for any token without an explicit child, fall back to a shared "…and so on" node that leads to `<|end|>` within one or two steps. Base prompt stays "The best way to learn is". Example shape (author 8–12 nodes total):

```js
// @story-tree-start
const STORY_TREE = {
  __root__: 'start',
  start: { probs: [
      { token: ' by', prob: 0.42 }, { token: ' to', prob: 0.22 }, { token: ' through', prob: 0.15 },
      { token: ' with', prob: 0.12 }, { token: ' from', prob: 0.09 } ],
    children: { ' by': 'by', ' to': 'to', ' through': 'through' } },
  by: { probs: [
      { token: ' doing', prob: 0.5 }, { token: ' practicing', prob: 0.25 },
      { token: ' failing', prob: 0.15 }, { token: ' example', prob: 0.1 } ],
    children: { ' doing': 'doing', ' practicing': 'doing', ' failing': 'doing' } },
  to: { probs: [
      { token: ' practice', prob: 0.55 }, { token: ' study', prob: 0.25 }, { token: ' try', prob: 0.2 } ],
    children: { ' practice': 'doing', ' study': 'doing', ' try': 'doing' } },
  through: { probs: [
      { token: ' repetition', prob: 0.5 }, { token: ' experience', prob: 0.3 }, { token: ' trial', prob: 0.2 } ],
    children: { ' repetition': 'doing', ' experience': 'doing', ' trial': 'doing' } },
  doing: { probs: [
      { token: '.', prob: 0.6 }, { token: ' it', prob: 0.25 }, { token: ' things', prob: 0.15 } ],
    children: { '.': 'end', ' it': 'end', ' things': 'end' } },
  end: { probs: [ { token: '<|end|>', prob: 0.9 }, { token: ' Really', prob: 0.1 } ],
    children: {} },
};
// @story-tree-end
```

- [ ] **Step 6: Rewire `setupInference()`.** Replace `stepCount`-into-`generationSequence` indexing with a `currentKey` walk of `STORY_TREE` (start at `STORY_TREE[STORY_TREE.__root__]`). `generateNext()`: read `node.probs`, `sampleToken()` (existing) with temperature, append the sampled token, then set `currentKey = node.children[sampled.token]` or the convergence node. **"You be the model" mode:** instead of auto-sampling, render the top tokens as clickable buttons; the learner's click is the chosen token. **"Watch" mode:** keep auto/step, but before each token appears add a brief highlight sweep over the whole current text (add/remove a CSS class `.reread-sweep` on the prompt display). The autoregressive-loop diagram (`updateLoopVisualization`) continues to reflect the actual generated tokens.

- [ ] **Step 7: CSS** for the toggle, clickable token buttons, and the sweep:

```css
.story-mode-toggle { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.mode-btn { flex: 1; padding: 0.6rem; border: 1px solid var(--border-subtle); background: var(--bg-card);
  border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; }
.mode-btn.active { background: var(--accent-primary); color: var(--bg-deep); border-color: var(--accent-primary); }
.token-pick-btn { cursor: pointer; }
@keyframes rereadSweep { from { background-position: -100% 0; } to { background-position: 200% 0; } }
.reread-sweep { background-image: linear-gradient(90deg, transparent, var(--accent-warm-10, rgba(249,168,37,0.25)), transparent);
  background-size: 50% 100%; background-repeat: no-repeat; animation: rereadSweep 0.5s ease; }
```

- [ ] **Step 8: Run test** (`node tests/inference-tree.test.mjs`) → all passed. **Browser check:** In "You be the model," clicking a token advances the story and the *next* choices differ by branch; temperature changes the offered probabilities; "Watch the model play" auto-runs with a visible re-read sweep; reset works; console clean.

- [ ] **Step 9: Commit**

```bash
git add ai_intuition_lab.html tests/inference-tree.test.mjs
git commit -m "feat: rebuild Inference as path-dependent one-word-story game with two modes"
```

---

### Task 9: Embeddings — real cosine similarity + richer word set

**Files:**
- Modify: `ai_intuition_lab.html` (`setupEmbeddings()` ~11465-11693; canvas wrapper fixed-height ~7173)
- Create: `tests/embeddings.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `const EMBED_WORDS` (markers `// @embed-words-start` / `// @embed-words-end`): `{ word: { vec:[…8 numbers], x, y, color } }` where `vec` is the hidden higher-D vector used for cosine and `x,y` are the 2D *projection* for plotting; and a `cosineSim(a, b)` used by the similarity table. Dropdown/click interaction preserved.

- [ ] **Step 1: Write the failing test**

```js
// tests/embeddings.test.mjs
import { extract, assertTrue, assertEq, done } from './harness.mjs';
const code = extract('// @embed-words-start', '// @embed-words-end');
const { EMBED_WORDS, cosineSim } = eval(`(() => { ${code}; return { EMBED_WORDS, cosineSim }; })()`);
const words = Object.keys(EMBED_WORDS);
assertTrue(words.length >= 30, 'at least 30 words');
assertTrue(EMBED_WORDS.king.vec.length === EMBED_WORDS.queen.vec.length, 'vectors share dimensionality');
// Self-similarity is 1; king–queen closer than king–computer.
assertTrue(Math.abs(cosineSim(EMBED_WORDS.king.vec, EMBED_WORDS.king.vec) - 1) < 1e-9, 'self-sim = 1');
assertTrue(cosineSim(EMBED_WORDS.king.vec, EMBED_WORDS.queen.vec) >
           cosineSim(EMBED_WORDS.king.vec, EMBED_WORDS.computer.vec), 'king~queen > king~computer');
done();
```

- [ ] **Step 2: Run it** → FAIL.

- [ ] **Step 3: Implement.** Replace the old `embeddings` object (2D-only) and the distance-based `similarity()` with:

```js
// @embed-words-start
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
// vec = hand-tuned 8-D "meaning" vector (drives cosine); x,y = 2D plot projection.
// Dimensions (intuition): royal, human, animal, tech, emotion, size, positive, action.
const EMBED_WORDS = {
  king:    { vec: [0.9,0.8,0.0,0.0,0.1,0.7,0.4,0.3], x: 0.45, y: 1.30, color: THEME.colors.yellow },
  queen:   { vec: [0.9,0.8,0.0,0.0,0.1,0.6,0.4,0.3], x: 0.55, y: 1.20, color: THEME.colors.yellow },
  prince:  { vec: [0.85,0.8,0.0,0.0,0.1,0.5,0.4,0.3], x: 0.50, y: 1.38, color: THEME.colors.yellow },
  man:     { vec: [0.1,0.9,0.0,0.0,0.1,0.6,0.2,0.3], x: 0.20, y: 1.35, color: THEME.colors.blue },
  woman:   { vec: [0.1,0.9,0.0,0.0,0.1,0.5,0.2,0.3], x: 0.30, y: 1.25, color: THEME.colors.blue },
  child:   { vec: [0.0,0.9,0.0,0.0,0.2,0.3,0.3,0.4], x: 0.22, y: 1.10, color: THEME.colors.blue },
  cat:     { vec: [0.0,0.1,0.9,0.0,0.1,0.3,0.3,0.4], x: 0.10, y: 0.30, color: THEME.colors.green },
  dog:     { vec: [0.0,0.1,0.9,0.0,0.2,0.35,0.4,0.5], x: 0.25, y: 0.20, color: THEME.colors.green },
  mouse:   { vec: [0.0,0.1,0.9,0.1,0.1,0.1,0.2,0.4], x: 0.05, y: 0.42, color: THEME.colors.green },
  lion:    { vec: [0.0,0.1,0.9,0.0,0.2,0.8,0.2,0.5], x: 0.15, y: 0.15, color: THEME.colors.green },
  computer:{ vec: [0.0,0.0,0.0,0.95,0.0,0.4,0.2,0.3], x: 0.90, y: 0.45, color: THEME.colors.purple },
  phone:   { vec: [0.0,0.0,0.0,0.9,0.0,0.2,0.3,0.3], x: 0.85, y: 0.30, color: THEME.colors.purple },
  laptop:  { vec: [0.0,0.0,0.0,0.92,0.0,0.3,0.2,0.3], x: 0.95, y: 0.55, color: THEME.colors.purple },
  robot:   { vec: [0.0,0.2,0.1,0.85,0.0,0.5,0.1,0.5], x: 0.80, y: 0.60, color: THEME.colors.purple },
  happy:   { vec: [0.0,0.3,0.0,0.0,0.9,0.2,0.9,0.3], x: 0.25, y: 0.85, color: THEME.colors.red },
  sad:     { vec: [0.0,0.3,0.0,0.0,0.9,0.2,0.1,0.2], x: 0.15, y: 0.70, color: THEME.colors.red },
  joy:     { vec: [0.0,0.2,0.0,0.0,0.95,0.2,0.95,0.3], x: 0.33, y: 0.90, color: THEME.colors.red },
  anger:   { vec: [0.0,0.3,0.0,0.0,0.9,0.3,0.1,0.5], x: 0.10, y: 0.80, color: THEME.colors.red },
  bread:   { vec: [0.0,0.0,0.0,0.0,0.1,0.3,0.5,0.2], x: 0.55, y: 0.55, color: THEME.colors.gray },
  apple:   { vec: [0.0,0.0,0.1,0.05,0.1,0.25,0.6,0.2], x: 0.60, y: 0.68, color: THEME.colors.gray },
  water:   { vec: [0.0,0.0,0.1,0.0,0.1,0.4,0.5,0.3], x: 0.65, y: 0.40, color: THEME.colors.gray },
  run:     { vec: [0.0,0.3,0.3,0.0,0.2,0.3,0.5,0.95], x: 0.40, y: 0.60, color: THEME.colors.blue },
  jump:    { vec: [0.0,0.3,0.3,0.0,0.2,0.3,0.5,0.95], x: 0.45, y: 0.68, color: THEME.colors.blue },
  think:   { vec: [0.0,0.6,0.0,0.1,0.3,0.1,0.5,0.8], x: 0.50, y: 0.85, color: THEME.colors.blue },
  doctor:  { vec: [0.0,0.9,0.0,0.1,0.2,0.5,0.6,0.6], x: 0.35, y: 1.05, color: THEME.colors.blue },
  teacher: { vec: [0.0,0.9,0.0,0.1,0.3,0.4,0.7,0.6], x: 0.40, y: 1.15, color: THEME.colors.blue },
  artist:  { vec: [0.0,0.9,0.0,0.1,0.4,0.4,0.7,0.6], x: 0.45, y: 1.00, color: THEME.colors.blue },
  car:     { vec: [0.0,0.0,0.0,0.5,0.0,0.7,0.3,0.6], x: 0.78, y: 0.20, color: THEME.colors.purple },
  train:   { vec: [0.0,0.0,0.0,0.5,0.0,0.9,0.3,0.6], x: 0.88, y: 0.15, color: THEME.colors.purple },
  boat:    { vec: [0.0,0.0,0.0,0.4,0.0,0.7,0.3,0.6], x: 0.70, y: 0.10, color: THEME.colors.purple },
  city:    { vec: [0.0,0.2,0.0,0.3,0.1,0.9,0.4,0.3], x: 0.72, y: 0.85, color: THEME.colors.gray },
  house:   { vec: [0.0,0.2,0.0,0.2,0.2,0.6,0.6,0.2], x: 0.68, y: 0.95, color: THEME.colors.gray },
};
// @embed-words-end
```

Update the render/table code: use `EMBED_WORDS[word].vec` with `cosineSim` for the similarity table (sorted desc), and `EMBED_WORDS[word].x/y` for plotting (rename references from the old `embeddings`/`similarity`). The dropdown `<select>` in the HTML currently lists 10 words — repopulate it from `Object.keys(EMBED_WORDS)` in JS at setup so all words are selectable.

- [ ] **Step 4: Fix canvas height.** Change the embeddings canvas wrapper `height: 900px` (and the `h-900` sidebar) to a responsive value: wrapper `aspect-ratio: 3 / 4; height: auto; max-height: 80vh;`. Keep the `initCanvas()` zero-size guard.

- [ ] **Step 5: Run test** → all passed. **Browser check:** ~30 words plotted in clusters; selecting "king" ranks queen/prince above computer/phone; table numbers are cosine (0–1); clicking a point updates the table; console clean.

- [ ] **Step 6: Commit**

```bash
git add ai_intuition_lab.html tests/embeddings.test.mjs
git commit -m "feat: embeddings use real cosine similarity over hidden vectors; expand to ~32 words; responsive canvas"
```

---

### Task 10: Attention — pronoun sentence the tab already teaches

**Files:**
- Modify: `ai_intuition_lab.html` (`setupAttention()` ~11695-11898; the query `<select>` options ~8054-8062)
- Create: `tests/attention.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `const ATT_TOKENS` and `const ATT_PATTERNS` (markers `// @att-data-start` / `// @att-data-end`) for the sentence "The cat sat because it was tired", where the row for `it` puts its highest weight on `cat`.

- [ ] **Step 1: Write the failing test**

```js
// tests/attention.test.mjs
import { extract, assertEq, assertTrue, done } from './harness.mjs';
const code = extract('// @att-data-start', '// @att-data-end');
const { ATT_TOKENS, ATT_PATTERNS } = eval(`(() => { ${code}; return { ATT_TOKENS, ATT_PATTERNS }; })()`);
const itIdx = ATT_TOKENS.indexOf('it');
const catIdx = ATT_TOKENS.indexOf('cat');
assertTrue(itIdx >= 0 && catIdx >= 0, 'sentence contains "it" and "cat"');
const row = ATT_PATTERNS[itIdx];
const argmax = row.indexOf(Math.max(...row));
assertEq(argmax, catIdx, '"it" attends most to "cat"');
ATT_PATTERNS.forEach((r, i) => assertTrue(Math.abs(r.reduce((a,b)=>a+b,0) - 1) < 0.02, `row ${i} sums ~1`));
done();
```

- [ ] **Step 2: Run it** → FAIL.

- [ ] **Step 3: Implement.** Replace `tokens` and `attentionPatterns` with (between markers):

```js
// @att-data-start
const ATT_TOKENS = ['The', 'cat', 'sat', 'because', 'it', 'was', 'tired'];
// Row i = how token i distributes its attention over all tokens (sums to 1).
const ATT_PATTERNS = [
  [0.45, 0.30, 0.10, 0.05, 0.04, 0.03, 0.03], // The -> cat
  [0.10, 0.45, 0.20, 0.05, 0.08, 0.05, 0.07], // cat -> self/sat
  [0.05, 0.40, 0.30, 0.05, 0.08, 0.05, 0.07], // sat -> cat
  [0.03, 0.15, 0.12, 0.25, 0.20, 0.10, 0.15], // because -> links clause
  [0.05, 0.50, 0.08, 0.07, 0.15, 0.05, 0.10], // it -> cat  (the payoff)
  [0.04, 0.15, 0.10, 0.06, 0.30, 0.20, 0.15], // was -> it
  [0.03, 0.20, 0.08, 0.05, 0.25, 0.14, 0.25], // tired -> it/cat
];
// @att-data-end
```

Rename references in `setupAttention()` from `tokens`→`ATT_TOKENS`, `attentionPatterns`→`ATT_PATTERNS`. Repopulate the query `<select>` from `ATT_TOKENS` in JS (drop the hardcoded `The cat sat on the mat` options). Default `queryIdx` to the index of `it` so the demo opens on its own best example.

- [ ] **Step 4: Run test** → all passed. **Browser check:** opening Attention shows "it" selected with the thickest arc to "cat"; clicking other tokens works; weights panel matches; console clean.

- [ ] **Step 5: Commit**

```bash
git add ai_intuition_lab.html tests/attention.test.mjs
git commit -m "feat: attention demo uses the pronoun sentence with it->cat as the default view"
```

---

### Task 11: Context-window visualizer truthfulness + RLHF reward meter + FT example swaps

**Files:**
- Modify: `ai_intuition_lab.html` (`setupContextVisualizer()` ~12451-12587; `setupRaterDemo()` ~12347-12449 + its HTML ~9056-9089; Fine-Tuning before/after HTML ~8909-8935; FT version example ~9283; DPO card ~9157)

**Interfaces:**
- Consumes: `MODEL_FACTS` (context size label).
- Produces: overflow that pins the system prompt and truncates oldest *user/assistant* turns; a reward-model meter element `#reward-meter` updated on each rating.

- [ ] **Step 1: Fix overflow logic.** In `setupContextVisualizer()`'s `overflowBtn` handler, change the truncation to skip any `.context-segment.system` (never truncate system) and truncate from the oldest **non-system** segment forward. Update the note to read "System prompt is pinned; oldest conversation turns drop first." Set the window capacity label via `MODEL_FACTS` (add a `data-fact` or set text to `1M` scale) instead of the bare `8192` — keep the numeric fill math but relabel the teaching point as illustrative.

- [ ] **Step 2: Add the reward meter (RLHF demo).** In the rater demo HTML, add above `.rater-stats`:

```html
<div class="reward-meter-wrap">
  <div class="reward-meter-label">Reward model's learned preference</div>
  <div class="reward-meter-track"><div class="reward-meter-fill" id="reward-meter" style="width: 50%"></div></div>
  <div class="reward-meter-caption" id="reward-caption">Rate comparisons to shape the reward model →</div>
</div>
```

In `setupRaterDemo()`, track `agreements` / `count`; after each `handleChoice`, set `#reward-meter` width to `Math.round(agreements / count * 100)%` and update `#reward-caption` to something like `After N ratings, the reward model predicts human preference X% of the time`. This makes rating produce a visible consequence (spec §4.6).

- [ ] **Step 3: Swap the poem comparison.** In the `comparisons` array, replace the poem item (the one whose "better" answer is "ask 3 clarifying questions") with a case where a direct, correct, well-structured answer is the better one — e.g. prompt "Convert 45 minutes to seconds," A = correct concise "2,700 seconds (45 × 60)", B = needless clarifying questions; feedback teaches that clarifying is good when genuinely ambiguous, not as a reflex. Keep the other comparison items.

- [ ] **Step 4: Swap the Fine-Tuning before/after example.** Replace the lock-picking prompt/response pair (~8911-8933) with an unambiguous one where fine-tuning clearly helps and no innocent question is wrongly refused — e.g. prompt "Write a mean joke about my coworker Dave," pre-trained = complies with something cruel, fine-tuned = redirects to a good-natured alternative. Keep the response-note structure.

- [ ] **Step 5: Fix FT text facts.** Version example (~9283): change "GPT-3.5 vs GPT-4o vs GPT-5" → "GPT-5.2 vs GPT-5.5" (or "Claude Sonnet 4.5 vs Sonnet 5"). DPO card (~9157): change "Examples: Llama 2+, many open models" → "Examples: Llama 3/3.1 (with SFT + PPO + DPO) and Qwen2/2.5 (per their technical reports)".

- [ ] **Step 6: CSS** for the meter:

```css
.reward-meter-wrap { margin: 1rem 0; }
.reward-meter-track { height: 12px; background: var(--bg-elevated); border-radius: 6px; overflow: hidden; }
.reward-meter-fill { height: 100%; background: var(--accent-secondary); transition: width 0.4s ease; }
.reward-meter-caption { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; }
```

- [ ] **Step 7: Browser check.** Prompting: "Simulate Overflow" strikes through oldest user/assistant turns but never the system prompt. Fine-Tuning: rater meter moves as you rate; poem/lock examples are replaced; DPO + version text updated. Console clean.

- [ ] **Step 8: Commit**

```bash
git add ai_intuition_lab.html
git commit -m "fix: pin system prompt on context overflow; add RLHF reward meter; swap misleading FT examples; correct DPO/version facts"
```

---

### Task 12: Small interactive + copy fixes (labels, static/JS sync, terminology)

**Files:**
- Modify: `ai_intuition_lab.html` (NN label ~7794 + canvas label array ~10965; training-loop static HTML ~8412-8483; Attention timeline text ~8198-8206; NN "Mechanical Interpretability" ~7916; Welcome grammar ~6820; Pre-Training grammar ~8340, ~8397; tech-stat prose)

**Interfaces:** none (copy/label fixes).

- [ ] **Step 1: NN input label.** In the Neural Networks slider (`<label>maleness</label>` group) the third input is already "maleness" in HTML but the canvas `inputLabels` array (~10965) reads `['roy', 'mil', 'gen', 'frml']`. Change `'gen'` → `'male'` so the canvas matches the slider. (The output token labels king/general/queen stay.)

- [ ] **Step 2: Sync training-loop static vs JS.** The static HTML seeds "floor" at 65% and avg-loss "1.90"; JS `getProbs` starts ~uniform (0.25) at `modelStrength=0`. Set the static `pred-bar`/`pred-prob` values and `loss-value`/`loop-avg-loss` to match the JS initial state (four ~0.25 bars, loss ≈ 1.39, avg-loss 1.39) so the first paint doesn't contradict the first interaction.

- [ ] **Step 3: Terminology fixes.**
  - NN deep dive: "Mechanical Interpretability" → "Mechanistic Interpretability".
  - Attention timeline (~8206): "Big Language Models (BLMs) like BERT, GPT" → "Large language models like BERT and GPT". Also the earlier "Big Language Models (BLMs)" if present.
  - Welcome (~6820): "They don't know to build a camera" → "They don't know *how* to build a camera".
  - Pre-Training callout (~8340): "how AI use data to learn" → "how AI *uses* data to learn".
  - Pre-Training data note (~8397): "not everyone wrote the text gave permission" → "not everyone *who* wrote the text gave permission".

- [ ] **Step 4: Tech-stat prose (from Appendix A.9).**
  - Inference core-loop (~7631): "20-100 times per second" → "roughly 50 to 200 times per second, and specialized fast-inference services go much higher".
  - Attention multi-head (~8177): keep "dozens of attention heads" (verified fine).
  - Transformer scale note (~8295): "40–120 layers" → "roughly 30 to 120 layers".
  - Embeddings deep dive dimension claim: "4K–16K+" stays (verified).

- [ ] **Step 5: Browser check.** NN canvas third input reads "male"; training-loop first paint matches after one step (no jarring jump); all corrected sentences read correctly; console clean.

- [ ] **Step 6: Commit**

```bash
git add ai_intuition_lab.html
git commit -m "fix: NN canvas label, training-loop initial-state sync, terminology and grammar, tech-stat numbers"
```

---

### Task 13: Images & Sound — patch-grid interactive + model-matrix refresh

**Files:**
- Modify: `ai_intuition_lab.html` (Images & Sound tab ~9686-9884: add interactive HTML; `data-fact` model matrix; realism warning; new `setupPatchGrid()` + register in `DOMContentLoaded` and `tabRenders['multimodal']`)
- Create: `tests/patchgrid.test.mjs`

**Interfaces:**
- Consumes: `MODEL_FACTS` (media model names).
- Produces: `setupPatchGrid()` drawing a procedurally-generated sample image on a canvas, sliced into a hoverable patch grid; `patchVectorFor(px, py)` (markers `// @patch-fn-start`/`end`) → deterministic pseudo-vector array for a patch, so hover shows "patch #N → [ … ]".

- [ ] **Step 1: Write the failing test**

```js
// tests/patchgrid.test.mjs
import { extract, assertEq, assertTrue, done } from './harness.mjs';
const patchVectorFor = eval(`(() => { ${extract('// @patch-fn-start', '// @patch-fn-end')}; return patchVectorFor; })()`);
const v = patchVectorFor(2, 3);
assertTrue(Array.isArray(v) && v.length === 6, 'patch vector has 6 dims');
assertEq(patchVectorFor(2, 3), patchVectorFor(2, 3), 'deterministic for same patch');
assertTrue(JSON.stringify(patchVectorFor(2,3)) !== JSON.stringify(patchVectorFor(4,1)), 'different patches differ');
done();
```

- [ ] **Step 2: Run it** → FAIL.

- [ ] **Step 3: Add HTML** after the "How It Works: Everything Becomes Embeddings" table:

```html
<div class="patch-demo interactive-well">
  <div class="card-header"><h3>🖼️ Try it: an image becomes patches</h3>
    <span class="badge">Hover a patch to see its vector</span></div>
  <div class="patch-demo-grid">
    <canvas id="patch-canvas" width="320" height="320" style="max-width:100%; cursor: crosshair;"></canvas>
    <div class="patch-readout" id="patch-readout">Hover over the image →</div>
  </div>
</div>
```

- [ ] **Step 4: Implement JS.**

```js
// @patch-fn-start
// Deterministic pseudo-embedding for a patch at grid (px, py). No RNG (keeps it reproducible).
function patchVectorFor(px, py) {
  const seed = (px * 73856093) ^ (py * 19349663);
  const out = [];
  for (let k = 0; k < 6; k++) {
    const s = Math.sin(seed * 0.0001 + k * 1.7);
    out.push(Math.round(s * 100) / 100);
  }
  return out;
}
// @patch-fn-end

function setupPatchGrid() {
  const canvas = document.getElementById('patch-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const readout = document.getElementById('patch-readout');
  const N = 8, cell = canvas.width / N;
  function draw(hx = -1, hy = -1) {
    // Procedural "landscape": sky gradient + sun + ground, so patches look meaningful.
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
      const isGround = gy >= 6, isSun = (gx === 5 && gy === 1) || (gx === 6 && gy === 1);
      ctx.fillStyle = isSun ? THEME.colors.yellow
        : isGround ? THEME.rgba(THEME.colors.green, 0.5 + 0.1 * ((gx + gy) % 3))
        : THEME.rgba(THEME.colors.blue, 0.25 + 0.06 * gy);
      ctx.fillRect(gx * cell, gy * cell, cell - 1, cell - 1);
      if (gx === hx && gy === hy) { ctx.strokeStyle = THEME.colors.red; ctx.lineWidth = 3;
        ctx.strokeRect(gx * cell + 1, gy * cell + 1, cell - 3, cell - 3); }
    }
  }
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    const gx = Math.floor((e.clientX - r.left) / r.width * N);
    const gy = Math.floor((e.clientY - r.top) / r.height * N);
    draw(gx, gy);
    const idx = gy * N + gx;
    readout.innerHTML = `patch #${idx} → [ ${patchVectorFor(gx, gy).join(', ')} … ]<br><small>one of ${N*N} patches, each an embedding vector</small>`;
  });
  draw();
  tabRenders['multimodal'] = () => draw();
}
```

Register `setupPatchGrid();` in `DOMContentLoaded`. CSS:

```css
.patch-demo-grid { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
.patch-readout { font-family: var(--font-mono); font-size: 0.9rem; background: var(--bg-card);
  padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); min-width: 220px; }
```

- [ ] **Step 5: Refresh the model matrix + realism warning (Appendix A.7).** In the "What Multimodal Means" scale grid and "What You Can Do" cards, replace model names via `data-fact`: image gen → `img.google` / `img.openai`; video row label examples → `video.models`; voice → `voice.models`. Remove "Sora" as a live example (it's discontinued) — the "Video" cell examples become `data-fact="video.models"`. In "Why Some Models Specialize," keep Whisper but append "(newer speech-to-text models now beat it on accuracy)". In the Realism Warning "how to stay skeptical" list, add a bullet: "Check for provenance signals — many AI tools now embed invisible watermarks (SynthID) or Content Credentials (C2PA)."

- [ ] **Step 6: Run test** (`node tests/patchgrid.test.mjs`) → all passed. **Browser check:** Images & Sound shows the patch canvas; hovering highlights a patch and prints its index + vector; model names read from the registry; switching away and back re-renders the canvas; console clean.

- [ ] **Step 7: Commit**

```bash
git add ai_intuition_lab.html tests/patchgrid.test.mjs
git commit -m "feat: patch-grid interactive for Images & Sound; refresh media model matrix and realism warning"
```

---

### Task 14: Welcome orientation card

**Files:**
- Modify: `ai_intuition_lab.html` (Welcome section ~6798-6828)

**Interfaces:** none.

- [ ] **Step 1: Add an orientation card** as the last `.concept-card` in `#tab-welcome`:

```html
<div class="concept-card">
  <h4>🧭 How to use this lab</h4>
  <p>The topics in the sidebar build on each other — going top to bottom is the intended path, but you can jump around once you have the basics.</p>
  <ul class="concept-list">
    <li><strong>Every topic has a hands-on interactive</strong> — play with it; that's where the intuition forms.</li>
    <li><strong>Each topic ends with a quick "Check your intuition"</strong> and a recap, so you know when it clicked.</li>
    <li><strong>The 🔬 "Go deeper" sections are optional</strong> — expand them when you want the mechanism, skip them for the core idea.</li>
    <li>Plan on <strong>10–15 minutes per topic</strong>. Best on a tablet or computer.</li>
  </ul>
  <p class="text-sm text-muted">Model names, prices, and figures are current as of <span data-fact-asof></span>.</p>
</div>
```

- [ ] **Step 2: Browser check.** Welcome shows the orientation card; the "as of" date reads "July 2026"; console clean.

- [ ] **Step 3: Commit**

```bash
git add ai_intuition_lab.html
git commit -m "feat: add orientation card to the welcome tab"
```

---

### Task 15: New tab — 09: Reasoning (content + thinking-budget interactive)

**Files:**
- Modify: `ai_intuition_lab.html` (add nav button after Prompting ~sidebar; add `<section id="tab-reasoning">` after `#tab-prompting` closes ~9683; move the thinking demo out of Limitations ~10034-10085 and its JS `setupThinkingDemo` ~12649-12718; add to `TAB_FLOW`, `QUIZ_DATA`; register render)
- Create: `tests/reasoning-tab.test.mjs`

**Interfaces:**
- Consumes: `MODEL_FACTS`, `TAB_FLOW` (insert `reasoning` entry between `prompting` and `multimodal`), `QUIZ_DATA` (add `reasoning`), existing `setupThinkingDemo`, `setupDeepDives`, `setupTabFooters`, `setupQuizzes`.
- Produces: `#tab-reasoning` section with tab id `reasoning`; a thinking-budget demo `setupThinkingBudget()`.

- [ ] **Step 1: Add the nav button** in the sidebar `#primary-nav`, between the Prompting and Images & Sound buttons:

```html
<button class="tab-btn" data-tab="reasoning"><span class="tab-num">09</span> Reasoning</button>
```

(Renumber the Images & Sound button to `11` and Limitations to `12` in the nav if not already done in Task 4; Reasoning is `09`, Agents `10`.)

- [ ] **Step 2: Add the section.** Insert after `#tab-prompting`'s closing `</section>`:

```html
<section id="tab-reasoning" class="tab-section">
  <div class="section-header">
    <h2>09: Reasoning</h2>
    <p>How "thinking" models work — and why it's just more of the loop you already understand</p>
  </div>
  <div class="intuition-callout">
    <div class="intuition-main">If you understand reasoning models, you understand <em>that "thinking" is just the model writing notes to itself before it answers you.</em></div>
    <div class="intuition-detail">A reasoning model runs the same one-token-at-a-time loop from the Inference tab — but first it generates tokens addressed to itself (its "thinking"), then tokens addressed to you. More thinking means more computation spent on your problem.</div>
  </div>

  <div class="concept-card">
    <h4>🎯 The punchline: thinking is more autoregression</h4>
    <p>Remember the one-word story game? A reasoning model plays it twice. First it writes a private draft — working through the problem one token at a time, re-reading its own notes as it goes. Then it writes the answer you see, now able to attend to all that thinking.</p>
    <p>Nothing new was bolted onto the architecture. The model just gets to <strong>talk to itself first</strong>.</p>
  </div>

  <div class="concept-card">
    <h4>Why writing it out helps</h4>
    <div class="why-points">
      <div class="why-point"><span class="why-point-icon">📝</span><p><strong>Thinking tokens enter the context window.</strong> The model can attend to its own reasoning when it writes the final answer.</p></div>
      <div class="why-point"><span class="why-point-icon">🔄</span><p><strong>More tokens = more forward passes = more computation.</strong> Each token is another trip through the network — more "thinking time" for hard problems.</p></div>
      <div class="why-point"><span class="why-point-icon">🔍</span><p><strong>Intermediate steps expose errors.</strong> Writing out the logic makes a wrong step visible before it reaches the answer.</p></div>
      <div class="why-point"><span class="why-point-icon">🧠</span><p><strong>Chain-of-thought is working memory.</strong> Complex problems need scratch space; the context window becomes that scratchpad.</p></div>
    </div>
  </div>

  <div class="concept-card">
    <h4>🏋️ How reasoning models are trained: rewarding right answers</h4>
    <p>In the <strong>Fine-Tuning</strong> tab you saw RLHF — reinforcement learning from <em>human preferences</em>. Reasoning models add a twist: reinforcement learning on <strong>verifiable</strong> problems, where the answer can be checked automatically.</p>
    <div class="grid grid-2-col gap-15 mt-1">
      <div class="card-sm"><div class="text-accent bold mb-05">RLHF (Fine-Tuning tab)</div><p class="text-sm">Reward = "did humans prefer this response?" Great for tone, helpfulness, safety.</p></div>
      <div class="card-sm"><div class="text-accent bold mb-05">Reasoning RL</div><p class="text-sm">Reward = "was the final answer correct?" Works for math and code, where correctness is checkable. The model is rewarded for reasoning that reaches right answers — so it learns to reason.</p></div>
    </div>
    <p class="text-sm text-muted mt-1">This is the biggest capability jump of 2024–2026. The openly published <a href="https://arxiv.org/abs/2501.12948" target="_blank" rel="noopener">DeepSeek-R1 paper</a> is a good technical primary source for how it works.</p>
  </div>

  <div class="concept-card">
    <h4>The 2026 reality: thinking is a dial, not a model family</h4>
    <p>Early on, "reasoning models" were separate products. Today the major models are hybrids that decide when to think — and let you set how hard:</p>
    <ul class="concept-list">
      <li><strong>OpenAI</strong> (<span data-fact="name.gpt"></span>): a <code>reasoning effort</code> setting — none / low / medium / high / xhigh.</li>
      <li><strong>Anthropic</strong> (<span data-fact="name.claude"></span>): adaptive thinking plus an <code>effort</code> level; the model decides when to think.</li>
      <li><strong>Google</strong> (<span data-fact="name.gemini"></span>): a <code>thinking level</code> setting, plus a separate high-compute "Deep Think" mode.</li>
    </ul>
    <p class="text-sm text-muted">The practical skill: spend thinking on genuinely hard problems (math, code, multi-step logic); skip it for simple lookups, where it just adds cost and latency.</p>
  </div>

  <!-- Thinking-budget interactive (Task 15 Step 4) -->
  <div class="thinking-budget-section">
    <h3>🎮 See it: the same problem at three thinking budgets</h3>
    <p>Watch how more thinking tokens change the answer — and the cost.</p>
    <div class="interactive-well">
      <div id="thinking-budget-demo"><!-- built by setupThinkingBudget() --></div>
    </div>
  </div>

  <div class="explanation">
    <h4>What thinking doesn't fix</h4>
    <p>Thinking is still pattern-matching, just more of it. It can't recover knowledge the model never learned, it can't outrun a wrong premise, and past a point more thinking stops helping. That's the bridge to the <strong>Limitations</strong> tab.</p>
  </div>

  <details class="deep-dive">
    <summary class="deep-dive-summary">🔬 Go deeper (optional): Reasoning trade-offs</summary>
    <div class="deep-dive-body">
      <div class="concept-card">
        <h4>The cost of thinking</h4>
        <p>Thinking tokens are output tokens — the expensive kind (see the <strong>Prompting</strong> tab's token economics). A problem that takes 2,000 thinking tokens costs roughly as much as a 2,000-word answer, even if the visible reply is one line. That's the trade-off a "thinking budget" manages.</p>
      </div>
      <div class="concept-card">
        <h4>You usually can't see the raw thinking</h4>
        <p>Most providers hide or summarize the model's private reasoning rather than showing it verbatim — partly to protect the technique, partly because raw chains of thought can be messy or misleading. What you get is the answer, sometimes with a readable summary of the reasoning.</p>
      </div>
    </div>
  </details>
</section>
```

- [ ] **Step 3: Move the bat-and-ball demo out of Limitations.** Cut the `thinking-demo-section` block (~10034-10085) from `#tab-limitations` and its `setupThinkingDemo` wiring stays (it still works); the three problems (bat-and-ball, lily-pad, widget) now belong to the reasoning narrative. Place its markup inside the new `#thinking-budget-demo` container OR keep `setupThinkingDemo` as-is and have `setupThinkingBudget` extend it — simplest: relocate the existing `thinking-demo` HTML into the Reasoning section's interactive-well and leave `setupThinkingDemo()` registered (it targets ids that moved with it).

- [ ] **Step 4: Add the thinking-budget layer.** Author `setupThinkingBudget()` that adds a 3-position budget control (Zero / Low / High) above the existing standard-vs-reasoning panels; at "Zero" it shows only the (wrong) fast answer, at "Low" a short chain, at "High" the full chain + correct answer, with a token/cost counter that climbs (Zero ≈ 12 tokens, High ≈ 180 tokens, cost shown via a simple `tokens × rate` using `MODEL_FACTS` output price). Reuse the three problems' `thinking`/`answer` data already defined in `setupThinkingDemo`.

- [ ] **Step 5: Register in shared systems.** Add to `TAB_FLOW` (between `prompting` and `multimodal`):

```js
{ tab: 'reasoning', title: '09: Reasoning', recap: [
  'A reasoning model writes private "thinking" tokens before answering you.',
  'More thinking = more forward passes = more computation on your problem.',
  'It is trained by rewarding correct answers on checkable problems — and in 2026, thinking is a dial you control.' ]},
```

Add to `QUIZ_DATA`:

```js
reasoning: [
  { q: 'What are a reasoning model\'s "thinking tokens"?', options: [
    { text: 'A separate database the model queries', feedback: 'No database — the thinking is just more generated tokens, produced by the same loop.' },
    { text: 'Tokens the model generates for itself before writing your answer', correct: true, feedback: 'Right — it plays the one-word game privately first, then attends to those notes when answering.' },
    { text: 'Hidden instructions from the developer', feedback: 'Those are system prompts (Prompting tab). Thinking tokens are generated by the model at runtime.' }]},
  { q: 'How are reasoning models mainly trained to reason?', options: [
    { text: 'By memorizing solved problems', feedback: 'Memorization doesn\'t generalize to new problems — the training is reinforcement, not lookup.' },
    { text: 'Reinforcement learning that rewards reaching correct answers on checkable problems', correct: true, feedback: 'Right — reward = "was the answer correct?" on math/code, so the model learns reasoning that pays off.' },
    { text: 'Humans rating which reasoning sounds smartest', feedback: 'That\'s closer to RLHF for tone. Reasoning RL rewards correctness, not style.' }]},
],
```

Register `setupThinkingBudget();` in `DOMContentLoaded`.

- [ ] **Step 6: Write the test**

```js
// tests/reasoning-tab.test.mjs
import { loadHTML, extract, assertTrue, done } from './harness.mjs';
const src = loadHTML();
assertTrue(src.includes('id="tab-reasoning"'), 'reasoning section exists');
assertTrue(src.includes('data-tab="reasoning"'), 'reasoning nav button exists');
const FLOW = eval(`(() => { ${extract('// @tab-flow-start', '// @tab-flow-end')}; return TAB_FLOW; })()`);
const i = FLOW.findIndex(t => t.tab === 'reasoning');
assertTrue(FLOW[i-1].tab === 'prompting' && FLOW[i+1].tab === 'multimodal', 'reasoning sits between prompting and images');
const QUIZ = eval(`(() => { ${extract('// @quiz-data-start', '// @quiz-data-end')}; return QUIZ_DATA; })()`);
assertTrue(QUIZ.reasoning && QUIZ.reasoning.length >= 2, 'reasoning has a quiz');
done();
```

- [ ] **Step 7: Run test** → all passed. **Browser check:** Reasoning appears at position 09; deep dive collapsed; thinking-budget control changes displayed thinking + cost; quiz + recap + Next (to Images & Sound) present; console clean.

- [ ] **Step 8: Commit**

```bash
git add ai_intuition_lab.html tests/reasoning-tab.test.mjs
git commit -m "feat: add Reasoning tab (09) with thinking-budget interactive; relocate thinking demo from Limitations"
```

---

### Task 16: New tab — 10: Agents & Tools (content + step-through agent trace)

**Files:**
- Modify: `ai_intuition_lab.html` (nav button; `<section id="tab-agents">` after `#tab-reasoning`; move+expand prompt-injection card from Limitations ~10162-10169; add to `TAB_FLOW`, `QUIZ_DATA`; new `setupAgentTrace()`)
- Create: `tests/agents-tab.test.mjs`

**Interfaces:**
- Consumes: `MODEL_FACTS`, `TAB_FLOW` (insert `agents` between `reasoning` and `multimodal`), `QUIZ_DATA` (add `agents`), shared setup fns.
- Produces: `#tab-agents` (tab id `agents`); `const AGENT_TRACE` (markers `// @agent-trace-start`/`end`) = ordered steps `{think, action, observation}`; `setupAgentTrace()` stepping through them into a growing context panel.

- [ ] **Step 1: Nav button** after the Reasoning button:

```html
<button class="tab-btn" data-tab="agents"><span class="tab-num">10</span> Agents &amp; Tools</button>
```

- [ ] **Step 2: Add the section** after `#tab-reasoning`:

```html
<section id="tab-agents" class="tab-section">
  <div class="section-header">
    <h2>10: Agents &amp; Tools</h2>
    <p>How a model that can only write text learns to <em>act</em> — without ever leaving the token loop</p>
  </div>
  <div class="intuition-callout">
    <div class="intuition-main">If you understand agents, you understand <em>that "doing things" is just the model writing a tool request, software running it, and the result coming back as more tokens.</em></div>
    <div class="intuition-detail">An agent is a model in a loop: it thinks, writes an action, the surrounding software performs that action, the result is pasted back into the context window, and the loop repeats until the goal is met.</div>
  </div>

  <div class="concept-card">
    <h4>🔧 Tool calling: the model asks, the software does</h4>
    <p>A model can't actually check the weather or run code — it can only produce tokens. So tool use works like this:</p>
    <ol class="concept-list">
      <li>The model writes a specially-formatted request: <code>get_weather(city="Provo")</code>.</li>
      <li>The <strong>software around the model</strong> (not the model) actually runs that function.</li>
      <li>The result — <code>"38°F, snow"</code> — is pasted back into the context window as new tokens.</li>
      <li>The model reads that result and keeps going.</li>
    </ol>
    <p>Tools are just <strong>context the model requests for itself</strong> — a direct extension of the context engineering from the <strong>Prompting</strong> tab.</p>
  </div>

  <div class="concept-card">
    <h4>🔁 The agent loop</h4>
    <p>Chain that together and you get an agent: <strong>goal → think → act → observe → repeat</strong>. It's the autoregressive loop from the Inference tab, one level up — instead of predicting the next token, it's choosing the next action.</p>
  </div>

  <!-- Interactive: step-through agent trace -->
  <div class="agent-trace-section">
    <h3>🎮 Step through an agent</h3>
    <p>Goal: <strong>"What should I wear in Provo tomorrow?"</strong> Step the loop and watch the context window grow.</p>
    <div class="interactive-well">
      <div class="agent-trace-layout">
        <div class="agent-trace-steps" id="agent-trace-steps"></div>
        <div class="agent-context-panel">
          <div class="agent-context-label">📋 Context window (grows each step)</div>
          <div class="agent-context-body" id="agent-context-body"></div>
        </div>
      </div>
      <div class="agent-trace-controls">
        <button class="gen-btn primary" id="agent-step-btn">▶ Next step</button>
        <button class="gen-btn secondary" id="agent-reset-btn">↺ Reset</button>
      </div>
    </div>
  </div>

  <div class="concept-card">
    <h4>🌐 Agents in the wild (as of <span data-fact-asof></span>)</h4>
    <div class="grid grid-2-col gap-1 mt-1">
      <div class="card-sm"><strong>💻 Coding agents</strong><p class="text-sm">Claude Code, OpenAI Codex, and Cursor write, run, and debug code across many files in a loop.</p></div>
      <div class="card-sm"><strong>🔍 Deep research</strong><p class="text-sm">Agents that search, read, and synthesize dozens of sources into a cited report.</p></div>
      <div class="card-sm"><strong>🖥️ Computer use</strong><p class="text-sm">Agents that see the screen and click, type, and navigate like a person.</p></div>
      <div class="card-sm"><strong>🔌 MCP</strong><p class="text-sm">The Model Context Protocol is a shared standard for connecting models to tools — a "USB-C port" for AI. Governed by the Linux Foundation and supported across the major providers.</p></div>
    </div>
  </div>

  <div class="concept-card" style="border-color: var(--negative-30); background: var(--negative-8);">
    <h4>⚠️ Why agents raise the stakes</h4>
    <p>When a model can only talk, a mistake is a bad sentence. When it can act, a mistake takes actions.</p>
    <ul class="concept-list">
      <li><strong>Errors compound.</strong> A wrong step early can send the whole loop down a bad path.</li>
      <li><strong>Prompt injection becomes dangerous.</strong> If a webpage or email the agent reads contains hidden instructions, and the agent can act, an attacker's text can make it do things — send data, run commands, make purchases.</li>
    </ul>
    <p class="text-sm text-muted">Prompt injection is the #1 risk on the OWASP LLM Top 10. A real 2025 case (<a href="https://en.wikipedia.org/wiki/Prompt_injection" target="_blank" rel="noopener">"EchoLeak," CVE-2025-32711</a>) showed an AI assistant leaking data from a single crafted message. Always be cautious about what an agent is allowed to read and do.</p>
  </div>

  <div class="explanation">
    <h4>The through-line</h4>
    <p>Nothing here breaks the model you've been building up. Tokenization, embeddings, attention, inference, the context window — an agent is all of that, wrapped in a loop that turns some tokens into actions and feeds the results back in as more tokens.</p>
  </div>
</section>
```

- [ ] **Step 3: Remove the prompt-injection card from Limitations** (~10162-10169, the `limitation-card` for Prompt Injection) since it now lives, expanded, in this tab. Leave the other limitation cards.

- [ ] **Step 4: Write the failing test**

```js
// tests/agents-tab.test.mjs
import { loadHTML, extract, assertTrue, assertEq, done } from './harness.mjs';
const src = loadHTML();
assertTrue(src.includes('id="tab-agents"'), 'agents section exists');
const TRACE = eval(`(() => { ${extract('// @agent-trace-start', '// @agent-trace-end')}; return AGENT_TRACE; })()`);
assertTrue(TRACE.length >= 3, 'trace has at least 3 steps');
assertTrue(TRACE.every(s => s.think && s.action && s.observation), 'each step has think/action/observation');
assertEq(TRACE[TRACE.length - 1].action, 'answer', 'last step answers the user');
const FLOW = eval(`(() => { ${extract('// @tab-flow-start', '// @tab-flow-end')}; return TAB_FLOW; })()`);
const i = FLOW.findIndex(t => t.tab === 'agents');
assertTrue(FLOW[i-1].tab === 'reasoning' && FLOW[i+1].tab === 'multimodal', 'agents between reasoning and images');
done();
```

- [ ] **Step 5: Implement the trace + component.**

```js
// @agent-trace-start
const AGENT_TRACE = [
  { think: 'The user wants clothing advice for Provo tomorrow. I need the weather forecast — I don\'t have it. I should use a tool.',
    action: 'get_weather', args: 'city="Provo", day="tomorrow"',
    observation: '{ high: 39°F, low: 24°F, condition: "light snow", wind: "12 mph" }' },
  { think: 'Snow and below freezing. "Tomorrow" is vague — let me confirm the date so my advice is concrete.',
    action: 'get_date', args: 'offset=1',
    observation: '{ date: "2026-07-02", weekday: "Thursday" }' },
  { think: 'I have the forecast and the date. Cold, snowy, windy — I can answer now. No more tools needed.',
    action: 'answer',
    observation: 'For Provo on Thursday: expect light snow, a high near 39°F and wind. Wear a warm insulated coat, waterproof boots, and a hat and gloves. Layers underneath will help if you go indoors.' },
];
// @agent-trace-end

function setupAgentTrace() {
  const stepsEl = document.getElementById('agent-trace-steps');
  const ctxEl = document.getElementById('agent-context-body');
  const stepBtn = document.getElementById('agent-step-btn');
  const resetBtn = document.getElementById('agent-reset-btn');
  if (!stepsEl || !stepBtn) return;
  let i = 0;
  const goal = 'GOAL: "What should I wear in Provo tomorrow?"';
  function reset() {
    i = 0; stepsEl.innerHTML = ''; ctxEl.innerHTML = `<div class="ctx-line goal">${goal}</div>`;
    stepBtn.disabled = false; stepBtn.textContent = '▶ Next step';
  }
  stepBtn.addEventListener('click', () => {
    if (i >= AGENT_TRACE.length) return;
    const s = AGENT_TRACE[i];
    const stepCard = document.createElement('div');
    stepCard.className = 'agent-step-card';
    stepCard.innerHTML = `<div class="agent-step-num">Step ${i + 1}</div>
      <div class="agent-think">🤔 ${s.think}</div>
      <div class="agent-action">${s.action === 'answer' ? '✅ Answer the user' : `🔧 call <code>${s.action}(${s.args})</code>`}</div>
      <div class="agent-obs">${s.action === 'answer' ? '💬 ' + s.observation : '↩ tool returned: <code>' + s.observation + '</code>'}</div>`;
    stepsEl.appendChild(stepCard);
    // Context window physically grows: append the model's action and the observation.
    ctxEl.innerHTML += `<div class="ctx-line think">think: ${s.think}</div>`;
    if (s.action === 'answer') ctxEl.innerHTML += `<div class="ctx-line answer">answer: ${s.observation}</div>`;
    else ctxEl.innerHTML += `<div class="ctx-line tool">tool ${s.action} → ${s.observation}</div>`;
    i++;
    if (i >= AGENT_TRACE.length) { stepBtn.disabled = true; stepBtn.textContent = '✓ Goal reached'; }
  });
  resetBtn.addEventListener('click', reset);
  reset();
}
```

CSS:

```css
.agent-trace-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
@media (max-width: 720px) { .agent-trace-layout { grid-template-columns: 1fr; } }
.agent-step-card { background: var(--bg-card); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); padding: 0.9rem; margin-bottom: 0.75rem; }
.agent-step-num { font-weight: 700; font-size: 0.8rem; color: var(--text-muted); }
.agent-think { font-style: italic; margin: 0.4rem 0; }
.agent-action { font-family: var(--font-mono); font-size: 0.85rem; margin: 0.3rem 0; }
.agent-obs { font-size: 0.85rem; color: var(--text-secondary); }
.agent-context-panel { background: var(--bg-deep); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); padding: 1rem; }
.agent-context-label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; }
.ctx-line { font-family: var(--font-mono); font-size: 0.78rem; padding: 0.3rem 0.5rem; margin-bottom: 0.3rem;
  border-radius: 4px; background: var(--bg-card); }
.ctx-line.goal { border-left: 3px solid var(--accent-primary); }
.ctx-line.tool { border-left: 3px solid var(--accent-cool); }
.ctx-line.answer { border-left: 3px solid var(--positive); }
.agent-trace-controls { margin-top: 1rem; display: flex; gap: 0.75rem; }
```

Register `setupAgentTrace();` in `DOMContentLoaded`.

- [ ] **Step 6: Register in shared systems.** Add to `TAB_FLOW` (between `reasoning` and `multimodal`):

```js
{ tab: 'agents', title: '10: Agents & Tools', recap: [
  'An agent is a model in a loop: think → act → observe → repeat.',
  'Tool calls are just the model requesting context; software runs the tool and pastes the result back.',
  'Acting raises the stakes — errors compound and prompt injection becomes dangerous.' ]},
```

Add `agents` to `QUIZ_DATA`:

```js
agents: [
  { q: 'When an agent "uses a tool," what actually runs the tool?', options: [
    { text: 'The model executes the code itself', feedback: 'The model can only produce tokens — it can\'t run anything. Something else does.' },
    { text: 'The software around the model runs it, then feeds the result back as tokens', correct: true, feedback: 'Right — the model writes a request; the surrounding program executes it and pastes the result into the context.' },
    { text: 'The tool runs inside the neural network', feedback: 'Tools live outside the model entirely; only their text results re-enter the context window.' }]},
  { q: 'Why is prompt injection more dangerous for an agent than for a chatbot?', options: [
    { text: 'Agents have larger context windows', feedback: 'Window size isn\'t the issue — the ability to take actions is.' },
    { text: 'An agent can act, so injected instructions can trigger real actions', correct: true, feedback: 'Right — a chatbot might say something wrong; an agent might send data or run a command based on hidden text it read.' },
    { text: 'Agents ignore their system prompt', feedback: 'They still have system prompts; the danger is that malicious input in tool results can override intended behavior.' }]},
],
```

Register `setupAgentTrace();` in `DOMContentLoaded`.

- [ ] **Step 7: Run test** (`node tests/agents-tab.test.mjs`) → all passed. **Browser check:** Agents at position 10; stepping the trace grows the context panel line by line and ends at the answer; reset works; quiz + recap + Next (to Images & Sound) present; console clean.

- [ ] **Step 8: Commit**

```bash
git add ai_intuition_lab.html tests/agents-tab.test.mjs
git commit -m "feat: add Agents & Tools tab (10) with step-through agent-trace interactive; relocate prompt-injection content"
```

---

### Task 17: README refresh + full-suite verification

**Files:**
- Modify: `README.md` (topic list ~9-20; "not optimized for mobile" note ~35; model-assist credit ~56)
- Modify: `ai_intuition_lab.html` (only if verification surfaces issues)

**Interfaces:** none.

- [ ] **Step 1: Update the README topic list** from 10 to the 12 topics (add 09 Reasoning, 10 Agents & Tools; renumber Images & Sound → 11, Limitations → 12). Update the "10 key topics" count to 12.

- [ ] **Step 2: Soften the mobile caveat.** The prior critique cycle shipped mobile reflow; change "not optimized for mobile phones" to "works on phones, but best on a tablet or computer."

- [ ] **Step 3: Update the build credit** line if desired (it currently cites "Claude Opus 4.5"); optional.

- [ ] **Step 4: Run the whole test suite**

```bash
for f in tests/*.test.mjs; do echo "== $f"; node "$f" || exit 1; done
```

Expected: every file ends `all passed`, overall exit 0.

- [ ] **Step 5: Full browser walkthrough.** Open the file; for each of the 13 nav entries (Welcome + 12 topics): tab renders, its interactive works, quiz gives feedback, deep dive expands and any canvas inside sizes correctly, recap + Next present, no console errors. Confirm no `??…??` fact placeholders anywhere. Confirm the file still opens from `file://` with no network requests.

- [ ] **Step 6: Confirm file-size budget.** `wc -c ai_intuition_lab.html` — growth over the pre-overhaul baseline should be dominated by the BPE table and new tabs; sanity-check it's within the spirit of the ~100KB allowance.

- [ ] **Step 7: Commit**

```bash
git add README.md ai_intuition_lab.html
git commit -m "docs: update README to 12 topics; final verification pass"
```

---

## Self-Review Notes

**Spec coverage map** (spec section → task):
- §2 architecture/renumber → Task 4, 15, 16 · §3.1 registry → Task 2 · §3.2 quizzes → Task 6 (+15/16) · §3.3 recap/next → Task 5 (+15/16) · §3.4 collapsible deep dives → Task 3
- §4.1 BPE tokenizer → Task 7 · §4.2 story game → Task 8 · §4.3 embeddings → Task 9 · §4.4 attention → Task 10 · §4.5 context overflow → Task 11 · §4.6 rater meter → Task 11 · §4.7 FT example → Task 11 · §4.8 thinking budget → Task 15 · §4.9 agent trace → Task 16 · §4.10 patch grid → Task 13 · §4.11 small fixes → Task 12
- §5 Reasoning tab → Task 15 · §6 Agents tab → Task 16 · §7 corrections → Task 12 (+ registry Task 2) · §8 welcome orientation → Task 14 · Appendix A facts → Task 2 registry, consumed across 2/11/12/13/15/16 · §9 out-of-scope → honored (no persistence/hash/mobile-redesign) · README → Task 17

**Ordering rationale:** Tasks 1–6 build shared infrastructure (harness, registry, deep-dive/footer/quiz systems) that Tasks 15–16 depend on; interactive rebuilds (7–13) are independent of each other and can run in any order after Task 3; Tasks 15–16 must follow 2/3/5/6 (they register into those systems); Task 17 is last.

**Deferred to execution (each task's Step for it):** exact old line numbers are approximate — locate by quoted snippet. The BPE runtime algorithm is verified lossless (round-trip test is Task 7 Step 2). Every new-tab test asserts flow/quiz registration so a missed wiring fails a test, not just review.


