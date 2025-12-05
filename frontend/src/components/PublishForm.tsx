"use client";

import { useState, useEffect, useRef } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { VerificationABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { useArticles } from '@/context/ArticleContext';
import { useToast } from '@/context/ToastContext';
import { keccak256, stringToBytes } from 'viem';
import { useTranslations } from 'next-intl';

export default function PublishForm() {
  const t = useTranslations();
  const { address } = useAccount();
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingToArweave, setIsUploadingToArweave] = useState(false);
  const hasAddedArticle = useRef(false);
  const { showToast } = useToast();

  const { addArticle, refreshArticles } = useArticles();
  const { data: hash, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setVideoFile(event.target.files[0]);
    }
  };

  useEffect(() => {
    if (isConfirmed && !hasAddedArticle.current) {
      hasAddedArticle.current = true;
      
      showToast("✅ Article published successfully! It will appear on the homepage.", "success");
      
      // Refresh articles from blockchain to get the newly published article
      setTimeout(() => {
        refreshArticles();
      }, 2000); // Wait 2 seconds for blockchain to process
      
      setHeadline('');
      setContent('');
      setVideoFile(null);
    }
  }, [isConfirmed, refreshArticles, showToast]);

  useEffect(() => {
    if (writeError) {
      showToast(writeError.message || "Failed to publish article. Please try again.", "error");
    }
  }, [writeError, showToast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!headline || !content) {
      showToast("Please fill out all required fields.", "warning");
      return;
    }
    hasAddedArticle.current = false;
    
    try {
      setIsUploadingToArweave(true);
      showToast("Uploading article content to Arweave...", "info");

      // Prepare article data
      const articleData = {
        headline,
        content,
        author: "Anonymous", // Will be replaced with wallet address
        createdAt: new Date().toISOString(),
        platform: "Gono Moncho"
      };

      // Upload to Arweave
      const formData = new FormData();
      formData.append('json', JSON.stringify(articleData));
      
      const uploadResponse = await fetch('/api/arweave/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to Arweave');
      }

      const uploadResult = await uploadResponse.json();
      const arweaveHash = uploadResult.arweaveId;
      
      showToast("Content uploaded! Publishing to blockchain...", "info");
      setIsUploadingToArweave(false);

      // Save to localStorage for demo verifiers to see
      const demoArticle = {
        contentHash: arweaveHash,
        author: address || "Unknown",
        timestamp: Date.now(),
        verificationStatus: 0, // PENDING
        credibilityScore: 0,
        totalVotes: 0,
        headline,
        content: content.slice(0, 200) + "..." // First 200 chars preview
      };
      
      const existingArticles = JSON.parse(localStorage.getItem('demoArticles') || '[]');
      const updatedArticles = [...existingArticles, demoArticle];
      localStorage.setItem('demoArticles', JSON.stringify(updatedArticles));
      
      console.log('Article saved to localStorage:', demoArticle);
      console.log('Total articles in storage:', updatedArticles.length);

      // Publish to blockchain using Arweave hash
      writeContract({
        address: CONTRACT_ADDRESSES.Verification,
        abi: VerificationABI,
        functionName: 'publishNews',
        args: [arweaveHash],
      });
    } catch (error) {
      setIsUploadingToArweave(false);
      showToast(error instanceof Error ? error.message : "Upload failed", "error");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">✍️ Publish Article</h2>
      <p className="text-gray-600 mb-6">
        Share your story with the world. Your article will be published on-chain and stored permanently.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Headline */}
        <div>
          <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-2">
            {t('publishArticle.headline')} *
          </label>
          <input
            id="headline"
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={t('publishArticle.headlinePlaceholder')}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            {t('publishArticle.articleContent')} *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('publishArticle.contentPlaceholder')}
            required
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length} {t('publishArticle.characters')}
          </p>
        </div>

        {/* Optional Video */}
        <div>
          <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-2">
            {t('publishArticle.videoMedia')}
          </label>
          <input
            id="video"
            type="file"
            onChange={handleFileChange}
            accept="video/*,image/*"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {videoFile && (
            <p className="text-sm text-green-600 mt-2">
              ✓ {t('publishArticle.selected')}: {videoFile.name}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isConfirming || isUploadingToArweave || !headline || !content}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {isUploadingToArweave ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('publishArticle.uploadingToArweave')}
              </span>
            ) : isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('publishArticle.publishingToBlockchain')}
              </span>
            ) : (
              `📰 ${t('publishArticle.publishButton')}`
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setHeadline('');
              setContent('');
              setVideoFile(null);
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
          >
            {t('publishArticle.clear')}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">📋 {t('publishArticle.publishingProcess')}</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• {t('publishArticle.step1')}</li>
          <li>• {t('publishArticle.step2')}</li>
          <li>• {t('publishArticle.step3')}</li>
          <li>• {t('publishArticle.step4')}</li>
        </ul>
      </div>

      {/* Tips */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">💡 {t('publishArticle.tipsTitle')}</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• {t('publishArticle.tip1')}</li>
          <li>• {t('publishArticle.tip2')}</li>
          <li>• {t('publishArticle.tip3')}</li>
          <li>• {t('publishArticle.tip4')}</li>
        </ul>
      </div>
    </div>
  );
}
