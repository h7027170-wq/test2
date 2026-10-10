"use client";

import type { Account, Community, HoldReason, ReactionKind, Reply, ReplyView, ReportReason, Story, StoryView, PublicMember } from "@/types/domain";
import { communities as seedCommunities } from "@/data/seed";
import { db, latency, persist, now, type DB, type Draft } from "./store";
import { currentAccount, requireAccount } from "./auth";
import { findPii } from "@/lib/pii";
import { newId } from "@/lib/crypto";

export const LIMITS = { storiesPerDay: 5, repliesPerHour: 30, reportsPerHour: 20 };

const isStaff = (a: Account | null) => a?.role === "moderator" || a?.role === "admin";

function publicMember(d: DB, id: string): PublicMember {
  const a = d.accounts.find((x) => x.id === id);
  return a
    ? { id: a.id, nickname: a.nickname, avatar: a.avatar, role: a.role }
    : { id, nickname: "former-member", avatar: { shape: "cloud", tint: "sand" }, role: "member" };
}

function toView(d: DB, s: Story, viewer: Account | null): StoryView {
  return {
    ...s,
    author: publicMember(d, s.authorId),
    replyCount: d.replies.filter((r) => r.storyId === s.id && r.status === "published").length,
    saved: viewer ? (d.saved[viewer.id] ?? []).includes(s.id) : false,
  };
}

export async function listCommunities(): Promise<Community[]> {
  await latency(250);
  return seedCommunities;
}

export async function getCommunity(id: string): Promise<Community | null> {
  await latency(200);
  return seedCommunities.find((c) => c.id === id) ?? null;
}

export async function listStories(filter: { communityId?: string; kind?: Story["kind"]; limit?: number } = {}): Promise<StoryView[]> {
  await latency();
  const d = await db();
  const viewer = await currentAccount();
  return d.stories
    .filter((s) => s.status === "published")
    .filter((s) => !filter.communityId || s.communityId === filter.communityId)
    .filter((s) => !filter.kind || s.kind === filter.kind)
    .filter((s) => !viewer?.blocked.includes(s.authorId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, filter.limit ?? 50)
    .map((s) => toView(d, s, viewer));
}

/** Held or rejected stories are visible only to their author and to moderators. */
export async function getStory(id: string): Promise<StoryView | null> {
  await latency();
  const d = await db();
  const viewer = await currentAccount();
  const s = d.stories.find((x) => x.id === id);
  if (!s) return null;
  if (s.status !== "published" && s.authorId !== viewer?.id && !isStaff(viewer)) return null;
  if (s.status === "removed" && !isStaff(viewer)) return null;
  if (viewer?.blocked.includes(s.authorId) && !isStaff(viewer)) return null;
  return toView(d, s, viewer);
}

export async function listReplies(storyId: string): Promise<ReplyView[]> {
  await latency(300);
  const d = await db();
  const viewer = await currentAccount();
  const visible = d.replies.filter(
    (r) => r.storyId === storyId && (r.status === "published" || (r.status === "held" && r.authorId === viewer?.id)) && !viewer?.blocked.includes(r.authorId),
  );
  const view = (r: Reply): ReplyView => ({ ...r, author: publicMember(d, r.authorId), children: [] });
  const top = visible.filter((r) => !r.parentId).map(view);
  for (const r of visible.filter((x) => x.parentId)) top.find((t) => t.id === r.parentId)?.children.push(view(r));
  return top.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function toggleReaction(storyId: string, kind: ReactionKind): Promise<Story["reactions"]> {
  await latency(150);
  const a = await requireAccount();
  const d = await db();
  const s = d.stories.find((x) => x.id === storyId);
  if (!s) throw new Error("not-found");
  const list = s.reactions[kind];
  s.reactions[kind] = list.includes(a.id) ? list.filter((x) => x !== a.id) : [...list, a.id];
  if (!list.includes(a.id) && s.authorId !== a.id) {
    d.notifications.push({ id: newId("n"), accountId: s.authorId, kind: "reaction", storyId, actorNickname: a.nickname, read: false, createdAt: now() });
  }
  persist();
  // Fresh object and arrays so React sees the change.
  return Object.fromEntries(Object.entries(s.reactions).map(([k, v]) => [k, [...v]])) as Story["reactions"];
}

export async function toggleSave(storyId: string): Promise<boolean> {
  await latency(150);
  const a = await requireAccount();
  const d = await db();
  const list = (d.saved[a.id] ??= []);
  const saved = !list.includes(storyId);
  d.saved[a.id] = saved ? [storyId, ...list] : list.filter((x) => x !== storyId);
  persist();
  return saved;
}

export async function listSaved(): Promise<StoryView[]> {
  await latency();
  const a = await requireAccount();
  const d = await db();
  return (d.saved[a.id] ?? [])
    .map((id) => d.stories.find((s) => s.id === id))
    .filter((s): s is Story => !!s && s.status === "published" && !a.blocked.includes(s.authorId))
    .map((s) => toView(d, s, a));
}

export type ReplyResult = { ok: true; held: boolean } | { ok: false; error: "rate-limited" | "empty" };

export async function addReply(storyId: string, parentId: string | null, body: string): Promise<ReplyResult> {
  await latency(350);
  const a = await requireAccount();
  const d = await db();
  if (!body.trim()) return { ok: false, error: "empty" };
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  if (d.replies.filter((r) => r.authorId === a.id && r.createdAt > hourAgo).length >= LIMITS.repliesPerHour) return { ok: false, error: "rate-limited" };
  // Only two levels: a reply to a reply attaches to the top-level parent.
  const parent = parentId ? d.replies.find((r) => r.id === parentId) : null;
  const held = findPii(body).length > 0;
  d.replies.push({
    id: newId("r"),
    storyId,
    parentId: parent ? (parent.parentId ?? parent.id) : null,
    authorId: a.id,
    body: body.trim(),
    relates: [],
    status: held ? "held" : "published",
    createdAt: now(),
  });
  const story = d.stories.find((s) => s.id === storyId);
  if (!held && story && story.authorId !== a.id) {
    d.notifications.push({ id: newId("n"), accountId: story.authorId, kind: "reply", storyId, actorNickname: a.nickname, read: false, createdAt: now() });
  }
  persist();
  return { ok: true, held };
}

export async function toggleReplyRelate(replyId: string) {
  await latency(120);
  const a = await requireAccount();
  const d = await db();
  const r = d.replies.find((x) => x.id === replyId);
  if (!r) return;
  r.relates = r.relates.includes(a.id) ? r.relates.filter((x) => x !== a.id) : [...r.relates, a.id];
  persist();
}

export interface NewStory {
  communityId: string;
  kind: Story["kind"];
  mood: Story["mood"];
  title: string;
  body: string;
  veil: string | null;
}

export type CreateStoryResult = { ok: true; id: string; status: "published" | "held"; holdReasons: HoldReason[] } | { ok: false; error: "rate-limited" | "invalid" };

export async function createStory(input: NewStory): Promise<CreateStoryResult> {
  await latency(600);
  const a = await requireAccount();
  const d = await db();
  if (!input.title.trim() || input.body.trim().length < 20) return { ok: false, error: "invalid" };
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  if (d.stories.filter((s) => s.authorId === a.id && s.createdAt > dayAgo).length >= LIMITS.storiesPerDay) return { ok: false, error: "rate-limited" };
  const community = seedCommunities.find((c) => c.id === input.communityId);
  if (!community) return { ok: false, error: "invalid" };
  const holdReasons: HoldReason[] = [];
  if (findPii(`${input.title}\n${input.body}\n${input.veil ?? ""}`).length) holdReasons.push("pii");
  if (community.sensitivity === "high") holdReasons.push("sensitive-community");
  const status = holdReasons.length ? "held" : "published";
  const id = newId("s");
  d.stories.push({
    id,
    communityId: input.communityId,
    authorId: a.id,
    kind: input.kind,
    mood: input.mood,
    title: input.title.trim(),
    body: input.body.trim(),
    veil: input.veil?.trim() || null,
    status,
    holdReasons,
    reactions: { relate: [], strength: [], helped: [], thanks: [] },
    createdAt: now(),
  });
  delete d.drafts[a.id];
  persist();
  return { ok: true, id, status, holdReasons };
}

export async function listMyStories(): Promise<StoryView[]> {
  await latency();
  const a = await requireAccount();
  const d = await db();
  return d.stories
    .filter((s) => s.authorId === a.id && s.status !== "removed")
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt))
    .map((s) => toView(d, s, a));
}

export async function getDraft(): Promise<Draft | null> {
  const a = await currentAccount();
  if (!a) return null;
  return (await db()).drafts[a.id] ?? null;
}

export async function saveDraft(draft: Omit<Draft, "savedAt">): Promise<string> {
  const a = await requireAccount();
  const d = await db();
  const savedAt = now();
  d.drafts[a.id] = { ...draft, savedAt };
  persist();
  return savedAt;
}

export async function discardDraft() {
  const a = await currentAccount();
  if (!a) return;
  delete (await db()).drafts[a.id];
  persist();
}

export async function report(input: { targetType: "story" | "reply"; targetId: string; storyId: string; reason: ReportReason; note: string }) {
  await latency(400);
  const a = await requireAccount();
  const d = await db();
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  if (d.reports.filter((r) => r.reporterId === a.id && r.createdAt > hourAgo).length >= LIMITS.reportsPerHour) return { ok: false as const, error: "rate-limited" as const };
  d.reports.push({ id: newId("rep"), reporterId: a.id, status: "open", createdAt: now(), ...input, note: input.note.slice(0, 500) });
  persist();
  return { ok: true as const };
}
