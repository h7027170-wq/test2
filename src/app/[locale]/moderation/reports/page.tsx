"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { PanelLayout } from "@/components/nafess/panel";
import { useAsync } from "@/lib/use-async";
import { listReports, resolveReport, type ReportView } from "@/services/moderation";

export default function ReportsPage() {
  const { t } = useI18n();
  const { account } = useSession();
  const isStaff = account?.role === "moderator" || account?.role === "admin";
  const reports = useAsync(() => (isStaff ? listReports("open") : Promise.resolve([])), [isStaff]);
  const [version, setVersion] = useState(0);

  return (
    <PanelLayout version={version}>
      {reports.state.status === "loading" && <LoadingBlock lines={4} />}
      {reports.state.status === "error" && <ErrorState onRetry={() => reports.reload()} />}
      {reports.state.status === "ready" &&
        (reports.state.data.length ? (
          <ul className="grid gap-4">
            {reports.state.data.map((r) => (
              <li key={r.id}>
                <ReportRow
                  report={r}
                  onDone={async () => {
                    await reports.reload(true);
                    setVersion((v) => v + 1);
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="check" title={t("moderation.emptyReports")} />
        ))}
    </PanelLayout>
  );
}

function ReportRow({ report, onDone }: { report: ReportView; onDone: () => Promise<void> }) {
  const { t, href, relativeTime } = useI18n();
  const toast = useToast();
  const [action, setAction] = useState<"dismiss" | "remove" | null>(null);
  return (
    <article className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warm">{t(`report.reasons.${report.reason}`)}</Badge>
        <Badge tone="neutral">{report.targetType === "story" ? t("story.kinds.story") : t("story.reply")}</Badge>
        <time className="text-sm text-mute" dateTime={report.createdAt}>
          {relativeTime(report.createdAt)}
        </time>
      </div>
      <p className="mt-3 text-sm text-ink-2">
        {t("moderation.reportedBy", { name: report.reporter })} · {t("moderation.author", { name: report.targetAuthor })}
      </p>
      <blockquote className="mt-3 border-s-[3px] border-field/60 ps-4 whitespace-pre-line" dir="auto">
        {report.targetText}
      </blockquote>
      {report.note && (
        <p className="mt-3 rounded-md bg-surface-2 p-3 text-sm" dir="auto">
          {report.note}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="secondary" icon="check" onClick={() => setAction("dismiss")}>
          {t("moderation.dismiss")}
        </Button>
        <Button variant="danger" icon="trash" onClick={() => setAction("remove")}>
          {t("moderation.remove")}
        </Button>
        <Link href={href(`/stories/${report.storyId}`)} className="ms-auto inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4">
          {t("story.readMore")}
        </Link>
      </div>
      <ConfirmDialog
        open={!!action}
        onClose={() => setAction(null)}
        title={action === "remove" ? t("moderation.removeTitle") : t("moderation.dismiss")}
        confirmLabel={action === "remove" ? t("moderation.remove") : t("moderation.dismiss")}
        variant={action === "remove" ? "danger" : "primary"}
        reasonLabel={t("moderation.removeReason")}
        reasonError={t("moderation.rejectReasonError")}
        onConfirm={async (reason) => {
          if (!action) return;
          await resolveReport(report.id, action, reason);
          toast(action === "remove" ? t("moderation.removed") : t("moderation.dismissed"));
          await onDone();
        }}
      />
    </article>
  );
}
