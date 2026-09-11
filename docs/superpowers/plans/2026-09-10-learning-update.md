# September Learning Update Implementation Plan

**Goal:** Refresh the single-file lab with accurate explanations, playful optional experiments, and a final TL;DR tab.

**Architecture:** Keep all runtime HTML, CSS, data and JavaScript in `ai_intuition_lab.html`. Use existing setup functions and tab navigation. New experiments have visible deterministic rules and no API calls, scoring, persistence, or gates.

**Tech stack:** HTML, CSS, vanilla JavaScript; Node test harness.

**Spec:** `docs/2026-09-10-update-proposal.md`, amended by Aaron: retain **Limitations**, replace guided route with final **TL;DR**, exercises feel useful rather than homework. Current chat approval supersedes earlier proposal wording.

## Tasks

- [x] Correct explanation and recap contradictions; refresh embedded facts with source links and dates. Keep clearly marked historical examples where newer values don't improve teaching.
- [x] Replace duplicate thinking demos with one experiment: choose a task and try more thinking, a source, or a clearer goal. Show immediate consequence, no score.
- [x] Add context experiment: toggle saved preference, a summary, the original source and irrelevant history; visibly show available information and a changed answer.
- [x] Add an agent decision experiment with failed tool result, bounded retry, preview and confirmation. Preserve the existing trace as an optional mechanism illustration.
- [x] Add optional “Spot what went wrong” cards to Limitations: unsupported citation, faulty calculation, and source-embedded instructions. No required sequence.
- [x] Add final TL;DR with useful mental models and direct in-page jumps; add Start and TL;DR actions to Welcome. Preserve all 12 topic names except Prompting becomes Prompting & Context.
- [x] Add text alternatives/labels to canvas controls, accessible feedback and navigation focus. Keep quizzes optional and change earned-knowledge assertions to key takeaways.
- [x] Verify all Node tests and browser behavior on desktop and phone; update README with the TL;DR and offline/simulation details.

## Behavioral checks

Use the existing extraction harness for pure experiment logic. A regression that makes “more thinking” solve missing information must fail. Removing original-source retrieval must prevent the context example from returning the exact source fact. Agent send cannot proceed before a preview and explicit approval; retry cannot run indefinitely. Browser checks exercise actual buttons, reset, scenario switching, tab transitions, text alternatives, feedback and narrow layout.

Implementation occurs on `codex/september-learning-update`. No deployment or push is part of this task.

## Validation outcome

All 13 Node test files pass, including discovery behavior and resolution of every embedded fact key. Browser DOM interaction checks passed over localhost and direct file opening: context selection/reset, reasoning scenario changes, failed lookup/retry, blocked premature send, explicit simulated approval, agent reset, patch selection, and source navigation. Desktop and 390px phone screenshots were inspected; all 14 navigation views fit the phone viewport without page overflow. Native mobile navigation opened correctly. Browser error log and git diff whitespace checks were clear.

The CUA browser connection timed out; verification used the dedicated agent-browser CLI in an isolated browser session. No push or deployment was performed.
