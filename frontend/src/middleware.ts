import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n/request';

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: 'bn',
  
  // Automatically detect locale from request
  localeDetection: true,
  
  // Prefix for default locale - always show locale in URL
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except for api routes, static files, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
