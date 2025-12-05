import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type ArticleCardProps = {
  id: number;
  headline: string;
  summary: string;
  author: string;
  status: 'Verified' | 'Pending';
  category: string;
  credibilityScore?: number;
  imageUrl?: string;
  variant?: 'hero' | 'medium' | 'compact' | 'small';
};

export default function ArticleCard({ 
  id, 
  headline, 
  summary, 
  category, 
  imageUrl, 
  status, 
  credibilityScore,
  variant = 'medium'
}: ArticleCardProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const articleLink = `/${locale}/article/${id}`;
  
  console.log('ArticleCard - locale:', locale, 'id:', id, 'link:', articleLink);
  
  // Hero variant - Main featured story (left column)
  if (variant === 'hero') {
    return (
      <Link href={articleLink} className="block group" onClick={() => console.log('Clicked article:', id, 'link:', articleLink)}>
        <article className="bg-white border border-gray-200">
          {imageUrl && (
            <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '5/4' }}>
              <img 
                src={imageUrl} 
                alt={headline} 
                className="w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-300" 
              />
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-1 text-xs font-semibold ${
                  status === 'Verified' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'
                }`}>
                  {status === 'Verified' ? '✓' : '⏳'}
                </span>
              </div>
            </div>
          )}
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-red-600 transition-colors leading-tight line-clamp-3">
              {headline}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              {summary}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  // Medium variant - Center column stories
  if (variant === 'medium') {
    return (
      <Link href={articleLink} className="block group" onClick={() => console.log('Clicked article:', id, 'link:', articleLink)}>
        <article className="bg-white border border-gray-200">
          {imageUrl && (
            <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
              <img 
                src={imageUrl} 
                alt={headline} 
                className="w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-300" 
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-0.5 text-xs font-semibold ${
                  status === 'Verified' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'
                }`}>
                  {status === 'Verified' ? '✓' : '⏳'}
                </span>
              </div>
            </div>
          )}
          <div className="p-3">
            <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-red-600 transition-colors leading-tight line-clamp-3">
              {headline}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {summary}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  // Compact variant - Right sidebar stories
  if (variant === 'compact') {
    return (
      <Link href={articleLink} className="block group" onClick={() => console.log('Clicked article:', id, 'link:', articleLink)}>
        <article className="border-b border-gray-200 pb-4">
          <div className="flex gap-3">
            {imageUrl && (
              <div className="relative overflow-hidden w-24 h-20 flex-shrink-0 bg-gray-100">
                <img 
                  src={imageUrl} 
                  alt={headline} 
                  className="w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-300" 
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-tight line-clamp-3 mb-1">
                {headline}
              </h4>
              {status === 'Verified' && (
                <span className="text-xs text-green-600 font-semibold">✓ Verified</span>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Small variant - Bottom grid stories
  return (
    <Link href={articleLink} className="block group" onClick={() => console.log('Clicked article:', id, 'link:', articleLink)}>
      <article className="bg-white border border-gray-200 h-full flex flex-col">
        {imageUrl && (
          <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
            <img 
              src={imageUrl} 
              alt={headline} 
              className="w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-300" 
            />
            <div className="absolute top-2 right-2">
              <span className={`px-1.5 py-0.5 text-xs font-semibold ${
                status === 'Verified' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'
              }`}>
                {status === 'Verified' ? '✓' : '⏳'}
              </span>
            </div>
          </div>
        )}
        <div className="p-3 flex-1">
          <h4 className="text-sm font-bold mb-1 text-gray-900 group-hover:text-red-600 transition-colors leading-tight line-clamp-3">
            {headline}
          </h4>
          <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
            {summary}
          </p>
        </div>
      </article>
    </Link>
  );
}