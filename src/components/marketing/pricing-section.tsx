"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { PLANS } from "@/lib/subscription";

export function PricingSection() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") {
        setCurrency("INR");
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const pricing = [
    {
      name: "Free",
      priceDisplay: "Free",
      description: "Launch-ready essentials to get started.",
      features: ["1 resume", "Basic analyzer", "Application tracker", "Community support"],
      highlight: false,
    },
    {
      name: "Pro",
      priceDisplay: currency === "INR" ? `₹${PLANS.pro.price_inr}` : `$${PLANS.pro.price_usd}`,
      description: "For serious job seekers ready to move fast.",
      features: [
        "Unlimited resumes",
        "Advanced AI tailoring",
        "Cover letter studio",
        "Priority support",
      ],
      highlight: true,
    },
    {
      name: "Elite",
      priceDisplay: currency === "INR" ? `₹${PLANS.elite.price_inr}` : `$${PLANS.elite.price_usd}`,
      description: "Career acceleration with full automation.",
      features: ["Auto-apply queue", "Premium templates", "Deep insights", "Concierge support"],
      highlight: false,
    },
  ];

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-3">
      {pricing.map((plan) => (
        <div
          key={plan.name}
          className={`relative rounded-3xl border border-border p-8 ${
            plan.highlight
              ? "glass-card shadow-[0_0_60px_rgba(255,0,61,0.3)]"
              : "glass-card"
          }`}
        >
          {plan.highlight ? (
            <div className="absolute right-6 top-6 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-primary">
              Most Popular
            </div>
          ) : null}
          <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
          <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>
          <p className="mt-6 text-4xl font-semibold text-foreground">{plan.priceDisplay}</p>
          {plan.priceDisplay !== "Free" ? (
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-text-secondary">Per month</p>
          ) : null}

          <div className="mt-6 space-y-3 text-sm text-text-secondary">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {feature}
              </div>
            ))}
          </div>

          <Link
            href="/register"
            className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5 ${
              plan.highlight
                ? "bg-gradient-to-r from-primary to-primary-light text-white"
                : "border border-border bg-white/5 text-foreground"
            }`}
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}
