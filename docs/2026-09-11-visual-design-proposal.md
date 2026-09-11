# Visual design: diagnosis and proposal

Reviewed 2026-09-11. Method: read the stylesheet (lines 10–7018 of `ai_intuition_lab.html`), inventoried every interactive exercise, and screenshotted all 14 tabs in headless Chrome at 1440px and 390px. Then built a CSS-only overlay of the recommended direction and screenshotted the same tabs again to check the diagnosis against real content. No project files were changed except this doc and `.claude/launch.json` (a dev-server entry for previews).

## What the current design is doing wrong

The theme is not the problem. Cream, black rules, Bauhaus red/blue/yellow, IBM Plex: that is a sound, distinctive identity and I would keep it. The problem is that "Swiss" got implemented as **borders** instead of as **alignment and space**. Everything is a box, and boxes sit inside boxes.

1. **Box-in-box-in-box.** A probability bar on the Inference tab sits five containers deep: 4px black "WORKBENCH" frame → tan panel → white card → bordered row → bar track. Each level has its own border, background, and padding. That is where the clunk comes from. It also eats width: the useful area inside the workbench is about 60% of the content column.

2. **Every section has the same visual weight.** Intuition callout (pink box), explanation (`concept-card`, tan box), "why it matters" (`explanation`, red-outlined white box), workbench (black-framed box), deep dive (tan bar with red-outlined EXPAND), quiz (tan box), recap (tan box). Seven box styles, all full width, all in one column. The eye cannot tell "read this" from "do this". The red-outlined prose box is louder than the interactive one.

3. **A dozen button families.** Red filled, black filled, gray disabled, white outlined, tan bordered, red-outlined small caps (EXPAND), tan pills (TL;DR), tan mono (+ System Prompt). A learner has to relearn the affordance on each tab. Meanwhile some non-controls look like controls (the "SUBWORD TOKENIZATION" badge, "Training Controls" labels), and some controls do not look like controls (the pickable probability rows in "You be the model" mode are visually identical to the read-only rows).

4. **Three competing label styles.** Red sans small caps (WORKBENCH), blue mono small caps (AVAILABLE TO THE APP, IN CONTEXT NOW), red mono small caps (TRY ANOTHER LEVER). Plus uppercase nav, uppercase group labels, uppercase card headings. Letterspaced caps are a spice. Here they are the main course.

5. **Ragged dead zones.** Prose is capped at 68ch (correct) but its container box runs full width. Every explanation card therefore has a third of its area empty on the right, inside a border. That empty-box look reads as unfinished.

6. **Color has no fixed meaning.** Red is accent, heading color, border, primary button, assistant message, negative weight, and error. Blue is user message, info callout, kicker, and "token continues a word". When color means everything it means nothing, and the one place color should carry meaning (correct/incorrect, user/model) gets no help.

7. **Emoji as icons.** Every nav item and most card headings open with an emoji. They render differently per OS, they are tonally at odds with the Swiss identity, and they add a glyph of noise before every heading. (Aaron kept them in July 2026; I am raising it again with a concrete alternative below.)

8. **Everything stacks vertically.** Tabs run 4,000–6,000px tall on desktop and 10,000px on a phone. Lesson → workbench → explanation → deep dive → quiz → recap → next. Compactness has to come from the interactive figures and their internal layout, not from cutting content.

Minor: the reading-progress bar draws across the sidebar header at the top left.

## Principles to design from

- **Prose is the spine. Interactives are figures set into it.** Like a textbook chapter with live figures (Distill.pub, Bret Victor's explorable explanations). The lesson reads top to bottom as an essay with one or two hands-on figures.
- **Only the thing you can touch gets a frame.** Reading material gets headings, a hairline, and space. Figures get the one strong frame in the design. That single contrast does all the "what do I do here" work.
- **One button grammar.** Primary (ink fill), secondary (ink outline), selected (ink fill within a segmented group), text link with arrow. Nothing else. Choice cards in the experiments are one shared "option" component with a visible selection state.
- **One label style.** One small kicker for figure names and section eyebrows. Sentence case everywhere else.
- **Color carries meaning or stays out.** Ink for chrome. Blue = user/input. Red = model/output. Yellow = highlight. Green/red only for right/wrong feedback. Headings are ink, not red.
- **Figures may be wider than text.** Prose at 66–68ch. Figures can break out to the full column, the way a wide figure does in a book. That kills the dead zones without touching the measure.
- **Icons: geometric or none.** Numbered sections already give the nav its structure.

## Three directions

### A. Edited Swiss (recommended base)

Keep the identity. Remove ~80% of the borders. Prose sections become running text with a sentence-case heading and a hairline. The intuition callout becomes a lede sentence with a yellow underline on the key phrase. Only the figure ("Try it"), the experiment, and the quiz keep a container. One button system. Deep dives become plain disclosure rows with a + / –. Nav goes sentence case without emoji; the active item gets an ink bar instead of an inverted block.

Cost: mostly CSS, plus a pass over the HTML to collapse redundant wrapper divs and unify button classes. Low risk. The CSS-only overlay built for this review already gets most of the way there. Prompting tab height: 5,829px → 3,806px with identical content.

### B. Explorable textbook

Direction A plus a layout change: a single centered reading column (~700px) with figures breaking out wider, sidenotes for "Note:" asides on wide screens, and the sidebar replaced by a slim top chapter bar with a drop-down table of contents. Optionally a serif body face (Source Serif 4 or Newsreader) with Plex Sans kept for UI and Plex Mono for code.

Cost: medium. Layout rework of the shell and every tab's outer structure. The figure work is the same as A. Gains a "book" feel and better reading rhythm; loses the always-visible chapter list that is handy in class. I would not change the font in the same step; Aaron chose Plex in July after rejecting Work Sans, and typography was just retuned on 2026-09-10.

### C. Sticky figure with scroll-driven text

For step-based demos only (inference loop, agent trace, context window): the figure sticks in the right half while the explanation scrolls on the left, and passing a paragraph advances the figure state. Most compact and most impressive; also the most engineering, because each demo needs state hooks tied to scroll position. Not worth doing for all 12 tabs.

## Recommendation

Do **A** as the base, borrow two things from **B** (figures wider than prose; asides become quiet sidenotes or hairline-left notes), and consider **C** later for two or three tabs where the demo has steps. Keep IBM Plex and the cream/red/blue/yellow identity.

## Specific fixes to the interactives

- **Inference.** Mode toggle becomes a two-segment control. The settings side panel goes away; temperature slider, Generate, Auto, Reset become one control strip under the stage. In "You be the model" mode the probability rows become obvious press targets (full-row button, hover, "pick" hint).
- **Context window (Prompting).** Already the most compact widget. Drop the three nested frames; keep the fill bar and segments.
- **Context experiment (Prompting).** Checkbox cards and the reply panel side by side is right. "Back to just the summary" becomes a text-link reset.
- **Reasoning levers.** Scenario chooser and lever chooser become two segmented groups with the same look; the result panels lose their blue mono kickers in favor of the one shared kicker style.
- **Neural network / attention.** Keep the canvas. Drop the bordered side panel; sliders and readouts sit in a plain column.
- **Training loop.** Three separate wells on one tab. Merge the "take one step" loop and the loss readout into one figure; keep gradient descent as a second figure.
- **Quiz.** Options become radio-style rows (circle glyph, single border), not text-field lookalikes.
- **Deep dive.** Plain disclosure row, no background, no red EXPAND pill.
- **Badges.** Descriptive badges (SUBWORD TOKENIZATION) go away. Instruction badges become plain text with a small ▶ mark.
- **Multimodal patch picker.** Keep the canvas click; drop the redundant select, or label them as the same control.

## Verification of this review

- Screenshots: 14 tabs at 1440px, 5 at 390px, before; 10 views after with the overlay. Stored in the session scratchpad, not in the repo.
- The overlay is a screenshot aid, not shippable CSS. It uses `!important` throughout and misses some tab-specific wrappers (e.g. the "Autoregressive loop" card, the inference settings panel).
- No tests were run; no application code changed.
