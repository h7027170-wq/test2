"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AgeRange, AvatarShape, Tint } from "@/types/domain";
import { communities } from "@/data/seed";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { Button } from "@/components/ui/button";
import { Checkbox, ChoiceCard, ErrorSummary, Field, Input, PasswordInput, Select, StrengthMeter } from "@/components/ui/form";
import { Avatar, avatarShapes, Steps } from "@/components/ui/misc";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/feedback";
import { CrisisContent } from "@/components/nafess/chrome";
import { RecoveryCodeBox } from "@/components/nafess/recovery-code";
import { AuthShell } from "@/components/nafess/auth-shell";
import { nicknameProblem } from "@/lib/nickname";
import { MIN_STRENGTH, passwordStrength } from "@/lib/password";
import { isNicknameAvailable, signUp } from "@/services/auth";
import { cn } from "@/lib/cn";
import { tintClass } from "@/components/ui/misc";

const tints: Tint[] = ["sage", "sky", "lilac", "sand"];
const ages: (AgeRange | "under18")[] = ["under18", "18-24", "25-34", "35-44", "45-54", "55+"];

export default function SignUpPage() {
  const { t, href } = useI18n();
  const { refresh } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [nickname, setNickname] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [shape, setShape] = useState<AvatarShape>("leaf");
  const [tint, setTint] = useState<Tint>("sage");
  const [age, setAge] = useState<AgeRange | "under18" | "">("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [recovery, setRecovery] = useState<"code" | "email">("code");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code?: string; token?: string } | null>(null);
  const [codeSaved, setCodeSaved] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Live nickname availability, debounced.
  useEffect(() => {
    if (nicknameProblem(nickname)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the value becomes invalid
      setAvailability("idle");
      return;
    }
    setAvailability("checking");
    let cancelled = false;
    const id = setTimeout(async () => {
      const ok = await isNicknameAvailable(nickname);
      if (!cancelled) setAvailability(ok ? "available" : "taken");
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [nickname]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, done]);

  const strength = passwordStrength(password, nickname);
  const steps = [t("signup.steps.communities"), t("signup.steps.identity"), t("signup.steps.security")];

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 0 && !picked.length) e.communities = t("signup.communitiesError");
    if (s === 1) {
      const p = nicknameProblem(nickname);
      if (p) e.nickname = t(`signup.nicknameErrors.${p}`);
      else if (availability === "taken") e.nickname = t("signup.nicknameErrors.taken");
      if (!age) e.age = t("signup.ageHelp");
    }
    if (s === 2) {
      if (strength < MIN_STRENGTH) e.password = t("signup.weakError");
      if (confirm !== password) e.confirm = t("signup.mismatch");
      if (recovery === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = t("signup.emailError");
      if (!agree) e.agree = t("signup.agreeError");
    }
    return e;
  }

  async function next(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < 2) return setStep(step + 1);
    setBusy(true);
    let res;
    try {
      res = await signUp({
      communities: picked,
      nickname,
      avatar: { shape, tint },
      ageRange: age as AgeRange,
      password,
        recovery: recovery === "email" ? { type: "email", email } : { type: "code" },
      });
    } catch {
      setErrors({ form: t("common.actionFailed") });
      return;
    } finally {
      setBusy(false);
    }
    if (!res.ok) {
      if (res.error === "nickname-taken") {
        setStep(1);
        setErrors({ nickname: t("signup.nicknameErrors.taken") });
      } else setErrors({ form: t("signup.genericError") });
      return;
    }
    await refresh();
    setDone({ code: res.recoveryCode, token: res.verifyToken });
  }

  if (age === "under18") {
    return (
      <AuthShell>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
          {t("signup.under18Title")}
        </h1>
        <p className="mt-3 text-lg text-ink-2">{t("signup.under18Body")}</p>
        <div className="mt-6">
          <CrisisContent showBreathing={false} />
        </div>
        <Button variant="secondary" className="mt-6" onClick={() => setAge("")}>
          {t("common.back")}
        </Button>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        {done.code ? (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
              {t("signup.codeTitle")}
            </h1>
            <p className="mt-3 text-ink-2">{t("signup.codeBody")}</p>
            <div className="mt-5">
              <RecoveryCodeBox code={done.code} />
            </div>
            <Checkbox className="mt-5" checked={codeSaved} onChange={(e) => setCodeSaved(e.target.checked)} label={t("signup.codeSaved")} />
          </>
        ) : (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
              {t("signup.doneTitle")}
            </h1>
            <p className="mt-3 text-ink-2">{t("signup.doneBody")}</p>
            <Notice tone="info" icon="mail" className="mt-5">
              {t("signup.verifyNote", { email: email.trim() })}
            </Notice>
            {done.token && (
              <div className="mt-4 rounded-md border border-dashed border-field/60 p-4 text-sm">
                <p className="font-semibold">{t("forgot.demoInbox")}</p>
                <p className="text-ink-2">{t("forgot.demoInboxHelp")}</p>
                <Link className="mt-2 inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4" href={href(`/verify-email?token=${encodeURIComponent(done.token)}`)}>
                  {t("forgot.openLink")}
                </Link>
              </div>
            )}
          </>
        )}
        <Button size="lg" className="mt-6 w-full" disabled={!!done.code && !codeSaved} iconEnd="arrow" onClick={() => router.push(href("/"))}>
          {t("signup.start")}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide={step === 0}>
      <Steps steps={steps} current={step} label={t("signup.stepOf", { n: step + 1, total: 3 })} />
      <p className="mt-6 text-sm text-mute">{t("signup.stepOf", { n: step + 1, total: 3 })}</p>
      <form onSubmit={next} noValidate className="mt-1 grid gap-6">
        {step === 0 && (
          <>
            <div>
              <h1 ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
                {t("signup.communitiesTitle")}
              </h1>
              <p className="mt-2 text-ink-2">{t("signup.communitiesHelp")}</p>
            </div>
            <ErrorSummary title={t("write.errors.summary", { n: Object.keys(errors).length })} errors={Object.values(errors).map((message) => ({ message }))} />
            <fieldset>
              <legend className="sr-only">{t("signup.communitiesTitle")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {communities.map((c) => (
                  <ChoiceCard
                    key={c.id}
                    type="checkbox"
                    name="communities"
                    checked={picked.includes(c.id)}
                    onChange={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                    title={t(`communities.list.${c.id}.name`)}
                    description={t(`communities.list.${c.id}.desc`)}
                    icon="wind"
                    accent={tintClass[c.tint]}
                  />
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
              {t("signup.identityTitle")}
            </h1>
            <ErrorSummary title={t("write.errors.summary", { n: Object.keys(errors).length })} errors={Object.values(errors).map((message) => ({ message }))} />
            <Field label={t("auth.nickname")} help={t("signup.nicknameHelp")} error={errors.nickname}>
              {({ id, describedBy, invalid }) => (
                <div>
                  <Input id={id} aria-describedby={describedBy} invalid={invalid} value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={24} dir="auto" />
                  <p className="mt-1.5 min-h-6 text-sm" aria-live="polite">
                    {availability === "checking" && <span className="text-mute">{t("signup.checking")}</span>}
                    {availability === "available" && (
                      <span className="inline-flex items-center gap-1 font-medium text-sage-ink">
                        <Icon name="check" className="size-4" />
                        {t("signup.available")}
                      </span>
                    )}
                    {availability === "taken" && (
                      <span className="inline-flex items-center gap-1 font-medium text-warm-ink">
                        <Icon name="alert" className="size-4" />
                        {t("signup.taken")}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </Field>
            <fieldset>
              <legend className="font-medium">{t("signup.avatar")}</legend>
              <p className="mb-3 text-sm text-mute">{t("signup.avatarHelp")}</p>
              <div className="flex items-center gap-4">
                <Avatar avatar={{ shape, tint }} size={72} />
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("signup.avatarShape")}>
                    {avatarShapes.map((s, i) => (
                      <button key={s} type="button" role="radio" aria-checked={shape === s} aria-label={t("signup.avatarOption", { n: i + 1 })} onClick={() => setShape(s)} className={cn("rounded-full p-0.5 ring-2", shape === s ? "ring-primary" : "ring-transparent")}>
                        <Avatar avatar={{ shape: s, tint }} size={40} />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2" role="radiogroup" aria-label={t("signup.avatarColor")}>
                    {tints.map((c, i) => (
                      <button key={c} type="button" role="radio" aria-checked={tint === c} aria-label={t("signup.avatarOption", { n: i + 1 })} onClick={() => setTint(c)} className={cn("size-11 rounded-full p-1 ring-2", tint === c ? "ring-primary" : "ring-transparent")}>
                        <span className={cn("block size-full rounded-full border border-field/40", tintClass[c])} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </fieldset>
            <Field label={t("signup.ageRange")} help={t("signup.ageHelp")} error={errors.age}>
              {({ id, describedBy, invalid }) => (
                <Select id={id} aria-describedby={describedBy} invalid={invalid} value={age} onChange={(e) => setAge(e.target.value as AgeRange)}>
                  <option value="">—</option>
                  {ages.map((a) => (
                    <option key={a} value={a}>
                      {a === "under18" ? t("signup.under18") : a}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
              {t("signup.securityTitle")}
            </h1>
            <ErrorSummary title={t("write.errors.summary", { n: Object.keys(errors).length })} errors={Object.values(errors).map((message) => ({ message }))} />
            <Field label={t("auth.password")} help={t("signup.passwordHelp")} error={errors.password}>
              {({ id, describedBy, invalid }) => (
                <div>
                  <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" showLabel={t("auth.showPassword")} hideLabel={t("auth.hidePassword")} />
                  <StrengthMeter score={strength} label={t("signup.strengthLabel", { label: t(`signup.strength.${strength}`) })} />
                </div>
              )}
            </Field>
            <Field label={t("signup.confirmPassword")} error={errors.confirm}>
              {({ id, describedBy, invalid }) => (
                <PasswordInput id={id} aria-describedby={describedBy} invalid={invalid} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" showLabel={t("auth.showPassword")} hideLabel={t("auth.hidePassword")} />
              )}
            </Field>
            <fieldset>
              <legend className="mb-2 font-medium">{t("signup.recovery")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard type="radio" name="recovery" checked={recovery === "code"} onChange={() => setRecovery("code")} title={t("signup.recoveryCode")} description={t("signup.recoveryCodeDesc")} icon="key" accent="bg-primary-soft text-primary-ink" />
                <ChoiceCard type="radio" name="recovery" checked={recovery === "email"} onChange={() => setRecovery("email")} title={t("signup.recoveryEmail")} description={t("signup.recoveryEmailDesc")} icon="mail" accent="bg-sky-soft text-sky-ink" />
              </div>
            </fieldset>
            {recovery === "email" && (
              <Field label={t("signup.email")} error={errors.email}>
                {({ id, describedBy, invalid }) => <Input id={id} type="email" aria-describedby={describedBy} invalid={invalid} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" dir="ltr" />}
              </Field>
            )}
            <div>
              <Checkbox
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                label={
                  <>
                    {t("signup.agree")} ·{" "}
                    <Link href={href("/guidelines")} target="_blank" className="font-medium text-primary underline underline-offset-4">
                      {t("footer.guidelines")}
                    </Link>
                  </>
                }
              />
              {errors.agree && <p className="mt-1 ms-9 text-sm font-medium text-warm-ink">{errors.agree}</p>}
            </div>
            {errors.form && <Notice tone="warm">{errors.form}</Notice>}
          </>
        )}

        <div className="flex flex-wrap-reverse items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <Button variant="ghost" icon="arrow" onClick={() => (setErrors({}), setStep(step - 1))} className="[&_svg]:rotate-180">
              {t("common.back")}
            </Button>
          ) : (
            <p className="text-ink-2">
              {t("signup.haveAccount")}{" "}
              <Link href={href("/signin")} className="font-medium text-primary underline underline-offset-4">
                {t("nav.signIn")}
              </Link>
            </p>
          )}
          <Button type="submit" size="lg" loading={busy} iconEnd={step < 2 ? "arrow" : undefined}>
            {step < 2 ? t("common.continue") : busy ? t("signup.creating") : t("signup.submit")}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

