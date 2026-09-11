import { loadHTML, extract, assertEq, assertTrue, done } from './harness.mjs';

const html = loadHTML();
assertTrue(html.includes('// @discovery-start'), 'discovery behavior is available');
if (html.includes('// @discovery-start')) {
  const lab = eval(`(() => { ${extract('// @discovery-start', '// @discovery-end')}; return { contextReply, thinkingResult, agentTransition }; })()`);
  assertEq(lab.contextReply([]).hasTime, false, 'missing source cannot supply an exact time');
  assertEq(lab.contextReply(['summary']).hasTime, false, 'lossy summary cannot reconstruct omitted time');
  assertEq(lab.contextReply(['original']).hasTime, true, 'original source restores the exact time');
  assertEq(lab.contextReply(['original','preference']).vegetarian, true, 'retrieved preference affects suggestion');
  assertEq(lab.thinkingResult('missing','think').resolved, false, 'extra thinking cannot invent missing hours');
  assertEq(lab.thinkingResult('missing','source').resolved, true, 'source resolves unknown hours');
  assertEq(lab.thinkingResult('math','think').resolved, true, 'checking constraints resolves calculation');
  assertEq(lab.thinkingResult('vague','clarify').resolved, true, 'clear goal resolves vague task');
  let s = lab.agentTransition('start','send');
  assertEq(s.state, 'start', 'cannot skip preparation to send');
  assertEq(lab.agentTransition('start','search').state, 'failed', 'first lookup demonstrates failed result');
  assertEq(lab.agentTransition('failed','retry').state, 'ready', 'one retry supplies evidence');
  assertEq(lab.agentTransition('ready','retry').state, 'ready', 'retry is bounded');
  assertEq(lab.agentTransition('ready','send').state, 'ready', 'evidence alone is not permission');
  assertEq(lab.agentTransition('ready','preview').state, 'preview', 'preview precedes approval');
  assertEq(lab.agentTransition('preview','approve').state, 'sent', 'specific approval permits simulated send');
  assertEq(lab.agentTransition('preview','keep').state, 'draft', 'keeping draft causes no send');
}
done();
