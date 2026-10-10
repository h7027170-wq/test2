"use client";

import { useI18n } from "@/components/providers/i18n";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";

/** Shows a recovery code once, with a copy button. Codes are always LTR monospace. */
export function RecoveryCodeBox({ code }: { code: string }) {
  const { t } = useI18n();
  const toast = useToast();
  return (
    <div className="rounded-lg border-[1.5px] border-dashed border-primary bg-primary-soft p-5 text-center text-primary-ink">
      <p className="font-mono text-2xl tracking-[0.12em] sm:text-3xl" dir="ltr" translate="no">
        {code}
      </p>
      <Button
        variant="secondary"
        size="sm"
        icon="copy"
        className="mt-4"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            toast(t("signup.codeCopied"));
          } catch {
            toast(t("common.copyFailed"));
          }
        }}
      >
        {t("signup.copyCode")}
      </Button>
    </div>
  );
}
