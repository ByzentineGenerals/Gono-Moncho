"use client";

import ArticleCard from "@/components/ArticleCard";
import { useArticles } from "@/context/ArticleContext";
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations();
  const { filteredArticles, isLoading } = useArticles();

  // Organize articles like The Daily Star layout
  const mainStory = filteredArticles[0];
  const centerStories = filteredArticles.slice(1, 3);
  const rightStories = filteredArticles.slice(3, 6);
  const bottomStories = filteredArticles.slice(6);

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <main className="container mx-auto px-4 py-6 max-w-[1400px]">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-6 bg-gray-50 rounded-xl mb-4">
              <span className="text-5xl">📰</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('home.latestNews')}</h3>
            <p className="text-gray-500">{t('news.publishArticle')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Grid - Matches The Daily Star's 3-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Main Story - Takes ~40% width */}
              {mainStory && (
                <div className="lg:col-span-5">
                  <ArticleCard {...mainStory} variant="hero" />
                </div>
              )}

              {/* Center Column - 2 stories stacked */}
              <div className="lg:col-span-4 space-y-6">
                {centerStories.map((article) => (
                  <ArticleCard key={article.id} {...article} variant="medium" />
                ))}
              </div>

              {/* Right Sidebar - Compact list */}
              <div className="lg:col-span-3 space-y-4">
                {rightStories.map((article) => (
                  <ArticleCard key={article.id} {...article} variant="compact" />
                ))}
              </div>
            </div>

            {/* Bottom Grid - 4 columns of smaller articles */}
            {bottomStories.length > 0 && (
              <div className="border-t-2 border-gray-200 pt-6 mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {bottomStories.map((article) => (
                    <ArticleCard key={article.id} {...article} variant="small" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}