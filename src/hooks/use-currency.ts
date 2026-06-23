"use client";

import { useEffect, useState } from "react";

export type Currency = "USD" | "INR" | "EUR" | "GBP" | "CAD" | "AUD";

const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  // India
  IN: "INR",
  // UK
  GB: "GBP",
  // Australia
  AU: "AUD",
  // Canada
  CA: "CAD",
  // Eurozone
  AT: "EUR", BE: "EUR", CY: "EUR", EE: "EUR", FI: "EUR", 
  FR: "EUR", DE: "EUR", GR: "EUR", IE: "EUR", IT: "EUR", 
  LV: "EUR", LT: "EUR", LU: "EUR", MT: "EUR", NL: "EUR", 
  PT: "EUR", SK: "EUR", SI: "EUR", ES: "EUR",
};

let cachedCurrency: Currency | null = null;
let fetchPromise: Promise<Currency> | null = null;

export function useCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (cachedCurrency) return cachedCurrency;
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("nzo_currency") as Currency | null;
      if (stored && ["USD", "INR", "EUR", "GBP", "CAD", "AUD"].includes(stored)) {
        cachedCurrency = stored;
        return stored;
      }
    }
    return "USD";
  });

  useEffect(() => {
    if (cachedCurrency) {
      setCurrency(cachedCurrency);
      return;
    }

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
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$"
  };
  return `${symbols[currency]}${amount}`;
}

async function detectCurrency(): Promise<Currency> {
  try {
    const res = await fetch("/api/geo", { cache: "default" });
    if (res.ok) {
      const data = await res.json();
      if (data.country && COUNTRY_TO_CURRENCY[data.country]) {
        return COUNTRY_TO_CURRENCY[data.country];
      }
      if (data.country) {
        return "USD";
      }
    }
  } catch {}

  // 2. Try client-side IP API (for local dev with VPN)
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/country.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.country && COUNTRY_TO_CURRENCY[data.country]) {
        return COUNTRY_TO_CURRENCY[data.country];
      }
      // If it's a known country but not mapped, fallback to USD
      if (data.country) return "USD";
    }
  } catch {}

  // 3. Fallback to timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "INR";
    if (tz === "Europe/London") return "GBP";
    if (tz.startsWith("Australia/")) return "AUD";
    if (tz.startsWith("Europe/")) {
      const nonEuro = ["Europe/Moscow", "Europe/Kiev", "Europe/London", "Europe/Zurich"];
      if (!nonEuro.includes(tz)) return "EUR";
    }
  } catch {}

  return "USD";
}
