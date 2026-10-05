/**
 * Admin Route Guards
 *
 * Shared helpers to verify admin/super_admin roles in API routes.
 * Uses the admin client to bypass RLS and check the users table directly.
 */

import { getCachedUser } from "@/lib/supabase/server";
import { cache } from "react";
import { getRequestAccess } from '@/lib/request-access';
import { apiError, ERROR_CODES } from "@/types/api";
import type { UserRole } from "@/types/database";

export interface AuthenticatedAdmin {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Verify the current user is an admin or super_admin.
 * Returns the user info if authorized, or a Response error.
 */
export const requireAdmin = cache(async (): Promise<AuthenticatedAdmin | Response> => {
  const { user } = await getCachedUser();

  if (!user) {
    return apiError(ERROR_CODES.UNAUTHORIZED, "Please sign in.", 401);
  }

  const access=await getRequestAccess(user.id,user.email||'');
  if(!access.role||access.application!=='approved'||!access.service||!['admin','supervisor_admin','super_admin'].includes(access.role))return apiError(ERROR_CODES.FORBIDDEN,'Admin access required.',403);

  return {
    userId: user.id,
    email: user.email || "",
    role: access.role as UserRole,
  };
});

/**
 * Verify the current user is a super_admin.
 * Returns the user info if authorized, or a Response error.
 */
export async function requireSuperAdmin(): Promise<AuthenticatedAdmin | Response> {
  const result = await requireAdmin();

  if (result instanceof Response) return result;

  if (result.role !== "super_admin") {
    return apiError(ERROR_CODES.FORBIDDEN, "Super admin access required.", 403);
  }

  return result;
}

/**
 * Type guard to check if the result is an error Response.
 */
export function isAuthError(result: AuthenticatedAdmin | Response): result is Response {
  return result instanceof Response;
}
