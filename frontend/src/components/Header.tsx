"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import ConnectButton from './ConnectButton';
import LanguageSwitcher from './LanguageSwitcher';
import { useArticles } from '@/context/ArticleContext';
import { useUserRole } from '@/Hooks/useUserRole';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const { categories, selectedCategory, setSelectedCategory } = useArticles();
  const { isJournalist, isLoading } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render ConnectButton after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    // Use setTimeout to ensure state update happens before navigation
    setTimeout(() => {
      router.push(`/${locale}`);
    }, 0);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedCategory('All');
    setTimeout(() => {
      router.push(`/${locale}`);
    }, 0);
  };

  return (
    <header className="bg-gradient-to-b from-white to-gray-50 text-black shadow-md">
      {/* Top bar with elegant styling - This stays sticky */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center text-sm">
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">
              📅 {new Date().toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Navigation Links with modern styling */}
            <Link 
              href={`/${locale}/reporter`}
              className="group relative font-semibold text-gray-700 hover:text-primary-600 transition-all duration-300 px-3 py-2"
            >
              <span className="relative z-10">🎤 {t('nav.reporters')}</span>
              <span className="absolute inset-0 bg-primary-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></span>
            </Link>
            
            <Link 
              href={`/${locale}/governance`}
              className="group relative font-semibold text-gray-700 hover:text-primary-600 transition-all duration-300 px-3 py-2"
            >
              <span className="relative z-10">🏛️ {t('nav.governance')}</span>
              <span className="absolute inset-0 bg-primary-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></span>
            </Link>

            {/* Only render wallet button after client-side mount to prevent hydration mismatch */}
            {mounted ? (
              <ConnectButton />
            ) : (
              <div className="w-40 h-10 bg-gray-100 rounded-lg animate-pulse" />
            )}
          </div>
        </div>
      </div>
      
      {/* Main header with logo - Enhanced with gradient and animations */}
      <div className="py-8 text-center bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <Link href={`/${locale}`} className="group inline-block" onClick={handleLogoClick}>
          <h1 className="text-6xl md:text-7xl font-serif font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-primary-700 group-hover:via-primary-600 group-hover:to-primary-700 transition-all duration-500 tracking-tight">
            {locale === 'bn' ? 'গণ-মঞ্চ' : 'Gono Moncho'}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary-400"></span>
            <p className="text-sm font-medium text-gray-600 uppercase tracking-widest">
              {t('home.subtitle')}
            </p>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary-400"></span>
          </div>
        </Link>
      </div>

      {/* Category Navigation Bar with Search - Modern tabs design */}
      <nav className="border-t border-gray-200 bg-white shadow-sm sticky top-[60px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 py-3">
            {/* Categories */}
            <ul className="flex gap-1 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>

            {/* Search Bar */}
            <div className="flex items-center gap-2">
              {showSearch && (
                <div className="relative animate-slide-down">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('common.search')}
                    className="w-64 px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    autoFocus
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
                title="Search"
              >
                {showSearch ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}