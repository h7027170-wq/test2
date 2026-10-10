"use client";

import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorState, StoryListSkeleton } from "@/components/ui/feedback";
import { MemberGate, PageIntro, StoryCard } from "@/components/nafess/content";
import { useAsync } from "@/lib/use-async";
import { listSaved } from "@/services/content";

export default function SavedPage() {
  const { t, href } = useI18n();
  const { account, status } = useSession();
  const saved = useAsync(() => (account ? listSaved() : Promise.resolve([])), [account?.id]);

  if (status === "ready" && !account) return <MemberGate title={t("saved.title")} body={t("story.guestPrompt")} />;
  return (
    <>
      <PageIntro title={t("saved.title")} lead={t("saved.lead")} />
      <div className="container-page max-w-3xl! pb-10">
        {(status === "loading" || saved.state.status === "loading") && <StoryListSkeleton />}
        {saved.state.status === "error" && <ErrorState onRetry={() => saved.reload()} />}
        {status === "ready" &&
          saved.state.status === "ready" &&
          (saved.state.data.length ? (
            <ul className="grid gap-4">
              {saved.state.data.map((s) => (
                <li key={s.id}>
                  <StoryCard story={s} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="bookmark"
              title={t("saved.emptyTitle")}
              body={t("saved.emptyBody")}
              action={<ButtonLink href={href("/communities")}>{t("saved.browse")}</ButtonLink>}
            />
          ))}
      </div>
    </>
  );
}
