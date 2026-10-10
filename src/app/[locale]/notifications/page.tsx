"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { MemberGate, PageIntro } from "@/components/nafess/content";
import { useAsync } from "@/lib/use-async";
import { listNotifications, markAllRead } from "@/services/notifications";
import type { NotificationKind } from "@/types/domain";
import { cn } from "@/lib/cn";

const icons: Record<NotificationKind, IconName> = { reply: "message", reaction: "heart", approved: "check", rejected: "info", welcome: "sparkle" };

export default function NotificationsPage() {
  const { t, href, relativeTime } = useI18n();
  const { account, status, refresh } = useSession();
  const list = useAsync(() => (account ? listNotifications() : Promise.resolve([])), [account?.id]);

  if (status === "ready" && !account) return <MemberGate title={t("notifications.title")} body={t("story.guestPrompt")} />;
  const hasUnread = list.state.status === "ready" && list.state.data.some((n) => !n.read);

  return (
    <>
      <PageIntro title={t("notifications.title")}>
        {hasUnread && (
          <Button
            variant="secondary"
            size="sm"
            icon="check"
            className="mt-5"
            onClick={async () => {
              await markAllRead();
              await Promise.all([list.reload(true), refresh()]);
            }}
          >
            {t("notifications.markAll")}
          </Button>
        )}
      </PageIntro>
      <div className="container-page max-w-3xl! pb-10">
        {(status === "loading" || list.state.status === "loading") && <LoadingBlock lines={4} />}
        {list.state.status === "error" && <ErrorState onRetry={() => list.reload()} />}
        {status === "ready" &&
          list.state.status === "ready" &&
          (list.state.data.length ? (
            <ul className="grid gap-2">
              {list.state.data.map((n) => {
                const text = t(`notifications.kinds.${n.kind}`, { name: n.actorNickname ?? "" });
                const inner = (
                  <>
                    <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full", n.read ? "bg-surface-2 text-ink-2" : "bg-primary-soft text-primary-ink")}>
                      <Icon name={icons[n.kind]} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block", !n.read && "font-semibold")}>{text}</span>
                      <time className="text-sm text-mute" dateTime={n.createdAt}>
                        {relativeTime(n.createdAt)}
                      </time>
                    </span>
                    {!n.read && (
                      <span className="flex items-center gap-1.5 text-sm text-primary-ink">
                        <span className="size-2.5 rounded-full bg-primary" aria-hidden />
                        <span className="sr-only sm:not-sr-only">{t("notifications.unread")}</span>
                      </span>
                    )}
                  </>
                );
                const cls = cn("flex items-center gap-4 rounded-md border p-4", n.read ? "border-line bg-surface" : "border-primary/40 bg-surface");
                return (
                  <li key={n.id}>
                    {n.storyId ? (
                      <Link href={href(`/stories/${n.storyId}`)} className={cn(cls, "hover:bg-surface-2")}>
                        {inner}
                      </Link>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon="bell" title={t("notifications.emptyTitle")} body={t("notifications.emptyBody")} />
          ))}
      </div>
    </>
  );
}
