import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geo
 *
 * Returns the visitor's country code based on:
 *   1. Vercel's `x-vercel-ip-country` header
 *   2. Cloudflare's `cf-ipcountry` header
 *   3. Timezone-based fallback for local development
 *
 * Response: { country: "US" | "IN" | "GB" | ... }
 */
export async function GET(request: NextRequest) {
  let country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    null;

  if (!country) {
    const acceptLang = request.headers.get("accept-language") || "";
    // Check Indian locales
    const indianLocales = /\b(hi|mr|ta|te|bn|gu|kn|ml|pa|or|as|ne|sa|kok|doi|mai|bho|sd)-?/i;
    if (indianLocales.test(acceptLang) && acceptLang.includes("IN")) {
      country = "IN";
    }
    // Very basic fallback logic for a few other common ones if testing locally
    else if (acceptLang.includes("GB")) country = "GB";
    else if (acceptLang.includes("AU")) country = "AU";
    else if (acceptLang.includes("CA")) country = "CA";
  }

  return NextResponse.json(
    { country: country?.toUpperCase() || null },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
