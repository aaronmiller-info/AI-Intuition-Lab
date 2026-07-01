import { extract, assertTrue, done } from './harness.mjs';
// eval() here runs trusted source extracted from our own repo's ai_intuition_lab.html
// (delimited by the @quiz-data-start/@quiz-data-end markers), not untrusted input.
// This matches the established harness pattern (tests/harness.mjs extract()) used to
// test single-file, dependency-free JS embedded in the app without a bundler.
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
