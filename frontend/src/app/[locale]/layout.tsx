import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, resolveLocaleOrDefault } from '@/i18n/request';
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "গণ-মঞ্চ | Gono Moncho",
  description: "বাংলাদেশের বিকেন্দ্রীকৃত সংবাদ প্ল্যাটফর্ম | Bangladesh's Decentralized News Platform",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params before accessing properties (Next.js 15 requirement)
  const rawParams = await params;
  const locale = resolveLocaleOrDefault(rawParams?.locale);

  // Providing all messages to the client
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
