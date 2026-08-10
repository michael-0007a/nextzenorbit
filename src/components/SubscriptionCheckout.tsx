"use client";

/**
 * Subscription Checkout — Dual Gateway Support
 *
 * Handles:
 * 1. Call POST /api/subscription/create with { plan, currency, paymentMethod }
 * 2. For INR: Submit form parameters to PayU redirect gateway
 * 3. For USD: Redirect to USD gateway (Airwallex/Stripe placeholder)
 *
 * Usage:
 *   <SubscriptionCheckout plan="pro" paymentMethod="inr" />
 *   <SubscriptionCheckout plan="elite" paymentMethod="usd" />
 */

import { useState, useCallback } from "react";
import { PLANS } from "@/lib/subscription";
import { Currency, formatPrice } from "@/hooks/use-currency";
import type { PaymentMethod } from "@/components/subscription/payment-method-selector";

interface SubscriptionCheckoutProps {
  plan: "free" | "pro" | "elite";
  userEmail?: string;
  userName?: string;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  onSuccess?: (response: any) => void;
  onFailure?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const PLAN_DISPLAY = {
  free: {
    name: "Plan 1",
    description: "Plan 1 monthly subscription",
  },
  pro: {
    name: "Plan 2",
    description: "Plan 2 monthly subscription",
  },
  elite: {
    name: "Plan 3",
    description: "Plan 3 monthly subscription",
  },
} as const;

export default function SubscriptionCheckout({
  plan,
  userEmail,
  userName,
  currency,
  paymentMethod = "inr",
  onSuccess,
  onFailure,
  className,
  children,
}: SubscriptionCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const activeCurrency: Currency = paymentMethod === "inr" ? "INR" : "USD";

  const handleSubscribe = useCallback(async () => {
    setLoading(true);

    try {
      // 1. Create subscription on backend
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, currency: activeCurrency, paymentMethod }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const message = json.error?.message || "Failed to create subscription";
        onFailure?.(message);
        setLoading(false);
        return;
      }

      const { data } = json;

      if (paymentMethod === "inr" && data.payu) {
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

      if (paymentMethod === "usd" && data.redirectUrl) {
        // USD Gateway Flow: Redirect to the checkout URL
        window.location.href = data.redirectUrl;
        return;
      }

      if (paymentMethod === "usd" && !data.redirectUrl) {
        // USD gateway placeholder — show message
        onFailure?.("USD payment gateway is being set up. Please use INR payment for now, or try again later.");
        setLoading(false);
        return;
      }

      // If no redirect payload is present
      onFailure?.("Payment gateway configuration mismatch.");
      setLoading(false);
    } catch (error) {
      console.error("Subscription checkout error:", error);
      onFailure?.("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [plan, activeCurrency, paymentMethod, onFailure]);

  const display = PLAN_DISPLAY[plan];
  const priceKey = paymentMethod === "inr" ? "price_inr" : "price_usd";
  const displayPrice = PLANS[plan][priceKey];

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex items-start gap-2 px-1">
        <input 
          type="checkbox" 
          id={`agree-${plan}`} 
          className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-white/5 accent-primary shrink-0" 
          checked={agreed} 
          onChange={(e) => setAgreed(e.target.checked)} 
        />
        <label htmlFor={`agree-${plan}`} className="text-[11px] leading-tight text-text-secondary text-left">
          I understand there is <strong className="text-foreground font-medium">No Job Guarantee</strong> and <strong className="text-foreground font-medium">No Refunds</strong>. I agree to the <a href="/terms" target="_blank" className="text-primary hover:underline">Terms</a> & <a href="/refund" target="_blank" className="text-primary hover:underline">Refund Policy</a>.
        </label>
      </div>
      <button
        onClick={handleSubscribe}
        disabled={loading || !agreed}
        className={className}
        style={!className ? {
          padding: "12px 32px",
          fontSize: "16px",
          fontWeight: 600,
          borderRadius: "8px",
          border: "none",
          cursor: (loading || !agreed) ? "not-allowed" : "pointer",
          background: (loading || !agreed)
            ? "#94a3b8"
            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          opacity: (loading || !agreed) ? 0.7 : 1,
          transition: "all 0.2s ease",
        } : undefined}
      >
        {children || (loading
          ? "Processing..."
          : `Subscribe to ${display.name} — ${formatPrice(displayPrice, activeCurrency)}/mo`)}
      </button>
    </div>
  );
}
