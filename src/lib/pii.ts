// Detects details that could identify a member. Any match holds the post for a moderator.
export type PiiKind = "phone" | "email" | "handle" | "link" | "name" | "address";

export interface PiiMatch {
  kind: PiiKind;
  start: number;
  end: number;
  text: string;
}

const patterns: { kind: PiiKind; re: RegExp }[] = [
  { kind: "email", re: /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu },
  // Algerian and international phone shapes: 0555 12 34 56, +213 555 123 456, 05-55-12-34-56
  { kind: "phone", re: /(?:\+|00)?\d[\d\s.\-()]{7,}\d/g },
  { kind: "link", re: /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|dz|fr|net|org|io|me|ly)\b\S*/giu },
  { kind: "handle", re: /(?<![\p{L}\p{N}.])@[\p{L}\p{N}_.]{2,}/gu },
  {
    kind: "name",
    re: /\b(?:my name is|i am called|je m'appelle|je m’appelle|mon nom est)\s+\p{L}+|(?:اسمي|إسمي|سميتي)\s+\p{L}+/giu,
  },
  {
    kind: "address",
    re: /\b\d{1,4}\s*,?\s*(?:rue|avenue|bd|boulevard|street|st\.|road|cité|cite)\s+\p{L}+|(?:حي|شارع|نهج)\s+\p{L}+\s+(?:رقم\s*)?\d+/giu,
  },
];

export function findPii(text: string): PiiMatch[] {
  const found: PiiMatch[] = [];
  for (const { kind, re } of patterns) {
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      // Phone pattern must contain at least 8 digits to avoid matching years or counts.
      if (kind === "phone" && m[0].replace(/\D/g, "").length < 8) continue;
      if (found.some((f) => start < f.end && end > f.start)) continue;
      found.push({ kind, start, end, text: m[0] });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

export function redactPii(text: string, replacement = "[removed]"): string {
  let out = "";
  let cursor = 0;
  for (const m of findPii(text)) {
    out += text.slice(cursor, m.start) + replacement;
    cursor = m.end;
  }
  return out + text.slice(cursor);
}
