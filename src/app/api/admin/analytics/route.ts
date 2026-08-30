import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { apiError, apiSuccess, ERROR_CODES } from "@/types/api";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

    // Check if user is supervisor or super admin to see detailed stats
    if (auth.role === "admin") {
      return apiError(ERROR_CODES.FORBIDDEN, "Supervisor or Super Admin access required.", 403);
    }

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("id");

    if (!adminId) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, "Admin ID is required.");
    }

    const admin = createAdminClient();

    // Get basic admin info
    const { data: adminData } = await admin
      .from("users")
      .select("id, email, role, created_at, profile:profiles!profiles_user_id_fkey(full_name)")
      .eq("id", adminId)
      .single();

    if (!adminData) {
      return apiError(ERROR_CODES.NOT_FOUND, "Admin not found.");
    }

    // Get all clients assigned to this admin
    const { data: clientsRaw, error: clientsError } = await admin
      .from("profiles")
      .select(`
        user_id,
        full_name,
        users!profiles_user_id_fkey(email)
      `)
      .eq("assigned_admin_id", adminId);

    if (clientsError) throw clientsError;

    // Get job queue records claimed by this admin (detailed)
    const { data: jobData, error: jobError } = await admin
      .from("job_queue")
      .select("id, title, company, status, applied_at, created_at, user_id, job_url")
      .eq("claimed_by", adminId)
      .order("created_at", { ascending: false });

    if (jobError) throw jobError;

    // Build client map
    const clientMap: Record<string, { id: string, name: string, email: string, applied: number, pending: number, failed: number }> = {};
    (clientsRaw || []).forEach((c: any) => {
      clientMap[c.user_id] = {
        id: c.user_id,
        name: c.full_name || "Unknown",
        email: Array.isArray(c.users) ? c.users[0]?.email : c.users?.email || "",
        applied: 0,
        pending: 0,
        failed: 0,
      };
    });

    // Process jobs for monthly and client stats
    const monthlyStats: Record<string, { applied: number, failed: number, pending: number }> = {};
    
    (jobData || []).forEach(job => {
      // Monthly stats
      const dateString = job.applied_at || job.created_at;
      if (dateString) {
        const date = new Date(dateString);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { applied: 0, failed: 0, pending: 0 };
        
        if (job.status === "applied") monthlyStats[monthKey].applied++;
        if (job.status === "failed") monthlyStats[monthKey].failed++;
        if (job.status === "pending" || job.status === "processing") monthlyStats[monthKey].pending++;
      }

      // Client stats
      if (clientMap[job.user_id]) {
        if (job.status === "applied") clientMap[job.user_id].applied++;
        if (job.status === "failed") clientMap[job.user_id].failed++;
        if (job.status === "pending" || job.status === "processing") clientMap[job.user_id].pending++;
      }
    });

    // Convert to arrays
    const monthlyData = Object.keys(monthlyStats)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({ month: key, ...monthlyStats[key] }));

    const clientsData = Object.values(clientMap).sort((a, b) => b.applied - a.applied);

    return NextResponse.json(apiSuccess({
      admin: {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        created_at: adminData.created_at,
        name: Array.isArray(adminData.profile) ? adminData.profile[0]?.full_name : adminData.profile?.full_name || adminData.email,
      },
      currentClients: clientsRaw?.length || 0,
      monthlyData,
      clientsData,
      allJobs: jobData || []
    }));
  } catch (err) {
    console.error("Admin Analytics GET error:", err);
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch detailed analytics.");
  }
}
