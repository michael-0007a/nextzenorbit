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

for (const template of RESUME_TEMPLATES) {
  test(`${template.id}: complete, readable, balanced pages and recoverable PDF/DOCX text`, async () => {
    const content = fixture();
    const plan = layoutResume(content, template);
    assert.ok(plan.pages.length >= 2);
    assert.ok(plan.fontSize >= 10.5 && plan.fontSize <= 12);
    const heights = plan.pages.map(page => page.reduce((h, l) => h + l.before + l.height, 0));
    const capacity = PAPER.height - template.layout.margins.top - template.layout.margins.bottom;
    assert.ok(heights.every(h => h <= capacity));
    assert.ok(Math.max(...heights) - Math.min(...heights) < 100, `Unbalanced pages: ${heights}`);
    assert.ok(plan.pages.every(page => page.at(-1).kind !== 'section'));
    const pdf = await renderToBuffer(ResumePDF({ content, template }));
    const extracted = await extractText(new Uint8Array(pdf), { mergePages: true });
    assert.equal(extracted.totalPages, plan.pages.length);
    const docx = await generateWordDocument(content, { template });
    const word = await mammoth.extractRawText({ buffer: docx });
    for (const block of resumeBlocks(content)) {
      assert.ok(normalize(extracted.text).includes(normalize(block.text)), `PDF missing: ${block.text}`);
      assert.ok(normalize(word.value).includes(normalize(block.text)), `DOCX missing: ${block.text}`);
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
  assert.equal(getTemplate('software-engineer').id, 'modern');
  const plans = RESUME_TEMPLATES.map(t => JSON.stringify(layoutResume(fixture(), t)));
  assert.equal(new Set(plans).size, RESUME_TEMPLATES.length);
});

test('long URLs preserve characters and unsupported glyphs are surfaced', () => {
  const content = fixture(0); content.contact.portfolio_url = `https://example.com/${'a'.repeat(180)}`;
  const plan = layoutResume(content, getTemplate('classic'));
  assert.ok(normalize(plan.pages.flat().map(l => l.text).join('')).includes(content.contact.portfolio_url));
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
      const response = await handler(new Request(`http://localhost/export?id=resume-id&format=${format}&template=modern`), { params: Promise.resolve({ id: 'resume-id' }) });
      assert.equal(response.status, 200);
      assert.equal(selected, 'modern', 'Query layout must override saved classic template');
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
  let calls = 0;
  const shorter = fixture(2, 1);
  const groq = { chat: { completions: { create: async args => {
    calls++;
    assert.match(args.messages[1].content, /renders as .* target is 1/);
    return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(shorter) } }], usage: { total_tokens: 42 } };
  } } } };
  const fitted = await fitGeneratedResume(groq, source, source, 1, 'classic');
  assert.equal(calls, 1);
  assert.equal(fitted.pageCount, 1);
  assert.equal(fitted.tokensUsed, 42);
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
    for (const page of plan.pages) {
      const used = page.reduce((sum, line) => sum + line.height + line.before, 0);
      assert.ok(used / capacity >= 0.9, `${template.id}: underfilled at ${used / capacity}`);
      assert.ok(used <= capacity);
    }
    const text = normalize(plan.pages.flat().map(line => line.text).join(' '));
    for (const block of resumeBlocks(content)) assert.ok(text.includes(normalize(block.text)));
  }
});
