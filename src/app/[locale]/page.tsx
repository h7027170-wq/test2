"use client";

import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SectionHeading } from "@/components/ui/misc";
import { ErrorState, StoryListSkeleton, Skeleton, EmptyState } from "@/components/ui/feedback";
import { CommunityCard, StoryCard } from "@/components/nafess/content";
import { useAsync } from "@/lib/use-async";
import { listCommunities, listStories } from "@/services/content";

export default function HomePage() {
  const { t, href } = useI18n();
  const { account } = useSession();
  const stories = useAsync(() => listStories({ limit: 4 }), []);
  const communities = useAsync(() => listCommunities(), []);

  return (
    <>
      <section className="relative overflow-clip">
        <div aria-hidden className="pointer-events-none absolute -top-40 end-[-10%] size-[520px] rounded-full bg-primary-soft opacity-70 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 start-[-10%] size-[420px] rounded-full bg-lilac-soft opacity-60 blur-3xl" />
        <div className="container-page relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="tag-label text-primary-ink">{t("home.eyebrow")}</p>
            <h1 className="mt-4 text-4xl sm:text-5xl">
              <span className="text-gradient">{t("home.title")}</span>
            </h1>
            <p className="mt-6 max-w-reading text-lg text-ink-2 sm:text-xl">{t("home.lead")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {account ? (
                <ButtonLink href={href("/write")} size="lg" icon="pen">
                  {t("home.ctaMember")}
                </ButtonLink>
              ) : (
                <ButtonLink href={href("/signup")} size="lg" iconEnd="arrow">
                  {t("home.ctaGuest")}
                </ButtonLink>
              )}
              <ButtonLink href={href("/communities")} size="lg" variant="secondary">
                {t("home.secondary")}
              </ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4" aria-label={t("home.stats.note")}>
            {(["members", "stories", "communities"] as const).map((k) => (
              <div key={k} className="rounded-lg border border-line bg-surface p-4 text-center sm:p-6">
                <p className="font-mono text-3xl font-medium sm:text-4xl">{t("common.placeholderNumber")}</p>
                <p className="mt-1 text-sm text-ink-2">{t(`home.stats.${k}`)}</p>
              </div>
            ))}
            <p className="col-span-3 text-center text-sm text-mute">{t("home.stats.note")}</p>
          </div>
        </div>
      </section>

      <section className="container-page py-10" aria-labelledby="how">
        <SectionHeading id="how" title={t("home.how.title")} />
        <ol className="grid gap-4 md:grid-cols-3">
          {(["step1", "step2", "step3"] as const).map((s, i) => (
            <li key={s} className="rounded-lg border border-line bg-surface p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-ink">{i + 1}</span>
              <h3 className="mt-4 text-xl">{t(`home.how.${s}.title`)}</h3>
              <p className="mt-2 text-ink-2">{t(`home.how.${s}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page py-10" aria-labelledby="communities">
        <SectionHeading
          id="communities"
          title={t("home.communitiesTitle")}
          action={
            <ButtonLink href={href("/communities")} variant="ghost" iconEnd="arrow">
              {t("common.seeAll")}
            </ButtonLink>
          }
        />
        {communities.state.status === "loading" && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        )}
        {communities.state.status === "error" && <ErrorState onRetry={() => communities.reload()} />}
        {communities.state.status === "ready" && (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {communities.state.data.slice(0, 5).map((c) => (
              <li key={c.id} className="grid">
                <CommunityCard community={c} compact />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="container-page grid gap-8 py-10 lg:grid-cols-[1.5fr_1fr]" aria-labelledby="recent">
        <div>
          <SectionHeading id="recent" title={t("home.storiesTitle")} />
          {stories.state.status === "loading" && <StoryListSkeleton count={2} />}
          {stories.state.status === "error" && <ErrorState onRetry={() => stories.reload()} />}
          {stories.state.status === "ready" &&
            (stories.state.data.length ? (
              <ul className="grid gap-4">
                {stories.state.data.map((s) => (
                  <li key={s.id}>
                    <StoryCard story={s} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t("communities.emptyTitle")} body={t("communities.emptyBody")} />
            ))}
        </div>
        <aside className="self-start rounded-xl bg-primary-soft p-6 text-primary-ink sm:p-8 lg:sticky lg:top-28">
          <Icon name="shield" className="size-8" />
          <h2 className="mt-4 text-2xl">{t("home.safety.title")}</h2>
          <p className="mt-3">{t("home.safety.body")}</p>
          <ButtonLink href={href("/guidelines")} variant="ghost" iconEnd="arrow" className="mt-4 text-primary-ink">
            {t("home.safety.link")}
          </ButtonLink>
        </aside>
      </section>
    </>
  );
}
