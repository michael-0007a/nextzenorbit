import { autofillProfileSchema } from "../shared/profile";
import { getSettings } from "../shared/storage";

export async function fetchAutofillProfile() {
  const settings = await getSettings();
  const apiBaseUrl = settings.apiBaseUrl.replace(/\/$/, "");

  const response = await fetch(`${apiBaseUrl}/api/autofill/profile`, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-Extension-Client": "nextzen-orbit",
    },
  });

  const body = await response.json();

  if (!response.ok || !body?.success) {
    return { ok: false, error: body?.error?.message || "Unable to fetch profile." };
  }

  const parsed = autofillProfileSchema.safeParse(body.data);

  if (!parsed.success) {
    return { ok: false, error: "Invalid profile payload." };
  }

  return { ok: true, profile: parsed.data };
}
