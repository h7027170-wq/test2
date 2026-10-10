"use client";

import { use, useState } from "react";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/form";
import { EmptyState, ErrorState, Notice, Skeleton, StoryListSkeleton } from "@/components/ui/feedback";
import { tintClass } from "@/components/ui/misc";
import { Icon } from "@/components/ui/icon";
import { JoinButton, SensitivityBadge, StoryCard } from "@/components/nafess/content";
import { NotFoundView } from "@/components/nafess/not-found";
import { useAsync } from "@/lib/use-async";
import { getCommunity, listStories } from "@/services/content";
import type { StoryKind } from "@/types/domain";
import { cn } from "@/lib/cn";

export default function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, href } = useI18n();
  const { account } = useSession();
  const [kind, setKind] = useState<StoryKind | undefined>();
  const community = useAsync(() => getCommunity(id), [id]);
  const stories = useAsync(() => listStories({ communityId: id, kind }), [id, kind]);

  if (community.state.status === "loading") {
    return (
      <div className="container-page py-14">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="mt-4 h-6 w-full max-w-xl" />
      </div>
    );
  }
  if (community.state.status === "error")
    return (
      <div className="container-page py-14">
        <ErrorState onRetry={() => community.reload()} />
      </div>
    );
  const c = community.state.data;
  if (!c) return <NotFoundView body={t("communities.notFound")} />;
  const name = t(`communities.list.${c.id}.name`);

  return (
    <>
      <div className={cn("border-b border-line", tintClass[c.tint])}>
        <div className="container-page py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-3">
            <SensitivityBadge community={c} />
            <span className="text-sm">{t("communities.members", { n: t("common.placeholderNumber") })}</span>
          </div>
          <h1 className="mt-3 text-3xl text-ink sm:text-4xl">{name}</h1>
          <p className="mt-3 max-w-reading text-lg text-ink-2">{t(`communities.list.${c.id}.desc`)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <JoinButton community={c} />
            {account && (
              <ButtonLink href={href(`/write?community=${c.id}`)} variant="secondary" icon="pen">
                {t("nav.write")}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
      <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="feed">
          <h2 id="feed" className="sr-only">
            {name}
          </h2>
          <div role="group" aria-label={t("communities.filter")} className="mb-5 flex flex-wrap gap-2">
            <Chip selected={!kind} onClick={() => setKind(undefined)}>
              {t("communities.all")}
            </Chip>
            {(["story", "checkin", "win"] as const).map((k) => (
              <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>
                {t(`story.kinds.${k}`)}
              </Chip>
            ))}
          </div>
          {stories.state.status === "loading" && <StoryListSkeleton />}
          {stories.state.status === "error" && <ErrorState onRetry={() => stories.reload()} />}
          {stories.state.status === "ready" &&
            (stories.state.data.length ? (
              <ul className="grid gap-4">
                {stories.state.data.map((s) => (
                  <li key={s.id}>
                    <StoryCard story={s} showCommunity={false} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="pen"
                title={t("communities.emptyTitle")}
                body={t("communities.emptyBody")}
                action={
                  <ButtonLink href={href(account ? `/write?community=${c.id}` : "/signup")} icon="pen">
                    {account ? t("nav.write") : t("nav.signUp")}
                  </ButtonLink>
                }
              />
            ))}
        </section>
        <aside className="self-start">
          <Notice tone={c.sensitivity === "high" ? "warm" : "neutral"} icon={c.sensitivity === "standard" ? "info" : "shield"}>
            {t(`communities.sensitivityHelp.${c.sensitivity}`)}
          </Notice>
          <div className="mt-4 rounded-md border border-line bg-surface p-4 text-ink-2">
            <p className="flex items-start gap-2">
              <Icon name="lifebuoy" className="mt-1 text-warm-ink" />
              <span>{t("crisis.lead")}</span>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
