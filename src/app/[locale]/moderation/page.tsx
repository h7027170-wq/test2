"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Badge, Avatar } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { MoodBadge } from "@/components/nafess/content";
import { PanelLayout } from "@/components/nafess/panel";
import { useAsync } from "@/lib/use-async";
import { approve, auditLog, heldQueue, reject, type QueueItem } from "@/services/moderation";

export default function ModerationPage() {
  const { t, relativeTime } = useI18n();
  const { account } = useSession();
  const isStaff = account?.role === "moderator" || account?.role === "admin";
  const queue = useAsync(() => (isStaff ? heldQueue() : Promise.resolve([])), [isStaff]);
  const audit = useAsync(() => (isStaff ? auditLog() : Promise.resolve([])), [isStaff]);
  const [version, setVersion] = useState(0);
  const after = async () => {
    await Promise.all([queue.reload(true), audit.reload(true)]);
    setVersion((v) => v + 1);
  };

  return (
    <PanelLayout version={version}>
      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
        <section aria-labelledby="queue-h">
          <h2 id="queue-h" className="sr-only">
            {t("moderation.queue")}
          </h2>
          {queue.state.status === "loading" && <LoadingBlock lines={4} />}
          {queue.state.status === "error" && <ErrorState onRetry={() => queue.reload()} />}
          {queue.state.status === "ready" &&
            (queue.state.data.length ? (
              <ul className="grid gap-4">
                {queue.state.data.map((item) => (
                  <li key={item.id}>
                    <QueueRow item={item} onDone={after} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="check" title={t("moderation.emptyQueue")} />
            ))}
        </section>
        <section aria-labelledby="audit-h" className="self-start rounded-lg border border-line bg-surface p-5">
          <h2 id="audit-h" className="text-xl">
            {t("moderation.audit")}
          </h2>
          {audit.state.status === "ready" &&
            (audit.state.data.length ? (
              <ul className="mt-3 grid gap-3 text-sm">
                {audit.state.data.map((a) => (
                  <li key={a.id} className="border-b border-line pb-3 last:border-0">
                    <p>
                      <span className="font-semibold" dir="auto">
                        {a.moderatorNickname}
                      </span>{" "}
                      {t(`moderation.auditActions.${a.action}`)} <span className="font-mono text-mute">{a.targetId}</span>
                    </p>
                    {a.reason && (
                      <p className="mt-0.5 text-ink-2" dir="auto">
                        {a.reason}
                      </p>
                    )}
                    <time className="text-mute" dateTime={a.createdAt}>
                      {relativeTime(a.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-ink-2">{t("moderation.auditEmpty")}</p>
            ))}
        </section>
      </div>
    </PanelLayout>
  );
}

function QueueRow({ item, onDone }: { item: QueueItem; onDone: () => Promise<void> }) {
  const { t, href, relativeTime } = useI18n();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = item.story;
  const original = item.reply ? item.reply.body : s.body;
  const hasPii = item.pii.length > 0;
  const kinds = Array.from(new Set(item.pii.map((p) => p.kind)));

  return (
    <article className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {item.type === "story" ? (
          s.holdReasons.map((r) => (
            <Badge key={r} tone={r === "pii" ? "warm" : "neutral"}>
              {t(`moderation.holdReasons.${r}`)}
            </Badge>
          ))
        ) : (
          <Badge tone="warm">{t("moderation.holdReasons.pii")}</Badge>
        )}
        <Badge tone="neutral">{t(`communities.list.${s.communityId}.name`)}</Badge>
        {item.type === "story" && <MoodBadge mood={s.mood} />}
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-ink-2">
        {!item.reply && <Avatar avatar={s.author.avatar} size={28} />}
        <span dir="auto">{t("moderation.author", { name: item.reply ? (item.replyAuthor ?? "—") : s.author.nickname })}</span>
        <time className="text-mute" dateTime={item.reply?.createdAt ?? s.createdAt}>
          · {relativeTime(item.reply?.createdAt ?? s.createdAt)}
        </time>
      </div>
      <h3 className="mt-3 text-xl" dir="auto">
        {item.reply ? (
          <Link href={href(`/stories/${s.id}`)} className="underline-offset-4 hover:underline">
            {t("moderation.replyTo", { title: s.title })}
          </Link>
        ) : (
          s.title
        )}
      </h3>
      <p className="mt-2 whitespace-pre-line text-ink-2" dir="auto">
        {original}
      </p>
      {hasPii && (
        <div className="mt-4 rounded-md bg-surface-2 p-4">
          <p className="text-sm font-semibold text-warm-ink">{t("moderation.found", { items: kinds.map((k) => t(`write.piiKinds.${k}`)).join(", ") })}</p>
          <p className="mt-2 text-sm font-medium">{t("moderation.willPublish")}</p>
          <p className="mt-1 whitespace-pre-line" dir="auto">
            {item.redacted}
          </p>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          icon="check"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await approve(item.type, item.id);
            toast(t("moderation.approved"));
            await onDone();
          }}
        >
          {hasPii ? t("moderation.approveRedacted") : t("moderation.approve")}
        </Button>
        <Button variant="danger" icon="x" onClick={() => setRejecting(true)}>
          {t("moderation.reject")}
        </Button>
      </div>
      <ConfirmDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title={t("moderation.rejectTitle")}
        confirmLabel={t("moderation.reject")}
        variant="danger"
        reasonLabel={t("moderation.rejectReason")}
        reasonError={t("moderation.rejectReasonError")}
        onConfirm={async (reason) => {
          await reject(item.type, item.id, reason);
          toast(t("moderation.rejected"));
          await onDone();
        }}
      />
    </article>
  );
}
