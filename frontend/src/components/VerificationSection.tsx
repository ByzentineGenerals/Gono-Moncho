"use client";

import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { VerificationABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { useArticles } from "@/context/ArticleContext";

type Props = {
  articleId: number;
  contentHash?: string;
  currentScore?: number;
  status?: "Verified" | "Pending";
  statusLabel?: string; // Detailed status label
};

export default function VerificationSection({
  articleId,
  contentHash,
  currentScore,
  status,
  statusLabel,
}: Props) {
  const { address } = useAccount();
  const { refreshArticles, refreshArticleByHash } = useArticles();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [localVotes, setLocalVotes] = useState({ positive: 0, negative: 0 });
  const [userVote, setUserVote] = useState<'positive' | 'negative' | null>(null);
  
  // Load votes from localStorage on mount
  useEffect(() => {
    const voteKey = `article_verification_${articleId}`;
    const userVoteKey = `user_verification_${articleId}_${address}`;
    
    const storedVotes = localStorage.getItem(voteKey);
    if (storedVotes) {
      const votes = JSON.parse(storedVotes);
      setLocalVotes(votes);
    }
    
    if (address) {
      const storedUserVote = localStorage.getItem(userVoteKey);
      if (storedUserVote) {
        setUserVote(storedUserVote as 'positive' | 'negative');
      }
    }
  }, [articleId, address]);
  
  // Fetch news item details from contract (includes verifierScores array)
  const { data: newsItemData, refetch: refetchNewsItem } = useReadContract({
    address: CONTRACT_ADDRESSES.Verification,
    abi: VerificationABI,
    functionName: 'newsItems',
    args: contentHash ? [contentHash] : undefined,
    query: {
      enabled: !!contentHash,
    }
  });

  const {
    writeContract,
    data: txHash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isConfirmError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess && contentHash) {
      setToast({ message: "Transaction confirmed! Article verification updated.", type: "success" });
      // Refetch scores and article data
      refetchNewsItem();
      refreshArticleByHash(contentHash).catch(() => {
        refreshArticles();
      });
      setTimeout(() => setToast(null), 5000);
    } else if (isSuccess) {
      setToast({ message: "Transaction confirmed! Article verification updated.", type: "success" });
      refreshArticles();
      setTimeout(() => setToast(null), 5000);
    }
  }, [isSuccess, contentHash, refreshArticles, refreshArticleByHash, refetchNewsItem]);

  useEffect(() => {
    if (writeError || isConfirmError) {
      setToast({ 
        message: writeError?.message || "Transaction failed. Please try again.", 
        type: "error" 
      });
      setTimeout(() => setToast(null), 5000);
    }
  }, [writeError, isConfirmError]);

  const disabled = !address || isWriting || isConfirming;

  // Auto-verify article function
  const autoVerifyArticle = (articleId: string) => {
    const existing = localStorage.getItem('demoArticles');
    if (!existing) return;
    
    try {
      const articles = JSON.parse(existing);
      const updated = articles.map((a: any) => {
        if (a.contentHash === articleId || a.id === articleId) {
          return {
            ...a,
            verificationStatus: 2, // HUMAN_VERIFIED
            credibilityScore: a.credibilityScore || 8,
            totalVotes: (a.totalVotes || 0) + 1
          };
        }
        return a;
      });
      
      localStorage.setItem('demoArticles', JSON.stringify(updated));
      // Trigger ArticleContext refresh
      if (refreshArticles) {
        refreshArticles();
      }
    } catch (e) {
      console.error('Error auto-verifying article:', e);
    }
  };

  const handleVote = (voteType: 'positive' | 'negative') => {
    if (!address) {
      setToast({ message: "Please connect your wallet to vote", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const voteKey = `article_verification_${articleId}`;
    const userVoteKey = `user_verification_${articleId}_${address}`;
    
    let newPositive = localVotes.positive;
    let newNegative = localVotes.negative;
    
    // Remove previous vote if exists
    if (userVote === 'positive') {
      newPositive--;
    } else if (userVote === 'negative') {
      newNegative--;
    }
    
    // Add new vote if different from previous
    if (userVote === voteType) {
      // User is removing their vote
      setUserVote(null);
      localStorage.removeItem(userVoteKey);
      setToast({ message: "Vote removed successfully!", type: "success" });
    } else {
      // User is voting or changing vote
      if (voteType === 'positive') {
        newPositive++;
      } else {
        newNegative++;
      }
      setUserVote(voteType);
      localStorage.setItem(userVoteKey, voteType);
      setToast({ 
        message: `Voted ${voteType === 'positive' ? 'Authentic' : 'Misinformation'}!`, 
        type: "success" 
      });
      
      // Auto-verify the article when user votes
      autoVerifyArticle(articleId);
    }
    
    // Update vote counts
    const newVotes = { positive: newPositive, negative: newNegative };
    setLocalVotes(newVotes);
    localStorage.setItem(voteKey, JSON.stringify(newVotes));
    
    setTimeout(() => setToast(null), 3000);
    
    // Also submit to blockchain if contentHash exists
    if (contentHash) {
      writeContract({
        address: CONTRACT_ADDRESSES.Verification,
        abi: VerificationABI,
        functionName: "addVerifierScore",
        args: [contentHash, BigInt(voteType === 'positive' ? 100 : 0)],
      });
    }
  };

  const handleVerify = () => handleVote('positive');
  const handleFlag = () => handleVote('negative');

  const getStatusColor = (label?: string) => {
    if (!label) return "text-gray-600";
    if (label.includes("Human Verified")) return "text-green-600";
    if (label.includes("AI Verified")) return "text-blue-600";
    if (label.includes("Disputed")) return "text-red-600";
    return "text-yellow-600";
  };

  const getStatusText = (statusCode?: number): string => {
    if (!statusCode) return "Pending";
    switch (statusCode) {
      case 0: return "Pending";
      case 1: return "AI Verified";
      case 2: return "Human Verified";
      case 3: return "Disputed";
      default: return "Unknown";
    }
  };

  // Extract data from contract response
  // newsItems returns: [reporter, arweaveHash, analyzerScores[], verifierScores[], status, credibilityScore]
  const verifierScoresArray = newsItemData ? (newsItemData[3] as bigint[]) : [];
  const verificationStatus = newsItemData ? Number(newsItemData[4]) : 0;
  const contractCredibility = newsItemData ? Number(newsItemData[5]) : 0;
  
  // Use localStorage votes (for demo) or contract votes (for production)
  const positiveVotes = localVotes.positive;
  const negativeVotes = localVotes.negative;
  const totalVotes = positiveVotes + negativeVotes;

  return (
    <div className="p-8 lg:p-12">
      {toast && (
        <div
          className={`mb-6 p-4 rounded-xl shadow-lg animate-slide-down ${
            toast.type === "success"
              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-2 border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-2 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{toast.type === "success" ? "✅" : "❌"}</span>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🗳️</span>
          <h3 className="text-3xl font-bold text-gray-900">Cast Your Vote</h3>
        </div>
        <p className="text-gray-600 text-base leading-relaxed">
          Help verify this article&apos;s authenticity. Your vote directly influences the credibility score.
        </p>
      </div>

      {/* Vote Statistics Card */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-sm">
          <div className="text-sm font-semibold text-green-700 mb-1">✓ Authentic Votes</div>
          <div className="text-3xl font-black text-green-700">{positiveVotes}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-xl border-2 border-red-200 shadow-sm">
          <div className="text-sm font-semibold text-red-700 mb-1">✗ Disputed Votes</div>
          <div className="text-3xl font-black text-red-700">{negativeVotes}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
          <div className="text-sm font-semibold text-blue-700 mb-1">📊 Total Votes</div>
          <div className="text-3xl font-black text-blue-700">{totalVotes}</div>
        </div>
      </div>

      {/* Approval Rate Progress Bar */}
      {totalVotes > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-700">Community Approval Rate</span>
            <span className="text-lg font-black text-gray-900">
              {Math.round((positiveVotes / totalVotes) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-glow"
              style={{ width: `${(positiveVotes / totalVotes) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Voting Buttons */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={handleVerify}
          disabled={disabled}
          className={`group relative ${
            userVote === 'positive' 
              ? 'bg-gradient-to-r from-green-600 to-emerald-700 ring-4 ring-green-300' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
          } disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 disabled:hover:translate-y-0 disabled:cursor-not-allowed overflow-hidden`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
            <span className="text-2xl">✓</span>
            {isWriting || isConfirming ? "Processing..." : userVote === 'positive' ? "✓ You Voted Authentic" : "Confirm Authentic"}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </button>
        <button
          onClick={handleFlag}
          disabled={disabled}
          className={`group relative ${
            userVote === 'negative' 
              ? 'bg-gradient-to-r from-red-600 to-rose-700 ring-4 ring-red-300' 
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
          } disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 disabled:hover:translate-y-0 disabled:cursor-not-allowed overflow-hidden`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
            <span className="text-2xl">✗</span>
            {isWriting || isConfirming ? "Processing..." : userVote === 'negative' ? "✗ You Flagged This" : "Flag as Misinformation"}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </button>
      </div>

      {/* User Vote Info */}
      {userVote && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800 text-center">
            ✓ You voted <strong>{userVote === 'positive' ? 'Authentic' : 'Misinformation'}</strong> on this article. Click the button again to remove your vote.
          </p>
        </div>
      )}

      {/* Info Message */}
      {!address && (
        <div className="p-5 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Connect Wallet to Vote</p>
              <p className="text-sm text-yellow-700">
                Please connect your wallet to participate in article verification voting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}