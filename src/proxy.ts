import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  // 1. Refresh session
  const { user, supabaseResponse } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // 2. Protect specific routes based on role or auth
  // Ensure the user is signed in to access protected user areas
  const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/resumes") || path.startsWith("/job-search") || path.startsWith("/interviews") || path.startsWith("/billing") || path.startsWith("/onboarding") || path.startsWith("/settings");

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Block sso_user from /billing (since they get everything for free and don't need billing)
  if (user && path.startsWith("/billing")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      redirectUrl.pathname = "/admin/login";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
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
