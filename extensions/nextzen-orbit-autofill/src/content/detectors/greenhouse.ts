import { detectFields as detectGenericFields, selectBestMatches, type FieldMatch, type FieldType } from "./base";

export function detectGreenhouseFields(): Map<FieldType, FieldMatch> {
  const genericMatches = detectGenericFields(document);
  const greenhouseMatches: FieldMatch[] = [...genericMatches];

  // Greenhouse standard fields
  const idMap: Record<string, FieldType> = {
    "first_name": "firstName",
    "last_name": "lastName",
    "email": "email",
    "phone": "phone",
    "resume": "resume",
    "job_application_answers_attributes_1_text_value": "linkedinUrl", // Often custom question 1 is linkedin
  };

  Object.entries(idMap).forEach(([id, type]) => {
    const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
    if (element && !element.disabled && element.type !== "hidden") {
      greenhouseMatches.push({
        type,
        element,
        confidence: 10,
        reason: `Matched Greenhouse standard ID: ${id}`,
        text: id,
      });
    }
  });

  return selectBestMatches(greenhouseMatches);
}
