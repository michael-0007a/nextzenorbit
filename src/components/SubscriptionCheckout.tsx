"use client";

/**
 * Subscription Checkout — Example Frontend Integration
 *
 * Demonstrates how to:
 * 1. Call POST /api/subscription/create with { plan: "pro" | "elite" }
 * 2. Open the Razorpay checkout modal for subscription payment
 * 3. Handle success/failure callbacks
 *
 * Usage:
 *   <SubscriptionCheckout plan="pro" />
 *   <SubscriptionCheckout plan="elite" />
 *
 * NOTE: The Razorpay checkout.js script must be loaded on the page.
 *       See the useEffect below for how it's loaded dynamically.
 */

import { useState, useEffect, useCallback } from "react";
import { PLANS } from "@/lib/subscription";

// Razorpay global type declaration
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface SubscriptionCheckoutProps {
  plan: "pro" | "elite";
  userEmail?: string;
  userName?: string;
  onSuccess?: (response: RazorpayResponse) => void;
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
  onSuccess,
  onFailure,
  className,
  children,
}: SubscriptionCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
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

  // Dynamically load Razorpay checkout script
  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay checkout script");
      onFailure?.("Failed to load payment gateway. Please refresh and try again.");
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove on cleanup — other components may need it
    };
  }, [onFailure]);

  const handleSubscribe = useCallback(async () => {
    if (!scriptLoaded) {
      onFailure?.("Payment gateway is still loading. Please wait.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create subscription on backend
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
        form.action = process.env.NEXT_PUBLIC_PAYU_URL || "https://test.payu.in/_payment";

        Object.entries(data.payu).forEach(([key, value]) => {
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

      const { subscriptionId, razorpayKey } = data;

      // 2. Open Razorpay checkout modal
      const options: RazorpayOptions = {
        key: razorpayKey,
        subscription_id: subscriptionId,
        name: "Nextzen Orbit",
        description: PLAN_DISPLAY[plan].description,
        handler: (response: RazorpayResponse) => {
          // Payment successful — webhook will handle activation
          console.log("Razorpay payment successful:", response);
          onSuccess?.(response);
          setLoading(false);
        },
        prefill: {
          email: userEmail,
          name: userName,
        },
        theme: {
          color: "#6366f1", // Indigo
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Subscription checkout error:", error);
      onFailure?.("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [plan, scriptLoaded, userEmail, userName, onSuccess, onFailure]);

  const display = PLAN_DISPLAY[plan];

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading || !scriptLoaded}
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
        : `Subscribe to ${display.name} — ${currency === "INR" ? "₹" + PLANS[plan].price_inr : "$" + PLANS[plan].price_usd}/mo`)}
    </button>
  );
}
