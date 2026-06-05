export type SupportedPortal = {
  id: string;
  label: string;
  hostPatterns: string[];
};

export const supportedPortals: SupportedPortal[] = [
  {
    id: "workday",
    label: "Workday",
    hostPatterns: ["myworkdayjobs.com"],
  },
  {
    id: "greenhouse",
    label: "Greenhouse",
    hostPatterns: ["greenhouse.io"],
  },
  {
    id: "lever",
    label: "Lever",
    hostPatterns: ["lever.co"],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    hostPatterns: ["linkedin.com"],
  },
  {
    id: "microsoft",
    label: "Microsoft Careers",
    hostPatterns: ["apply.careers.microsoft.com", "careers.microsoft.com"],
  },
];

export function detectPortal(hostname: string): SupportedPortal | null {
  const lower = hostname.toLowerCase();
  return (
    supportedPortals.find((portal) =>
      portal.hostPatterns.some((pattern) => lower.includes(pattern))
    ) ?? null
  );
}

export async function sendMessageToActiveTab<T>(message: unknown): Promise<T | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return null;
  }

  try {
    return (await chrome.tabs.sendMessage(tab.id, message)) as T;
  } catch {
    return null;
  }
}
