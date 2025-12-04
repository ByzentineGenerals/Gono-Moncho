"use client";

import { useArticles } from "@/context/ArticleContext";
import Link from "next/link";
import AnalysisSection from "@/components/AnalysisSection";
import VerificationSection from "@/components/VerificationSection";
import AIAnalysisSection from "@/components/AIAnalysisSection";
import { use } from "react";
// We no longer import useUserRole

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { articles, isLoading } = useArticles();
  const { id } = use(params);
  const article = articles.find(a => a.id === parseInt(id, 10));

  if (!article) {
    return (
      <main className="container mx-auto p-8 text-center">
        {isLoading ? (
          <p className="text-gray-500">Loading article from the network...</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Article not found.</h1>
            <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
              &larr; Back to homepage
            </Link>
          </>
        )}
      </main>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
            <span>🏠</span> Home
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{article.category}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8 lg:p-12">
            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-sm font-bold uppercase tracking-wider">
                {article.category}
              </span>
            </div>

            {/* Article Title */}
            <h1 className="text-4xl lg:text-5xl font-serif font-black text-gray-900 mb-6 leading-tight">
              {article.headline}
            </h1>

            {/* Article Metadata */}
            <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                  {article.author?.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">By {article.author}</p>
                  <p className="text-xs text-gray-500">Verified Journalist</p>
                </div>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    article.status === "Verified" 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                  }`}
                >
                  {article.statusLabel ?? article.status}
                </span>
              </div>
              {typeof article.credibilityScore === "number" && (
                <>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Credibility:</span>
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                      <span className="text-yellow-500">⭐</span>
                      <strong className="text-sm font-bold text-yellow-700">{article.credibilityScore}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Video Player */}
            {article.videoUrl && (
              <div className="mb-10">
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                  <video 
                    src={article.videoUrl} 
                    controls 
                    className="w-full h-full"
                    poster="/video-thumbnail.jpg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-xl text-gray-700 leading-relaxed font-medium mb-8 border-l-4 border-primary-500 pl-6 py-2 bg-primary-50/50 rounded-r-lg">
                {article.summary}
              </p>
              {article.body && (
                <div className="mt-8 text-gray-800 leading-loose space-y-4">
                  {article.body.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-base">{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* AI Analysis Section */}
          <div className="border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <AIAnalysisSection contentHash={article.contentHash} />
          </div>
          
          {/* Verification Section */}
          <div className="border-t border-gray-200 bg-white">
            <VerificationSection
              articleId={article.id}
              contentHash={article.contentHash}
              currentScore={article.credibilityScore}
              status={article.status}
              statusLabel={article.statusLabel}
            />
          </div>

          {/* Analysis section */}
          <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <AnalysisSection />
          </div>
        </div>
      </main>
    </div>
  );
}