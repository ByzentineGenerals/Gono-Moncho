"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES, NewsDAOABI, CREDABI } from "@/lib/contracts";
import { formatEther } from "viem";
import Link from "next/link";
import DelegationSection from "@/components/DelegationSection";
import StakingSection from "@/components/StakingSection";

type Proposal = {
  id: bigint;
  pType: number;
  proposer: string;
  forVotes: bigint;
  againstVotes: bigint;
  createdAt: bigint;
  executed: boolean;
};

const PROPOSAL_TYPES = {
  0: "General Governance",
  1: "Parameter Change",
  2: "Emergency Action",
  3: "Treasury Management",
};

const PROPOSAL_EMOJIS = {
  0: "🏛️",
  1: "⚙️",
  2: "🚨",
  3: "💰",
};

export default function GovernancePage() {
  const { address, isConnected } = useAccount();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [voteAmount, setVoteAmount] = useState("");
  const [proposalType, setProposalType] = useState<number>(0);

  // Check user's CRED balance (voting power)
  const { data: credBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.CRED,
    abi: CREDABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const {
    writeContract,
    data: txHash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      setToast({ message: "Transaction confirmed successfully!", type: "success" });
      setTimeout(() => setToast(null), 5000);
      setVoteAmount("");
      setSelectedProposal(null);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (writeError) {
      setToast({ 
        message: writeError.message || "Transaction failed. Please try again.", 
        type: "error" 
      });
      setTimeout(() => setToast(null), 5000);
    }
  }, [writeError]);

  const handleCreateProposal = () => {
    if (!isConnected) {
      setToast({ message: "Please connect your wallet first", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESSES.NewsDAO,
      abi: NewsDAOABI,
      functionName: 'createProposal',
      args: [proposalType],
    });
  };

  const handleVote = (proposalId: number, support: boolean) => {
    if (!isConnected) {
      setToast({ message: "Please connect your wallet first", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (!voteAmount || parseFloat(voteAmount) <= 0) {
      setToast({ message: "Please enter a valid vote amount", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const votes = BigInt(Math.floor(parseFloat(voteAmount) * 1e18));

    writeContract({
      address: CONTRACT_ADDRESSES.NewsDAO,
      abi: NewsDAOABI,
      functionName: 'vote',
      args: [BigInt(proposalId), support, votes],
    });
  };

  const votingPower = credBalance ? formatEther(credBalance) : "0";
  const hasVotingPower = credBalance && credBalance > BigInt(0);

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen animate-fade-in">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200 group">
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span>Back to Articles</span>
          </Link>
        </div>

        {toast && (
          <div
            className={`mb-6 p-5 rounded-xl shadow-lg animate-slide-down ${
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

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-12 mb-8 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10">
            <h1 className="text-5xl font-black mb-4 flex items-center gap-3">
              <span>🏛️</span> DAO Governance
            </h1>
            <p className="text-xl text-primary-50 mb-6 max-w-3xl">
              Shape the future of decentralized journalism. Use your CRED tokens to create proposals and vote on important platform decisions.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-black text-white">{votingPower}</div>
                <div className="text-sm text-primary-100">Your Voting Power (CRED)</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-black text-white">{hasVotingPower ? "✓" : "✗"}</div>
                <div className="text-sm text-primary-100">Eligible to Vote</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-black text-white">∞</div>
                <div className="text-sm text-primary-100">Active Proposals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Staking Section */}
        <div className="mb-8">
          <StakingSection />
        </div>

        {/* Delegation Section */}
        <div className="mb-8">
          <DelegationSection />
        </div>

        {/* Create Proposal Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <span>✨</span> Create New Proposal
            </h2>
            <p className="text-indigo-100 mt-2">Submit a proposal for community vote</p>
          </div>
          <div className="p-8">
            {isConnected ? (
              <div>
                <div className="mb-6">
                  <label className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📋</span> Proposal Type
                  </label>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    {Object.entries(PROPOSAL_TYPES).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setProposalType(Number(key))}
                        className={`p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                          proposalType === Number(key)
                            ? 'border-primary-500 bg-primary-50 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-3xl mb-2">{PROPOSAL_EMOJIS[Number(key) as keyof typeof PROPOSAL_EMOJIS]}</div>
                        <div className="font-bold text-gray-900">{value}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreateProposal}
                  disabled={isWriting || isConfirming}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isWriting || isConfirming ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                      <span>Creating Proposal...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Submit Proposal</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-center">
                <span className="text-4xl mb-3 block">🔒</span>
                <p className="font-bold text-yellow-800 mb-2">Connect Wallet to Participate</p>
                <p className="text-sm text-yellow-700">Please connect your wallet to create proposals and vote.</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Proposals Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <span>📊</span> Active Proposals
            </h2>
            <p className="text-purple-100 mt-2">Vote on community proposals</p>
          </div>
          <div className="p-8">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-200 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="font-bold text-yellow-800 mb-2">
                    Proposal Indexing Required
                  </p>
                  <p className="text-sm text-yellow-700 mb-2">
                    To display all proposals, you'll need to integrate:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                    <li>• Index ProposalCreated events from the contract</li>
                    <li>• Set up a subgraph for efficient querying</li>
                    <li>• Use a backend API to cache proposal data</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Example Proposal Card */}
            <div className="border-2 border-gray-200 rounded-xl p-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Example Proposal #1</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl">🏛️</span>
                    <p className="text-sm text-gray-600 font-medium">General Governance</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-bold border-2 border-green-200">
                  ✓ Active
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                  <p className="text-sm text-green-700 font-semibold mb-1">✓ For Votes</p>
                  <p className="text-2xl font-black text-green-700">0 CRED</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border-2 border-red-200">
                  <p className="text-sm text-red-700 font-semibold mb-1">✗ Against Votes</p>
                  <p className="text-2xl font-black text-red-700">0 CRED</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <input
                  type="number"
                  placeholder="Enter vote amount..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled
                />
                <button
                  disabled
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg"
                >
                  Vote For
                </button>
                <button
                  disabled
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg"
                >
                  Vote Against
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
