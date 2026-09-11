# Content pass: where a learner would stall

**Status (2026-09-11, later the same day):** Aaron approved all items. Every item below is applied in the commit that follows, with two judgment calls: 3.6 took the lighter option (the "Agents in the wild" list and the three-words box moved into the deep dive; no tab split), and 3.8 moved the dated model-examples note below each tab's recap rather than deleting it.

Reviewed 2026-09-11 by reading all 14 tabs in order, including every optional
"Go deeper" section, the quizzes, and the recaps, the way a first-time learner
would. About 17,000 words. This is a findings document; nothing in the app was
changed except heading-case slips from the redesign, which I fixed directly.

Severity key: **A** the learner is likely to stall or misread; **B** friction
that slows reading; **C** polish.

## 1. Concepts used before they are explained

| # | Tab | Sev | What happens | Proposed fix |
|---|-----|-----|--------------|--------------|
| 1.1 | Tokenization | A | The main paragraph "Why subword tokenization matters" ends on "because BPE merges are chosen by statistics." BPE is only explained in the optional deep dive. | Change to "because the merges are chosen by statistics, not grammar (the method is called byte pair encoding; the optional section shows how it works)." |
| 1.2 | Tokenization | B | "Subword tokenizer" appears in the intro before "subword" has been introduced. The lede and the intro paragraph both define "token", then the intro defines it a third time. | Cut the intro paragraph to one sentence that introduces "subword" and hands off to the figure: "This demo splits text the way real tokenizers do: into subwords, pieces that are often smaller than a word." |
| 1.3 | Inference | A | Temperature is a slider in the figure and named in the intro, but it is explained only in the deep dive ("Temperature explained"). A learner reaches a control they have not been told about. | Promote two sentences into the main flow directly above the figure: "The slider labeled temperature changes how adventurous the pick is. At 0 the model always takes the top token; at 2 it spreads its bets across unlikely ones." Keep the fuller version in the deep dive. |
| 1.4 | Inference | B | "Until a stop token ends the game" appears in the main flow; stop tokens are explained in the deep dive. | Add "(a special token that means 'I'm done')" inline. |
| 1.5 | Inference | B | The heading says "The autoregressive loop" but the word autoregressive is never defined anywhere in the lab, and the Reasoning tab later builds on it ("thinking is more autoregression"). | Add one sentence under the heading: "Autoregressive means each output is fed back in as the next input." |
| 1.6 | Inference (deep dive) | C | "Forward pass," "parameters," and "logits" are used before the Neural network tab. | Gloss forward pass as "one trip through the network." Leave logits; it is flagged as optional math. |
| 1.7 | Neural network | B | The intro flow reads "From embeddings tab → this tab → to inference tab," but Inference was the previous tab, not the next. | Relabel the third box "Back to the Inference tab." |
| 1.8 | Attention | A | "Traditional neural networks process words in fixed order, passing information step by step." The learner just built a feed-forward network in the previous tab that has no order at all, so "traditional" is confusing. The sentence is really about recurrent networks, which are only introduced in the deep dive. | Rewrite: "Earlier language models read a sentence one word at a time, carrying forward a summary of what they had seen. By word 10 the summary of word 1 was faint. Attention lets every word look at every other word directly." |
| 1.9 | Attention | A | The recap says "during text generation, future tokens are masked." Masking is never mentioned anywhere else. | Cut the clause, or add one sentence in the deep dive under "Attention Is All You Need." |
| 1.10 | Attention | B | The recap and quiz lean on Query, Key, Value, which lives only in the deep dive. Same pattern in Tokenization (the "¾ of a word" rule feeds a quiz question) and Embeddings (cosine similarity feeds a quiz question and a recap bullet). | Decide the rule: recaps and quizzes draw only on the main flow. Then either promote a one-line version of each concept into the main flow or swap the quiz item. My preference: promote. Each is one sentence. |
| 1.11 | Pre-training | A | The backpropagation diagram in the main flow says "each weight gets a gradient" and "assign blame." Gradient is explained by the hiking analogy, which is in the deep dive. | See 3.3, which moves the hiking analogy up and the diagram down. |
| 1.12 | Fine-tuning | B | "Reinforcement" in RLHF is expanded but never explained; Reasoning then says "reinforcement learning on verifiable problems." "Alignment" is used as a heading without a definition. | After "Reinforcement Learning from Human Feedback," add "(reinforcement learning means training by reward rather than by example)." Add one sentence before the alignment approaches: "Alignment is the umbrella word for making a model behave the way its makers intend." |
| 1.13 | Prompting | A | The context window figure shows a "System prompt" segment, and the "What are system prompts?" section comes after the figure. | Move the system prompts section above the figure, or add a one-line definition to the paragraph that introduces the figure. |
| 1.14 | Reasoning | B | "Chain-of-thought is working memory." Chain-of-thought is defined only in the Prompting deep dive. | "Writing the steps out (called chain-of-thought) is working memory." |
| 1.15 | Agents | C | "Like the JSON above," "OWASP LLM Top 10," and "context engineering from the Prompting tab" (a deep-dive title). | Gloss JSON as "a standard text format for structured data." Leave OWASP with its gloss. Change the Prompting reference to "the context ideas from the Prompting tab." |
| 1.16 | Limitations | B | "Post-training can reward accuracy." The lab calls this fine-tuning everywhere else. | "Fine-tuning (sometimes called post-training)." |

## 2. Metaphors that do not land

| # | Tab | Sev | Problem | Proposed fix |
|---|-----|-----|---------|--------------|
| 2.1 | Tokenization | A | The lede: understanding tokens is "like understanding how atoms work in molecules, cells, and organisms." The analogy climbs three levels and the reader has to work out which level tokens are. | "If you understand tokens, you understand the unit everything else is measured in: what the model reads, what it writes, what it costs, and how much it can hold at once." |
| 2.2 | Inference and Reasoning | B | The one-word story game is a good metaphor, but it is told twice on the Inference tab nearly verbatim (the intro paragraph and "The autoregressive loop"), and Reasoning refers back to it as "the one-word story game" though Inference never named it. | Tell it once, name it once ("the one-word story game"), and use the name in the loop section and in Reasoning. |
| 2.3 | Agents | B | Five metaphors on one tab: the sealed box, the box with a mail slot, the restaurant (kitchen, menu, order ticket), USB-C, the new hire's badge and handbook, and binders on a shelf. Each works alone. Together they compete. | Keep the sealed box (it carries the whole tab), the restaurant (it carries API), and USB-C (it carries MCP). Fold the badge-and-handbook and binders images into plain statements in the Skills section. |
| 2.4 | Attention (deep dive) | C | "Like a Google search, but fuzzy" for soft lookup, next to "like a dictionary" for hard lookup. Search engines are themselves fuzzy, so the contrast is muddy. | "A hard lookup asks for one exact entry. Attention asks for a blend of every entry, weighted by how relevant each one is." |
| 2.5 | Pre-training | B | The hiking-in-fog analogy for gradient descent is the clearest thing on the tab and it is hidden in the deep dive. | Promote it (see 3.3). |

## 3. Sequencing and fragmentation

| # | Sev | Problem | Proposed fix |
|---|-----|---------|--------------|
| 3.1 | A | The context window is explained in four places: Inference deep dive (with the sizes table), Prompting main flow (figure and system prompts), Prompting deep dive (management techniques), and Agents ("tools are context"). A learner meets the term in Inference without the explanation, then gets it twice in Prompting. | Introduce it in the Inference main flow in two sentences right after the loop ("Everything the model re-reads each step is called the context window; it has a fixed size"). Move the sizes table into Prompting next to the figure. Cut the Inference deep-dive section to a pointer. |
| 3.2 | B | Prompting's last section, "Understanding context in practice," restates the four cards from the top of the tab ("Why prompting matters") almost word for word. | Cut it. The recap already does this job. |
| 3.3 | A | Pre-training's main flow runs data → training-loop figure → a four-stage backpropagation diagram with weight names like AttnQ[103] → summary. The diagram is the most technical thing in the lab and it sits in the required path, while the hiking analogy that would make it intuitive is optional. | Swap them. Main flow: data → training-loop figure → hiking analogy (three sentences and the figure caption) → "The training process" summary. Deep dive: the four-stage backprop diagram, the chain-rule note, the gradient-descent figure. |
| 3.4 | B | Prompting puts "Input tokens vs output tokens" with API prices between the context window and the good-vs-bad prompt figure. It is useful but it breaks the thread from "what the model sees" to "how to write what it sees." | Move the pricing section to the end of the main flow, after the context experiment, or into the deep dive. Reasoning's "cost of thinking" already points at it and can keep pointing. |
| 3.5 | B | Limitations puts the hands-on figure ("Looks good, what could be wrong?") after the "Living with limitations" checklist. The checklist reads better as the summary of what the learner just practiced. | Move the figure above the checklist. |
| 3.6 | B | Agents is 3,400 words, two to three times any other tab, with two figures, a three-part diagram, MCP, connectors, skills, risks, and permissions. It is also the tab where the writing is best, so the length is a pacing problem, not a quality one. | Two options. Lighter: move "Agents in the wild" and the Skills section's second half (the binders detail and the "three words people mix up" box) into the deep dive. Heavier: split into "10 Agents & tools" and "11 Connectors & skills," which would push Images & sound to 12 and Limitations to 13. I would take the lighter option now. |
| 3.7 | C | Agents' "The safety valve" says "the checkpoint idea from the deep dive below," a forward reference into optional content. | Drop the cross-reference; the paragraph stands on its own. |
| 3.8 | C | The "Model examples checked September 10, 2026" note sits at the top of five tabs, above the lede. It is the first thing a learner reads and it is bookkeeping. | Move it below the recap on each tab, or keep a single instance on the TL;DR sources list and drop the per-tab notes. |
| 3.9 | C | Welcome's "Building your intuition" section repeats "The goal" section. | Merge into one section. |

## 4. Other friction

- **4.1 (B)** Recap on Attention: "A transformer is just attention + feed-forward layers, stacked." Feed-forward is named only in the deep dive diagram. Either say "just attention plus the kind of layers you built in the Neural network tab, stacked" or promote one sentence.
- **4.2 (B)** Neural network "What's happening?" still described green lines after the redesign made them black. Fixed in this pass.
- **4.3 (C)** Heading-case artifacts from the redesign's sentence-case sweep (token "iDs," "the Pro," "Soft" lookup, Title Case deep-dive titles and tab titles). Fixed in this pass.
- **4.4 (C)** Multimodal's product-name table ("Nano Banana 2 & ChatGPT Images 2.5") is a dated list at the top of the tab, ahead of the mechanism. Consider moving it below "How it works," where the learner already has the idea and the names are just examples.
- **4.5 (C)** Tokenization's deep dive: "Rule of thumb: 1 token ≈ 4 characters or ≈ ¾ of a word" and the recap bullet both give the rule; the quiz asks for it. See 1.10.

## What I would do first

1. The four **A** items that change what a learner reads on the required path: 1.1, 1.3, 1.8, 3.3.
2. Then the context-window consolidation (3.1) and the Prompting reorder (1.13, 3.2, 3.4), which are one tab's worth of moving sections.
3. Then the recap-and-quiz rule (1.10) across Tokenization, Embeddings, and Attention.
4. Everything else is a sentence here and there and can go in one sweep.

None of this touches the interactives or the data behind them, so the test suite should stay green throughout.
