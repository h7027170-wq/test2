"use client";

import { useI18n } from "@/components/providers/i18n";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function NotFoundView({ title, body }: { title?: string; body?: string }) {
  const { t, href } = useI18n();
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
        <Icon name="wind" className="size-7" />
      </span>
      <p className="tag-label mt-6 text-mute">404</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{title ?? t("notFound.title")}</h1>
      <p className="mt-3 max-w-md text-lg text-ink-2">{body ?? t("notFound.body")}</p>
      <ButtonLink href={href("/")} className="mt-8" icon="home">
        {t("notFound.home")}
      </ButtonLink>
    </div>
  );
}
