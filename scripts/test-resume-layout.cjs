// npm run test:resumes. Uses real renderers and checks recovered text, not snapshots.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');
const { renderToBuffer } = require('@react-pdf/renderer');
const { extractText, getDocumentProxy } = require('unpdf');
const mammoth = require('mammoth');
const { layoutResume, resumeBlocks, PAPER } = loadSource('src/lib/resume/layout.ts', {});
const { RESUME_TEMPLATES, getTemplate } = loadSource('src/lib/resume/templates.ts', {});
const { ResumePDF } = loadSource('src/lib/resume/pdf-document.tsx', {});
const { generateWordDocument } = loadSource('src/lib/resume/word-document.ts', {});
const { resumeContentSchema, createEmptyResumeContent } = loadSource('src/lib/validations/resume.ts', {});

function fixture(roles = 2, bullets = 6) {
  const content = createEmptyResumeContent({ full_name: 'Alex Morgan', email: 'alex@example.com', phone: '+1 555 123 4567', location: 'Austin, Texas',
    linkedin_url: 'https://linkedin.com/in/alex-morgan', github_url: 'https://github.com/alex-morgan', portfolio_url: 'https://example.com/portfolio' });
  content.summary.text = 'Software engineer building Python services and data quality tools. Experience includes API validation, deployment automation and production troubleshooting with platform teams.';
  content.experience = Array.from({ length: roles }, (_, i) => ({ id: `e${i}`, company: `Company ${i}`, position: 'Software Engineer', location: 'Austin, Texas',
    start_date: 'Jan 2020', end_date: 'Dec 2023', is_current: i === 0,
    bullets: Array.from({ length: bullets }, (_, b) => `Built validation workflow ${i}-${b} using Python and SQL to reconcile upstream API records with warehouse datasets, giving engineers a repeatable way to investigate schema mismatches before scheduled releases.`) }));
  content.education = [{ id: 'edu', institution: 'Example University', degree: 'Master of Science', field_of_study: 'Computer Science', location: 'Boston', start_date: '2018', end_date: '2020', gpa: '3.8', bullets: ['Completed a research thesis on distributed query execution.'] }];
  content.projects = [{ id: 'p', name: 'Telemetry Monitor', description: 'Collected service telemetry for troubleshooting.', url: 'https://example.com/monitor', technologies: ['Python', 'SQL'], bullets: ['Added a retry queue for failed telemetry deliveries.'] }];
  content.skills = [{ id: 's', category: 'Engineering', items: ['Python', 'SQL', 'Docker', 'Kubernetes', 'REST APIs'] }];
  content.certifications = [{ id: 'c', name: 'Cloud Certification', issuer: 'Example Institute', date: '2024', url: 'https://example.com/credential' }];
  content.languages = [{ id: 'l', name: 'English', proficiency: 'fluent' }];
  content.custom_sections = [{ id: 'x', title: 'Volunteer Experience', content: 'Mentored students through a local software workshop.' }];
  return content;
}
const normalize = text => text.replace(/\s+/g, '');
// Two-column templates fill each column independently.
const columns = page => [page.filter(l => l.column !== 'side'), page.filter(l => l.column === 'side')].filter(c => c.length);
const height = lines => lines.reduce((h, l) => h + l.before + l.height, 0);

for (const template of RESUME_TEMPLATES) {
  test(`${template.id}: complete, readable, balanced pages and recoverable PDF/DOCX text`, async () => {
    const content = fixture();
    const plan = layoutResume(content, template);
    assert.ok(plan.pages.length >= 2);
    assert.ok(plan.fontSize >= 10.5 && plan.fontSize <= 12);
    const heights = plan.pages.map(page => height(columns(page)[0]));
    const capacity = PAPER.height - template.layout.margins.top - template.layout.margins.bottom;
    assert.ok(plan.pages.every(page => columns(page).every(c => height(c) <= capacity)));
    // One column balances pages; two columns fill page 1 first so it never looks unfinished beside the sidebar.
    if (template.layout.sidebar) assert.ok(heights.slice(0, -1).every(h => h >= capacity * 0.85), `Page not filled before the next: ${heights}`);
    else assert.ok(Math.max(...heights) - Math.min(...heights) < 100, `Unbalanced pages: ${heights}`);
    assert.ok(plan.pages.every(page => columns(page).every(c => c.at(-1).kind !== 'section')));
    const pdf = await renderToBuffer(ResumePDF({ content, template }));
    const extracted = await extractText(new Uint8Array(pdf), { mergePages: true });
    assert.equal(extracted.totalPages, plan.pages.length);
    const docx = await generateWordDocument(content, { template });
    const word = await mammoth.extractRawText({ buffer: docx });
    for (const block of resumeBlocks(content, template)) for (const text of [block.lead, block.text, block.right].filter(Boolean)) {
      assert.ok(normalize(extracted.text).includes(normalize(text)), `PDF missing: ${text}`);
      assert.ok(normalize(word.value).includes(normalize(text)), `DOCX missing: ${text}`);
    }
    const proxy = await getDocumentProxy(new Uint8Array(pdf));
    for (let p = 1; p <= proxy.numPages; p++) {
      const page = await proxy.getPage(p);
      const text = await page.getTextContent();
      for (const item of text.items.filter(item => item.str?.trim())) {
        assert.ok(item.transform[4] >= template.layout.margins.left - 1);
        assert.ok(item.transform[4] + item.width <= PAPER.width - template.layout.margins.right + 1, `Text exceeds right margin: ${item.str}`);
        assert.ok(item.transform[5] >= template.layout.margins.bottom - 1, `Text exceeds bottom margin: ${item.str}`);
      }
    }
    await proxy.destroy();
  });
}

test('one page for short content; arbitrary page counts for long content without dropped bullets', () => {
  const short = fixture(0); short.education = []; short.projects = []; short.custom_sections = [];
  assert.equal(layoutResume(short, getTemplate('classic')).pages.length, 1);
  const long = fixture(5, 24);
  assert.equal(resumeContentSchema.safeParse(long).success, true);
  const plan = layoutResume(long, getTemplate('modern'));
  assert.ok(plan.pages.length > 3);
  assert.ok(normalize(plan.pages.flat().map(l => l.text).join(' ')).includes('workflow4-23'));
});

test('legacy IDs resolve and templates produce distinct plans', () => {
  // Retired designs keep rendering through their closest current template.
  assert.deepEqual(['classic', 'modern', 'creative', 'software-engineer', 'academic-cv'].map(id => getTemplate(id).id), ['harvard', 'faangpath', 'awesome', 'faangpath', 'harvard']);
  const plans = RESUME_TEMPLATES.map(t => JSON.stringify(layoutResume(fixture(), t)));
  assert.equal(new Set(plans).size, RESUME_TEMPLATES.length);
});

test('long URLs preserve characters and unsupported glyphs are surfaced', () => {
  const content = fixture(0); content.contact.portfolio_url = `https://example.com/${'a'.repeat(180)}`;
  const plan = layoutResume(content, getTemplate('classic'));
  // Links print without "https://" (resume convention) but every other character is kept.
  assert.ok(normalize(plan.pages.flat().map(l => l.text).join('')).includes(content.contact.portfolio_url.replace('https://', '')));
  content.contact.full_name = 'Alex 李';
  assert.ok(layoutResume(content, getTemplate('classic')).warnings.some(w => w.includes('character set')));
});

module.exports = { fixture };

for (const adminGenerated of [false, true]) {
  test(`${adminGenerated ? 'Admin' : 'Client'} exports honor explicit layout and Word format`, async () => {
    const { exportHandler } = require('./test-admin-resume-exports.cjs');
    let selected;
    const handler = exportHandler(adminGenerated, { owner: true, overrides: {
      '@/lib/resume/word-document': { generateWordDocument: async (_content, { template }) => { selected = template.id; return Buffer.from('PK-word'); } },
      '@/lib/resume/pdf-document': { ResumePDF: props => { selected = props.template.id; return ResumePDF(props); } },
    } });
    for (const format of ['pdf', 'docx']) {
      const response = await handler(new Request(`http://localhost/export?id=resume-id&format=${format}&template=faangpath`), { params: Promise.resolve({ id: 'resume-id' }) });
      assert.equal(response.status, 200);
      assert.equal(selected, 'faangpath', 'Query layout must override saved classic template');
      assert.ok(response.headers.get('content-disposition').endsWith(`.${format}"`));
    }
    const invalid = await handler(new Request('http://localhost/export?id=resume-id&format=exe'), { params: Promise.resolve({ id: 'resume-id' }) });
    assert.equal(invalid.status, 400);
  });
}

test('DOCX importer retains header contact details', async () => {
  const { Document, Paragraph, Header, Packer } = require('docx');
  const buffer = await Packer.toBuffer(new Document({ sections: [{ headers: { default: new Header({ children: [new Paragraph('Alex Morgan | alex@example.com')] }) }, children: [new Paragraph('Software engineer building validation tools.')] }] }));
  const { extractTextFromDOCX } = loadSource('src/lib/ai/parsers/resume-parser.ts', {});
  const text = await extractTextFromDOCX(buffer);
  assert.match(text, /Alex Morgan/);
  assert.match(text, /alex@example.com/);
  assert.match(text, /Software engineer/);
});

test('selected page count survives validation and controls pagination without clipping', () => {
  const content = fixture();
  content.layout = { target_pages: 3 };
  const parsed = resumeContentSchema.parse(content);
  assert.equal(parsed.layout.target_pages, 3);
  const plan = layoutResume(parsed, getTemplate('classic'));
  assert.equal(plan.pages.length, 3);
  content.layout.target_pages = 1;
  const overflow = layoutResume(content, getTemplate('classic'));
  assert.ok(overflow.pages.length > 1);
  assert.ok(overflow.warnings.some(w => w.includes('Requested 1 pages')));
  assert.equal(resumeContentSchema.safeParse({ ...content, layout: { target_pages: 0 } }).success, false);
});

test('AI length revision uses actual overflow and preserves contact details', async () => {
  const { fitGeneratedResume } = loadSource('src/lib/resume/fit-generated-resume.ts', {});
  const source = fixture();
  let calls = 0, reviews = 0;
  const shorter = fixture(2, 1);
  const groq = { chat: { completions: { create: async args => {
    // The quality-gate reviewer runs first; a clean review means no fix call.
    if (args.messages[0].content.includes("fact-checker")) { reviews++; return { choices: [{ finish_reason: "stop", message: { content: "{\"issues\":[]}" } }], usage: { total_tokens: 8 } }; }
    calls++;
    assert.match(args.messages[1].content, /renders as .* target is 1/);
    return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(shorter) } }], usage: { total_tokens: 42 } };
  } } } };
  const fitted = await fitGeneratedResume(groq, source, source, 1, 'classic');
  assert.equal(calls, 1);
  assert.equal(fitted.pageCount, 1);
  assert.equal(fitted.tokensUsed, 50);
  assert.equal(reviews, 1);
  assert.deepEqual(fitted.content.contact, source.contact);
  await fitGeneratedResume(groq, source, source, null, 'classic');
  assert.equal(calls, 1, 'Auto must not condense the source');
});

test('reference resume fills both sheets without losing source details', () => {
  const reference = require('./resume-layout-fixture.json');
  for (const template of RESUME_TEMPLATES) {
    const content = { ...reference, layout: { target_pages: 2 } };
    const plan = layoutResume(content, template);
    assert.equal(plan.pages.length, 2);
    const capacity = PAPER.height - template.layout.margins.top - template.layout.margins.bottom;
    // Compact templates fit this resume on one page; a forced second page is never padded with invented content.
    const natural = layoutResume({ ...reference, layout: { target_pages: null } }, template).pages.length;
    for (const page of plan.pages) for (const [index, column] of columns(page).entries()) {
      if (natural >= 2 && index === 0) assert.ok(height(column) / capacity >= 0.9, `${template.id}: underfilled at ${height(column) / capacity}`);
      assert.ok(height(column) <= capacity);
    }
    const text = normalize(plan.pages.flat().map(line => (line.lead || '') + line.text + (line.right || '')).join(' '));
    for (const block of resumeBlocks(content, template)) for (const part of [block.lead, block.text, block.right].filter(Boolean)) assert.ok(text.includes(normalize(part)), part);
  }
});

test('LaTeX export keeps right-aligned dates, italics and bold labels for split templates', () => {
  const { generateLatex } = loadSource('src/lib/resume/latex-templates.ts', {});
  const tex = generateLatex(fixture(1, 1), 'jake');
  assert.ok(!tex.includes('\t'), 'a "\\t" escape turned into a tab character');
  assert.ok(tex.includes('\\textbf{Company 0}\\hfill Austin, Texas\\par'));
  assert.ok(tex.includes('\\textit{Software Engineer}\\hfill \\textit{Jan 2020 - Present}'));
  assert.ok(tex.includes('\\textbf{Engineering:} Python, SQL'));
});

test('a selected page count is guaranteed: least important content goes first and every removal is reported', () => {
  const { trimToPages } = loadSource('src/lib/resume/fit-generated-resume.ts', {});
  const content = fixture(4, 6);
  content.custom_sections.push({ id: 'y', title: 'Selected Deliverables', content: 'Long extra section. '.repeat(40) });
  for (const id of ['classic', 'jake', 'deedy']) {
    assert.ok(layoutResume(content, getTemplate(id)).pages.length > 1);
    const { content: trimmed, warning } = trimToPages(content, 1, id);
    assert.equal(layoutResume({ ...trimmed, layout: { target_pages: 1 } }, getTemplate(id)).pages.length, 1, id);
    assert.equal(trimmed.experience.length, 4, 'every role is kept');
    assert.ok(trimmed.experience[0].bullets.length >= trimmed.experience[3].bullets.length, 'older roles are trimmed first');
    assert.ok(trimmed.experience.every(e => e.bullets.length >= 1));
    assert.match(warning, /To fit 1 page, removed: .*Selected Deliverables/);
  }
  assert.deepEqual(trimToPages(fixture(1, 2), 1, 'classic').warning, '', 'content that already fits is untouched');
});

test('certifications drop a repeated issuer; split templates right-align issuer and date', () => {
  const content = fixture(1, 1);
  content.certifications = [
    { id: 'a', name: 'McKinsey.org Forward Program', issuer: 'McKinsey', date: '', url: '' },
    { id: 'b', name: 'Career Essentials in Business Analysis', issuer: 'Microsoft/LinkedIn', date: '2024', url: '' },
  ];
  const jake = resumeBlocks(content, getTemplate('jake'));
  assert.ok(jake.some(b => b.text === 'McKinsey.org Forward Program' && !b.right));
  assert.ok(jake.some(b => b.text === 'Career Essentials in Business Analysis' && b.right === 'Microsoft/LinkedIn · 2024'));
  const deedy = resumeBlocks(content, getTemplate('deedy'));
  assert.ok(deedy.some(b => b.text === 'Microsoft/LinkedIn · 2024' && b.column === 'side'));
  assert.equal(resumeBlocks(content, getTemplate('jake')).filter(b => b.kind === 'contact').length, 2, 'three long links need a second line');
  content.contact.github_url = ''; content.contact.portfolio_url = '';
  assert.equal(resumeBlocks(content, getTemplate('jake')).filter(b => b.kind === 'contact').length, 1, 'a typical contact line fits one line');
  assert.ok(!resumeBlocks(content, getTemplate('jake')).some(b => b.text.includes('https://')));
});

test('refill gives trimmed bullets back while the page still fits', () => {
  const { refillToPages, describeRemovals } = loadSource('src/lib/resume/fit-generated-resume.ts', {});
  const full = fixture(2, 3); full.education = []; full.projects = []; full.custom_sections = [];
  full.experience.forEach((e, i) => { e.bullets = [`Led API migration ${i} for billing`, `Wrote SQL checks ${i} for reconciliation`, `Trained analysts ${i} on dashboards`]; });
  const trimmed = { ...full, experience: full.experience.map(e => ({ ...e, bullets: e.bullets.slice(0, 1) })) };
  const refilled = refillToPages(trimmed, full, 1, 'jake');
  assert.deepEqual(refilled.experience.map(e => e.bullets.length), [3, 3]);
  assert.equal(describeRemovals(full, refilled, 1), '');
  assert.match(describeRemovals(full, trimmed, 1), /2 bullets from Company 0; 2 bullets from Company 1/);
});
