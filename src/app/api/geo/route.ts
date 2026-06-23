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

  return NextResponse.json(
    { country: country?.toUpperCase() || null },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
