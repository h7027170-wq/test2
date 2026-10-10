import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { fontVariables } from "../fonts";
import { isLocale, localeDir, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { I18nProvider } from "@/components/providers/i18n";
import { SessionProvider } from "@/components/providers/session";
import { ToastProvider } from "@/components/providers/toast";
import { SiteFooter, SiteHeader } from "@/components/nafess/chrome";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = await getMessages(locale);
  return {
    title: { default: m.meta.title, template: `%s · ${m.common.brand}` },
    description: m.meta.description,
    icons: { icon: "/icon.svg" },
    robots: { index: false, follow: false }, // prototype: keep it out of search engines
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1615" },
  ],
};

// Sets data-theme before first paint: saved choice, else the system preference.
const themeScript = `try{var t=localStorage.getItem("nafess-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}`;

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} dir={localeDir[locale]} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider locale={locale} messages={messages}>
          <SessionProvider>
            <ToastProvider>
              <a href="#main" className="sr-only z-50 rounded-md bg-surface px-4 py-3 focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
                {messages.common.skip}
              </a>
              <SiteHeader />
              <main id="main" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
              <SiteFooter />
            </ToastProvider>
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
