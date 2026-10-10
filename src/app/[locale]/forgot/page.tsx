"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { Button } from "@/components/ui/button";
import { ChoiceCard, Field, Input, PasswordInput, StrengthMeter } from "@/components/ui/form";
import { LoadingBlock, Notice } from "@/components/ui/feedback";
import { AuthShell } from "@/components/nafess/auth-shell";
import { RecoveryCodeBox } from "@/components/nafess/recovery-code";
import { recoverWithCode, requestEmailReset, resetWithToken } from "@/services/auth";
import { passwordStrength } from "@/lib/password";
import type { MailItem } from "@/services/store";

export default function ForgotPage() {
  return (
    <Suspense fallback={<AuthShell><LoadingBlock /></AuthShell>}>
      <Forgot />
    </Suspense>
  );
}

function Forgot() {
  const params = useSearchParams();
  const token = params.get("token");
  return token ? <ResetWithToken token={token} /> : <ChooseMethod />;
}

function ChooseMethod() {
  const { t, href } = useI18n();
  const { refresh } = useSession();
  const router = useRouter();
  const [method, setMethod] = useState<"code" | "email">("code");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [sent, setSent] = useState<MailItem | null | false>(false);
  const strength = passwordStrength(password, nickname);

  if (newCode) {
    return (
      <AuthShell>
        <h1 className="text-3xl">{t("forgot.doneTitle")}</h1>
        <p className="mt-3 text-ink-2">{t("forgot.doneBody")}</p>
        <div className="mt-5">
          <RecoveryCodeBox code={newCode} />
        </div>
        <Button size="lg" className="mt-6 w-full" onClick={() => router.push(href("/"))}>
          {t("signup.start")}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl">{t("forgot.title")}</h1>
      <p className="mt-2 text-ink-2">{t("forgot.lead")}</p>
      <fieldset className="mt-6">
        <legend className="sr-only">{t("forgot.lead")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard type="radio" name="method" checked={method === "code"} onChange={() => (setMethod("code"), setError(null))} title={t("forgot.withCode")} icon="key" accent="bg-primary-soft text-primary-ink" />
          <ChoiceCard type="radio" name="method" checked={method === "email"} onChange={() => (setMethod("email"), setError(null))} title={t("forgot.withEmail")} icon="mail" accent="bg-sky-soft text-sky-ink" />
        </div>
      </fieldset>

      <form
        noValidate
        className="mt-6 grid gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!nickname.trim()) return setError(t("common.required"));
          setBusy(true);
          try {
            if (method === "email") {
              setSent(await requestEmailReset(nickname));
            } else {
              const res = await recoverWithCode(nickname, code, password);
              if (res.ok) {
                await refresh();
                setNewCode(res.newCode);
              } else setError(res.error === "weak" ? t("signup.weakError") : t("forgot.invalidCode"));
            }
          } catch {
            setError(t("common.actionFailed"));
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && (
          <Notice tone="warm">
            <span role="alert">{error}</span>
          </Notice>
        )}
        <Field label={t("auth.nickname")}>
          {({ id }) => <Input id={id} value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} dir="auto" />}
        </Field>
        {method === "code" ? (
          <>
            <Field label={t("forgot.code")} help={t("forgot.codeHelp")}>
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" dir="ltr" className="font-mono tracking-wider uppercase" />}
            </Field>
            <Field label={t("forgot.newPassword")} help={t("signup.passwordHelp")}>
              {({ id, describedBy }) => (
                <div>
                  <PasswordInput id={id} aria-describedby={describedBy} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" showLabel={t("auth.showPassword")} hideLabel={t("auth.hidePassword")} />
                  <StrengthMeter score={strength} label={t("signup.strengthLabel", { label: t(`signup.strength.${strength}`) })} />
                </div>
              )}
            </Field>
            <Button type="submit" size="lg" loading={busy}>
              {t("forgot.submitCode")}
            </Button>
          </>
        ) : sent === false ? (
          <Button type="submit" size="lg" icon="mail" loading={busy}>
            {t("forgot.sendLink")}
          </Button>
        ) : (
          <>
            <Notice tone="success" icon="mail">
              <span role="status">{t("forgot.emailSent")}</span>
            </Notice>
            {sent && (
              <div className="rounded-md border border-dashed border-field/60 p-4 text-sm">
                <p className="font-semibold">{t("forgot.demoInbox")}</p>
                <p className="text-ink-2">{t("forgot.demoInboxHelp")}</p>
                <Link className="mt-2 inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4" href={href(`/forgot?token=${encodeURIComponent(sent.token)}`)}>
                  {t("forgot.openLink")}
                </Link>
              </div>
            )}
          </>
        )}
      </form>
      <p className="mt-6 text-center">
        <Link href={href("/signin")} className="font-medium text-primary underline underline-offset-4">
          {t("common.back")}
        </Link>
      </p>
    </AuthShell>
  );
}

function ResetWithToken({ token }: { token: string }) {
  const { t, href } = useI18n();
  const { refresh } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const strength = passwordStrength(password);

  if (done) {
    return (
      <AuthShell>
        <h1 className="text-3xl">{t("forgot.doneTitle")}</h1>
        <p className="mt-3 text-ink-2">{t("forgot.doneBodyEmail")}</p>
        <Button size="lg" className="mt-6 w-full" onClick={() => router.push(href("/"))}>
          {t("signup.start")}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl">{t("forgot.resetTitle")}</h1>
      <form
        noValidate
        className="mt-6 grid gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          let res;
          try {
            res = await resetWithToken(token, password);
          } catch {
            setError(t("common.actionFailed"));
            return;
          } finally {
            setBusy(false);
          }
          if (res.ok) {
            await refresh();
            setDone(true);
          } else setError(res.error === "weak" ? t("signup.weakError") : t("forgot.expired"));
        }}
      >
        {error && (
          <Notice tone="warm">
            <span role="alert">{error}</span>
            {error === t("forgot.expired") && (
              <p className="mt-1">
                <Link href={href("/forgot")} className="font-semibold underline underline-offset-4">
                  {t("forgot.withEmail")}
                </Link>
              </p>
            )}
          </Notice>
        )}
        <Field label={t("forgot.newPassword")} help={t("signup.passwordHelp")}>
          {({ id, describedBy }) => (
            <div>
              <PasswordInput id={id} aria-describedby={describedBy} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" showLabel={t("auth.showPassword")} hideLabel={t("auth.hidePassword")} />
              <StrengthMeter score={strength} label={t("signup.strengthLabel", { label: t(`signup.strength.${strength}`) })} />
            </div>
          )}
        </Field>
        <Button type="submit" size="lg" loading={busy}>
          {t("forgot.submitCode")}
        </Button>
      </form>
    </AuthShell>
  );
}
