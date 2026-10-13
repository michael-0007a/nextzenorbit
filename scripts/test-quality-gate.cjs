// Resume quality gate: each case is a failure seen in real model output during the Bedrock bake-off.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');

const { createEmptyResumeContent } = loadSource('src/lib/validations/resume.ts', {});
const { checkResume, enforceFacts, qualityGate } = loadSource('src/lib/resume/quality-gate.ts', {});

const JOB = 'Business Analyst - Cards & Payments. Document requirements for card authorization, billing and statement platform changes. Strong SQL, Jira, Tableau.';
function source() {
  const c = createEmptyResumeContent({ full_name: 'Jane Doe', email: 'jane@example.com' });
  c.summary.text = 'Business Analyst with banking operations and reporting experience.';
  c.experience = [
    { id: 'founder', company: 'Next Zen', position: 'Founder & Business Analyst', location: '', start_date: 'Nov 2024', end_date: '', is_current: true,
      bullets: ['Document banking and payment-style workflows, data inputs and controls.', 'Build SQL and Power BI reporting for KPI monitoring.'] },
    { id: 'hotel', company: 'Baymont', position: 'Business Analyst', location: '', start_date: 'Jul 2025', end_date: '', is_current: true,
      bullets: ['Create KPI dashboards and Excel reports to monitor occupancy and revenue.', 'Gather requirements from operations and leadership teams.'] },
  ];
  c.skills = [{ id: 's', category: 'Data', items: ['SQL', 'Power BI', 'Excel'] }];
  return c;
}
const clone = value => JSON.parse(JSON.stringify(value));

test('job-posting terms injected into a role that never did that work are flagged and restored', () => {
  const src = source(), out = clone(src);
  out.experience[1].bullets[0] = 'Designed KPI dashboards in Power BI to monitor card platform performance and billing exceptions.';
  const problems = checkResume(src, out, JOB);
  assert.ok(problems.some(p => p.kind === 'injected' && p.roleId === 'hotel'));
  const { content, restored } = enforceFacts(src, out, JOB);
  assert.equal(content.experience[1].bullets[0], src.experience[1].bullets[0]);
  assert.equal(restored.length, 1);
});

test('honest rewrites that reuse the role\'s own words pass untouched', () => {
  const src = source(), out = clone(src);
  out.experience[0].bullets[1] = 'Built SQL queries and Power BI reports to monitor KPIs.';
  assert.deepEqual(checkResume(src, out, JOB), []);
  assert.equal(enforceFacts(src, out, JOB).content.experience[0].bullets[1], out.experience[0].bullets[1]);
});

test('invented numbers, years, banned phrases and added skills are caught', () => {
  const src = source(), out = clone(src);
  out.summary.text = 'Results-driven Business Analyst with 4 years of experience.';
  out.experience[0].bullets[1] = 'Build SQL reporting that cut reconciliation time by 30%.';
  out.skills[0].items.push('Tableau');
  const kinds = checkResume(src, out, JOB).map(p => p.kind);
  for (const kind of ['years', 'banned', 'number']) assert.ok(kinds.includes(kind), kind);
  const { content } = enforceFacts(src, out, JOB);
  assert.equal(content.summary.text, src.summary.text);
  assert.equal(content.experience[0].bullets[1], src.experience[0].bullets[1]);
  assert.deepEqual(content.skills[0].items, ['SQL', 'Power BI', 'Excel']);
});

test('dropped roles are restored; titles, dates and contact always come from the source', () => {
  const src = source(), out = clone(src);
  out.experience = [{ ...out.experience[0], position: 'Senior Payments Architect', start_date: 'Jan 2019' }];
  out.contact.email = 'invented@example.com';
  const { content, restored } = enforceFacts(src, out, JOB);
  assert.equal(content.experience.length, 2);
  assert.equal(content.experience[0].position, 'Founder & Business Analyst');
  assert.equal(content.experience[0].start_date, 'Nov 2024');
  assert.equal(content.contact.email, 'jane@example.com');
  assert.ok(restored.some(r => r.includes('Baymont')));
});

test('work moved between roles is restored to the original role\'s bullet', () => {
  const src = source(), out = clone(src);
  out.experience[1].bullets[1] = 'Document banking and payment-style workflows, data inputs and controls.';
  assert.ok(checkResume(src, out, JOB).some(p => p.kind === 'moved'));
  assert.equal(enforceFacts(src, out, JOB).content.experience[1].bullets[1], src.experience[1].bullets[1]);
});

test('gate sends found problems to the writer once, then enforces the fixed version', async () => {
  const src = source(), draft = clone(src);
  draft.experience[1].bullets[0] = 'Monitored card platform performance and billing exceptions.';
  draft.experience[0].bullets[1] = 'Built SQL queries and Power BI reports to monitor KPIs.';
  const better = 'Created KPI dashboards and Excel reports tracking occupancy and revenue for leadership.';
  const calls = [];
  const client = { chat: { completions: { create: async args => {
    calls.push(args.model);
    // The fixer may only replace quoted lines; it cannot touch the good tailored bullet.
    const reply = args.messages[0].content.includes('fact-checker') ? { issues: [] }
      : { edits: [{ role_id: 'hotel', quote: draft.experience[1].bullets[0], replacement: better }] };
    return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(reply) } }], usage: { total_tokens: 10 } };
  } } } };
  const result = await qualityGate(client, src, draft, { jobDescription: JOB });
  assert.deepEqual(calls, ['deepseek.v3.2', 'moonshotai.kimi-k2.5']);
  assert.equal(result.content.experience[1].bullets[0], better);
  assert.equal(result.content.experience[0].bullets[1], draft.experience[0].bullets[1]);
  assert.equal(result.report.problemsFound, 1);
  assert.deepEqual(result.report.restored, []);
});

test('if the reviewer or fix call fails, code-only enforcement still removes invented work', async () => {
  const src = source(), draft = clone(src);
  draft.experience[1].bullets[0] = 'Monitored card platform performance and billing exceptions.';
  const client = { chat: { completions: { create: async () => { throw new Error('timeout'); } } } };
  const result = await qualityGate(client, src, draft, { jobDescription: JOB });
  assert.equal(result.content.experience[1].bullets[0], src.experience[1].bullets[0]);
  assert.equal(result.report.restored.length, 1);
});

test('a model answer wrapped as {"resume": {...}} is unwrapped, not treated as empty', () => {
  const { parseExportContent, hasResumeBody } = loadSource('src/lib/resume/export-content.ts', {});
  const parsed = parseExportContent({ resume: source() });
  assert.equal(parsed.success, true);
  assert.equal(hasResumeBody(parsed.data), true);
  assert.equal(parsed.data.experience[0].id, 'founder');
});

test('sections the gate cannot check line by line come from the source', () => {
  const src = source(), out = clone(src);
  src.custom_sections = [{ id: 'r', title: 'RESEARCH & INNOVATION HIGHLIGHTS', content: 'AI research publications.' }];
  out.custom_sections = [{ id: 'r', title: 'ANALYTICS PROJECTS & TOOLS', content: 'Built trading models.' }];
  out.certifications = [{ id: 'c', name: 'CFA Level III', issuer: 'CFA Institute', date: '', url: '' }];
  const { content } = enforceFacts(src, out, JOB);
  assert.deepEqual(content.custom_sections, src.custom_sections);
  assert.deepEqual(content.certifications, src.certifications);
});

test('a summary borrowing job-posting terms the resume never mentions is restored', () => {
  const src = source(), out = clone(src);
  out.summary.text = 'Business Analyst who writes Tableau dashboards for card authorization teams.';
  assert.ok(checkResume(src, out, JOB).some(p => p.kind === 'injected' && !p.roleId));
  assert.equal(enforceFacts(src, out, JOB).content.summary.text, src.summary.text);
});

test('a fix quoting one summary sentence replaces only that sentence', () => {
  const { applyEdits } = loadSource('src/lib/resume/quality-gate.ts', {});
  const src = source();
  src.summary.text = 'Business Analyst in banking. Builds SQL reporting. Works with operations teams.';
  const out = applyEdits(src, [{ role_id: 'summary', quote: 'Builds SQL reporting.', replacement: 'Builds SQL and Power BI reporting.' }]);
  assert.equal(out.summary.text, 'Business Analyst in banking. Builds SQL and Power BI reporting. Works with operations teams.');
});

test('generic action verbs from the posting are not treated as invented work', () => {
  const src = source(), out = clone(src);
  out.experience[1].bullets[1] = 'Elicit and prioritize requirements from operations and leadership teams.';
  assert.deepEqual(checkResume(src, out, JOB + ' Elicit and prioritize requirements.'), []);
});
