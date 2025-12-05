"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES, NewsStakingABI, NEWSABI } from "@/lib/contracts";
import { formatEther, parseEther } from "viem";
import { useToast } from "@/context/ToastContext";

export default function StakingSection() {
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const { showToast } = useToast();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get NEWS token balance
  const { data: newsBalance, refetch: refetchNewsBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.NEWS,
    abi: NEWSABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Get staked amount
  const { data: stakeData, refetch: refetchStakeData } = useReadContract({
    address: CONTRACT_ADDRESSES.NewsStaking,
    abi: NewsStakingABI,
    functionName: 'stakes',
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
      showToast("Transaction successful!", "success");
      refetchNewsBalance();
      refetchStakeData();
      setStakeAmount("");
      setUnstakeAmount("");
    }
  }, [isSuccess, refetchNewsBalance, refetchStakeData, showToast]);

  useEffect(() => {
    if (writeError) {
      showToast(writeError.message || "Transaction failed", "error");
    }
  }, [writeError, showToast]);

  const handleApprove = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }

    const amount = parseEther(stakeAmount);
    writeContract({
      address: CONTRACT_ADDRESSES.NEWS,
      abi: NEWSABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.NewsStaking, amount],
    });
  };

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }

    const amount = parseEther(stakeAmount);
    writeContract({
      address: CONTRACT_ADDRESSES.NewsStaking,
      abi: NewsStakingABI,
      functionName: 'stake',
      args: [amount],
    });
  };

  const handleUnstake = () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }

    const amount = parseEther(unstakeAmount);
    writeContract({
      address: CONTRACT_ADDRESSES.NewsStaking,
      abi: NewsStakingABI,
      functionName: 'unstake',
      args: [amount],
    });
  };

  if (!isConnected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">💰 Stake NEWS Tokens</h2>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">Please connect your wallet to stake tokens.</p>
        </div>
      </div>
    );
  }

  const newsBalanceFormatted = newsBalance ? formatEther(newsBalance) : "0";
  const stakedAmount = stakeData ? formatEther(stakeData[0] as bigint) : "0";
  const stakedAt = stakeData ? Number(stakeData[1]) : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">💰 Stake NEWS Tokens</h2>
      <p className="text-gray-600 mb-6">
        Stake your NEWS tokens to earn CRED reputation tokens and participate in governance.
      </p>

      {/* Balance Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 mb-1">Available NEWS</p>
          <p className="text-2xl font-bold text-blue-900">{parseFloat(newsBalanceFormatted).toFixed(2)}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800 mb-1">Staked NEWS</p>
          <p className="text-2xl font-bold text-green-900">{parseFloat(stakedAmount).toFixed(2)}</p>
          {isMounted && stakedAt > 0 && (
            <p className="text-xs text-green-700 mt-1">
              Since {new Date(stakedAt * 1000).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Stake Section */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-3">Stake Tokens</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Stake
            </label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.0"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isWriting || isConfirming || !stakeAmount}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isConfirming ? "Approving..." : "1. Approve"}
            </button>
            <button
              onClick={handleStake}
              disabled={isWriting || isConfirming || !stakeAmount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isConfirming ? "Staking..." : "2. Stake"}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            First approve the contract to spend your NEWS tokens, then stake them.
          </p>
        </div>
      </div>

      {/* Unstake Section */}
      {parseFloat(stakedAmount) > 0 && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-3">Unstake Tokens</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Unstake
              </label>
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                max={stakedAmount}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleUnstake}
              disabled={isWriting || isConfirming || !unstakeAmount}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isConfirming ? "Unstaking..." : "Unstake"}
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">ℹ️ How Staking Works</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Stake NEWS tokens to become eligible for journalist verification</li>
          <li>• Earn CRED reputation tokens over time</li>
          <li>• Higher stake = more voting power in DAO governance</li>
          <li>• Unstake anytime, but may affect your voting power</li>
        </ul>
      </div>
    </div>
  );
}
