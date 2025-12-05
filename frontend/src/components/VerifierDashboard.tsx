"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES, VerificationABI } from "@/lib/contracts";
import { useToast } from "@/context/ToastContext";
import { useArticles } from "@/context/ArticleContext";
import { useTranslations } from 'next-intl';

interface Article {
  contentHash: string;
  author: string;
  timestamp: number;
  verificationStatus: number;
  credibilityScore: number;
  totalVotes: number;
}

export default function VerifierDashboard() {
  const t = useTranslations();
  const { address } = useAccount();
  const { showToast } = useToast();
  const { refreshArticles } = useArticles();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string>("");
  const [verificationScore, setVerificationScore] = useState<number>(5);

  const { writeContract: addVerifierScore, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: txError } = useWaitForTransactionReceipt({ hash: txHash });

  // Load articles from localStorage (demo articles published by reporters)
  useEffect(() => {
    const loadArticles = () => {
      const storedArticles = localStorage.getItem('demoArticles');
      if (storedArticles) {
        const parsed = JSON.parse(storedArticles);
        // Only show unverified articles (status 0 or 1) - verified ones (status 2) are on homepage
        const unverifiedArticles = parsed.filter((a: Article) => a.verificationStatus < 2);
        setArticles(unverifiedArticles);
      }
    };
    loadArticles();
    
    // Refresh every 5 seconds to catch new articles
    const interval = setInterval(loadArticles, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && selectedArticle) {
      showToast("✅ Verification score submitted successfully! Article will appear on homepage.", "success");
      
      // Update localStorage to mark article as verified
      const storedArticles = localStorage.getItem('demoArticles');
      console.log('Before update:', storedArticles);
      
      if (storedArticles) {
        const parsed = JSON.parse(storedArticles);
        const updated = parsed.map((article: Article) => {
          if (article.contentHash === selectedArticle) {
            return {
              ...article,
              verificationStatus: 2, // HUMAN_VERIFIED
              credibilityScore: verificationScore,
              totalVotes: (article.totalVotes || 0) + 1
            };
          }
          return article;
        });
        
        console.log('After update:', updated);
        localStorage.setItem('demoArticles', JSON.stringify(updated));
        
        // Trigger storage event manually for same-tab updates
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('refreshArticles'));
        
        // Remove verified article from verifier dashboard (already verified)
        const unverifiedArticles = updated.filter((a: Article) => a.verificationStatus !== 2);
        setArticles(unverifiedArticles);
      }
      
      // Refresh homepage to show the newly verified article
      setTimeout(() => {
        console.log('Triggering refreshArticles...');
        refreshArticles();
      }, 1000);
      
      setSelectedArticle("");
      setVerificationScore(5);
    }
  }, [isSuccess, selectedArticle, verificationScore, showToast, refreshArticles]);
  
  // Handle errors
  useEffect(() => {
    if (writeError) {
      showToast(`❌ Error: ${writeError.message}`, "error");
    }
    if (txError) {
      showToast("❌ Transaction failed. Please try again.", "error");
    }
  }, [writeError, txError, showToast]);

  const handleVerify = (contentHash: string) => {
    if (!address) {
      showToast("Please connect your wallet", "warning");
      return;
    }

    setSelectedArticle(contentHash);
  };

  const submitVerification = () => {
    if (!selectedArticle) return;

    addVerifierScore({
      address: CONTRACT_ADDRESSES.Verification,
      abi: VerificationABI,
      functionName: 'addVerifierScore',
      args: [selectedArticle, verificationScore],
    });
  };

  const getStatusLabel = (status: number) => {
    const labels = ['Pending', 'AI Verified', 'Human Verified', 'Disputed'];
    return labels[status] || 'Unknown';
  };

  const getStatusColor = (status: number) => {
    const colors = ['bg-yellow-100 text-yellow-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-red-100 text-red-800'];
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-6">🔍 Verifier Dashboard</h2>
      
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2">📋 Your Role: Verifier</h3>
        <p className="text-sm text-blue-800">
          Review published articles and assign credibility scores (1-10). Your votes help determine which content is trustworthy.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-2">✅ All articles verified!</p>
          <p className="text-sm text-gray-400">No pending articles at the moment. New submissions will appear here.</p>
          <p className="text-sm text-green-600 mt-2">Check the homepage to see verified articles!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-lg mb-3">📰 Published Articles ({articles.length})</h3>
          
          {articles.map((article, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(article.verificationStatus)}`}>
                      {getStatusLabel(article.verificationStatus)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Score: {article.credibilityScore}/10
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Author:</strong> {article.author.slice(0, 6)}...{article.author.slice(-4)}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Content Hash:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{article.contentHash.slice(0, 20)}...</code>
                  </p>
                  
                  <p className="text-xs text-gray-400">
                    Published: {new Date(article.timestamp).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => handleVerify(article.contentHash)}
                  disabled={isPending || isConfirming}
                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  ✅ Verify
                </button>
              </div>

              {selectedArticle === article.contentHash && (
                <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-3">Assign Credibility Score</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Score: {verificationScore}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={verificationScore}
                      onChange={(e) => setVerificationScore(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 (Low)</span>
                      <span>5 (Medium)</span>
                      <span>10 (High)</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={submitVerification}
                      disabled={isPending || isConfirming}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                    >
                      {isPending ? '⏳ Waiting for approval...' : 
                       isConfirming ? '⏳ Confirming transaction...' : 
                       '✅ Submit Score'}
                    </button>
                    <button
                      onClick={() => setSelectedArticle("")}
                      disabled={isPending || isConfirming}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                  {txHash && (
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Transaction Hash:</strong>{' '}
                      <a 
                        href={`https://amoy.polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
        <h3 className="font-bold text-purple-900 mb-2">💡 How Verification Works</h3>
        <ul className="text-sm text-purple-800 space-y-1 ml-4 list-disc">
          <li>Review articles published by reporters</li>
          <li>Assign a credibility score from 1-10 based on quality and accuracy</li>
          <li>Your vote is recorded on the blockchain (Polygon Amoy)</li>
          <li>Articles with high scores get promoted on the homepage</li>
          <li>Testing mode: Free transactions, no gas fees required</li>
        </ul>
        
        {/* Debug button */}
        <div className="mt-4 pt-4 border-t border-purple-300">
          <button
            onClick={() => {
              const data = localStorage.getItem('demoArticles');
              console.log('=== DEBUG: localStorage data ===');
              console.log(data);
              if (data) {
                const parsed = JSON.parse(data);
                console.log('Parsed:', parsed);
                const verified = parsed.filter((a: any) => a.verificationStatus === 2);
                console.log('Verified articles:', verified);
                alert(`Found ${verified.length} verified articles. Check console for details.`);
              } else {
                alert('No demo articles in localStorage');
              }
              refreshArticles();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
          >
            🔍 Debug: Check Storage & Refresh Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
