// Browser-only mock database for the v1 prototype. Screens never touch this directly:
// they go through the service modules, which are the seam where the real API will plug in.
"use client";

import type { Account, Notification, Reply, Report, Story, ReactionKind, Tint, AvatarShape } from "@/types/domain";
import * as seed from "@/data/seed";
import { hashSecret } from "@/lib/crypto";

export interface LoginState {
  failures: number;
  lockedUntil: number | null;
}

export interface Draft {
  communityId: string;
  kind: Story["kind"];
  mood: Story["mood"] | null;
  title: string;
  body: string;
  veil: string | null;
  savedAt: string;
}

export interface MailItem {
  id: string;
  to: string;
  kind: "verify" | "reset";
  token: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  moderatorNickname: string;
  action: "approve" | "reject" | "dismiss" | "remove";
  targetId: string;
  reason?: string;
  createdAt: string;
}

export interface DB {
  version: 1;
  accounts: Account[];
  stories: Story[];
  replies: Reply[];
  saved: Record<string, string[]>;
  notifications: Notification[];
  reports: Report[];
  logins: Record<string, LoginState>;
  session: { accountId: string; expiresAt: number } | null;
  drafts: Record<string, Draft>;
  tokens: { token: string; accountId: string; kind: "verify" | "reset"; expiresAt: number }[];
  outbox: MailItem[];
  audit: AuditEntry[];
}

const KEY = "nafess-db-v1";
let cache: DB | null = null;

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

async function createSeed(): Promise<DB> {
  const accounts: Account[] = await Promise.all(
    seed.members.map(async (m) => ({
      id: m.id,
      nickname: m.nickname,
      avatar: { shape: m.shape as AvatarShape, tint: m.tint as Tint },
      role: m.role,
      passwordHash: await hashSecret(m.nickname, seed.DEMO_PASSWORD),
      recoveryCodeHash: null,
      recoveryEmail: null,
      emailVerified: false,
      ageRange: "25-34" as const,
      communities: m.communities,
      suspended: false,
      blocked: [],
      createdAt: hoursAgo(24 * 90),
    })),
  );
  // One suspended account to demonstrate the sign-in message.
  accounts.push({
    ...accounts[accounts.length - 1],
    id: "m-susp",
    nickname: "demo-suspended",
    passwordHash: await hashSecret("demo-suspended", seed.DEMO_PASSWORD),
    suspended: true,
    communities: [],
  });

  const fakeIds = (n: number, prefix: string) => Array.from({ length: n }, (_, i) => `${prefix}-${i}`);
  const stories: Story[] = seed.stories.map((s) => {
    const reactions = { relate: [], strength: [], helped: [], thanks: [] } as Record<ReactionKind, string[]>;
    for (const [k, n] of Object.entries(s.reactions)) reactions[k as ReactionKind] = fakeIds(n ?? 0, `seed-${k}`);
    const community = seed.communities.find((c) => c.id === s.communityId);
    return {
      id: s.id,
      communityId: s.communityId,
      authorId: s.authorId,
      kind: s.kind,
      mood: s.mood,
      title: s.title,
      body: s.body,
      veil: s.veil ?? null,
      status: s.held ? "held" : "published",
      holdReasons: s.held ? (community?.sensitivity === "high" ? ["sensitive-community"] : ["pii"]) : [],
      reactions,
      createdAt: hoursAgo(s.hoursAgo),
    };
  });
  const replies: Reply[] = seed.replies.map((r) => ({
    id: r.id,
    storyId: r.storyId,
    parentId: r.parentId,
    authorId: r.authorId,
    body: r.body,
    relates: [],
    status: "published",
    createdAt: hoursAgo(r.hoursAgo),
  }));
  return {
    version: 1,
    accounts,
    stories,
    replies,
    saved: { "m-demo": ["s-3"] },
    notifications: [
      { id: "n-1", accountId: "m-demo", kind: "welcome", read: true, createdAt: hoursAgo(24 * 90) },
      { id: "n-2", accountId: "m-demo", kind: "reaction", storyId: "s-3", actorNickname: "quiet-river", read: false, createdAt: hoursAgo(3) },
    ],
    reports: [
      {
        id: "rep-1",
        targetType: "reply",
        targetId: "r-5",
        storyId: "s-3",
        reporterId: "m-4",
        reason: "other",
        note: "Not sure this is okay, please check.",
        status: "open",
        createdAt: hoursAgo(6),
      },
    ],
    logins: {},
    session: null,
    drafts: {},
    tokens: [],
    outbox: [],
    audit: [],
  };
}

export async function db(): Promise<DB> {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === 1) return (cache = parsed);
    }
  } catch {
    // Corrupt or blocked storage: start fresh below.
  }
  cache = await createSeed();
  persist();
  return cache;
}

export function persist() {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  cache = null;
}

/** Simulates network latency, and failures when the URL contains ?simulate=error. */
export async function latency(ms = 350) {
  await new Promise((r) => setTimeout(r, ms));
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("simulate") === "error") {
    throw new Error("simulated-network-error");
  }
}

export function now() {
  return new Date().toISOString();
}
