import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['bn', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = locales[0];

const localeMatchers = locales.map((entry) => entry.toLowerCase());

export function resolveLocale(input?: string | null): Locale | undefined {
  if (!input) return undefined;

  const normalized = input.toLowerCase();
  if (normalized === 'default') {
    return defaultLocale;
  }
  const directMatchIndex = localeMatchers.findIndex((candidate) => candidate === normalized);
  if (directMatchIndex !== -1) {
    return locales[directMatchIndex];
  }

  const partialMatchIndex = localeMatchers.findIndex((candidate) => normalized.startsWith(`${candidate}-`));
  if (partialMatchIndex !== -1) {
    return locales[partialMatchIndex];
  }

  return undefined;
}

export function resolveLocaleOrDefault(input?: string | null): Locale {
  return resolveLocale(input) ?? defaultLocale;
}

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = resolveLocaleOrDefault(locale);

  return {
    locale: resolvedLocale,
    messages: (await import(`../${resolvedLocale}.json`)).default
  };
});
