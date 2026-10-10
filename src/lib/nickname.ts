export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 24;

export type NicknameProblem = "short" | "long" | "chars" | "looks-like-contact" | null;

/** Nicknames: letters (any script), digits, dash, underscore, dot. No phone-number or email lookalikes. */
export function nicknameProblem(value: string): NicknameProblem {
  const v = value.trim();
  if (v.length < NICKNAME_MIN) return "short";
  if (v.length > NICKNAME_MAX) return "long";
  if (!/^[\p{L}\p{N}_.-]+$/u.test(v)) return "chars";
  if ((v.match(/\d/g) ?? []).length >= 6 || v.includes("@")) return "looks-like-contact";
  return null;
}
