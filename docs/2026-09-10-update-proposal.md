# AI Intuition Lab: proposed September update

Prepared September 10, 2026. Proposal only; the application has not been changed.

The next update should help learners make better decisions with AI: supply the right information, choose useful tools, recognize unsupported answers, and verify completed work. Keep the 12-topic structure, experience-first explanations, visual identity, optional deep dives, and downloadable single-file format.

## 1. Correct misleading mental models first

These are observed content problems, independent of which models are newest.

| Location | Current problem | Proposed change |
| --- | --- | --- |
| Reasoning, `setupThinkingBudget()` | All three scenarios hard-code Zero/Low as wrong and High as correct. The page presents illustrative counts as “thinking tokens”; Zero even displays 12. A second demo repeats the same problems under “Standard vs Reasoning,” contradicting the lesson's dial framing. | Replace both with one explicitly labeled simulation. Include a simple task where extra thinking adds little, a reasoning task where it helps, and a missing-information task where a source is needed. Separate reasoning tokens from answer tokens; label all synthetic costs and outputs. |
| Reasoning | “Nothing new was bolted onto the architecture” makes an unsupported universal claim. “Thinking is just…” oversimplifies a useful teaching analogy. | Explain the scratchpad mechanism as an important way reasoning models spend additional computation, without claiming to describe every model's internals. Move the warning about displayed reasoning into the main lesson. |
| Limitations | “It wasn't trained to output uncertainty”; “no way to distinguish”; “confidence and correctness are not correlated.” | Explain that models can learn uncertainty and abstention, but remain imperfectly calibrated. Fluent confidence is insufficient evidence. Distinguish token probabilities, verbal confidence, and observed accuracy. |
| Prompting | New chats are described as a freshly erased whiteboard, and long chats only as truncation. | Separate model weights, current context, saved app memory, retrieved files, and summaries. A new conversation may receive saved information; that does not mean the weights changed. |
| Agents & Tools | “There's one [MCP server] per tool”; connectors and MCP servers are described as identical. | A server can expose several tools. A connector is a product integration that may use MCP. Keep the model inside the app boundary in the diagrams, preserving the July design decision. |
| Agents & Tools | Approval text promises that nothing consequential happens until the user says yes. | Present approvals as a configurable safeguard, not a universal guarantee. Explain bounded permissions, checking results, and what the particular app is authorized to do. |
| Limitations and recap | Retrieved information is repeatedly called “verified”; grounding is called “the reliability fix.” | Retrieval supplies evidence that may be stale, irrelevant, or wrong. Teach checking whether a source actually supports the claim. |

Evidence: [OpenAI's hallucination research](https://openai.com/index/why-language-models-hallucinate/) discusses incentives to guess versus acknowledge uncertainty. [Anthropic's reasoning research](https://www.anthropic.com/research/reasoning-models-dont-say-think) shows why reasoning text is not a reliable explanation of every factor behind an answer. [MCP's architecture documentation](https://modelcontextprotocol.io/docs/learn/architecture) describes servers exposing tools, resources, and prompts.

Also fix the smaller inconsistencies: 2,000 thinking tokens should be compared with 2,000 output **tokens**, not a 2,000-word answer; the attention recap should acknowledge causal masking for text generation; the agent success calculation should state its simplified assumptions of independent steps, equal success probability, and no recovery. These are corrections to existing explanations, not reasons to add more jargon.

## 2. Refresh product facts, and make future refreshes easier

The registry still says July 2026. Current official sources establish material changes:

| Existing example | Verified replacement candidate | Teaching consequence |
| --- | --- | --- |
| GPT-5.5 | GPT-6 Astra: 1,050,000 context tokens; April 30, 2026 cutoff; standard input/output $10/$50 per million tokens. | Its documented effort settings start at low, not none. Do not simply replace the name while retaining the old controls. Context length is still finite. [Model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra) |
| Claude Fable 5 | Claude Fable 5.1, announced September 1; $10/$50 per million input/output tokens; cache reads $0.25 per million. | Reusing context has a different price from providing new context. This is a useful extension to the token-economics lesson. [Anthropic model page](https://www.anthropic.com/claude/fable) |
| Gemini 3.5 Flash | Gemini 3.8 Flash, announced September 2; introductory input/output $0.75/$3.75 per million tokens through December 31, 2026. | A single price without an expiry can become misleading. Label temporary pricing. [Google announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/) |

These are examples to explain trade-offs, not a ranking. Availability differs by product and plan; Astra's release material describes a staged rollout. Do not turn an announcement into a claim that every learner has access. [OpenAI release notes](https://openai.com/products/release-notes/)

Extend `MODEL_FACTS` with source URL, verification date, product/API scope, and qualifications such as introductory pricing or rollout status. Render a small “Examples checked…” disclosure alongside each changing comparison. Preserve older models as explicitly historical examples where they teach a concept well.

Keep core explanations independent of the newest model name. Use a small, dated “What has changed?” panel for the current examples. Before implementation, finish checking media models, other providers, cutoffs, and parameter figures; this review did not reverify every registry entry. Do not advance the global date until that work is done.

## 3. Expand Prompting into “Prompting & Context”

This is the most useful content addition. It explains why the same model can behave differently in different products or conversations.

Introduce it with: **“Why does the assistant remember your preference but miss the document you uploaded?”** Then let the learner assemble a small context window from a goal, relevant source, irrelevant history, saved preference, and summary. Show what each choice makes available and what it leaves out. Summarization should occasionally omit a crucial detail so learners must retrieve the original.

The takeaway: a large context window is capacity; useful context is a selection problem. Distinguish in-context learning from training, and memory retrieval from remembering everything. Anthropic documents compaction, structured notes, and retrieval as practical ways to manage long-running work. [Context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Keep the exercise deterministic and offline. Its outcomes should follow visible rules and be labeled as an illustration, not represented as responses from a live model.

## 4. Turn demonstrations into experiments

Use a consistent sequence: **predict → change something → observe → explain → apply**. Existing quizzes and recaps remain; add a short prediction before the interesting result rather than adding another bank of recall questions.

| Lesson | Proposed learner action |
| --- | --- |
| Tokens | Predict whether an English phrase, code snippet, or non-English phrase needs more tokens; compare the actual tiny tokenizer's output. State that commercial tokenizers differ. |
| Inference | Choose a less likely continuation, then explain why the next choices changed. Distinguish probability of a continuation from truth of a claim. |
| Embeddings / Attention | Predict a relationship before selecting a word; expose a text/table alternative to the canvas. Label hand-designed coordinates and weights as illustrative. |
| Fine-Tuning | Keep the human-rater interaction; add a case where a pleasant answer is less accurate, making the training trade-off tangible. |
| Reasoning | Decide whether the task needs more computation, more evidence, or a clearer question. |
| Agents | Choose the next action rather than only clicking “Next step.” Include a failed tool result, retry/stop decision, and a request whose scope requires checking. |

Reuse missed concepts later in new settings. For example, after learning context selection, ask which source an agent should retrieve. Retrieval practice has supporting classroom evidence; the particular exercise designs above are proposals to test with learners. [Research review and database](https://www.retrievalpractice.org/strategies/2019/10/28/database-of-retrieval-practice-research)

## 5. Make Limitations a practical capstone

Rename it **“Reliability & Judgment”**, retaining the limitations material but ending with an activity instead of an unearned claim that the reader now understands more than most users.

Suggested scenario: **prepare a short community-program briefing from three supplied documents.** One document is outdated, one contains the current evidence, and one contains a plausible but unsupported assertion. Use fictional material and no personal data.

The learner must:

1. Identify what the assistant needs to know and retrieve the relevant material.
2. Decide which claims are supported, contradicted, or unresolved.
3. Check a number with a calculator/tool.
4. Notice an instruction inside a source that should be treated as document content.
5. Decide whether the final briefing satisfies the request and is ready for review.

Give feedback on the decisions, not only a total score. Include a short “How would you test this on your own work?” takeaway: define success, try representative examples, inspect failures, and repeat after changes. This extends current agent-evaluation practice into language a general learner can use. [Anthropic's evaluation guide](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

The existing `alignment-standards-brief.html` could become an optional, clearly framed classroom companion. The capstone itself should simulate injection consequences locally rather than depend on a live attack or an external agent.

## 6. Reduce the cost of getting started

The welcome page estimates 10–15 minutes per topic: two to three hours for the whole lab. Offer two explicit routes through the same content:

- **Guided essentials:** a proposed 30–45 minute route selecting one core activity per major idea, with brief bridges over omitted mechanics. Pilot the time estimate before publishing it.
- **Full exploration:** the existing 12-topic sequence with optional deep dives.

Add a visible Start button, lesson objectives stated as things the learner can do, and a local outline for long lessons. Use “Key takeaways” instead of automatically asserting “You now know.” Keep visited-topic cues distinct from demonstrated understanding.

You deferred persistence and deep links in July. I would leave saved progress out of the first release. Topic/exercise links could now help instructors assign one activity, but that is a proposed revisit of the earlier decision, not an assumed requirement.

## 7. Improve access without a visual redesign

The canvas elements for embeddings, attention, networks, and training lack useful fallback content; word selection uses pointer handlers. Provide equivalent buttons or tables for meaningful choices, describe the visual result in text, and announce quiz feedback with a live region. Test keyboard focus after topic changes and ensure selected answers are conveyed beyond color.

The narrow-screen check found contained diagrams wider than the phone viewport. That alone does not establish a broken layout. Test whether learners can understand and operate them without awkward panning before deciding to stack the diagram nodes. A full screen-reader and mobile usability pass remains necessary.

## Recommended delivery order

| Release | Scope | Relative effort |
| --- | --- | --- |
| 1 — Accuracy and clarity | Correct contradictions; consolidate and label reasoning demos; refresh verified examples; source metadata; basic keyboard/feedback fixes. | Small–medium |
| 2 — Better practice | Context assembly activity; decision-based agent exercise; reliability capstone; prediction prompts and targeted feedback. | Medium–large |
| 3 — Easier teaching and return visits | Guided route; long-lesson outlines; optional deep links if desired; refinement from learner testing. | Medium |

A names-and-prices-only refresh is smaller but leaves the most consequential misconceptions. A full redesign would consume effort without first testing these learning improvements. I recommend the sequence above.

## Evidence and validation limits

- Reviewed local application source, July design decisions, recent Git history, current fact registry, quiz/recap generation, and test coverage.
- Inspected Welcome, Reasoning, and Agents & Tools in the browser; changed the reasoning budget and confirmed the scripted outcome. Inspected a 390px layout. A later browser call timed out, so this was not an exhaustive interactive walkthrough.
- All 12 existing test files passed. Their success is not evidence that pedagogical claims are correct; several checks assert presence or fixed July values.
- No application code, deployment, or existing design document changed. This proposal is the sole repository addition.
- For implementation, retain the current tests, add behavioral coverage for the changed exercises, check every displayed outcome against its explanatory text, and pilot with a few new learners. Test whether learners can select a remedy for a new failure, not merely recognize definitions.
