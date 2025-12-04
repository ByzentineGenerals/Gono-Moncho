"use client";

import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VerificationABI, CONTRACT_ADDRESSES, ReporterRegistryABI } from '@/lib/contracts';
import { useArticles } from '@/context/ArticleContext';
import { useToast } from '@/context/ToastContext';
import { useUserRole } from '@/Hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { keccak256, stringToBytes } from 'viem';
import Link from 'next/link';

export default function PublishPage() {
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const router = useRouter();
  const hasAddedArticle = useRef(false);
  const { showToast } = useToast();
  const { isJournalist, isLoading } = useUserRole();
  const { address } = useAccount();

  // Check if user can publish via ReporterRegistry
  const { data: canPublishData } = useReadContract({
    address: CONTRACT_ADDRESSES.ReporterRegistry,
    abi: ReporterRegistryABI,
    functionName: 'canPublish',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const canPublish = Boolean(canPublishData);

  const { addArticle, refreshArticles } = useArticles();
  const { data: hash, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Redirect non-journalists to reporter registration page
  useEffect(() => {
    if (!isLoading && !isJournalist && !canPublish) {
      showToast("You must register and be verified as a reporter to publish articles", "warning");
      router.push('/reporter');
    }
  }, [isJournalist, canPublish, isLoading, router, showToast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setVideoFile(event.target.files[0]);
    }
  };

  useEffect(() => {
    if (isConfirmed && !hasAddedArticle.current) {
      hasAddedArticle.current = true;
      
      // --- NEW LOGIC HERE ---
      let videoUrl;
      if (videoFile) {
        // Create a temporary local URL for the selected video file
        videoUrl = URL.createObjectURL(videoFile);
      }

      // Add the article with the new videoUrl to our global state
      const payload = JSON.stringify({
        headline,
        content,
        createdAt: new Date().toISOString(),
      });
      const contentHash = keccak256(stringToBytes(payload));
      
      addArticle({ headline, summary: content, body: content, videoUrl, contentHash });
      refreshArticles();
      
      showToast("Article published successfully! Redirecting...", "success");
      
      setHeadline('');
      setContent('');
      setVideoFile(null);
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  }, [isConfirmed, headline, content, videoFile, addArticle, refreshArticles, router, showToast]);

  useEffect(() => {
    if (writeError) {
      showToast(writeError.message || "Failed to publish article. Please try again.", "error");
    }
  }, [writeError, showToast]);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!headline || !content) {
      showToast("Please fill out all text fields.", "warning");
      return;
    }
    hasAddedArticle.current = false;
    
    const payload = JSON.stringify({
      headline,
      content,
      createdAt: new Date().toISOString(),
    });
    const contentHash = keccak256(stringToBytes(payload));
    
    showToast("Publishing article to blockchain...", "info");
    
    writeContract({
      address: CONTRACT_ADDRESSES.Verification,
      abi: VerificationABI,
      functionName: 'publishNews',
      args: [contentHash],
    });
  };

  // Show loading or access denied
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium animate-pulse">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  if (!isJournalist && !canPublish) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen flex items-center justify-center animate-fade-in">
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
          <div className="bg-white p-12 rounded-2xl shadow-2xl text-center border-2 border-yellow-200">
            <div className="mb-6 inline-block p-6 bg-yellow-100 rounded-full">
              <span className="text-6xl">📝</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4">Reporter Verification Required</h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              You must <strong className="text-primary-600">register and be verified as a reporter</strong> before you can publish articles.
            </p>
            <div className="space-y-4 text-left bg-gray-50 p-6 rounded-xl mb-8">
              <h3 className="font-bold text-gray-900 mb-3">📋 How to get started:</h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary-600">1.</span>
                  <span>Go to the Reporter Portal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary-600">2.</span>
                  <span>Register with your credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary-600">3.</span>
                  <span>Wait for admin/DAO verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary-600">4.</span>
                  <span>Start publishing your articles!</span>
                </li>
              </ol>
            </div>
            <Link 
              href="/reporter" 
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              🎤 Go to Reporter Portal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen animate-fade-in">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-5xl font-black text-gray-900 mb-3 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            ✍️ Publish Your Story
          </h1>
          <p className="text-gray-600 text-lg">
            Share verified news with the decentralized community
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <form className="p-8 lg:p-12 space-y-8" onSubmit={handleSubmit}>
            {/* Headline Input */}
            <div className="space-y-3">
              <label htmlFor="headline" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📰</span> Article Headline
              </label>
              <input 
                type="text" 
                id="headline" 
                value={headline} 
                onChange={(e) => setHeadline(e.target.value)} 
                placeholder="Enter a compelling headline..."
                required
                className="block w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300" 
              />
              <p className="text-sm text-gray-500">Make it clear, concise, and attention-grabbing</p>
            </div>

            {/* Content Textarea */}
            <div className="space-y-3">
              <label htmlFor="content" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📝</span> Full Article Content
              </label>
              <textarea 
                id="content" 
                rows={12} 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your full article here... Include all relevant details, sources, and context."
                required
                className="block w-full px-5 py-4 text-base border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300 leading-relaxed"
              ></textarea>
              <p className="text-sm text-gray-500">Provide comprehensive details with proper sourcing</p>
            </div>

            {/* Video Upload */}
            <div className="space-y-3">
              <label htmlFor="video-upload" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🎥</span> Supporting Video <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </label>
              <div className="relative">
                <input 
                  id="video-upload" 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileChange} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 file:cursor-pointer file:transition-all file:duration-200 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-primary-400 transition-all duration-200" 
                />
              </div>
              {videoFile && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl animate-slide-down">
                  <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                    <span>✓</span> Selected: {videoFile.name}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500">Upload video evidence or interviews to support your article</p>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button 
                type="submit" 
                disabled={isConfirming} 
                className="w-full flex justify-center items-center gap-3 py-5 px-6 border-none rounded-xl shadow-lg font-bold text-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                {isConfirming ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Publish Article to Blockchain</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {isConfirmed && (
            <div className="px-12 pb-12">
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl text-center animate-slide-down">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-lg font-bold text-green-800">Transaction Confirmed!</p>
                <p className="text-sm text-green-700">Redirecting to homepage...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}