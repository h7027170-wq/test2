"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/dialog";
import { locales, localeLabel, type Locale } from "@/i18n/config";
import { signOut } from "@/services/auth";
import { resetDemo } from "@/services/store";
import { BreathingMinute } from "./breathing";

export function Logo({ className }: { className?: string }) {
  const { locale, href, t } = useI18n();
  return (
    <Link href={href("/")} className={cn("inline-flex min-h-11 items-center gap-2.5 rounded-md", className)} aria-label={`${t("common.brand")}, ${t("nav.home")}`}>
      <svg viewBox="0 0 64 64" className="size-9" aria-hidden>
        <rect width="64" height="64" rx="18" className="fill-primary" />
        <path d="M14 36c6-10 12-10 18 0s12 10 18 0" fill="none" className="stroke-bg" strokeWidth="5" strokeLinecap="round" />
        <path d="M20 26c4-6 8-6 12 0s8 6 12 0" fill="none" className="stroke-primary-soft" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="font-display text-2xl font-semibold leading-none">{locale === "ar" ? "نَفَس" : "Nafess"}</span>
    </Link>
  );
}

/** Swaps the locale segment so the visitor stays on the equivalent page. */
function useLocalePath() {
  const pathname = usePathname();
  return (target: Locale) => {
    const parts = pathname.split("/");
    parts[1] = target;
    return parts.join("/") || `/${target}`;
  };
}

export function LocaleSwitch({ compact }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const toPath = useLocalePath();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (compact) {
    return (
      <nav aria-label={t("prefs.language")}>
        <ul className="flex flex-wrap gap-2">
          {locales.map((l) => (
            <li key={l}>
              <Link
                href={toPath(l)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? "true" : undefined}
                className={cn("inline-flex min-h-11 items-center rounded-pill border-[1.5px] px-4", l === locale ? "border-primary bg-primary-soft text-primary-ink" : "border-field/70")}
              >
                {localeLabel[l]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-pill px-3 text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <Icon name="globe" />
        <span className="text-sm font-medium uppercase">{locale}</span>
        <span className="sr-only">{t("prefs.language")}</span>
      </button>
      {open && (
        <ul className="absolute end-0 top-full z-40 mt-2 min-w-44 rounded-md border border-line bg-surface p-1.5 shadow-md">
          {locales.map((l) => (
            <li key={l}>
              <Link
                href={toPath(l)}
                hrefLang={l}
                lang={l}
                onClick={() => setOpen(false)}
                aria-current={l === locale ? "true" : undefined}
                className={cn("flex min-h-11 items-center justify-between gap-3 rounded-sm px-3 hover:bg-surface-2", l === locale && "font-semibold text-primary-ink")}
              >
                {localeLabel[l]}
                {l === locale && <Icon name="check" className="size-4" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the theme set by the pre-paint script
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <IconButton
      icon={theme === "dark" ? "sun" : "moon"}
      label={theme === "dark" ? t("prefs.toLight") : t("prefs.toDark")}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("nafess-theme", next);
        } catch {}
        setTheme(next);
      }}
    />
  );
}

export function CrisisButton({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  const { t, href } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      {iconOnly ? (
        <IconButton icon="lifebuoy" label={t("crisis.button")} onClick={() => setOpen(true)} className={cn("border-[1.5px] border-warm text-warm-ink hover:bg-warm-soft hover:text-warm-ink", className)} />
      ) : (
        <Button variant="crisis" size="sm" icon="lifebuoy" onClick={() => setOpen(true)} className={className}>
          {t("crisis.button")}
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t("crisis.title")}>
        <CrisisContent />
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={href("/help")} variant="secondary" onClick={() => setOpen(false)}>
            {t("crisis.fullPage")}
          </ButtonLink>
        </div>
      </Dialog>
    </>
  );
}

export function CrisisContent({ showBreathing = true }: { showBreathing?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-5">
      <p className="text-lg text-ink-2">{t("crisis.lead")}</p>
      <ol className="grid gap-3">
        {(["safe", "person", "breathe"] as const).map((k, i) => (
          <li key={k} className="flex gap-3 rounded-md bg-surface-2 p-4">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-ink">{i + 1}</span>
            <span>{t(`crisis.steps.${k}`)}</span>
          </li>
        ))}
      </ol>
      <div className="rounded-md border border-dashed border-field/60 p-4 text-ink-2">
        <p className="flex items-start gap-2">
          <Icon name="info" className="mt-1" />
          <span>{t("crisis.numbersPending")}</span>
        </p>
      </div>
      {showBreathing && <BreathingMinute compact />}
    </div>
  );
}

export function SiteHeader() {
  const { t, href } = useI18n();
  const { account, status, unread, refresh } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isStaff = account?.role === "moderator" || account?.role === "admin";

  const nav = [
    { href: "/communities", label: t("nav.communities") },
    { href: "/discussions", label: t("nav.discussions") },
    { href: "/about", label: t("footer.about") },
  ];
  const active = (p: string) => pathname.startsWith(href(p));

  async function doSignOut() {
    await signOut();
    await refresh();
    setMenuOpen(false);
    router.push(href("/"));
  }

  const accountLinks = account
    ? [
        { href: "/saved", label: t("nav.saved"), icon: "bookmark" as const },
        { href: "/profile", label: t("nav.profile"), icon: "user" as const },
        ...(isStaff ? [{ href: "/moderation", label: t("nav.moderation"), icon: "shield" as const }] : []),
      ]
    : [];

  return (
    <header className="glass sticky top-0 z-30 border-b border-line">
      <div className="container-page flex min-h-18 items-center gap-2 py-2">
        <Logo className="me-2" />
        <nav aria-label={t("nav.main")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={href(n.href)}
                  aria-current={active(n.href) ? "page" : undefined}
                  className={cn("inline-flex min-h-11 items-center rounded-pill px-4 font-medium text-ink-2 hover:bg-surface-2 hover:text-ink", active(n.href) && "bg-surface-2 text-ink")}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <CrisisButton className="hidden whitespace-nowrap lg:inline-flex" />
          <CrisisButton iconOnly className="lg:hidden" />
          <div className="hidden md:flex md:items-center">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
          {status === "ready" && !account && (
            <div className="hidden items-center gap-2 md:flex">
              <ButtonLink href={href("/signin")} variant="ghost" size="sm" className="whitespace-nowrap">
                {t("nav.signIn")}
              </ButtonLink>
              <ButtonLink href={href("/signup")} size="sm" className="whitespace-nowrap">
                {t("nav.signUp")}
              </ButtonLink>
            </div>
          )}
          {account && (
            <>
              <ButtonLink href={href("/write")} size="sm" icon="pen" className="hidden md:inline-flex">
                {t("nav.write")}
              </ButtonLink>
              <Link
                href={href("/notifications")}
                className="relative inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink"
                aria-label={unread ? `${t("nav.notifications")}, ${t("nav.unread", { n: unread })}` : t("nav.notifications")}
              >
                <Icon name="bell" />
                {unread > 0 && <span className="absolute end-2 top-2 size-2.5 rounded-full bg-warm ring-2 ring-surface" aria-hidden />}
              </Link>
              <AccountMenu links={accountLinks} onSignOut={doSignOut} />
            </>
          )}
          <IconButton icon="menu" label={t("nav.menu")} className="md:hidden" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} />
        </div>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title={t("nav.menu")} className="mt-4 mb-auto">
        <nav aria-label={t("nav.main")} onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}>
          <ul className="grid gap-1">
            {[{ href: "/", label: t("nav.home") }, ...nav, ...(account ? [{ href: "/write", label: t("nav.write") }, ...accountLinks] : [])].map((n) => (
              <li key={n.href}>
                <Link href={href(n.href)} className="flex min-h-12 items-center rounded-md px-3 text-lg font-medium hover:bg-surface-2">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid gap-3">
            <CrisisButton className="w-full" />
            {!account ? (
              <div className="grid grid-cols-2 gap-3">
                <ButtonLink href={href("/signin")} variant="secondary">
                  {t("nav.signIn")}
                </ButtonLink>
                <ButtonLink href={href("/signup")}>{t("nav.signUp")}</ButtonLink>
              </div>
            ) : (
              <Button variant="secondary" onClick={doSignOut}>
                {t("nav.signOut")}
              </Button>
            )}
          </div>
        </nav>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <LocaleSwitch compact />
          <ThemeToggle />
        </div>
      </Dialog>
    </header>
  );
}

function AccountMenu({ links, onSignOut }: { links: { href: string; label: string; icon: "bookmark" | "user" | "shield" }[]; onSignOut: () => void }) {
  const { t, href } = useI18n();
  const { account } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (!account) return null;
  return (
    <div ref={ref} className="relative hidden md:block">
      <button type="button" aria-expanded={open} aria-haspopup="true" aria-label={t("nav.account")} onClick={() => setOpen((o) => !o)} className="inline-flex size-11 items-center justify-center rounded-full">
        <Avatar avatar={account.avatar} size={38} />
      </button>
      {open && (
        <div className="absolute end-0 top-full z-40 mt-2 w-60 rounded-md border border-line bg-surface p-1.5 shadow-md">
          <p className="truncate px-3 py-2 font-semibold" dir="auto">
            {account.nickname}
          </p>
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={href(l.href)} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-sm px-3 hover:bg-surface-2">
                  <Icon name={l.icon} />
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-1">
              <button type="button" onClick={onSignOut} className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-start hover:bg-surface-2">
                <Icon name="arrow" />
                {t("nav.signOut")}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export function SiteFooter() {
  const { t, href } = useI18n();
  return (
    <footer className="mt-20 border-t border-line bg-surface-2/60">
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-ink-2">{t("footer.tagline")}</p>
          <p className="mt-4 text-sm text-mute">{t("footer.review")}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <nav aria-label={t("common.brand")}>
            <ul className="grid gap-1">
              {[
                ["/about", t("footer.about")],
                ["/guidelines", t("footer.guidelines")],
                ["/help", t("footer.help")],
              ].map(([p, label]) => (
                <li key={p}>
                  <Link href={href(p)} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="grid content-start gap-3">
            <LocaleSwitch compact />
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-mute">
          <p>{t("common.prototypeBanner")}</p>
          <button
            type="button"
            className="min-h-11 underline underline-offset-4 hover:text-ink"
            onClick={() => {
              resetDemo();
              window.location.reload();
            }}
          >
            {t("common.resetDemo")}
          </button>
        </div>
      </div>
    </footer>
  );
}
