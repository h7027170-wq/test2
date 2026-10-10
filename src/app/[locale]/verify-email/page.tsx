"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useI18n } from "@/components/providers/i18n";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { LoadingBlock, ErrorState } from "@/components/ui/feedback";
import { AuthShell } from "@/components/nafess/auth-shell";
import { useAsync } from "@/lib/use-async";
import { verifyEmail } from "@/services/auth";
import { cn } from "@/lib/cn";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthShell><LoadingBlock /></AuthShell>}>
      <Verify />
    </Suspense>
  );
}

function Verify() {
  const { t, href } = useI18n();
  const token = useSearchParams().get("token");
  const result = useAsync(() => (token ? verifyEmail(token) : Promise.resolve("missing" as const)), [token]);

  return (
    <AuthShell>
      <h1 className="text-3xl">{t("verify.title")}</h1>
      <div className="mt-6" aria-live="polite">
        {result.state.status === "loading" && <p className="text-ink-2">{t("verify.checking")}</p>}
        {result.state.status === "error" && <ErrorState onRetry={() => result.reload()} />}
        {result.state.status === "ready" && (
          <div className={cn("flex items-start gap-3 rounded-md p-4", result.state.data === "verified" ? "bg-sage-soft text-sage-ink" : "bg-warm-soft text-warm-ink")}>
            <Icon name={result.state.data === "verified" ? "check" : "alert"} className="mt-1" />
            <p>{t(`verify.${result.state.data}`)}</p>
          </div>
        )}
      </div>
      <ButtonLink href={href(result.state.status === "ready" && result.state.data === "verified" ? "/profile" : "/")} className="mt-6 w-full" size="lg">
        {result.state.status === "ready" && result.state.data === "verified" ? t("nav.profile") : t("notFound.home")}
      </ButtonLink>
    </AuthShell>
  );
}
