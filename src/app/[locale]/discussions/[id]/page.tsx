"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/types/domain";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar, LiveDot } from "@/components/ui/misc";
import { EmptyState, ErrorState, LoadingBlock, Notice } from "@/components/ui/feedback";
import { BreathingMinute } from "@/components/nafess/breathing";
import { NotFoundView } from "@/components/nafess/not-found";
import { useAsync } from "@/lib/use-async";
import { getRoom, listMessages, sendMessage } from "@/services/rooms";
import { findPii } from "@/lib/pii";
import { cn } from "@/lib/cn";

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, href, relativeTime } = useI18n();
  const { account } = useSession();
  const room = useAsync(() => getRoom(id), [id]);
  const messages = useAsync(() => listMessages(id), [id]);
  const [local, setLocal] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(true);
  const [sendFailed, setSendFailed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const warn = useMemo(() => findPii(draft).length > 0, [draft]);

  useEffect(() => {
    const timer = setTimeout(() => setTyping(false), 6000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [local.length]);

  if (room.state.status === "loading")
    return (
      <div className="container-page py-14">
        <LoadingBlock lines={4} />
      </div>
    );
  if (room.state.status === "error")
    return (
      <div className="container-page py-14">
        <ErrorState onRetry={() => room.reload()} />
      </div>
    );
  const r = room.state.data;
  if (!r) return <NotFoundView body={t("discussions.notFound")} />;
  const all = messages.state.status === "ready" ? [...messages.state.data, ...local] : [];

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
      <section aria-labelledby="room-title" className="flex min-h-[70dvh] flex-col overflow-hidden rounded-xl border border-line bg-surface">
        <header className="flex flex-wrap items-center gap-3 border-b border-line p-4 sm:p-5">
          <Link href={href("/discussions")} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={t("common.back")}>
            <Icon name="arrow" className="rotate-180" directional />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 id="room-title" className="text-xl sm:text-2xl">
              {t(`discussions.rooms.${r.id}.name`)}
            </h1>
            <p className="text-sm text-mute">{t(`communities.list.${r.communityId}.name`)}</p>
          </div>
          {r.live && <LiveDot label={t("discussions.live")} />}
        </header>
        <Notice tone="neutral" className="m-4 mb-0 text-sm">
          {t("discussions.mockNote")}
        </Notice>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5" aria-live="polite" aria-relevant="additions">
          {messages.state.status === "loading" && <LoadingBlock lines={3} />}
          {messages.state.status === "error" && <ErrorState onRetry={() => messages.reload()} />}
          {messages.state.status === "ready" && all.length === 0 && <EmptyState icon="message" title={t("discussions.emptyTitle")} body={t("discussions.emptyBody")} />}
          <ul className="grid gap-3">
            {all.map((m) => (
              <li key={m.id} className={cn("flex items-end gap-2", m.mine && "flex-row-reverse")}>
                <Avatar avatar={m.avatar} size={32} />
                <div className={cn("max-w-[80%] rounded-lg px-4 py-2.5", m.mine ? "rounded-ee-sm bg-primary text-primary-fg" : "rounded-es-sm bg-surface-2")}>
                  {!m.mine && (
                    <p className="text-sm font-semibold" dir="auto">
                      {m.authorNickname}
                    </p>
                  )}
                  <p dir="auto" className="whitespace-pre-line">
                    {m.body}
                  </p>
                  <time className={cn("block text-xs", m.mine ? "text-primary-fg/80" : "text-mute")} dateTime={m.createdAt}>
                    {relativeTime(m.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
          {typing && r.live && all.length > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-mute">
              <span className="flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="animate-blink size-1.5 rounded-full bg-mute" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </span>
              {t("discussions.typing", { name: all[0].authorNickname })}
            </p>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-line p-3 sm:p-4">
          {account ? (
            <form
              className="grid gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                try {
                  const msg = await sendMessage(r.id, draft.trim());
                  setLocal((l) => [...l, msg]);
                  setDraft("");
                  setSendFailed(false);
                } catch {
                  setSendFailed(true);
                }
              }}
            >
              {sendFailed && (
                <p className="text-sm font-medium text-warm-ink" role="alert">
                  {t("common.actionFailed")}
                </p>
              )}
              {warn && (
                <p className="flex items-center gap-2 text-sm font-medium text-warm-ink" role="alert">
                  <Icon name="alert" className="size-4" />
                  {t("discussions.piiWarning")}
                </p>
              )}
              <div className="flex items-end gap-2">
                <label htmlFor="chat-input" className="sr-only">
                  {t("discussions.composer")}
                </label>
                <textarea
                  id="chat-input"
                  rows={1}
                  dir="auto"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder={t("discussions.composer")}
                  maxLength={1000}
                  className="max-h-40 min-h-12 flex-1 resize-none rounded-md border-[1.5px] border-field bg-surface px-4 py-2.5 placeholder:text-placeholder"
                />
                <Button type="submit" icon="send" disabled={!draft.trim()} className="min-h-12">
                  {t("discussions.send")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 p-1">
              <p className="text-ink-2">{t("discussions.guest")}</p>
              <ButtonLink href={href("/signin")} size="sm">
                {t("nav.signIn")}
              </ButtonLink>
            </div>
          )}
        </div>
      </section>
      <aside className="self-start lg:sticky lg:top-28">
        <BreathingMinute compact />
      </aside>
    </div>
  );
}
