import { loadHTML, extract, assertTrue, assertEq, done } from './harness.mjs';
const src = loadHTML();
assertTrue(src.includes('id="tab-agents"'), 'agents section exists');

const agentsSectionStart = src.indexOf('id="tab-agents"');
const agentsSectionEnd = src.indexOf('id="tab-multimodal"');
const agentsSection = src.slice(agentsSectionStart, agentsSectionEnd);
assertTrue(agentsSection.includes('class="deep-dive"'), 'agents tab has a deep-dive section');
assertTrue(agentsSection.includes('deep-dive-summary'), 'agents tab deep-dive has a summary');
const TRACE = eval(`(() => { ${extract('// @agent-trace-start', '// @agent-trace-end')}; return AGENT_TRACE; })()`);
assertTrue(TRACE.length >= 3, 'trace has at least 3 steps');
assertTrue(TRACE.every(s => s.think && s.action && s.observation), 'each step has think/action/observation');
assertEq(TRACE[TRACE.length - 1].action, 'answer', 'last step answers the user');
const FLOW = eval(`(() => { ${extract('// @tab-flow-start', '// @tab-flow-end')}; return TAB_FLOW; })()`);
const i = FLOW.findIndex(t => t.tab === 'agents');
assertTrue(FLOW[i-1].tab === 'reasoning' && FLOW[i+1].tab === 'multimodal', 'agents between reasoning and images');
done();
