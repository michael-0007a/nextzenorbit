// src/shared/storage.ts
var defaultSettings = {
  enabled: true,
  apiBaseUrl: "http://localhost:3000"
};
async function getSettings() {
  const stored = await chrome.storage.sync.get(defaultSettings);
  return {
    enabled: Boolean(stored.enabled),
    apiBaseUrl: String(stored.apiBaseUrl || defaultSettings.apiBaseUrl)
  };
}
async function setSettings(partial) {
  await chrome.storage.sync.set(partial);
}

// src/shared/sites.ts
async function sendMessageToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return null;
  }
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    return null;
  }
}

// src/popup/popup.ts
var apiBaseInput = document.getElementById("api-base-url");
var enabledToggle = document.getElementById("toggle-enabled");
var statusEl = document.getElementById("status");
var portalPill = document.getElementById("portal-pill");
var fillButton = document.getElementById("fill-button");
var refreshButton = document.getElementById("refresh-button");
async function loadSettings() {
  const settings = await getSettings();
  apiBaseInput.value = settings.apiBaseUrl;
  enabledToggle.checked = settings.enabled;
}
async function updateStatus() {
  const response = await sendMessageToActiveTab({
    type: "GET_PAGE_STATUS"
  });
  if (!response) {
    portalPill.textContent = "No tab";
    statusEl.textContent = "Open a supported job portal to enable autofill.";
    return;
  }
  portalPill.textContent = response.portal;
  statusEl.textContent = response.supported ? `Detected ${response.fields} field(s). Ready to fill.` : "This portal is not yet supported.";
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
//# sourceMappingURL=popup.js.map
