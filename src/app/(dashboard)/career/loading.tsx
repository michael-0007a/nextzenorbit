import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function CareerListingLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <PageHeader
        title="Career workspace"
        description="Explore role-based roadmaps, interview prep, and curated learning paths."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} shape="card" />
        ))}
      </div>
    </div>
  );
}
