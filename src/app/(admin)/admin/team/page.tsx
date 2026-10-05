export const dynamic='force-dynamic';
import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/team/route";
import AdminTeamPage from "./client";

export default async function Page() {
  const response = await GET(new NextRequest("http://localhost/api/admin/team"));
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error?.message ?? "Unable to load this page.");
  return <AdminTeamPage initialTeam={result.data} />;
}
