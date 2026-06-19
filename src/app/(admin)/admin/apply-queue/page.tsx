import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { redirect } from "next/navigation";
import { ApplyQueueClient } from "./client";

export const metadata = {
  title: "Apply Queue | Admin Portal",
};

export default async function AdminApplyQueuePage() {
  const adminAuth = await requireAdmin();

  if (isAuthError(adminAuth)) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Apply Queue
          </h1>
          <p className="text-text-secondary">
            Manage and process user job applications.
          </p>
        </div>
      </div>

      <ApplyQueueClient adminId={adminAuth.userId} />
    </div>
  );
}
