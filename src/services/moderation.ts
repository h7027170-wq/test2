"use client";

import type { Reply, Report, StoryView } from "@/types/domain";
import { db, latency, persist, now, type AuditEntry } from "./store";
import { requireAccount } from "./auth";
import { findPii, redactPii, type PiiMatch } from "@/lib/pii";
import { newId } from "@/lib/crypto";

async function requireStaff() {
  const a = await requireAccount();
  if (a.role !== "moderator" && a.role !== "admin") throw new Error("forbidden");
  return a;
}

export interface QueueItem {
  type: "story" | "reply";
  id: string;
  story: StoryView;
  reply?: Reply;
  replyAuthor?: string;
  pii: PiiMatch[];
  redacted: string;
}

export async function heldQueue(): Promise<QueueItem[]> {
  await latency();
  await requireStaff();
  const d = await db();
  const view = (id: string) => {
    const s = d.stories.find((x) => x.id === id)!;
    const a = d.accounts.find((x) => x.id === s.authorId)!;
    return { ...s, author: { id: a.id, nickname: a.nickname, avatar: a.avatar, role: a.role }, replyCount: 0, saved: false };
  };
  const stories: QueueItem[] = d.stories
    .filter((s) => s.status === "held")
    .map((s) => {
      const text = `${s.title}\n${s.body}`;
      return { type: "story", id: s.id, story: view(s.id), pii: findPii(text), redacted: redactPii(s.body) };
    });
  const replies: QueueItem[] = d.replies
    .filter((r) => r.status === "held")
    .map((r) => ({ type: "reply", id: r.id, story: view(r.storyId), reply: r, replyAuthor: d.accounts.find((a) => a.id === r.authorId)?.nickname, pii: findPii(r.body), redacted: redactPii(r.body) }));
  return [...stories, ...replies].sort((a, b) => (a.reply?.createdAt ?? a.story.createdAt).localeCompare(b.reply?.createdAt ?? b.story.createdAt));
}

async function log(entry: Omit<AuditEntry, "id" | "createdAt">) {
  (await db()).audit.unshift({ id: newId("a"), createdAt: now(), ...entry });
}

/** Approving removes detected identifying details first; the moderator sees the redacted text before confirming. */
export async function approve(type: "story" | "reply", id: string) {
  await latency(350);
  const mod = await requireStaff();
  const d = await db();
  if (type === "story") {
    const s = d.stories.find((x) => x.id === id);
    if (!s) return;
    s.title = redactPii(s.title);
    s.body = redactPii(s.body);
    s.status = "published";
    s.createdAt = now();
    d.notifications.push({ id: newId("n"), accountId: s.authorId, kind: "approved", storyId: s.id, read: false, createdAt: now() });
  } else {
    const r = d.replies.find((x) => x.id === id);
    if (!r) return;
    r.body = redactPii(r.body);
    r.status = "published";
  }
  await log({ moderatorNickname: mod.nickname, action: "approve", targetId: id });
  persist();
}

export async function reject(type: "story" | "reply", id: string, reason: string) {
  await latency(350);
  const mod = await requireStaff();
  const d = await db();
  if (type === "story") {
    const s = d.stories.find((x) => x.id === id);
    if (!s) return;
    s.status = "rejected";
    s.rejectReason = reason;
    d.notifications.push({ id: newId("n"), accountId: s.authorId, kind: "rejected", storyId: s.id, read: false, createdAt: now() });
  } else {
    const r = d.replies.find((x) => x.id === id);
    if (r) r.status = "removed";
  }
  await log({ moderatorNickname: mod.nickname, action: "reject", targetId: id, reason });
  persist();
}

export interface ReportView extends Report {
  targetText: string;
  targetAuthor: string;
  reporter: string;
}

export async function listReports(status: Report["status"] | "all" = "open"): Promise<ReportView[]> {
  await latency();
  await requireStaff();
  const d = await db();
  return d.reports
    .filter((r) => status === "all" || r.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const target = r.targetType === "story" ? d.stories.find((s) => s.id === r.targetId) : d.replies.find((x) => x.id === r.targetId);
      const authorId = target?.authorId;
      return {
        ...r,
        targetText: target ? ("title" in target ? `${target.title} — ${target.body}` : target.body) : "",
        targetAuthor: d.accounts.find((a) => a.id === authorId)?.nickname ?? "—",
        reporter: d.accounts.find((a) => a.id === r.reporterId)?.nickname ?? "—",
      };
    });
}

export async function resolveReport(id: string, action: "dismiss" | "remove", reason: string) {
  await latency(350);
  const mod = await requireStaff();
  const d = await db();
  const r = d.reports.find((x) => x.id === id);
  if (!r) return;
  if (action === "remove") {
    if (r.targetType === "story") {
      const s = d.stories.find((x) => x.id === r.targetId);
      if (s) s.status = "removed";
    } else {
      const reply = d.replies.find((x) => x.id === r.targetId);
      if (reply) reply.status = "removed";
    }
  }
  r.status = action === "remove" ? "actioned" : "dismissed";
  await log({ moderatorNickname: mod.nickname, action, targetId: r.targetId, reason });
  persist();
}

export async function auditLog(): Promise<AuditEntry[]> {
  await latency(200);
  await requireStaff();
  return (await db()).audit.slice(0, 20);
}

export async function queueCounts() {
  const d = await db();
  return {
    held: d.stories.filter((s) => s.status === "held").length + d.replies.filter((r) => r.status === "held").length,
    reports: d.reports.filter((r) => r.status === "open").length,
  };
}
