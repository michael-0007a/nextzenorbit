import { redirect } from "next/navigation";

export default function AdminPage() {
  // Redirect to the main workflow page
  redirect("/admin/apply-queue");
}
