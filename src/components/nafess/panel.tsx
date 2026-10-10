"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { LoadingBlock } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { MemberGate } from "./content";
import { queueCounts } from "@/services/moderation";
import { cn } from "@/lib/cn";

/** Moderator layout: tabs for queue and reports. Members and guests see a refusal, never the data. */
export function PanelLayout({ children, version }: { children: ReactNode; version: number }) {
  const { t, href } = useI18n();
  const { account, status } = useSession();
  const pathname = usePathname();
  const [counts, setCounts] = useState<{ held: number; reports: number } | null>(null);
  const isStaff = account?.role === "moderator" || account?.role === "admin";

  useEffect(() => {
    if (isStaff) void queueCounts().then(setCounts);
  }, [isStaff, version]);

  if (status === "loading")
    return (
      <div className="container-page py-14">
        <LoadingBlock />
      </div>
    );
  if (!account) return <MemberGate title={t("moderation.title")} body={t("moderation.forbidden")} />;
  if (!isStaff)
    return (
      <div className="container-page py-14">
        <div className="mx-auto max-w-lg rounded-xl border border-line bg-surface p-8 text-center">
          <Icon name="shield" className="mx-auto size-8 text-ink-2" />
          <h1 className="mt-4 text-2xl">{t("moderation.title")}</h1>
          <p className="mt-2 text-ink-2">{t("moderation.forbidden")}</p>
        </div>
      </div>
    );

  const tabs = [
    { href: "/moderation", label: t("moderation.queue"), count: counts?.held },
    { href: "/moderation/reports", label: t("moderation.reports"), count: counts?.reports },
  ];

  return (
    <div className="container-page py-10">
      <h1 className="flex items-center gap-3 text-3xl sm:text-4xl">
        <Icon name="shield" className="size-8 text-primary-ink" />
        {t("moderation.title")}
      </h1>
      <nav aria-label={t("moderation.title")} className="mt-6 border-b border-line">
        <ul className="-mb-px flex gap-1">
          {tabs.map((tab) => {
            const active = pathname === href(tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={href(tab.href)}
                  aria-current={active ? "page" : undefined}
                  className={cn("inline-flex min-h-12 items-center gap-2 border-b-[3px] px-4 font-medium", active ? "border-primary text-ink" : "border-transparent text-ink-2 hover:text-ink")}
                >
                  {tab.label}
                  {tab.count !== undefined && <span className="rounded-pill bg-surface-2 px-2 font-mono text-sm tabular-nums">{tab.count}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
