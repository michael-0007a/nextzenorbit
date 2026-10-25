import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { accountAccessFor, type AccountAccess } from "@/lib/account-access";
import { ACCESS_HEADER, signAccess } from "@/lib/access-envelope";
import { appHref, hostKind, routeForHost, sessionCookieOptions } from "@/lib/hosts";

export default async function proxy(request: NextRequest) {
  // Public metrics do not touch account data or need a refreshed auth session.
  if (["/api/performance", "/api/internal/jobs"].includes(request.nextUrl.pathname)) return NextResponse.next();
  // 0. Send each page to its own domain (no-op until the three host URLs are configured).
  const host = request.nextUrl.host;
  const kind = hostKind(host);
  const hostRoute = routeForHost(kind, request.nextUrl.pathname, request.nextUrl.search);
  if (hostRoute && "redirect" in hostRoute) return NextResponse.redirect(hostRoute.redirect, 308);
  const rewrite = hostRoute && "rewrite" in hostRoute ? hostRoute.rewrite : null;
  // 1. Refresh session
  const { user, supabaseResponse } = await updateSession(request);
  const path = rewrite ?? request.nextUrl.pathname;
  // Only the marketing host hands "/" traffic to the app host; previews/localhost stay on their own origin.
  const toApp = (target: string) => new URL(kind === "site" ? appHref(target) : target, request.url);
  if (path === "/") {
    const error = request.nextUrl.searchParams.get("error");
    if (error) {
      const errorCode = request.nextUrl.searchParams.get("error_code");
      const message = errorCode === "flow_state_already_used"
        ? "Your login link or session has already been used or expired. Please try signing in again."
        : request.nextUrl.searchParams.get("error_description") || "Authentication failed. Please try signing in again.";
      const response = NextResponse.redirect(toApp(`/login?error=${encodeURIComponent(message)}`));
      for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
      return response;
    }
    if (user || kind === "app") {
      const response = NextResponse.redirect(toApp(user ? "/dashboard" : "/login"));
      for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
      return response;
    }
  }
  let access: AccountAccess | undefined;
  const accountAccess = async () => access ??= await accountAccessFor(user!);

  // Protect direct API calls too; hiding dashboard/payment links is insufficient.
  const onboardingApi = path === "/api/onboarding" || path.startsWith("/api/onboarding/");
  if (user && path.startsWith("/api/") && !onboardingApi && !path.startsWith("/api/auth/") && !path.startsWith("/api/webhooks/")) {
    try {
      if ((await accountAccess()).application !== "approved") {
        return NextResponse.json({ success: false, error: { code: "APPROVAL_REQUIRED", message: "Complete your application and wait for approval before accessing this feature." } }, { status: 403 });
      }
      const checkoutPaths = ["/api/subscription", "/api/subscription/create", "/api/payments/create-order", "/api/payments/reconcile"];
      if (!checkoutPaths.includes(path) && !(await accountAccess()).service) {
        return NextResponse.json({ success: false, error: { code: "PAYMENT_REQUIRED", message: "Choose a plan and complete payment to unlock services." } }, { status: 402 });
      }
    } catch {
      return NextResponse.json({ success: false, error: { message: "Account status is temporarily unavailable." } }, { status: 503 });
    }
  }

  // 2. Protect specific routes based on role or auth
  // Ensure the user is signed in to access protected user areas
  const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/profile") || path.startsWith("/resumes") || path.startsWith("/cover-letter") || path.startsWith("/analyzer") || path.startsWith("/job-search") || path.startsWith("/applications") || path.startsWith("/career") || path.startsWith("/interviews") || path.startsWith("/billing") || path.startsWith("/onboarding") || path.startsWith("/settings") || path.startsWith("/messages") || path.startsWith("/linkedin") || path.startsWith("/offers");

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (isProtectedRoute || path === "/subscription") && !path.startsWith("/onboarding")) {
    try {
      const approved = (await accountAccess()).application === "approved";
      const destination = !approved ? "/onboarding" : path !== "/subscription" && !(await accountAccess()).service ? "/subscription" : null;
      if (destination) return NextResponse.redirect(new URL(destination, request.url));
    } catch {
      return new NextResponse("Account status is temporarily unavailable. Please retry.", { status: 503 });
    }
  }

  // 3. Block sso_user from /billing (since they get everything for free and don't need billing)
  if (user && path.startsWith("/billing")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: sessionCookieOptions(host),
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role === "sso_user") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Admin routing is handled mostly by the /admin layout using admin-only tokens,
  // but we can block basic access if not logged in
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = kind === "admin" ? "/login" : "/admin/login";
      return NextResponse.redirect(redirectUrl);
    }
  }

  const forwarded = new Headers(request.headers);
  forwarded.delete(ACCESS_HEADER);
  forwarded.set("x-next-pathname", path);
  if (user && access) forwarded.set(ACCESS_HEADER, await signAccess(user.id, path, access));
  const response = rewrite
    ? NextResponse.rewrite(new URL(`${rewrite}${request.nextUrl.search}`, request.url), { request: { headers: forwarded } })
    : NextResponse.next({ request: { headers: forwarded } });
  // Preserve every session-refresh cookie on the forwarded response.
  for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
  response.headers.set("x-next-pathname", path);
  if (kind === "app" || kind === "admin") response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes, some have their own checks)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
