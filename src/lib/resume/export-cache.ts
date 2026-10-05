import { createHash } from "node:crypto";
const MAX_BYTES = 24 * 1024 * 1024;
const MAX_ENTRY_BYTES = 4 * 1024 * 1024;
const TTL = 5 * 60_000;
const entries = new Map<string, { bytes: Buffer; expires: number }>();
const pending = new Map<string, Promise<Buffer>>();
let totalBytes = 0;

/** Called only after current auth, ownership, and document validation.
 * Scope to the requesting user; content changes and renderer upgrades change the key. */
export async function cachedExport(userId: string, format: string, source: unknown, render: () => Promise<Buffer>): Promise<Buffer> {
  const key = createHash("sha256").update(JSON.stringify(["orbit-export-v1", userId, format, source])).digest("hex");
  const now = Date.now();
  for (const [id, item] of entries) if (item.expires <= now) { totalBytes -= item.bytes.length; entries.delete(id); }
  const existing = entries.get(key);
  if (existing) { entries.delete(key); entries.set(key, existing); return existing.bytes; }
  const running = pending.get(key);
  if (running) return running;
  const result = render().then(bytes => {
    if (bytes.length <= MAX_ENTRY_BYTES) {
      while (totalBytes + bytes.length > MAX_BYTES && entries.size) {
        const oldest = entries.keys().next().value!;
        totalBytes -= entries.get(oldest)!.bytes.length; entries.delete(oldest);
      }
      entries.set(key, { bytes, expires: Date.now() + TTL }); totalBytes += bytes.length;
    }
    return bytes;
  }).finally(() => { pending.delete(key); });
  pending.set(key, result);
  return result;
}
