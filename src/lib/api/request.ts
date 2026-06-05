import type { ApiError, ApiSuccess } from "@/types/api";

export async function fetchJson<T>(
  path: string,
  init?: RequestInit
): Promise<ApiSuccess<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const response = await fetch(url, init);
  const data = (await response.json()) as ApiSuccess<T> | ApiError;

  if (!response.ok || !data.success) {
    const message = data.success ? "Request failed." : data.error.message;
    throw new Error(message);
  }

  return data;
}
