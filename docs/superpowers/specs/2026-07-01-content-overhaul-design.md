# AI Intuition Lab — Content & Learning-Experience Overhaul

**Date:** 2026-07-01
**Status:** Approved pending final review
**Scope:** `ai_intuition_lab.html` (single-file app, no dependencies — this constraint is preserved)

## 1. Goals & audience

Make the lab an excellent self-study tool for **general-public learners** (the GitHub Pages audience is primary). The lab keeps its "expert user, not researcher" framing. Three thrusts:

1. **Truthful interactives** — every demo must actually exhibit the behavior its prose teaches.
2. **2026-current content** — all model names, prices, context windows, and examples pinned to mid-2026, centralized for easy refresh.
3. **Self-learner support** — knowledge checks, end-of-tab flow, and a completable core path.

## 2. Information architecture

New running order (12 numbered topics; tab element IDs unchanged, nav labels renumbered):

| # | Topic | Change |
|---|-------|--------|
| — | Welcome | + orientation card |
| 01 | Tokenization | tokenizer rebuilt as real tiny BPE |
| 02 | Embedding Space | cosine similarity rebuild, larger word set |
| 03 | Inference | rewritten around one-word-story game; forward deps removed |
| 04 | Neural Networks | label fix, content updates |
| 05 | Attention | pronoun sentence in demo |
| 06 | Pre-Training | minor fixes |
| 07 | Fine-Tuning | example swaps, rater demo upgrade |
| 08 | Prompting | context visualizer fixes, 2026 numbers |
| 09 | **Reasoning** (new) | absorbs thinking demo from Limitations |
| 10 | **Agents & Tools** (new) | absorbs prompt-injection card from Limitations |
| 11 | Images & Sound | + patch-grid interactive |
| 12 | Limitations | reflowed after content moves to 09/10; remains capstone |

**Ordering philosophy (decided):** experience-first. Inference stays early because "what happens when I hit enter" is the most relatable entry point. Its dependence on unexplained internals is resolved by presenting the model as an honest black box ("billions of calculations — we open this box in the next two tabs"), converting forward references into teasers. All cross-tab references re-pointed to new numbering.

## 3. New shared components

### 3.1 Model-facts registry (single source of truth)
A single JS object (e.g. `MODEL_FACTS`) near the top of the script holding every dated fact: model names, context-window sizes, API prices, knowledge cutoffs, parameter-scale examples, "as of" date. HTML elements carry `data-fact="..."` attributes and are populated at load. Next semester's refresh = edit one object. All 2026 facts **verified via web search during implementation** (author's knowledge alone is insufficient — training cutoffs).

### 3.2 "Check your intuition" quiz (all 12 topics)
End-of-tab self-quiz: 2–3 multiple-choice questions, each option giving teaching feedback (wrong answers get an explanation, not a buzzer). Static per-tab data; styled consistently with existing experiment boxes. No persistence — feedback is immediate and inline.

### 3.3 Recap + Next-topic footer (all 12 topics)
Each tab ends with: (a) a recap card — "You now know:" with ~3 bullets; (b) a **"Next: NN Topic →"** button that navigates like the sidebar. Final tab (Limitations) gets a completion card instead. *(Decided: no localStorage persistence, no URL hash routing — out of scope.)*

### 3.4 Collapsible deep dives (all 🔬 sections)
Deep dives collapse by default behind a clear "🔬 Go deeper (optional): …" affordance, making the core path per tab completable in one sitting. Implementation note: any canvas inside a collapsed region (e.g. gradient-descent demo in Pre-Training) must (re)initialize on expand — canvases can't size themselves while `display:none`.

## 4. Interactive rebuilds & fixes

### 4.1 Tokenizer → real tiny BPE (replaces rule engine)
The current homemade rule engine **fails its own suggested experiments** (verified by execution): `misunderstanding` → `mis + understand` silently deleting "ing"; `disagreement` loses "ment"; `unfortunately` returns one token despite the prose promising a prefix/suffix split; `unhappy / happiness / unhappiness` share zero pieces despite the prose claiming they demonstrate shared pieces.

Replace with an actual BPE tokenizer: a merges table (~5–10k merges) trained offline on public-domain text and embedded in the file (~60–100KB acceptable against the current 446KB), applied with standard greedy merge order at runtime. Result: truthful splits for *any* input. Suggested experiments rewritten to match real output (verified during implementation). Keep the "simplified for education; try a production tokenizer" note with the existing external link. Optional nicety: a "show merge steps" toggle that animates the merges for a word, reusing the existing BPE evolution diagram's visual language.

### 4.2 Inference → one-word-story game (true autoregression)
The metaphor becomes the tab's spine: LLMs play the party game where each player reads the whole story so far and adds one word — except the model plays every turn itself.

- **Mode 1 — "You be the model":** learner sees top-5 next tokens with probability bars and personally picks each next word. Temperature felt viscerally ("how tempted am I by option #3?").
- **Mode 2 — "Watch the model play":** auto-generation, with a visible highlight sweep across *all prior text* before each new token appears — making the re-read step (the thing people miss) visible.
- **True path-dependence (bug fix):** the current demo replays a fixed script regardless of the sampled token. Replace with a shallow branching continuation tree (2–3 levels of authored branches + graceful convergence for tail branches) so the sampled/chosen token genuinely changes subsequent distributions.
- Temperature slider, stats, stop-token teaching all retained, re-skinned into the game frame. Forward-deps removed per §2. Autoregressive-loop diagram below still reflects what the learner produced.

### 4.3 Embeddings — cosine similarity, richer space
- **Concept alignment (bug fix):** deep dive teaches cosine similarity; demo computes Euclidean-distance-based scores on 2D screen coordinates. Fix: each word stores a hidden higher-dimensional vector (e.g. 8–16D, hand-tuned); the table computes **real cosine similarity** from those; the 2D canvas positions become the "projection" the prose already describes.
- Expand from 10 words to ~60 across more clusters (royalty, animals, tech, emotions, food, verbs, professions…) so exploration feels like discovery. Search-free: click or dropdown as today.
- Canvas sizing: replace fixed 900px height with responsive aspect ratio.

### 4.4 Attention — use the pronoun sentence
Demo sentence becomes "The cat sat on the mat because it was tired." with an authored pattern where **it → cat** dominates — the tab's own killer example, currently text-only. Retain click-a-token interaction and weights panel.

### 4.5 Context-window visualizer (Prompting)
- **Truthfulness fix:** overflow must *pin the system prompt* and truncate oldest conversation turns (mid-window), matching both reality and the tab's own prose ("system prompts persist throughout").
- Window size updated from 8,192 to a 2026-plausible figure (illustrative scale is fine; label it).

### 4.6 RLHF rater demo (Fine-Tuning)
- Replace the poem comparison (currently rewards "ask 3 clarifying questions" over just writing the poem — contradicts 2026 behavior and the demo's own website-speed example).
- **Close the loop:** add a mini "reward model" meter that visibly shifts with each rating, so rating produces a consequence instead of just incrementing a counter.

### 4.7 Fine-Tuning before/after example
Swap lock-picking (benign; modern models answer it) for an unambiguous example, so learners aren't taught to expect refusals for innocent questions.

### 4.8 New: thinking-budget demo (Reasoning tab)
Same problem solved at zero / low / high thinking budget; thinking tokens stream visibly; token/cost counter climbs; answer quality changes. Absorbs the existing bat-and-ball/lily-pad/widget problems from Limitations.

### 4.9 New: step-through agent trace (Agents & Tools tab)
Learner sets a goal (e.g. "What should I wear in Provo tomorrow?") and steps the loop: model thinks → emits tool call → result injected into a visible, growing context window → loop → final answer. Ties directly back to the Prompting tab's context-window visual language.

### 4.10 New: patch-grid demo (Images & Sound tab)
A built-in sample image sliced into patches on canvas; hovering a patch shows "patch #N → [0.42, −1.03, …]". Makes divide → embed → attend tangible. Currently this tab has zero interactives.

### 4.11 Small interactive fixes
- NN canvas input label `gen` → `male` (leftover from the gender→maleness rename).
- Sync static HTML initial states with JS reset states (training-loop card's 65%-"floor" story vs. actual ~uniform init; static avg-loss "1.90" vs. actual 1.39).
- Token ID collision nit: `'!': 0` collides with `<|endoftext|>: 0` (moot if 4.1 ships).

## 5. New content — Tab 09: Reasoning

1. **Punchline:** thinking is just more autoregression — tokens addressed to itself before tokens addressed to you (callback to the story game).
2. **Why it works:** thinking tokens enter context; more tokens = more forward passes = more compute per problem; written-out steps expose errors; chain-of-thought as working memory. (Relocated from Limitations.)
3. **How reasoning models are trained:** RL on *verifiable* problems (math/code, auto-checkable answers). Explicit contrast with Fine-Tuning: RLHF = human preferences; reasoning-RL = right answers.
4. **2026 reality:** thinking is a dial, not a model family — hybrid models decide when to think; users set budgets/effort. Practical guidance on when deep thinking is worth cost/latency.
5. **Interactive:** thinking-budget demo (§4.8).
6. **Bridge to Limitations:** what thinking doesn't fix.

Prompting's chain-of-thought section handoff becomes literal ("covered in the next tab" is now true).

## 6. New content — Tab 10: Agents & Tools

1. **Intuition:** a model that can only talk becomes a system that can act — without ever leaving the token loop.
2. **Tool calling mechanics:** model emits a formatted token sequence; *surrounding software* executes; result pasted back into context as more tokens. Tools = context engineering the model requests for itself.
3. **The agent loop:** goal → think → act → observe → repeat; the autoregressive loop one level up.
4. **Agents in the wild (mid-2026):** coding agents, deep research, computer use; MCP as the "USB-C port" for tools.
5. **Raised stakes:** error compounding across steps; prompt injection graduates to real-world risk (absorbs/expands the Limitations card).
6. **Interactive:** step-through agent trace (§4.9).

The dangling "(We'll explore building RAG systems in depth later.)" in Limitations re-points here.

## 7. Content corrections & updates (all tabs)

**Errors (fix regardless):**
- "Big Language Models (BLMs) like BERT" → correct to large language models; fix the BERT lineage framing in the Attention timeline.
- "Mechanical Interpretability" → "Mechanistic Interpretability" (Neural Networks tab).
- Grammar: "They don't know **how** to build a camera" (Welcome); "how AI **uses** data" (Pre-Training callout); "not everyone **who** wrote the text gave permission" (Pre-Training data note); consistency pass over all intuition-callout sentences.
- DPO card: "Llama 2+" → "many open models (e.g., Llama 3-era, Zephyr)"; Llama 2 used RLHF/PPO.
- Knowledge-cutoff timeline hardcoded "~May 2025" cutoff and related copy join the model-facts registry; "Today" marker already dynamic.

**Mid-2026 refresh (via registry §3.1, facts verified by web search at implementation time):**
- Inference: context-window chart (currently GPT-5.2 400K / Claude Sonnet 4.5 200K / Gemini 3 Flash 1M / Grok 4.1 2M — mixed vintages).
- Neural Networks: parameter-scale chart (currently all-Llama-3 examples).
- Fine-Tuning: provider/version examples (GPT-3.5/4o references).
- Prompting: token pricing table, example system prompt (currently dated Dec 2025).
- Images & Sound: model matrix ("NanoBanana & GPT Image-Gen 1.5", Sora/Runway, voice examples).
- Limitations: "standard vs reasoning" model examples (o1/o3-pro, Claude 3.5 Sonnet) — superseded by Reasoning tab's "dial" framing; Limitations keeps only a short pointer.
- Welcome: no dated facts; verify.

## 8. Welcome tab orientation

One added card: recommended order (top-to-bottom), rough time expectation per topic, note that every topic has hands-on interactives and an optional 🔬 deep dive, and that the lab works best on tablet/desktop.

## 9. Out of scope (decided)

- localStorage progress persistence and URL hash routing (declined for now).
- Mobile-first redesign (recent critique cycle already shipped mobile reflow).
- Emoji replacement (previously decided: emoji stay).
- Backend/API-connected demos — everything remains static, single-file, offline-capable.

## 10. Implementation notes

- Single HTML file, zero dependencies, CC BY 4.0 — all preserved.
- BPE merges table embedded as compact JS (accept +60–100KB file growth).
- Canvas-in-collapsed-`details` requires init-on-expand hooks (§3.4); reuse the existing `tabRenders` re-render pattern.
- Reuse existing THEME/JS conventions; new interactives follow the established `setupX()` + `tabRenders` registration pattern.
- Verification: run the app in a browser (preview tools), execute every suggested experiment in every tab, and confirm each demo exhibits the behavior its prose claims — the class-A bugs above are the regression tests.
