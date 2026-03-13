/**
 * Subscription Page — Server Component
 *
 * Displays current plan, usage stats, and upgrade options.
 * Route: /(dashboard)/subscription
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SubscriptionDetails } from "@/components/subscription/subscription-details";
import { PlanCards } from "@/components/subscription/plan-cards";
import type { SubscriptionRow, AiUsageRow } from "@/types/database";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [subRes, usageRes, resumeCountRes] = await Promise.all([
    admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("ai_usage")
      .select("*")
      .eq("user_id", user.id)
      .order("billing_period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const subscription = (subRes.data as SubscriptionRow) ?? null;
  const aiUsage = (usageRes.data as AiUsageRow) ?? null;
  const resumeCount = resumeCountRes.count ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Subscription"
        description="Manage your plan, billing, and usage."
      />
      <SubscriptionDetails
        subscription={subscription}
        aiUsage={aiUsage}
        resumeCount={resumeCount}
      />
      <PlanCards currentPlanId={subscription?.plan_id ?? "free"} />
    </div>
  );
}

