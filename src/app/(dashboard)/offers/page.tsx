import { Scale } from "lucide-react";
import { FeatureHero } from "@/components/layout/feature-hero";
import { OfferCompare } from "@/components/offers/offer-compare";

export default function OffersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <FeatureHero icon={Scale} title="Offer Compare" description="See what each CTC really pays per month after PF and tax, and compare up to three offers side by side." />
      <OfferCompare />
    </div>
  );
}
