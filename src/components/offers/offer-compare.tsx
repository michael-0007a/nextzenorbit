"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Briefcase, Info, Plus, Trash2, Trophy, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { breakdownOffer, TAX_YEAR, type OfferInput, type Regime } from "@/lib/salary/ctc";

type Offer = OfferInput & { name: string };

const STORAGE_KEY = "orbit-offer-compare-v1";
const MAX_OFFERS = 3;
const blank = (n: number): Offer => ({
  name: `Offer ${n}`, ctc: 1200000, variable: 0, basicPercent: 40, pfOnCappedWage: true,
  professionalTax: 2400, regime: "new", oldRegimeDeductions: 0, joiningBonus: 0, noticeBuyout: 0,
});

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const money = (value: number) => inr.format(Math.round(value));

const numberFields: { key: keyof OfferInput; label: string; hint?: string }[] = [
  { key: "ctc", label: "Annual CTC (₹)" },
  { key: "variable", label: "Variable pay in CTC (₹)" },
  { key: "basicPercent", label: "Basic (% of fixed)", hint: "Often 40–50%. Check the offer letter." },
  { key: "professionalTax", label: "Professional tax / year (₹)", hint: "₹2,400 in most PT states; 0 if none." },
  { key: "joiningBonus", label: "Joining bonus (₹)" },
  { key: "noticeBuyout", label: "Notice buyout you pay (₹)" },
];

function savedOffers(): Offer[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(saved) && saved.length) return saved.slice(0, MAX_OFFERS).map((o, i) => ({ ...blank(i + 1), ...o }));
  } catch { /* storage unavailable: start fresh */ }
  return [blank(1), blank(2)];
}

const noopSubscribe = () => () => {};

/** Renders only in the browser so saved offers load without a hydration mismatch. */
export function OfferCompare() {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return mounted ? <OfferCompareInner /> : <div className="glass-card rounded-3xl p-10 text-center text-sm text-text-secondary">Loading calculator…</div>;
}

function OfferCompareInner() {
  const [offers, setOffers] = useState<Offer[]>(savedOffers);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(offers)); } catch { /* ignore */ }
  }, [offers]);

  const results = useMemo(() => offers.map(breakdownOffer), [offers]);
  const bestMonthly = Math.max(...results.map((r) => r.monthlyInHand));
  const bestFirstYear = Math.max(...results.map((r) => r.firstYearCash));
  const winner = (() => {
    if (offers.length < 2) return null;
    const ranked = results.map((r, i) => ({ i, m: r.monthlyInHand })).sort((a, b) => b.m - a.m);
    const gap = ranked[0].m - ranked[1].m;
    if (Math.round(gap) === 0) return { text: "These offers pay the same monthly in-hand. Compare first-year cash and the role itself." };
    return { text: `${offers[ranked[0].i].name} pays ${money(gap)} more per month in hand than ${offers[ranked[1].i].name} (${money(gap * 12)} a year).` };
  })();
  const update = (index: number, patch: Partial<Offer>) => setOffers((list) => list.map((o, i) => (i === index ? { ...o, ...patch } : o)));

  const rows: { label: string; value: (i: number) => number; best?: number; strong?: boolean }[] = [
    { label: "Monthly in-hand", value: (i) => results[i].monthlyInHand, best: bestMonthly, strong: true },
    { label: "First-year cash", value: (i) => results[i].firstYearCash, best: bestFirstYear, strong: true },
    { label: "Annual in-hand (steady state)", value: (i) => results[i].annualInHand },
    { label: "Gross salary", value: (i) => results[i].grossSalary },
    { label: "Basic", value: (i) => results[i].basic },
    { label: "Employer PF (in CTC)", value: (i) => results[i].employerPf },
    { label: "Gratuity (in CTC)", value: (i) => results[i].gratuity },
    { label: "Your PF contribution", value: (i) => results[i].employeePf },
    { label: "Income tax on salary", value: (i) => results[i].taxOnSalary },
    { label: "Variable after tax", value: (i) => results[i].variableAfterTax },
    { label: "Joining bonus after tax", value: (i) => results[i].joiningBonusAfterTax },
  ];

  return (
    <div className="space-y-6">
      <div className={cn("grid gap-4", offers.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
        {offers.map((offer, index) => (
          <Card key={index} className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 right-0 h-1", results[index].monthlyInHand === bestMonthly && offers.length > 1 ? "bg-gradient-to-r from-success via-success/70 to-success" : "bg-gradient-to-r from-primary via-primary-light to-primary")} />
            <CardBody className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10"><Briefcase className="h-4 w-4 text-primary" /></div>
              <input
                aria-label="Offer name"
                value={offer.name}
                maxLength={40}
                onChange={(e) => update(index, { name: e.target.value })}
                className="min-w-0 flex-1 rounded-lg bg-transparent px-1 text-base font-semibold text-foreground hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {offers.length > 1 && (
                <button type="button" onClick={() => setOffers((list) => list.filter((_, i) => i !== index))} className="p-1.5 text-text-secondary hover:text-error" aria-label={`Remove ${offer.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {numberFields.map((field) => (
              <label key={field.key} className="block space-y-1">
                <span className="block text-sm font-medium text-foreground">{field.label}</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={offer[field.key] as number}
                  onChange={(e) => update(index, { [field.key]: Number(e.target.value) || 0 })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                />
                {field.hint && <span className="block text-xs text-granite">{field.hint}</span>}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={offer.pfOnCappedWage} onChange={(e) => update(index, { pfOnCappedWage: e.target.checked })} className="accent-primary" />
              PF on ₹15,000 wage cap
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-text-secondary">Tax regime</span>
              <select
                value={offer.regime}
                onChange={(e) => update(index, { regime: e.target.value as Regime })}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              >
                <option value="new">New regime</option>
                <option value="old">Old regime</option>
              </select>
            </label>
            {offer.regime === "old" && (
              <label className="block space-y-1">
                <span className="block text-sm font-medium text-foreground">Other deductions (80C beyond PF, 80D, HRA exemption) ₹</span>
                <input
                  type="number"
                  min={0}
                  value={offer.oldRegimeDeductions}
                  onChange={(e) => update(index, { oldRegimeDeductions: Number(e.target.value) || 0 })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                />
              </label>
            )}
            <div className="mt-2 rounded-2xl border border-border bg-white/5 p-4">
              <p className="text-xs text-text-secondary">Monthly in-hand</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{money(results[index].monthlyInHand)}</p>
            </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {offers.length < MAX_OFFERS && (
        <Button type="button" variant="secondary" onClick={() => setOffers((list) => [...list, blank(list.length + 1)])}>
          <Plus className="h-4 w-4" /> Add offer
        </Button>
      )}

      {winner && (
        <motion.div key={winner.text} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/5 p-4">
          <Trophy className="mt-0.5 h-5 w-5 flex-none text-success" />
          <p className="text-sm text-foreground">{winner.text}</p>
        </motion.div>
      )}

      <div className="glass-card rounded-3xl overflow-x-auto">
        <div className="flex items-center gap-2 px-5 pt-5 pb-2 text-sm font-semibold text-foreground"><Wallet className="h-4 w-4 text-primary" /> Side-by-side breakdown</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3 text-left font-medium text-text-secondary">Breakdown</th>
              {offers.map((offer, i) => <th key={i} className="p-3 text-right font-semibold text-foreground">{offer.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border/60 last:border-0">
                <td className={cn("p-3", row.strong ? "font-semibold text-foreground" : "text-text-secondary")}>{row.label}</td>
                {offers.map((_, i) => {
                  const value = row.value(i);
                  const isBest = row.best !== undefined && offers.length > 1 && Math.round(value) === Math.round(row.best);
                  return (
                    <td key={i} className={cn("p-3 text-right tabular-nums", row.strong && "font-semibold", isBest ? "text-success" : "text-foreground")}>
                      {isBest && <Trophy className="mr-1 inline h-3.5 w-3.5" aria-label="Best" />}
                      {money(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex items-start gap-2 text-xs text-text-secondary">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
        Estimates using {TAX_YEAR} rules, assuming variable pay is paid in full and gratuity sits inside CTC. Actual payslips vary by employer structure. Not tax advice.
      </p>
    </div>
  );
}
