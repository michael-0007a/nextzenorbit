import { redirect } from "next/navigation";
import { getCachedUser, getCachedProfile } from "@/lib/supabase/server";
import { TermsForm } from "./terms-form";

export default async function TermsPage() {
  const { user } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCachedProfile(user.id);

  // If they already agreed, send them to dashboard
  if (profile?.has_agreed_to_terms) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-[24px] border border-border bg-surface/80 p-8 shadow-xl backdrop-blur-xl">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">Action Required</h1>
          <p className="text-sm text-text-secondary">
            Please review and accept our updated terms to continue using your account.
          </p>
        </div>

        <TermsForm />
      </div>
    </div>
  );
}
