import { detectFields as detectGenericFields, selectBestMatches, type FieldMatch, type FieldType } from "./base";

export function detectWorkdayFields(): Map<FieldType, FieldMatch> {
  // First run generic detection
  const genericMatches = detectGenericFields(document);
  
  // Workday often uses data-automation-id
  const elements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
  const workdayMatches: FieldMatch[] = [...genericMatches];

  elements.forEach((element) => {
    if (element.disabled || element.type === "hidden" || element.type === "password") {
      return;
    }

    const autoId = element.getAttribute("data-automation-id")?.toLowerCase() || "";
    let type: FieldType | null = null;

    if (autoId.includes("firstname") || autoId.includes("legalname_first")) type = "firstName";
    else if (autoId.includes("lastname") || autoId.includes("legalname_last")) type = "lastName";
    else if (autoId.includes("email")) type = "email";
    else if (autoId.includes("phone")) type = "phone";
    else if (autoId.includes("linkedin")) type = "linkedinUrl";

    if (type) {
      workdayMatches.push({
        type,
        element,
        confidence: 10, // High confidence for explicit automation IDs
        reason: `Matched Workday automation ID: ${autoId}`,
        text: autoId,
      });
    }
  });

  return selectBestMatches(workdayMatches);
}
