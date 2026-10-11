import { PageHeader } from "@/components/layout/page-header";
import { OfferCompare } from "@/components/offers/offer-compare";

export default function OffersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Offer Compare" description="See what each CTC really pays per month, and compare up to three offers side by side." />
      <OfferCompare />
    </div>
  );
}
