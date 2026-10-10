"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/i18n";
import { EmptyState, ErrorState, Notice, Skeleton } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { LiveDot, tintClass } from "@/components/ui/misc";
import { PageIntro } from "@/components/nafess/content";
import { useAsync } from "@/lib/use-async";
import { listRooms } from "@/services/rooms";
import { cn } from "@/lib/cn";

export default function DiscussionsPage() {
  const { t, href } = useI18n();
  const rooms = useAsync(() => listRooms(), []);
  return (
    <>
      <PageIntro title={t("discussions.title")} lead={t("discussions.lead")}>
        <Notice tone="neutral" className="mt-6 max-w-reading">
          {t("discussions.mockNote")}
        </Notice>
      </PageIntro>
      <div className="container-page pb-10">
        {rooms.state.status === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        )}
        {rooms.state.status === "error" && <ErrorState onRetry={() => rooms.reload()} />}
        {rooms.state.status === "ready" && rooms.state.data.length === 0 && <EmptyState icon="message" title={t("discussions.noRoomsTitle")} body={t("discussions.noRoomsBody")} />}
        {rooms.state.status === "ready" && rooms.state.data.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {rooms.state.data.map((r) => (
              <li key={r.id} className="relative flex flex-col gap-3 rounded-lg border border-line bg-surface p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn("inline-flex size-11 items-center justify-center rounded-full", tintClass[r.tint])} aria-hidden>
                    <Icon name="message" />
                  </span>
                  {r.live ? <LiveDot label={t("discussions.live")} /> : <span className="text-sm text-mute">{t("discussions.quiet")}</span>}
                </div>
                <h2 className="text-xl">
                  <Link href={href(`/discussions/${r.id}`)} className="after:absolute after:inset-0 after:rounded-lg">
                    {t(`discussions.rooms.${r.id}.name`)}
                  </Link>
                </h2>
                <p className="text-ink-2">{t(`discussions.rooms.${r.id}.desc`)}</p>
                <p className="mt-auto text-sm text-mute">{t(`communities.list.${r.communityId}.name`)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
