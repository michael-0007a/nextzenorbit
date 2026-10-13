/**
 * Models sometimes wrap JSON in code fences or append a note after it, even in JSON mode
 * (seen with Kimi K2.5). Returns the first complete JSON object; throws SyntaxError like JSON.parse.
 */
export function extractJson(raw: string | null | undefined): unknown {
  const text = (raw ?? "").trim();
  try { return JSON.parse(text); } catch { /* fall through to the scan */ }
  const start = text.indexOf("{");
  if (start < 0) throw new SyntaxError("No JSON object in model output");
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new SyntaxError("Incomplete JSON object in model output");
}
