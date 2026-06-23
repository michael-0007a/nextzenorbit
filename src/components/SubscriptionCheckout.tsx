"use client";

/**
 * Subscription Checkout — PayU Integration
 *
 * Handles:
 * 1. Call POST /api/subscription/create with { plan: "pro" | "elite", currency: "USD" | "INR" }
 * 2. Submit form parameters to PayU redirect gateway
 *
 * Usage:
 *   <SubscriptionCheckout plan="pro" />
 *   <SubscriptionCheckout plan="elite" />
 */

import { useState, useEffect, useCallback } from "react";
import { PLANS } from "@/lib/subscription";
import { Currency, useCurrency, formatPrice } from "@/hooks/use-currency";

interface SubscriptionCheckoutProps {
  plan: "pro" | "elite";
  userEmail?: string;
  userName?: string;
  currency?: Currency; // Allow passing currency directly, fallback to hook
  onSuccess?: (response: any) => void;
  onFailure?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const PLAN_DISPLAY = {
  pro: {
    name: "Pro",
    description: "Pro monthly subscription",
  },
  elite: {
    name: "Elite",
    description: "Elite monthly subscription",
  },
} as const;

export default function SubscriptionCheckout({
  plan,
  userEmail,
  userName,
  currency,
  onSuccess,
  onFailure,
  className,
  children,
}: SubscriptionCheckoutProps) {
  const [loading, setLoading] = useState(false);
  
  const detectedCurrency = useCurrency();
  const activeCurrency = currency || detectedCurrency;

  const handleSubscribe = useCallback(async () => {
    setLoading(true);

    try {
      // 1. Create subscription on backend
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, currency: activeCurrency }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const message = json.error?.message || "Failed to create subscription";
        onFailure?.(message);
        setLoading(false);
        return;
      }

      const { data } = json;

      if (data.payu) {
        // PayU Flow: Create a hidden form and submit it
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.payu.action || process.env.NEXT_PUBLIC_PAYU_URL || "https://test.payu.in/_payment";

        Object.entries(data.payu).forEach(([key, value]) => {
          if (key === "action") return; // Skip action URL in form fields
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // If no payu redirect payload is present
      onFailure?.("Payment gateway configuration mismatch.");
      setLoading(false);
    } catch (error) {
      console.error("Subscription checkout error:", error);
      onFailure?.("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [plan, currency, onFailure]);

  const display = PLAN_DISPLAY[plan];

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className={className}
      style={!className ? {
        padding: "12px 32px",
        fontSize: "16px",
        fontWeight: 600,
        borderRadius: "8px",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        background: loading
          ? "#94a3b8"
          : "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "#fff",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s ease",
      } : undefined}
    >
      {children || (loading
        ? "Processing..."
        : `Subscribe to ${display.name} — ${formatPrice(PLANS[plan][`price_${activeCurrency.toLowerCase()}` as keyof typeof PLANS.pro] as number, activeCurrency)}/mo`)}
    </button>
  );
}
