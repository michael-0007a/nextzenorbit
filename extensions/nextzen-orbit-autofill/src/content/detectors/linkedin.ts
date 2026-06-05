import { detectFields, selectBestMatches } from "./base";

export function detectLinkedInFields() {
  const matches = detectFields(document);
  return selectBestMatches(matches);
}
