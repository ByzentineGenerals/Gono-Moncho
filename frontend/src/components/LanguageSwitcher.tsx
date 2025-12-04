'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    startTransition(() => {
      const pathWithoutLocale = pathname.replace(/^\/(bn|en)/, '');
      const suffix = pathWithoutLocale
        ? pathWithoutLocale.startsWith('/')
          ? pathWithoutLocale
          : `/${pathWithoutLocale}`
        : '';

      router.replace(`/${newLocale}${suffix}`);
    });
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => handleLanguageChange('bn')}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          locale === 'bn'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        বাংলা
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          locale === 'en'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        English
      </button>
    </div>
  );
}
