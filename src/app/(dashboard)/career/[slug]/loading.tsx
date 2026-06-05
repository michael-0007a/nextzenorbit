import { Skeleton } from "@/components/ui/skeleton";

export default function CareerDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <Skeleton shape="card" height="h-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton shape="card" />
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </div>
      <div className="space-y-4">
        <Skeleton shape="heading" width="w-1/3" />
        <Skeleton shape="text" />
        <Skeleton shape="text" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} shape="card" />
        ))}
      </div>
    </div>
  );
}
