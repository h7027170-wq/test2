import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { CrisisContent } from "@/components/nafess/chrome";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getMessages(isLocale(locale) ? locale : "ar")).crisis.title };
}

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  const m = (await getMessages(locale as Locale)).crisis;
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-reading">
        <h1 className="text-3xl sm:text-4xl">{m.title}</h1>
        <div className="mt-6">
          <CrisisContent />
        </div>
      </div>
    </div>
  );
}
