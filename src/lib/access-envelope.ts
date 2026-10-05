import type { AccountAccess } from "@/lib/account-access";

export const ACCESS_HEADER = "x-orbit-access";
const encoder = new TextEncoder();

async function signature(payload: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Account access signing is unavailable.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(`orbit-request-access-v1:${secret}`),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return { key, bytes: encoder.encode(payload) };
}

/** Only middleware creates these; never send the envelope as a response header. */
export async function signAccess(userId: string, pathname: string, access: AccountAccess) {
  const payload = JSON.stringify({ userId, pathname, access, expires: Date.now() + 30_000 });
  const { key, bytes } = await signature(payload);
  const mac = await crypto.subtle.sign("HMAC", key, bytes);
  return `${btoa(unescape(encodeURIComponent(payload)))}.${Array.from(new Uint8Array(mac), b => b.toString(16).padStart(2, "0")).join("")}`;
}

export async function verifyAccess(value: string | null, userId: string, pathname: string): Promise<AccountAccess | null> {
  if (!value || value.length > 16_000) return null;
  try {
    const [encoded, mac, extra] = value.split(".");
    if (extra || !/^[0-9a-f]{64}$/.test(mac)) return null;
    const payload = decodeURIComponent(escape(atob(encoded)));
    const { key, bytes } = await signature(payload);
    const valid = await crypto.subtle.verify("HMAC", key, Uint8Array.from(mac.match(/../g)!, h => parseInt(h, 16)), bytes);
    if (!valid) return null;
    const result = JSON.parse(payload);
    if (result.userId !== userId || result.pathname !== pathname || result.expires < Date.now() || result.expires > Date.now() + 30_000) return null;
    return result.access as AccountAccess;
  } catch { return null; }
}
