# Typography audit: all tabs

Reviewed all 14 tabs at 1280px desktop and 390px phone widths, plus a deeper section of each lesson with optional sections expanded. Inspected rendered text sizes and line spacing throughout expanded content, not just the opening viewport. Changes remain local.

| Tab | Findings and changes |
| --- | --- |
| Overview | Reviewed heading hierarchy, comparison text, numbered instructions and source action. Reduced phone card padding; source actions use the shared understated link treatment. |
| Tokenization | Improved introductory explanation and note leading. Long example words now wrap inside cards. Compact token/ID output remains monospaced. |
| Embeddings | Enlarged the explanatory step note and removed its forced small italic style. Improved introduction spacing and reduced nested phone padding. |
| Inference | Improved introduction and pipeline caption readability; long interaction instructions use larger mixed-case text. |
| Neural networks | Improved explanation and code-sample leading; checked diagram labels and deeper explanation/list layout. |
| Attention | Improved timeline and architecture notes. Fixed canvas end-label clipping with a minimum drawing width inside a keyboard-focusable horizontal scrolling region. |
| Pre-training | Improved explanatory stage results, math annotations and notes. Removed an inline small-size override on the training-demo note. |
| Fine-tuning | Enlarged explanatory cards, response notes, comparison choices and method descriptions; improved multiline response leading. |
| Prompting & context | Enlarged explanation cards, prompt/system examples, cost explanation and comparison notes. Inline tool-request examples now wrap. |
| Reasoning | Checked prose, model-option lists and experiments; improved recap leading and phone card padding. |
| Agents & tools | Improved diagram captions, code examples, inline request wrapping and recap leading. |
| Images & sound | Improved intuition callout, patch readout, explanatory lists and heading-to-paragraph spacing. |
| Limitations | Enlarged reason/tool/limitation cards and example verdicts; improved example, insight, cutoff and list leading. |
| TL;DR | Checked headings, paragraph spacing, lesson links and expanded sources; retained its existing typography from the prior revision. |

## Verification

- Inspected 28 opening screenshots (each tab at both widths) and 14 deeper-section screenshots, with additional targeted checks after fixes.
- Expanded-content typography scan: no long explanatory text below 15px or below 1.3 line-height remains in the scanned text blocks; exceptions are a display heading and the deliberately compact monospaced token/ID output.
- No horizontal page overflow across all 14 expanded views at 390px. Wide diagrams can scroll within their own regions.
- All 13 Node test files pass.
- Browser interaction checks pass for context, reasoning, agent decisions, patch selection, source navigation and embedded facts.
- Git diff whitespace check passed.

This is a visual and browser-computed-style review, not a claim of exhaustive accessibility certification.
