"use client";

// MOCK: there is no chat backend yet. Rooms and messages come from src/data/seed.ts and
// messages a member sends stay in this browser tab only.
import type { ChatMessage, Room } from "@/types/domain";
import { rooms, roomMessages } from "@/data/seed";
import { latency } from "./store";
import { currentAccount } from "./auth";
import { newId } from "@/lib/crypto";

const local: Record<string, ChatMessage[]> = {};

export async function listRooms(): Promise<Room[]> {
  await latency();
  return rooms;
}

export async function getRoom(id: string): Promise<Room | null> {
  await latency(200);
  return rooms.find((r) => r.id === id) ?? null;
}

export async function listMessages(roomId: string): Promise<ChatMessage[]> {
  await latency();
  const seeded = (roomMessages[roomId] ?? []).map((m, i) => ({
    id: `${roomId}-${i}`,
    roomId,
    authorNickname: m.nickname,
    avatar: { shape: m.shape, tint: m.tint },
    body: m.body,
    createdAt: new Date(Date.now() - m.minutesAgo * 60_000).toISOString(),
  }));
  return [...seeded, ...(local[roomId] ?? [])];
}

export async function sendMessage(roomId: string, body: string): Promise<ChatMessage> {
  await latency(200);
  const a = await currentAccount();
  if (!a) throw new Error("unauthenticated");
  const msg: ChatMessage = { id: newId("c"), roomId, authorNickname: a.nickname, avatar: a.avatar, body, mine: true, createdAt: new Date().toISOString() };
  (local[roomId] ??= []).push(msg);
  return msg;
}
