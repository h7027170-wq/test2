"use client";

import type { Account, AgeRange, Avatar, PublicMember } from "@/types/domain";
import { db, latency, persist, now, type MailItem } from "./store";
import { generateRecoveryCode, hashSecret, newId, normalizeCode } from "@/lib/crypto";
import { nicknameProblem } from "@/lib/nickname";
import { MIN_STRENGTH, passwordStrength } from "@/lib/password";

export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;
const DAY = 86_400_000;

export interface SessionAccount extends PublicMember {
  communities: string[];
  recoveryMethod: "code" | "email" | "none";
  emailVerified: boolean;
  ageRange: AgeRange;
  blocked: string[];
}

function toSession(a: Account): SessionAccount {
  return {
    id: a.id,
    nickname: a.nickname,
    avatar: a.avatar,
    role: a.role,
    communities: a.communities,
    recoveryMethod: a.recoveryEmail ? "email" : a.recoveryCodeHash ? "code" : "none",
    emailVerified: a.emailVerified,
    ageRange: a.ageRange,
    blocked: a.blocked,
  };
}

export async function currentAccount(): Promise<Account | null> {
  const d = await db();
  if (!d.session) return null;
  if (d.session.expiresAt < Date.now()) {
    d.session = null;
    persist();
    return null;
  }
  return d.accounts.find((a) => a.id === d.session!.accountId && !a.suspended) ?? null;
}

/** Mirrors GET /api/auth/me. */
export async function me(): Promise<SessionAccount | null> {
  const a = await currentAccount();
  return a ? toSession(a) : null;
}

export async function requireAccount(): Promise<Account> {
  const a = await currentAccount();
  if (!a) throw new Error("unauthenticated");
  return a;
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  await latency(250);
  const d = await db();
  return !d.accounts.some((a) => a.nickname.toLowerCase() === nickname.trim().toLowerCase());
}

export interface SignUpInput {
  communities: string[];
  nickname: string;
  avatar: Avatar;
  ageRange: AgeRange;
  password: string;
  recovery: { type: "code" } | { type: "email"; email: string };
}

export type SignUpResult = { ok: true; recoveryCode?: string; verifyToken?: string } | { ok: false; error: "nickname-taken" | "invalid" };

export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  await latency(500);
  const d = await db();
  const nickname = input.nickname.trim();
  if (nicknameProblem(nickname) || passwordStrength(input.password, nickname) < MIN_STRENGTH || input.communities.length === 0) {
    return { ok: false, error: "invalid" };
  }
  if (!(await isNicknameAvailable(nickname))) return { ok: false, error: "nickname-taken" };

  const recoveryCode = input.recovery.type === "code" ? generateRecoveryCode() : undefined;
  const account: Account = {
    id: newId("m"),
    nickname,
    avatar: input.avatar,
    role: "member", // staff roles are never granted through sign-up
    passwordHash: await hashSecret(nickname, input.password),
    recoveryCodeHash: recoveryCode ? await hashSecret(nickname, normalizeCode(recoveryCode)) : null,
    recoveryEmail: input.recovery.type === "email" ? input.recovery.email.trim() : null,
    emailVerified: false,
    ageRange: input.ageRange,
    communities: input.communities,
    suspended: false,
    blocked: [],
    createdAt: now(),
  };
  d.accounts.push(account);
  d.notifications.push({ id: newId("n"), accountId: account.id, kind: "welcome", read: false, createdAt: now() });
  let verifyToken: string | undefined;
  if (account.recoveryEmail) verifyToken = issueToken(account, "verify");
  d.session = { accountId: account.id, expiresAt: Date.now() + 30 * DAY };
  persist();
  return { ok: true, recoveryCode, verifyToken };

  function issueToken(a: Account, kind: "verify" | "reset") {
    const token = newId("t") + newId("");
    d.tokens.push({ token, accountId: a.id, kind, expiresAt: Date.now() + DAY });
    d.outbox.unshift({ id: newId("mail"), to: a.recoveryEmail!, kind, token, createdAt: now() });
    return token;
  }
}

export type SignInResult =
  | { ok: true; role: SessionAccount["role"] }
  | { ok: false; error: "invalid" }
  | { ok: false; error: "locked"; minutes: number }
  | { ok: false; error: "suspended" };

export async function signIn(nickname: string, password: string, remember: boolean): Promise<SignInResult> {
  await latency(450);
  const d = await db();
  const key = nickname.trim().toLowerCase();
  const state = (d.logins[key] ??= { failures: 0, lockedUntil: null });
  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    return { ok: false, error: "locked", minutes: Math.ceil((state.lockedUntil - Date.now()) / 60_000) };
  }
  const account = d.accounts.find((a) => a.nickname.toLowerCase() === key);
  // Hash even when the account doesn't exist so timing and messages don't reveal which nicknames exist.
  const hash = await hashSecret(nickname.trim(), password);
  if (!account || account.passwordHash !== hash) {
    state.failures += 1;
    if (state.failures >= MAX_FAILURES) {
      state.failures = 0;
      state.lockedUntil = Date.now() + LOCK_MINUTES * 60_000;
      persist();
      return { ok: false, error: "locked", minutes: LOCK_MINUTES };
    }
    persist();
    return { ok: false, error: "invalid" };
  }
  d.logins[key] = { failures: 0, lockedUntil: null };
  if (account.suspended) {
    persist();
    return { ok: false, error: "suspended" };
  }
  d.session = { accountId: account.id, expiresAt: Date.now() + (remember ? 30 * DAY : DAY / 2) };
  persist();
  return { ok: true, role: account.role };
}

export async function signOut() {
  await latency(150);
  const d = await db();
  d.session = null;
  persist();
}

/** Recovery with the one-time code. Returns a fresh code (the old one stops working). */
export async function recoverWithCode(nickname: string, code: string, newPassword: string): Promise<{ ok: true; newCode: string } | { ok: false; error: "invalid" | "weak" }> {
  await latency(500);
  const d = await db();
  const account = d.accounts.find((a) => a.nickname.toLowerCase() === nickname.trim().toLowerCase());
  const codeHash = await hashSecret(nickname.trim(), normalizeCode(code));
  if (!account || !account.recoveryCodeHash || account.recoveryCodeHash !== codeHash) return { ok: false, error: "invalid" };
  if (passwordStrength(newPassword, account.nickname) < MIN_STRENGTH) return { ok: false, error: "weak" };
  const newCode = generateRecoveryCode();
  account.passwordHash = await hashSecret(account.nickname, newPassword);
  account.recoveryCodeHash = await hashSecret(account.nickname, normalizeCode(newCode));
  d.logins[account.nickname.toLowerCase()] = { failures: 0, lockedUntil: null };
  d.session = { accountId: account.id, expiresAt: Date.now() + DAY / 2 };
  persist();
  return { ok: true, newCode };
}

/**
 * The screen always shows the same message, whether or not the nickname has a recovery email.
 * Prototype only: returns the mail generated by this request so the fake inbox can show it.
 */
export async function requestEmailReset(nickname: string): Promise<MailItem | null> {
  await latency(500);
  const d = await db();
  const account = d.accounts.find((a) => a.nickname.toLowerCase() === nickname.trim().toLowerCase());
  if (!account?.recoveryEmail) return null;
  const token = newId("t") + newId("");
  const mail: MailItem = { id: newId("mail"), to: account.recoveryEmail, kind: "reset", token, createdAt: now() };
  d.tokens.push({ token, accountId: account.id, kind: "reset", expiresAt: Date.now() + 3_600_000 });
  d.outbox.unshift(mail);
  persist();
  return mail;
}

export async function resetWithToken(token: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: "expired" | "weak" }> {
  await latency(450);
  const d = await db();
  const t = d.tokens.find((x) => x.token === token && x.kind === "reset");
  const account = t && d.accounts.find((a) => a.id === t.accountId);
  if (!t || !account || t.expiresAt < Date.now()) return { ok: false, error: "expired" };
  if (passwordStrength(newPassword, account.nickname) < MIN_STRENGTH) return { ok: false, error: "weak" };
  account.passwordHash = await hashSecret(account.nickname, newPassword);
  d.tokens = d.tokens.filter((x) => x !== t);
  d.session = { accountId: account.id, expiresAt: Date.now() + DAY / 2 };
  persist();
  return { ok: true };
}

export async function verifyEmail(token: string): Promise<"verified" | "expired"> {
  await latency(400);
  const d = await db();
  const t = d.tokens.find((x) => x.token === token && x.kind === "verify");
  const account = t && d.accounts.find((a) => a.id === t.accountId);
  if (!t || !account || t.expiresAt < Date.now()) return "expired";
  // Idempotent: opening the same link twice (or a re-render) still reports success until it expires.
  account.emailVerified = true;
  persist();
  return "verified";
}

export async function setCommunity(communityId: string, joined: boolean) {
  await latency(250);
  const a = await requireAccount();
  a.communities = joined ? Array.from(new Set([...a.communities, communityId])) : a.communities.filter((c) => c !== communityId);
  persist();
}

export async function regenerateRecoveryCode(): Promise<string> {
  await latency(350);
  const a = await requireAccount();
  const code = generateRecoveryCode();
  a.recoveryCodeHash = await hashSecret(a.nickname, normalizeCode(code));
  persist();
  return code;
}

export async function blockMember(memberId: string) {
  await latency(250);
  const a = await requireAccount();
  if (memberId !== a.id && !a.blocked.includes(memberId)) a.blocked.push(memberId);
  persist();
}

export async function unblockMember(memberId: string) {
  await latency(200);
  const a = await requireAccount();
  a.blocked = a.blocked.filter((id) => id !== memberId);
  persist();
}
