export type ExtensionSettings = {
  enabled: boolean;
  apiBaseUrl: string;
};

export const defaultSettings: ExtensionSettings = {
  enabled: true,
  apiBaseUrl: "https://app.nextzenorbit.com",
};

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.sync.get(defaultSettings);
  return {
    enabled: Boolean(stored.enabled),
    apiBaseUrl: String(stored.apiBaseUrl || defaultSettings.apiBaseUrl),
  };
}

export async function setSettings(partial: Partial<ExtensionSettings>) {
  await chrome.storage.sync.set(partial);
}
