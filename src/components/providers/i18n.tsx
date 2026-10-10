"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { translate, type Messages } from "@/i18n/messages";

interface I18n {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  href: (path: string) => string;
  relativeTime: (iso: string) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(messages, key, vars), [messages]);
  const value = useMemo<I18n>(
    () => ({
      locale,
      t,
      href: (path: string) => `/${locale}${path === "/" ? "" : path}`,
      relativeTime: (iso: string) => {
        const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
        if (mins < 1) return t("common.justNow");
        if (mins < 60) return t("common.minutesAgo", { n: mins });
        const h = Math.round(mins / 60);
        if (h < 24) return t("common.hoursAgo", { n: h });
        return t("common.daysAgo", { n: Math.round(h / 24) });
      },
    }),
    [locale, t],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}
