import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getMessages(isLocale(locale) ? locale : "ar")).guidelines.title };
}

export default async function GuidelinesPage({ params }: Props) {
  const { locale } = await params;
  const m = (await getMessages(locale as Locale)).guidelines;
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-reading">
        <h1 className="text-3xl sm:text-4xl">{m.title}</h1>
        <p className="mt-5 text-xl text-ink-2">{m.lead}</p>
        <ol className="mt-10 grid gap-4">
          {Object.values(m.rules).map((r, i) => (
            <li key={r.title} className="flex gap-4 rounded-lg border border-line bg-surface p-5 sm:p-6">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-ink">{i + 1}</span>
              <div>
                <h2 className="text-xl">{r.title}</h2>
                <p className="mt-2 text-ink-2">{r.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
