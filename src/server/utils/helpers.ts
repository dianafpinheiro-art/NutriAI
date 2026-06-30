export const MAX_BASE64_SIZE_BYTES = 5 * 1024 * 1024;

export function validateBase64Size(base64: string): boolean {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  try {
    const buf = Buffer.from(clean, "base64");
    return buf.length <= MAX_BASE64_SIZE_BYTES;
  } catch {
    return false;
  }
}

export function sanitizeString(input: string, maxLength: number): string {
  if (!input) return "";
  let s = input.slice(0, maxLength);
  s = s.replace(/`/g, "'");
  return s;
}

export function parseCleanJson(text: string): unknown {
  let cleanText = text.trim();
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```[a-zA-Z]*\s*/, "");
    cleanText = cleanText.replace(/\s*```$/, "");
  }
  return JSON.parse(cleanText.trim());
}
