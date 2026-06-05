import { fetchAutofillProfile } from "./auth";
import { getSettings, setSettings } from "../shared/storage";
import { messageSchema, type ExtensionMessage } from "../shared/messages";

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  const parsed = messageSchema.safeParse(message);

  if (!parsed.success) {
    sendResponse({ type: "PROFILE_RESPONSE", ok: false, error: "Invalid message." });
    return false;
  }

  const data = parsed.data;

  if (data.type === "GET_SETTINGS") {
    getSettings().then((settings) => sendResponse({ type: "SETTINGS", settings }));
    return true;
  }

  if (data.type === "SET_SETTINGS") {
    setSettings(data.settings).then(async () => {
      const settings = await getSettings();
      sendResponse({ type: "SETTINGS", settings });
    });
    return true;
  }

  if (data.type === "REQUEST_PROFILE") {
    fetchAutofillProfile().then((result) => {
      sendResponse({
        type: "PROFILE_RESPONSE",
        ok: result.ok,
        profile: result.ok ? result.profile : undefined,
        error: result.ok ? undefined : result.error,
      });
    });
    return true;
  }

  if (data.type === "SEND_TELEMETRY") {
    getSettings().then(async (settings) => {
      try {
        await fetch(`${settings.apiBaseUrl}/api/autofill/telemetry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.payload),
        });
      } catch (e) {
        console.error("Failed to send telemetry", e);
      }
    });
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
