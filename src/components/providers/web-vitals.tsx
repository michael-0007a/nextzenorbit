"use client";
import { useReportWebVitals } from "next/web-vitals";
export function WebVitals() {
  useReportWebVitals(metric => {
    // Strip dynamic IDs. Never report URLs, query strings, or document content.
    const pathname = window.location.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id").slice(0, 180);
    navigator.sendBeacon("/api/performance", new Blob([JSON.stringify({ name: metric.name, value: metric.value, pathname })], { type: "application/json" }));
  });
  return null;
}
