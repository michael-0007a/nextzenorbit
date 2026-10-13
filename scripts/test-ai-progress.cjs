// Stage progress for long AI routes: server streams stages, client gets a normal Response back.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');
const { withStageStream } = loadSource('src/lib/ai/progress-stream.ts', {});
const { fetchWithProgress } = loadSource('src/lib/ai/fetch-progress.ts', {});

const handler = async onStage => {
  onStage('write'); onStage('review'); onStage('fit');
  return Response.json({ success: true, data: { pages: 1 } }, { status: 201 });
};

test('stages stream to the client, then the route answer arrives as a normal Response', async () => {
  const realFetch = global.fetch;
  global.fetch = async (url, init) => withStageStream(new Request('http://local' + url, init), handler);
  try {
    const seen = [];
    const response = await fetchWithProgress('/api/x', { method: 'POST', body: '{}' }, stage => seen.push(stage));
    assert.deepEqual(seen, ['write', 'review', 'fit']);
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { success: true, data: { pages: 1 } });
  } finally { global.fetch = realFetch; }
});

test('without the progress header the route answers exactly as before', async () => {
  const response = await withStageStream(new Request('http://local/api/x', { method: 'POST' }), handler);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('content-type'), 'application/json');
});

test('gate answers (402/403 JSON) pass straight through the client helper', async () => {
  const realFetch = global.fetch;
  global.fetch = async () => Response.json({ error: { code: 'PAYMENT_REQUIRED' } }, { status: 402 });
  try {
    const response = await fetchWithProgress('/api/x', { method: 'POST' }, () => assert.fail('no stages expected'));
    assert.equal(response.status, 402);
  } finally { global.fetch = realFetch; }
});

test('a crashing handler still ends the stream with an error the UI can show', async () => {
  const response = await withStageStream(new Request('http://local/api/x', { headers: { 'x-ai-progress': '1' } }), async () => { throw new Error('boom'); });
  const lines = (await response.text()).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(lines.at(-1).status, 500);
});

test('the bar follows real stages, skips steps the server skipped, and never claims 100% early', () => {
  const { estimateProgress, resumeRewritePlan, AI_PLANS } = loadSource('src/lib/ai/progress.ts', {});
  const plan = resumeRewritePlan(1); // parse 20, write 20, review 8, fix 5, fit 32 = 85s
  const start = estimateProgress(plan, 0, 0, 0);
  assert.equal(start.percent, 0);
  assert.equal(start.secondsLeft, 85);
  // Already-parsed resume: the server's first stage is "write", so parsing drops out of the estimate.
  const write = estimateProgress(plan, 1, 1, 10);
  assert.equal(write.steps.length, 4);
  assert.equal(write.secondsLeft, 55);
  assert.equal(write.percent, Math.round(10 / 65 * 100));
  // Fact-checking just started: everything before it counts as done.
  assert.equal(estimateProgress(plan, 2, 1, 0).percent, Math.round(20 / 65 * 100));
  // A step running far over its typical time slows near its end and is flagged, never hitting 100.
  const stuck = estimateProgress(plan, 4, 1, 120);
  assert.ok(stuck.percent < 100 && stuck.percent >= 90);
  assert.equal(stuck.slow, true);
  assert.equal(stuck.secondsLeft, 0);
  // Without a page limit the fitting step is not part of the estimate.
  assert.ok(!resumeRewritePlan(null).some(step => step.stage === 'fit'));
  assert.equal(estimateProgress(AI_PLANS.coverLetter, -1, 0, 6).secondsLeft, 6);
});
