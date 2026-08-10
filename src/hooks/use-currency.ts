"use client";

import { useEffect, useState } from "react";

export type Currency = "USD" | "INR";

/**
 * useCurrency — Always returns "USD" for display purposes.
 * All plan prices are shown in USD regardless of the user's location.
 */
export function useCurrency(): Currency {
  return "USD";
}

let cachedCurrency: Currency | null = null;
let fetchPromise: Promise<Currency> | null = null;

/**
 * usePaymentCurrency — Detects the user's local currency for payment routing.
 * Used to determine whether to route to PayU (INR) or USD gateway.
 */
export function usePaymentCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    if (cachedCurrency) {
      setCurrency(cachedCurrency);
      return;
    }

    try {
      const stored = sessionStorage.getItem("nzo_currency") as Currency | null;
      if (stored && ["USD", "INR"].includes(stored)) {
        cachedCurrency = stored;
        setCurrency(stored);
        return;
      }
    } catch {}

    if (!fetchPromise) {
      fetchPromise = detectCurrency();
    }

    fetchPromise.then((resolved) => {
      cachedCurrency = resolved;
      setCurrency(resolved);
      try {
        sessionStorage.setItem("nzo_currency", resolved);
      } catch {}
    });
  }, []);

  return currency;
}

export function formatPrice(amount: number, currency: Currency): string {
  if (amount === 0) return "Free";
  const symbols: Record<Currency, string> = {
    USD: "$",
    INR: "₹",
  };
  return `${symbols[currency]}${amount.toLocaleString()}`;
}

async function detectCurrency(): Promise<Currency> {
  // 1. Try server-side geo API
  try {
    const res = await fetch("/api/geo", { cache: "default" });
    if (res.ok) {
      const data = await res.json();
      if (data.country === "IN") return "INR";
      if (data.country) return "USD";
    }
  } catch {}

  // 2. Try client-side IP API (for local dev with VPN)
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/country.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.country === "IN") return "INR";
      if (data.country) return "USD";
    }
  } catch {}

  // 3. Fallback to timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "INR";
  } catch {}

  return "USD";
}
