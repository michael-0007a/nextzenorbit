import { PageHeader } from "@/components/layout/page-header";
import { CareerExplorer } from "@/components/career";
import { listCareers } from "@/services/careers-service";

export const dynamic = "force-dynamic";

interface CareerListingPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function CareerListingPage({ searchParams }: CareerListingPageProps) {
  const result = await listCareers();
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialQuery = resolvedParams?.q ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <PageHeader
        title="Career workspace"
        description="Explore role-based roadmaps, interview prep, and curated learning paths."
      />

      {!result.ok ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 p-10 text-center">
          <p className="text-sm text-text-secondary">
            Unable to load careers right now. Please try again.
          </p>
        </div>
      ) : (
        <CareerExplorer careers={result.data} initialQuery={initialQuery} />
      )}
    </div>
  );
}
