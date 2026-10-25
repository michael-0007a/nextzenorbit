// Minimal in-memory stand-in for the Supabase query builder, for route tests.
function fakeDb(tables) {
  let seq = 0;
  return {
    tables,
    from(name) {
      const rows = (tables[name] ??= []);
      const filters = [];
      let update = null, insert = null, limit = Infinity, desc = false, orderKey = null;
      const matches = r => filters.every(f => f(r));
      const run = () => {
        if (insert) {
          const row = { id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`, created_at: new Date(Date.now() + seq).toISOString(), read_at: null, ...insert };
          rows.push(row);
          return [row];
        }
        let out = rows.filter(matches);
        if (update) { out.forEach(r => Object.assign(r, update)); return out.map(r => ({ ...r })); }
        if (orderKey) out = [...out].sort((a, b) => (a[orderKey] < b[orderKey] ? -1 : 1) * (desc ? -1 : 1));
        return out.slice(0, limit).map(r => ({ ...r }));
      };
      const q = {
        select() { return q; },
        eq(k, v) { filters.push(r => r[k] === v); return q; },
        in(k, v) { filters.push(r => v.includes(r[k])); return q; },
        is(k, v) { filters.push(r => (r[k] ?? null) === v); return q; },
        gte(k, v) { filters.push(r => r[k] >= v); return q; },
        lte(k, v) { filters.push(r => r[k] <= v); return q; },
        order(k, o) { orderKey = k; desc = o?.ascending === false; return q; },
        limit(n) { limit = n; return q; },
        insert(v) { insert = v; return q; },
        update(v) { update = v; return q; },
        async single() { const d = run()[0]; return { data: d ?? null, error: d ? null : { message: 'none' } }; },
        async maybeSingle() { return { data: run()[0] ?? null, error: null }; },
        then(resolve, reject) { return Promise.resolve({ data: run(), error: null }).then(resolve, reject); },
      };
      return q;
    },
  };
}

/** groq-sdk mock: each create() call returns the next queued reply (string, or Error to throw). */
function fakeGroq(replies) {
  const calls = [];
  class Groq {
    constructor() {
      this.chat = { completions: { create: async (body) => {
        calls.push(body);
        const next = replies.shift();
        if (next instanceof Error) throw next;
        return { choices: [{ message: { content: next } }], usage: { total_tokens: 100 } };
      } } };
    }
  }
  return { module: { __esModule: true, default: Groq }, calls };
}

module.exports = { fakeDb, fakeGroq };
