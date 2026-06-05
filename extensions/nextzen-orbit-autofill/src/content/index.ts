import { detectPortal } from "../shared/sites";
import { messageSchema } from "../shared/messages";
import { renderAssistPanel } from "./ui/panel";
import { detectWorkdayFields } from "./detectors/workday";
import { detectGreenhouseFields } from "./detectors/greenhouse";
import { detectLeverFields } from "./detectors/lever";
import { detectLinkedInFields } from "./detectors/linkedin";
import { detectMicrosoftFields } from "./detectors/microsoft";
import { autofillFields } from "./handlers/autofill";
import type { FieldMatch, FieldType } from "./detectors/base";
import type { AutofillProfile } from "../shared/profile";
import { getSettings } from "../shared/storage";

const logPrefix = "[Nextzen Autofill]";

let cachedProfile: AutofillProfile | null = null;
let currentPortal = "Unknown";
let currentFields: Map<FieldType, FieldMatch> = new Map();

function detectFieldsForPortal(portalId: string) {
  switch (portalId) {
    case "workday":
      return detectWorkdayFields();
    case "greenhouse":
      return detectGreenhouseFields();
    case "lever":
      return detectLeverFields();
    case "linkedin":
      return detectLinkedInFields();
    case "microsoft":
      return detectMicrosoftFields();
    default:
      return new Map();
  }
}

function updatePanel(status: "ready" | "working" | "error" | "unsupported", message: string) {
  renderAssistPanel(
    {
      status,
      message,
      portal: currentPortal,
      fields: currentFields.size,
      fieldNames: Array.from(currentFields.keys()),
    },
    {
      onFill: () => void handleFillRequest(),
      onRefresh: () => void refreshDetection(),
    }
  );
}

async function refreshDetection() {
  const portal = detectPortal(window.location.hostname);
  currentPortal = portal?.label ?? "Unsupported";

  if (!portal) {
    currentFields = new Map();
    updatePanel("unsupported", "Portal not supported yet.");
    return;
  }

  currentFields = detectFieldsForPortal(portal.id);

  if (currentFields.size === 0) {
    updatePanel("error", "No fields detected. Try refreshing.");
    return;
  }

  updatePanel("ready", "Ready to fill your application.");
}

async function handleFillRequest() {
  if (currentFields.size === 0) {
    updatePanel("error", "No fields detected.");
    return;
  }

  updatePanel("working", "Fetching profile...");

  const response = (await chrome.runtime.sendMessage({
    type: "REQUEST_PROFILE",
  })) as { ok: boolean; profile?: AutofillProfile; error?: string };

  if (!response?.ok || !response.profile) {
    updatePanel("error", response?.error || "Unable to load profile.");
    return;
  }

  cachedProfile = response.profile;
  autofillFields(currentFields, cachedProfile);
  updatePanel("ready", "Fields filled. Review before submitting.");

  chrome.runtime.sendMessage({
    type: "SEND_TELEMETRY",
    payload: {
      portal: currentPortal,
      url: window.location.href,
      fieldsDetected: currentFields.size,
      fieldNames: Array.from(currentFields.keys()),
      status: "success",
    },
  }).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const parsed = messageSchema.safeParse(message);
  if (!parsed.success) {
    return;
  }

  if (parsed.data.type === "FILL_REQUEST") {
    void handleFillRequest();
    return;
  }

  if (parsed.data.type === "GET_PAGE_STATUS") {
    sendResponse({
      type: "PAGE_STATUS",
      supported: currentFields.size > 0,
      portal: currentPortal,
      fields: currentFields.size,
    });
    return;
  }
});

getSettings()
  .then((settings) => {
    if (!settings.enabled) {
      updatePanel("unsupported", "Autofill is disabled in extension settings.");
      return;
    }

    void refreshDetection();
  })
  .catch(() => {
    console.error(logPrefix, "Failed to load settings.");
  });
