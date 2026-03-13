/**
 * Shared API Response Types
 *
 * All API routes return these shapes for consistency.
 */

// ── Success response ──
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ── Error response ──
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ── Union type for route handlers ──
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Result type for internal functions ──
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// ── Helper to create typed responses ──
export function apiSuccess<T>(data: T, meta?: ApiSuccess<T>["meta"]): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): Response {
  const body: ApiError = {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
  return Response.json(body, { status });
}

// ── Common error codes ──
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  SUBSCRIPTION_REQUIRED: "SUBSCRIPTION_REQUIRED",
  TRIAL_EXPIRED: "TRIAL_EXPIRED",
  AI_QUOTA_EXCEEDED: "AI_QUOTA_EXCEEDED",
} as const;

