export type FieldType =
  | "fullName"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "linkedinUrl"
  | "githubUrl"
  | "portfolioUrl"
  | "location"
  | "skills"
  | "education"
  | "experience"
  | "resume";

export type FieldMatch = {
  type: FieldType;
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  confidence: number;
  reason: string;
  text: string;
};

const patternMap: Record<FieldType, RegExp[]> = {
  fullName: [/full\s*name/i, /name\s*\(full\)/i],
  firstName: [/first\s*name/i, /given\s*name/i],
  lastName: [/last\s*name/i, /family\s*name/i, /surname/i],
  email: [/email/i],
  phone: [/phone/i, /mobile/i, /contact\s*number/i],
  linkedinUrl: [/linkedin/i],
  githubUrl: [/github/i],
  portfolioUrl: [/portfolio/i, /website/i, /personal\s*site/i],
  location: [/location/i, /city/i, /state/i],
  skills: [/skills/i, /technologies/i],
  education: [/education/i, /college/i, /university/i],
  experience: [/experience/i, /employment/i],
  resume: [/resume/i, /cv/i, /upload/i],
};

const sensitiveKeywords = [
  "work authorization",
  "employment eligibility",
  "immigration",
  "sponsorship",
  "work permit",
  "visa",
  "citizenship",
  "gender",
  "self-identification",
  "self identification",
  "disability",
  "veteran",
  "military",
  "government",
  "non-compete",
  "non compete",
  "non-disclosure",
  "non disclosure",
  "criminal",
  "conviction",
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function isSensitiveQuestion(text: string) {
  if (!text) {
    return false;
  }
  return sensitiveKeywords.some((keyword) => text.includes(keyword));
}

function getLabelText(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): string {
  const labels = element.labels ? Array.from(element.labels) : [];
  const labelText = labels.map((label) => label.textContent || "").join(" ");
  if (labelText) {
    return normalize(labelText);
  }

  const id = element.getAttribute("id");
  if (id) {
    const label = element.ownerDocument.querySelector(`label[for='${id}']`);
    if (label?.textContent) {
      return normalize(label.textContent);
    }
  }

  const nearestLabel = element.closest("label");
  if (nearestLabel?.textContent) {
    return normalize(nearestLabel.textContent);
  }

  return "";
}

function getAriaReferenceText(
  element: Element,
  attribute: "aria-labelledby" | "aria-describedby"
): string {
  const ids = element.getAttribute(attribute);
  if (!ids) {
    return "";
  }

  return ids
    .split(/\s+/)
    .map((id) => element.ownerDocument.getElementById(id)?.textContent || "")
    .join(" ");
}

function getInputTypeHint(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
) {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    if (["email", "tel", "url"].includes(type)) {
      return type;
    }
  }
  return "";
}

function getCandidateText(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): string {
  const attrs = [
    element.getAttribute("name"),
    element.getAttribute("placeholder"),
    element.getAttribute("aria-label"),
    element.getAttribute("autocomplete"),
    element.getAttribute("data-testid"),
    element.getAttribute("data-test"),
    getInputTypeHint(element),
  ];

  const ariaText = `${getAriaReferenceText(element, "aria-labelledby")} ${getAriaReferenceText(
    element,
    "aria-describedby"
  )}`.trim();

  return normalize(`${attrs.filter(Boolean).join(" ")} ${ariaText}`.trim());
}

function scoreMatch(text: string, patterns: RegExp[]) {
  let score = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      score += 1;
    }
  }
  return score;
}

function collectElements(root: Document | HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea"
    )
  ).filter(
    (element) =>
      !element.disabled &&
      element.type !== "hidden" &&
      element.type !== "password"
  );
}

function detectFieldsInRoot(root: Document | HTMLElement): FieldMatch[] {
  const elements = collectElements(root);
  const matches: FieldMatch[] = [];

  elements.forEach((element) => {
    const labelText = getLabelText(element);
    const candidateText = `${getCandidateText(element)} ${labelText}`.trim();

    if (isSensitiveQuestion(candidateText)) {
      return;
    }

    (Object.keys(patternMap) as FieldType[]).forEach((type) => {
      const score = scoreMatch(candidateText, patternMap[type]);
      const threshold = ["experience", "education", "skills"].includes(type) ? 2 : 1;
      if (score >= threshold) {
        matches.push({
          type,
          element,
          confidence: score,
          reason: `Matched ${type}`,
          text: candidateText,
        });
      }
    });
  });

  return matches;
}

export function detectFields(root: Document | HTMLElement): FieldMatch[] {
  const matches = detectFieldsInRoot(root);

  const frames = Array.from(root.querySelectorAll<HTMLIFrameElement>("iframe"));
  frames.forEach((frame) => {
    try {
      const doc = frame.contentDocument;
      if (doc) {
        matches.push(...detectFieldsInRoot(doc));
      }
    } catch {
      // Ignore cross-origin frames.
    }
  });

  return matches;
}

export function selectBestMatches(matches: FieldMatch[]) {
  const best = new Map<FieldType, FieldMatch>();

  matches.forEach((match) => {
    const current = best.get(match.type);
    if (!current || match.confidence > current.confidence) {
      best.set(match.type, match);
    }
  });

  return best;
}
