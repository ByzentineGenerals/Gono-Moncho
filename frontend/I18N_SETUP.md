# Internationalization (i18n) Setup

## Overview
The Gono-Moncho platform now supports bilingual functionality with **Bangla (বাংলা)** as the default language and English as an alternative. The system UI, navigation, and all interface elements are translated, while news content remains in its original language.

## Features

### 1. **Language Support**
- **Default Language**: Bangla (বাংলা) - `bn`
- **Alternative Language**: English - `en`
- **Language Detection**: Automatic locale detection from browser settings
- **URL Structure**: 
  - Bangla (default): `https://yoursite.com/` or `https://yoursite.com/bn`
  - English: `https://yoursite.com/en`

### 2. **Language Switcher**
A prominent language switcher is available in the header navigation:
- Toggle between বাংলা and English
- Smooth transitions without page reload
- Persists across navigation

### 3. **Translated Components**
All UI elements are translated including:
- **Navigation**: Home, News, Reporters, Organizations, Verification, Staking, Governance
- **Authentication**: Wallet connection, network switching
- **Forms**: Reporter registration, article publishing, staking
- **Dashboards**: Statistics, profiles, analytics
- **Messages**: Success/error notifications, loading states
- **Common Actions**: Submit, Cancel, Save, Edit, Delete, etc.

### 4. **News Content**
- News articles remain in their **original language**
- No automatic translation of news content
- Only system UI changes language

## Technical Implementation

### Tech Stack
- **next-intl**: Next.js internationalization library
- **Locale Routing**: App Router with `[locale]` dynamic segments
- **Middleware**: Automatic locale detection and redirection

### File Structure
```
frontend/
├── src/
│   ├── i18n/
│   │   └── request.ts          # i18n configuration
│   ├── middleware.ts            # Locale detection middleware
│   ├── bn.json                  # Bangla translations (13KB)
│   ├── en.json                  # English translations (7.8KB)
│   ├── app/
│   │   ├── [locale]/            # Locale-based routing
│   │   │   ├── layout.tsx       # Root layout with i18n provider
│   │   │   ├── template.tsx     # App providers wrapper
│   │   │   ├── page.tsx         # Home page
│   │   │   └── ...              # Other pages
│   │   ├── layout.tsx           # Root redirect
│   │   └── page.tsx             # Root redirect
│   └── components/
│       └── LanguageSwitcher.tsx # Language toggle component
```

### Translation Keys Structure
```json
{
  "common": { ... },        // Common UI elements
  "nav": { ... },           // Navigation
  "auth": { ... },          // Authentication
  "home": { ... },          // Home page
  "news": { ... },          // News/Articles
  "reporter": { ... },      // Reporter portal
  "organization": { ... },  // Organizations
  "staking": { ... },       // Staking
  "verification": { ... },  // Verification
  "governance": { ... },    // Governance
  "subscription": { ... },  // Subscriptions
  "dashboard": { ... },     // Dashboard
  "token": { ... },         // NEWS token
  "storage": { ... },       // Storage
  "profile": { ... },       // User profile
  "settings": { ... },      // Settings
  "errors": { ... },        // Error messages
  "messages": { ... }       // Success/info messages
}
```

## Usage in Components

### Using Translations
```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### Getting Current Locale
```tsx
import { useLocale } from 'next-intl';

export default function MyComponent() {
  const locale = useLocale(); // 'bn' or 'en'
  
  return <div>Current locale: {locale}</div>;
}
```

### Navigation with Locale
```tsx
import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function MyComponent() {
  const locale = useLocale();
  
  return <Link href={`/${locale}/news`}>View News</Link>;
}
```

## Adding New Translations

### 1. Add to Translation Files
Edit both `src/bn.json` and `src/en.json`:

```json
// bn.json
{
  "mySection": {
    "newKey": "নতুন বার্তা"
  }
}

// en.json
{
  "mySection": {
    "newKey": "New Message"
  }
}
```

### 2. Use in Component
```tsx
const t = useTranslations();
<p>{t('mySection.newKey')}</p>
```

## Date/Time Localization

Dates are automatically formatted based on locale:
```tsx
const locale = useLocale();
const date = new Date().toLocaleDateString(
  locale === 'bn' ? 'bn-BD' : 'en-US',
  { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
);
```

## Configuration

### Default Locale
Edit `src/middleware.ts` to change the default language:
```typescript
export default createMiddleware({
  locales: ['bn', 'en'],
  defaultLocale: 'bn',  // Change this to 'en' for English default
  localeDetection: true,
  localePrefix: 'as-needed'
});
```

### Supported Locales
Add new locales in `src/i18n/request.ts`:
```typescript
export const locales = ['bn', 'en', 'hi'] as const; // Add Hindi
```

## SEO Considerations

### Metadata
Each page automatically includes proper `lang` attribute:
```html
<html lang="bn">  <!-- or lang="en" -->
```

### Alternate Links
Consider adding alternate link tags for better SEO:
```tsx
export function generateMetadata({ params: { locale } }) {
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'bn-BD': '/bn',
        'en-US': '/en'
      }
    }
  };
}
```

## Performance

- **Build Time**: Translation files are bundled at build time
- **Static Generation**: All locale variants are pre-rendered (SSG)
- **Bundle Size**: 
  - Bangla translations: 13.1 KB
  - English translations: 7.87 KB
  - Total overhead: ~21 KB (minified)

## Browser Support

- Modern browsers with JavaScript enabled
- Automatic locale detection from `Accept-Language` header
- Fallback to Bangla for unsupported locales

## Testing Checklist

- [ ] Language switcher works on all pages
- [ ] URLs include correct locale prefix
- [ ] Direct navigation to `/bn` and `/en` works
- [ ] News content remains untranslated
- [ ] Date formatting changes with locale
- [ ] All navigation links include locale
- [ ] Form validations use correct language
- [ ] Error messages display in selected language
- [ ] Success notifications use correct language
- [ ] Wallet connection messages translated

## Future Enhancements

1. **More Languages**: Add Hindi, Urdu, or regional languages
2. **RTL Support**: For Urdu/Arabic if needed
3. **Content Translation**: Optional AI-powered news translation
4. **User Preferences**: Save language preference to local storage/database
5. **Admin Panel**: Manage translations without code changes
6. **Crowdsourced Translations**: Community-driven translation improvements

## Troubleshooting

### Issue: Translations not showing
- Check if translation key exists in both `bn.json` and `en.json`
- Verify component uses `useTranslations()` hook
- Ensure component is marked as `'use client'`

### Issue: Wrong locale displayed
- Clear browser cache and cookies
- Check middleware configuration
- Verify locale in URL matches expected format

### Issue: Build errors
- Validate JSON syntax in translation files
- Ensure all translation keys match in both files
- Check import paths in `i18n/request.ts`

## Support

For issues or feature requests:
- GitHub Issues: [Repository Issues]
- Documentation: This file
- Community: Discord/Telegram

---

**Last Updated**: December 5, 2025
**Version**: 1.0.0
**Maintainer**: Gono-Moncho Development Team
