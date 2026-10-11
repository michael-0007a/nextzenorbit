/**
 * Host routing for the three public domains:
 *   NEXT_PUBLIC_SITE_URL  (marketing)  e.g. https://nextzenorbit.com
 *   NEXT_PUBLIC_APP_URL   (client app) e.g. https://app.nextzenorbit.com
 *   NEXT_PUBLIC_ADMIN_URL (staff)      e.g. https://admin.nextzenorbit.com
 * Routing stays off ("any") until all three are set, so localhost, previews and the
 * current deployment behave exactly as before. A hostname is never authorization.
 */

export type HostKind = "site" | "app" | "admin" | "legacy" | "any";

export const ADMIN_SESSION_COOKIE = "sb-orbit-admin";

const hostOf = (url: string | undefined) => {
  try { return url ? new URL(url).host.toLowerCase() : null; } catch { return null; }
};

export function configuredHosts() {
  // Literal process.env reads so Next inlines NEXT_PUBLIC_* values into browser bundles.
  const site = hostOf(process.env.NEXT_PUBLIC_SITE_URL);
  const app = hostOf(process.env.NEXT_PUBLIC_APP_URL);
  const admin = hostOf(process.env.NEXT_PUBLIC_ADMIN_URL);
  const legacy = (process.env.ORBIT_LEGACY_HOSTS ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  return site && app && admin ? { site, app, admin, legacy } : null;
}

export function hostKind(host: string | null | undefined): HostKind {
  const hosts = configuredHosts();
  const value = (host ?? "").toLowerCase();
  if (!hosts) return "any";
  if (value === hosts.site || value === `www.${hosts.site}`) return "site";
  if (value === hosts.app) return "app";
  if (value === hosts.admin) return "admin";
  if (hosts.legacy.includes(value)) return "legacy";
  return "any";
}

const origin = (host: string) => `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

/** Absolute URL on the client app host once routing is on; a plain path before that. */
export function appHref(path: string) {
  const hosts = configuredHosts();
  return hosts ? `${origin(hosts.app)}${path}` : path;
}

const SITE_PAGES = new Set(["/", "/privacy", "/terms", "/refund", "/compliance"]);
const isAdminPath = (path: string) => path === "/admin" || path.startsWith("/admin/");
const cleanAdminPath = (path: string) => path.replace(/^\/admin/, "") || "/";
// APIs (webhooks, OAuth callback, extension) and framework/static files are never moved between hosts.
const passthrough = (path: string) => path.startsWith("/api/") || path === "/api" || path.startsWith("/_next/") || /\/[^/]+\.[a-z0-9]+$/i.test(path);

export type HostRoute = { redirect: string } | { rewrite: string } | null;

/** Pure routing decision for one request. */
export function routeForHost(kind: HostKind, path: string, search = ""): HostRoute {
  const hosts = configuredHosts();
  if (!hosts || kind === "any" || passthrough(path)) return null;
  const to = (host: string, target = path) => ({ redirect: `${origin(host)}${target}${search}` });
  // shortcut: in-app links still say /admin/..., so on the staff host they cost one 308 hop to the clean URL; make links host-aware if that hop matters.
  const toAdmin = () => to(hosts.admin, cleanAdminPath(path));

  if (kind === "site") {
    if (isAdminPath(path)) return toAdmin();
    return SITE_PAGES.has(path) ? null : to(hosts.app);
  }
  if (kind === "app") return isAdminPath(path) ? toAdmin() : null;
  if (kind === "admin") {
    if (isAdminPath(path)) return toAdmin();
    // Clean staff URLs: /users -> /admin/users, / -> /admin. Client pages 404 here.
    return { rewrite: path === "/" ? "/admin" : `/admin${path}` };
  }
  // legacy (*.vercel.app): pages move to their new host.
  if (isAdminPath(path)) return toAdmin();
  return to(SITE_PAGES.has(path) ? hosts.site : hosts.app);
}

/**
 * Supabase auth cookie options for a host.
 * Marketing + app share one session (cookie on the parent domain); the staff host
 * uses a separately named host-only cookie so client sessions never count there.
 */
export function sessionCookieOptions(host: string | null | undefined): { name?: string; domain?: string } | undefined {
  const kind = hostKind(host);
  const hosts = configuredHosts();
  if (kind === "admin") return { name: ADMIN_SESSION_COOKIE };
  if ((kind === "site" || kind === "app") && hosts && hosts.app.endsWith(`.${hosts.site}`)) return { domain: `.${hosts.site}` };
  return undefined;
}
