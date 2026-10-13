// Model output shapes seen from Kimi K2.5 on Bedrock, even in JSON mode.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');
const { extractJson } = loadSource('src/lib/ai/extract-json.ts', {});

test('plain, fenced, leading-space and trailing-note JSON all parse', () => {
  const value = { summary: { text: 'Uses {braces} and "quotes" inside strings' }, bullets: ['a}b', 'c'] };
  const json = JSON.stringify(value);
  for (const raw of [json, ` ${json}`, '```json\n' + json + '\n```', `${json}  ,"\n\n**Note:** The changesApplied field documents {the} edits.`, `Here you go:\n${json}\nThanks!`])
    assert.deepEqual(extractJson(raw), value);
});

test('missing or truncated JSON throws SyntaxError like JSON.parse', () => {
  for (const raw of ['', null, 'no json here', '{"summary": {"text": "cut off']) assert.throws(() => extractJson(raw), SyntaxError);
});
