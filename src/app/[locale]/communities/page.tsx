"use client";

import { useI18n } from "@/components/providers/i18n";
import { Skeleton, ErrorState, Notice } from "@/components/ui/feedback";
import { CommunityCard, PageIntro } from "@/components/nafess/content";
import { useAsync } from "@/lib/use-async";
import { listCommunities } from "@/services/content";

export default function CommunitiesPage() {
  const { t } = useI18n();
  const { state, reload } = useAsync(() => listCommunities(), []);
  return (
    <>
      <PageIntro title={t("communities.title")} lead={t("communities.lead")}>
        <Notice tone="neutral" className="mt-6 max-w-reading">
          {t("communities.placeholderNote")}
        </Notice>
      </PageIntro>
      <div className="container-page pb-10">
        {state.status === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        )}
        {state.status === "error" && <ErrorState onRetry={() => reload()} />}
        {state.status === "ready" && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.data.map((c) => (
              <li key={c.id} className="grid">
                <CommunityCard community={c} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
