import { detectFields as detectGenericFields, selectBestMatches, type FieldMatch, type FieldType } from "./base";

export function detectLeverFields(): Map<FieldType, FieldMatch> {
  const genericMatches = detectGenericFields(document);
  const leverMatches: FieldMatch[] = [...genericMatches];

  // Lever uses specific name attributes
  const nameMap: Record<string, FieldType> = {
    "name": "fullName",
    "email": "email",
    "phone": "phone",
    "org": "experience", // "Current company"
    "urls[LinkedIn]": "linkedinUrl",
    "urls[GitHub]": "githubUrl",
    "urls[Portfolio]": "portfolioUrl",
    "resume": "resume"
  };

  Object.entries(nameMap).forEach(([name, type]) => {
    const element = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement;
    if (element && !element.disabled && element.type !== "hidden") {
      leverMatches.push({
        type,
        element,
        confidence: 10,
        reason: `Matched Lever specific name: ${name}`,
        text: name,
      });
    }
  });

  return selectBestMatches(leverMatches);
}
