"use client";

/**
 * Payment Method Selector — Client Component
 *
 * Presents the user with a choice between:
 * - Pay in USD ($) via international gateway (Airwallex/Stripe)
 * - Pay in INR (₹) via PayU gateway
 */

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/subscription";
import { formatPrice } from "@/hooks/use-currency";
import { DollarSign, IndianRupee, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanId } from "@/types/database";

export type PaymentMethod = "usd" | "inr";

interface PaymentMethodSelectorProps {
  plan: PlanId;
  open: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  plan,
  open,
  onClose,
  onSelect,
}: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState<PaymentMethod>("usd");
  const planConfig = PLANS[plan];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose Payment Method"
      description="Select how you'd like to pay for your subscription."
      size="md"
    >
      <div className="space-y-4 p-2">
        {/* USD Option */}
        <button
          onClick={() => setSelected("usd")}
          className={cn(
            "w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left",
            selected === "usd"
              ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(255,0,61,0.1)]"
              : "border-border hover:border-primary/40 hover:bg-white/5"
          )}
        >
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
            selected === "usd"
              ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-lg shadow-primary/20"
              : "bg-white/10 text-text-secondary"
          )}>
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">Pay in US Dollars</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                International
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {formatPrice(planConfig.price_usd, "USD")}/month via secure international payment
            </p>
          </div>
        </button>

        {/* INR Option */}
        <button
          onClick={() => setSelected("inr")}
          className={cn(
            "w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left",
            selected === "inr"
              ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(255,0,61,0.1)]"
              : "border-border hover:border-primary/40 hover:bg-white/5"
          )}
        >
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
            selected === "inr"
              ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-lg shadow-primary/20"
              : "bg-white/10 text-text-secondary"
          )}>
            <IndianRupee className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">Pay in Indian Rupees</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                PayU
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {formatPrice(planConfig.price_inr, "INR")}/month via PayU payment gateway
            </p>
          </div>
        </button>

        {/* Security note */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-border/60">
          <Shield className="h-4 w-4 text-success shrink-0" />
          <p className="text-xs text-text-secondary">
            All transactions are secured with bank-level encryption. No payment data is stored on our servers.
          </p>
        </div>

        {/* Continue button */}
        <Button
          variant="primary"
          className="w-full h-12 rounded-full text-base font-semibold"
          onClick={() => onSelect(selected)}
        >
          Continue with {selected === "usd" ? "USD" : "INR"} Payment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Modal>
  );
}
