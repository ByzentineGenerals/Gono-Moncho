"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES, VerificationABI } from "@/lib/contracts";
import { demoArticles } from "@/lib/demoArticles";
import { useToast } from "@/context/ToastContext";

export default function SeedDemoPage() {
  const { address, isConnected } = useAccount();
  const [publishingIndex, setPublishingIndex] = useState<number | null>(null);
  const [publishedArticles, setPublishedArticles] = useState<string[]>([]);
  const { showToast } = useToast();

  const { writeContract, data: txHash } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const uploadAndPublish = async (articleIndex: number) => {
    setPublishingIndex(articleIndex);
    const article = demoArticles[articleIndex];

    try {
      // Upload to mock Arweave
      const response = await fetch('/api/arweave/upload', {
        method: 'POST',
        body: JSON.stringify(article),
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      const arweaveHash = data.arweaveId;

      showToast(`Uploaded: ${arweaveHash}`, "success");

      // Publish to blockchain
      writeContract({
        address: CONTRACT_ADDRESSES.Verification,
        abi: VerificationABI,
        functionName: 'publishNews',
        args: [arweaveHash],
      });

    } catch (error) {
      showToast("Failed to publish: " + (error as Error).message, "error");
      setPublishingIndex(null);
    }
  };

  // Track successful publications
  if (isSuccess && publishingIndex !== null && !publishedArticles.includes(`article-${publishingIndex}`)) {
    setPublishedArticles([...publishedArticles, `article-${publishingIndex}`]);
    showToast(`Article ${publishingIndex + 1} published successfully!`, "success");
    setPublishingIndex(null);
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Demo Article Seeder</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Please connect your wallet to continue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎬 Demo Article Seeder
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Quickly publish demo articles for your presentation
          </p>
          <div className="mt-4 inline-block bg-green-100 dark:bg-green-900 px-6 py-3 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-semibold">
              ✅ {publishedArticles.length} / {demoArticles.length} articles published
            </p>
          </div>
        </div>

        {/* Quick Publish All */}
        <div className="mb-8 text-center">
          <button
            onClick={async () => {
              for (let i = 0; i < demoArticles.length; i++) {
                if (!publishedArticles.includes(`article-${i}`)) {
                  await uploadAndPublish(i);
                  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between
                }
              }
            }}
            disabled={publishingIndex !== null || publishedArticles.length === demoArticles.length}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishedArticles.length === demoArticles.length
              ? "✅ All Articles Published"
              : publishingIndex !== null
              ? "Publishing..."
              : "🚀 Publish All Articles"}
          </button>
        </div>

        {/* Article Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {demoArticles.map((article, index) => {
            const isPublished = publishedArticles.includes(`article-${index}`);
            const isPublishing = publishingIndex === index;

            return (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 transition-all ${
                  isPublished
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Status Badge */}
                {isPublished && (
                  <div className="mb-4">
                    <span className="inline-block bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      ✅ Published
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">
                  {article.title}
                </h3>

                <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Author:</strong> {article.author}
                  </p>
                  <p>
                    <strong>Date:</strong> {article.date}
                  </p>
                  <p>
                    <strong>Category:</strong> {article.category}
                  </p>
                  <div>
                    <strong>Tags:</strong>{" "}
                    {article.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mr-2 mb-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm line-clamp-3">
                  {article.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    Credibility: {article.credibilityScore}%
                  </div>

                  <button
                    onClick={() => uploadAndPublish(index)}
                    disabled={isPublished || isPublishing || publishingIndex !== null}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      isPublished
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        : isPublishing
                        ? "bg-blue-500 text-white animate-pulse"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                    }`}
                  >
                    {isPublished
                      ? "Published"
                      : isPublishing
                      ? "Publishing..."
                      : "Publish Article"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-100">
            📋 Demo Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click "Publish All Articles" or publish individually</li>
            <li>Approve each MetaMask transaction (FREE on testnet)</li>
            <li>Articles will appear in the main feed automatically</li>
            <li>Use these articles for your demo presentation</li>
            <li>Articles are stored on mock Arweave with permanent hashes</li>
          </ol>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Note
          </h4>
          <p className="text-yellow-800 dark:text-yellow-200">
            These are demo articles for testing and presentation purposes. They use mock
            Arweave storage. For production, integrate real Bundlr/Arweave uploads.
          </p>
        </div>
      </div>
    </div>
  );
}
