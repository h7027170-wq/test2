import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getMessages(isLocale(locale) ? locale : "ar")).about.title };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const m = (await getMessages(locale as Locale)).about;
  const blocks = [
    [m.what, m.whatBody],
    [m.whatNot, m.whatNotBody],
    [m.languages, m.languagesBody],
  ];
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-reading">
        <h1 className="text-3xl sm:text-4xl">{m.title}</h1>
        <p className="mt-5 text-xl text-ink-2">{m.lead}</p>
        <div className="mt-10 grid gap-8">
          {blocks.map(([h, p]) => (
            <section key={h}>
              <h2 className="text-2xl">{h}</h2>
              <p className="mt-3 text-lg text-ink-2">{p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
