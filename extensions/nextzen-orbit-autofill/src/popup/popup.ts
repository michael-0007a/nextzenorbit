import { getSettings, setSettings } from "../shared/storage";
import { sendMessageToActiveTab } from "../shared/sites";
import type { PageStatusMessage } from "../shared/messages";

const apiBaseInput = document.getElementById("api-base-url") as HTMLInputElement;
const enabledToggle = document.getElementById("toggle-enabled") as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const portalPill = document.getElementById("portal-pill") as HTMLSpanElement;
const fillButton = document.getElementById("fill-button") as HTMLButtonElement;
const refreshButton = document.getElementById("refresh-button") as HTMLButtonElement;

async function loadSettings() {
  const settings = await getSettings();
  apiBaseInput.value = settings.apiBaseUrl;
  enabledToggle.checked = settings.enabled;
}

async function updateStatus() {
  const response = await sendMessageToActiveTab<PageStatusMessage>({
    type: "GET_PAGE_STATUS",
  });

  if (!response) {
    portalPill.textContent = "No tab";
    statusEl.textContent = "Open a supported job portal to enable autofill.";
    return;
  }

  portalPill.textContent = response.portal;
  statusEl.textContent = response.supported
    ? `Detected ${response.fields} field(s). Ready to fill.`
    : "This portal is not yet supported.";
}

apiBaseInput.addEventListener("change", async () => {
  await setSettings({ apiBaseUrl: apiBaseInput.value.trim() });
});

enabledToggle.addEventListener("change", async () => {
  await setSettings({ enabled: enabledToggle.checked });
});

fillButton.addEventListener("click", async () => {
  await sendMessageToActiveTab({ type: "FILL_REQUEST" });
});

refreshButton.addEventListener("click", async () => {
  await updateStatus();
});

async function init() {
  try {
    await loadSettings();
  } catch {
    statusEl.textContent = "Unable to load extension settings.";
    return;
  }

  await updateStatus();
}

void init();
