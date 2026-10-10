"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, PasswordInput } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { AuthShell } from "@/components/nafess/auth-shell";
import { signIn, type SignInResult } from "@/services/auth";
import { DEMO_PASSWORD } from "@/data/seed";

export default function SignInPage() {
  const { t, href } = useI18n();
  const { refresh } = useSession();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SignInResult | null>(null);
  const [missing, setMissing] = useState<{ nickname?: boolean; password?: boolean }>({});
  const alertRef = useRef<HTMLDivElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = { nickname: !nickname.trim(), password: !password };
    setMissing(m);
    if (m.nickname || m.password) return;
    setBusy(true);
    const res = await signIn(nickname, password, remember);
    setBusy(false);
    setResult(res);
    if (res.ok) {
      await refresh();
      router.push(href(res.role === "moderator" || res.role === "admin" ? "/moderation" : "/"));
    } else {
      setPassword("");
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  }

  return (
    <AuthShell>
      <h1 className="text-3xl">{t("signin.title")}</h1>
      <p className="mt-2 text-ink-2">{t("signin.lead")}</p>
      <div ref={alertRef} tabIndex={-1} className="outline-none">
        {result && !result.ok && (
          <Notice tone="warm" className="mt-5" icon={result.error === "invalid" ? "alert" : "lock"}>
            <span role="alert">
              {result.error === "invalid" && t("signin.invalid")}
              {result.error === "locked" && t("signin.locked", { n: result.minutes })}
              {result.error === "suspended" && t("signin.suspended")}
            </span>
            {result.error === "locked" && (
              <p className="mt-1">
                <Link href={href("/forgot")} className="font-semibold underline underline-offset-4">
                  {t("signin.lockedHelp")}
                </Link>
              </p>
            )}
          </Notice>
        )}
      </div>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-5">
        <Field label={t("auth.nickname")} error={missing.nickname ? t("common.required") : null}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} dir="auto" />
          )}
        </Field>
        <Field label={t("auth.password")} error={missing.password ? t("common.required") : null}>
          {({ id, describedBy, invalid }) => (
            <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" showLabel={t("auth.showPassword")} hideLabel={t("auth.hidePassword")} />
          )}
        </Field>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} label={t("auth.remember")} help={t("auth.rememberHelp")} />
          <Link href={href("/forgot")} className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4">
            {t("signin.forgot")}
          </Link>
        </div>
        <Button type="submit" size="lg" loading={busy} className="w-full">
          {busy ? t("signin.signingIn") : t("signin.submit")}
        </Button>
      </form>
      <p className="mt-6 text-center text-ink-2">
        {t("signin.noAccount")}{" "}
        <Link href={href("/signup")} className="font-medium text-primary underline underline-offset-4">
          {t("nav.signUp")}
        </Link>
      </p>
      <p className="mt-6 rounded-md bg-surface-2 p-3 text-sm text-ink-2">{t("signin.demo", { pw: DEMO_PASSWORD })}</p>
    </AuthShell>
  );
}
