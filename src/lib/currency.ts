export type Currency = "USD" | "INR";

export function formatPrice(amount: number, currency: Currency): string {
  if (amount === 0) return "Free";
  const symbols: Record<Currency, string> = {
    USD: "$",
    INR: "₹",
  };
  return `${symbols[currency]}${amount.toLocaleString()}`;
}
