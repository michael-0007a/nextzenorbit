export const dynamic='force-dynamic';
import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/users/[id]/route";
import AdminUserDetailsPage from "./client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await GET(new NextRequest(`http://localhost/api/admin/users/${id}`), { params });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error?.message ?? "Unable to load this page.");
  return <AdminUserDetailsPage key={id} params={params} initialUser={result.data} />;
}
