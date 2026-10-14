// Tailoring strength: implied competencies are allowed above conservative; domain and tool claims never are.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');
const { createEmptyResumeContent } = loadSource('src/lib/validations/resume.ts', {});
const { checkResume, enforceFacts, impliedAdditions, gateWarning } = loadSource('src/lib/resume/quality-gate.ts', {});

const JOB = 'IT Project Coordinator. Own project planning, risk management and stakeholder management for card authorization and billing platform changes. Track work in Jira.';
function source() {
  const c = createEmptyResumeContent({ full_name: 'Sam Rao', email: 'sam@example.com' });
  c.experience = [
    { id: 'infra', company: 'Sri Supraja Infracon', position: 'Project Coordinator', location: '', start_date: 'Nov 2022', end_date: 'Sep 2024', is_current: false,
      bullets: ['Coordinated scheduling, resource allocation, labor supervision and milestone delivery for infrastructure projects.'] },
    { id: 'hotel', company: 'Baymont', position: 'Business Analyst', location: '', start_date: 'Jul 2025', end_date: '', is_current: true,
      bullets: ['Created KPI dashboards and Excel reports to monitor occupancy and revenue.'] },
  ];
  c.skills = [{ id: 's', category: 'Tools', items: ['Excel'] }];
  return c;
}
const clone = v => JSON.parse(JSON.stringify(v));
const implied = 'Led project planning and risk management across scheduling, resource allocation and labor for infrastructure projects.';

test('implied competencies are reverted at conservative but kept and reported at moderate and aggressive', () => {
  const src = source(), out = clone(src);
  out.experience[0].bullets[0] = implied;
  assert.ok(checkResume(src, out, JOB, 'conservative').some(p => p.kind === 'injected'));
  assert.equal(enforceFacts(src, out, JOB, 'conservative').content.experience[0].bullets[0], src.experience[0].bullets[0]);
  for (const level of ['moderate', 'aggressive']) {
    assert.deepEqual(checkResume(src, out, JOB, level), [], level);
    assert.equal(enforceFacts(src, out, JOB, level).content.experience[0].bullets[0], implied);
  }
  const added = impliedAdditions(src, out, JOB);
  assert.equal(added.length, 1);
  assert.match(added[0], /^Sri Supraja Infracon: .*planning.*risk/);
  assert.match(gateWarning({ restored: [], implied: added }), /Added implied skills \(review these\): Sri Supraja Infracon/);
});

test('domain nouns and tools from the job stay blocked at every level', () => {
  const src = source(), out = clone(src);
  out.experience[1].bullets[0] = 'Monitored card authorization and billing platform performance in Jira dashboards.';
  for (const level of ['conservative', 'moderate', 'aggressive']) {
    assert.ok(checkResume(src, out, JOB, level).some(p => p.kind === 'injected'), level);
    assert.equal(enforceFacts(src, out, JOB, level).content.experience[1].bullets[0], src.experience[1].bullets[0], level);
  }
});

test('implied competency skills may be added above conservative; tools may not', () => {
  const src = source(), out = clone(src);
  out.skills = [{ id: 's', category: 'Tools', items: ['Excel', 'Jira'] }, { id: 'p', category: 'Project', items: ['Project planning', 'Stakeholder management'] }];
  const conservative = enforceFacts(src, out, JOB, 'conservative').content.skills.flatMap(g => g.items);
  assert.deepEqual(conservative, ['Excel']);
  const moderate = enforceFacts(src, out, JOB, 'moderate').content.skills.flatMap(g => g.items);
  assert.deepEqual(moderate, ['Excel', 'Project planning', 'Stakeholder management']);
});

test('job keywords are bolded in bullets of highlight templates and survive every export', async () => {
  const { keywordRanges, layoutResume, resumeBlocks } = loadSource('src/lib/resume/layout.ts', {});
  const { getTemplate } = loadSource('src/lib/resume/templates.ts', {});
  const { pickHighlights } = loadSource('src/lib/resume/fit-generated-resume.ts', {});
  const { generateLatex } = loadSource('src/lib/resume/latex-templates.ts', {});
  assert.deepEqual(keywordRanges('Built SQL checks and SQL reports in Power BI', ['SQL', 'Power BI']), [[6, 9], [36, 44]]);
  assert.deepEqual(keywordRanges('Used MySQL daily', ['SQL']), [], 'whole words only');
  const content = source();
  content.experience[1].bullets[0] = 'Created KPI dashboards in Excel and SQL to monitor occupancy and revenue.';
  content.skills = [{ id: 's', category: 'Data', items: ['Excel', 'SQL', 'Tableau'] }];
  const highlights = pickHighlights(content, 'Analyst with SQL, Excel and KPI reporting. Tableau a plus.');
  assert.deepEqual([...highlights].sort(), ['Excel', 'KPI', 'SQL']);
  content.layout = { target_pages: null, highlights };
  const jake = layoutResume(content, getTemplate('jake')).pages.flat().find(l => l.runs);
  assert.ok(jake.runs.some(r => r.bold && /KPI|Excel|SQL/.test(r.text)));
  assert.equal(jake.runs.map(r => r.text).join(''), jake.text, 'runs reproduce the line exactly');
  assert.ok(!layoutResume(content, getTemplate('classic')).pages.flat().some(l => l.runs), 'older templates unchanged');
  // At most two keywords per bullet, longest first: Excel and SQL here.
  assert.ok(generateLatex(content, 'jake').includes(String.raw`\textbf{Excel}`));
  const [{ renderToBuffer }, { ResumePDF }] = [require('@react-pdf/renderer'), loadSource('src/lib/resume/pdf-document.tsx', {})];
  const pdf = await renderToBuffer(ResumePDF({ content, template: getTemplate('jake') }));
  const { extractText } = await import('unpdf');
  const text = (await extractText(new Uint8Array(pdf), { mergePages: true })).text.replace(/\s+/g, '');
  for (const block of resumeBlocks(content, getTemplate('jake'))) assert.ok(text.includes(block.text.replace(/\s+/g, '')), block.text);
});

test('repeats within a role are dropped, similar work across roles is kept, weak openers go to the fixer', () => {
  const src = source(), out = clone(src);
  out.experience[0].bullets = [src.experience[0].bullets[0], 'Coordinated scheduling and resource allocation for infrastructure project milestones.'];
  out.experience[1].bullets = ['Participated in scheduling reports and dashboards for occupancy and revenue.'];
  const problems = checkResume(src, out, JOB, 'moderate');
  assert.ok(problems.some(p => p.kind === 'duplicate' && p.roleId === 'infra'));
  assert.ok(problems.some(p => p.kind === 'weak' && p.roleId === 'hotel'));
  assert.ok(!checkResume(src, out, JOB, 'conservative').some(p => p.kind === 'weak'), 'conservative keeps plain verbs');
  const { content } = enforceFacts(src, out, JOB, 'moderate');
  assert.equal(content.experience[0].bullets.length, 1, 'repeat removed');
  assert.equal(content.experience[1].bullets[0], out.experience[1].bullets[0], 'weak wording is not reverted by code');
});

test('bold keywords skip short codes and terms inside longer ones', () => {
  const { pickHighlights } = loadSource('src/lib/resume/fit-generated-resume.ts', {});
  const content = source();
  content.experience[0].bullets = ['Wrote BRD/FRD documents and Power BI reports for US clients using SQL.'];
  content.skills = [{ id: 's', category: 'Data', items: ['BRD/FRD', 'BRD', 'Power BI', 'BI', 'SQL'] }];
  assert.deepEqual(pickHighlights(content, 'Need BRD/FRD, BRD, Power BI, SQL for a US bank. BI tools.'), ['Power BI', 'BRD/FRD', 'SQL']);
});

test('bold stops at the keyword: trailing punctuation stays regular', () => {
  const { layoutResume } = loadSource('src/lib/resume/layout.ts', {});
  const { getTemplate } = loadSource('src/lib/resume/templates.ts', {});
  const content = source();
  content.experience[1].bullets[0] = 'Wrote user stories, acceptance criteria, and reports.';
  content.layout = { target_pages: null, highlights: ['user stories', 'acceptance criteria'] };
  const line = layoutResume(content, getTemplate('jake')).pages.flat().find(l => l.runs);
  assert.deepEqual(line.runs.filter(r => r.bold).map(r => r.text), ['user stories', 'acceptance criteria']);
  assert.equal(line.runs.map(r => r.text).join(''), line.text);
});
