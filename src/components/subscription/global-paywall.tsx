"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Crown } from "lucide-react";
import { PlanCards } from "@/components/subscription/plan-cards";
import { useEffect, useState } from "react";

export function GlobalPaywall({ isSsoUser }: { isSsoUser: boolean }) {
  const { isActive, loading, activePlanId } = useSubscription();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset dismissed state when navigating to a new page
  useEffect(() => {
    setDismissed(false);
  }, [pathname]);

  if (!mounted) return null;

  // Do not show on billing/subscription or settings pages
  if (pathname.startsWith("/subscription") || pathname.startsWith("/settings") || pathname.startsWith("/onboarding")) {
    return null;
  }

  // Allow sso_users
  if (isSsoUser) return null;

  // Show paywall if loaded, inactive, and not dismissed by the user
  const showPaywall = !loading && !isActive && !dismissed;

  return (
    <Modal
      open={showPaywall}
      onClose={() => setDismissed(true)}
      closeOnOverlayClick={true}
      size="full"
      title="Unlock NextZen Orbit"
      description="You need an active subscription to access this feature."
      className="p-0 overflow-hidden"
    >
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-xl shadow-primary/20 mb-2">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Choose Your Plan</h2>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          Subscribe to access AI-powered job search automation, advanced resume parsing, and priority recruiter support.
        </p>
        
        <div className="w-full max-w-4xl mx-auto text-left">
          <PlanCards currentPlanId={activePlanId} />
        </div>
      </div>
    </Modal>
  );
}
