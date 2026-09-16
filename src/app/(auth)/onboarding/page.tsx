import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApplicationAccess } from "@/lib/onboarding";
import { signOut } from "../actions";
import { OnboardingForm } from "./profile-form";

export const dynamic = "force-dynamic";
export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const status = await getApplicationAccess(user);
  if (status === "approved") redirect("/subscription");
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  return <>
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{status === "pending" ? "Application under review" : status === "rejected" ? "Application not accepted" : "Complete your application"}</h1>
      <p className="text-sm text-text-secondary">{status === "pending" ? "Your profile and resume have been submitted. A supervisor or super admin will review your application. Payment becomes available only after approval." : status === "rejected" ? "Registration is unavailable for this account. Rejected email addresses and phone numbers cannot be used to apply again." : "Add your profile and contact details, then upload your resume. Our team will review everything before you can pay."}</p>
    </div>
    {status === "draft" && <OnboardingForm profile={profile} email={user.email || ""} />}
    {status === "pending" && <Link href="/onboarding" className="block text-primary underline">Refresh application status</Link>}
    <form action={signOut}><button className="text-sm text-text-secondary underline">Sign out</button></form>
  </>;
}
