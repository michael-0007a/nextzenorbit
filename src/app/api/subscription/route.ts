import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, data: null }, { status: 401 });
    }

    const admin = createAdminClient();
    
    // First try to find an active subscription
    let { data, error } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[GET /api/subscription] active fetch error:", error.message);
    }

    // Fallback to most recent if no active subscription found
    if (!data || data.length === 0) {
      const { data: fallbackData, error: fallbackError } = await admin
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (fallbackError) {
        console.error("[GET /api/subscription] fallback fetch error:", fallbackError.message);
      }
      data = fallbackData;
    }

    const subscription = data && data.length > 0 ? data[0] : null;
    return NextResponse.json({ success: true, data: subscription });
  } catch (err) {
    console.error("[GET /api/subscription] error:", err);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
