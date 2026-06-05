import { detectFields, selectBestMatches } from "./base";

export function detectMicrosoftFields() {
  const matches = detectFields(document);
  return selectBestMatches(matches);
}
