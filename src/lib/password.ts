export type Strength = 0 | 1 | 2 | 3 | 4;

/** A simple, explainable score: length first, then variety. Minimum accepted is 2 ("fair"). */
export function passwordStrength(pw: string, nickname = ""): Strength {
  if (pw.length < 10) return pw.length === 0 ? 0 : 1;
  if (nickname && pw.toLowerCase().includes(nickname.toLowerCase())) return 1;
  let variety = 0;
  if (/[a-z\p{Ll}]/u.test(pw)) variety++;
  if (/[A-Z\p{Lu}]/u.test(pw)) variety++;
  if (/\d/.test(pw)) variety++;
  if (/[^\p{L}\d]/u.test(pw)) variety++;
  let score = 2;
  if (pw.length >= 14 || variety >= 3) score++;
  if (pw.length >= 16 && variety >= 3) score++;
  return Math.min(score, 4) as Strength;
}

export const MIN_STRENGTH: Strength = 2;
