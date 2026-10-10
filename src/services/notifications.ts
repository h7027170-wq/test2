"use client";

import type { Notification } from "@/types/domain";
import { db, latency, persist } from "./store";
import { currentAccount, requireAccount } from "./auth";

export async function listNotifications(): Promise<Notification[]> {
  await latency();
  const a = await requireAccount();
  return (await db()).notifications.filter((n) => n.accountId === a.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export async function unreadCount(): Promise<number> {
  const a = await currentAccount();
  if (!a) return 0;
  return (await db()).notifications.filter((n) => n.accountId === a.id && !n.read).length;
}

export async function markAllRead() {
  await latency(200);
  const a = await requireAccount();
  for (const n of (await db()).notifications) if (n.accountId === a.id) n.read = true;
  persist();
}
