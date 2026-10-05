import { cache } from "react";
import { headers } from "next/headers";
import { getAccountAccess } from "@/lib/account-access";
import { ACCESS_HEADER, verifyAccess } from "@/lib/access-envelope";

export const getRequestAccess = cache(async (userId: string, email = "") => {
  const requestHeaders = await headers();
  const verified = await verifyAccess(requestHeaders.get(ACCESS_HEADER), userId, requestHeaders.get("x-next-pathname") ?? "");
  return verified ?? getAccountAccess(userId, email);
});
