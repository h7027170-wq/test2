"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";
import { Button } from "./button";
import { useI18n } from "@/components/providers/i18n";

export function Notice({ tone = "info", title, children, icon, className }: { tone?: "info" | "warm" | "success" | "neutral"; title?: string; children?: ReactNode; icon?: IconName; className?: string }) {
  const styles = {
    info: "bg-sky-soft text-sky-ink",
    warm: "bg-warm-soft text-warm-ink",
    success: "bg-sage-soft text-sage-ink",
    neutral: "bg-surface-2 text-ink-2",
  }[tone];
  const defaultIcon: IconName = tone === "warm" ? "alert" : tone === "success" ? "check" : "info";
  return (
    <div className={cn("flex gap-3 rounded-md px-4 py-3.5", styles, className)}>
      <Icon name={icon ?? defaultIcon} className="mt-1" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon = "sparkle", title, body, action }: { icon?: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-field/60 px-6 py-12 text-center">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
        <Icon name={icon} className="size-6" />
      </span>
      <p className="font-display text-xl font-semibold">{title}</p>
      {body && <p className="mt-2 max-w-md text-ink-2">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, title, body }: { onRetry?: () => void; title?: string; body?: string }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center rounded-lg bg-warm-soft px-6 py-10 text-center text-warm-ink">
      <Icon name="wind" className="mb-3 size-8" />
      <p className="font-display text-xl font-semibold">{title ?? t("common.errorTitle")}</p>
      <p className="mt-2 max-w-md">{body ?? t("common.errorBody")}</p>
      {onRetry && (
        <Button variant="secondary" icon="refresh" className="mt-5" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("animate-shimmer block rounded-md", className)} />;
}

export function StoryListSkeleton({ count = 3 }: { count?: number }) {
  const { t } = useI18n();
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        {t("common.loading")}
      </span>
      <div className="grid gap-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-surface p-6">
            <Skeleton className="h-6 w-28 rounded-pill" />
            <Skeleton className="mt-4 h-7 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  const { t } = useI18n();
  return (
    <div aria-busy="true" className="grid gap-3">
      <span className="sr-only" role="status">
        {t("common.loading")}
      </span>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-5", i % 2 ? "w-4/6" : "w-full")} />
      ))}
    </div>
  );
}
