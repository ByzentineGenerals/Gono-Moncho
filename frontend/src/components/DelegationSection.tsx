"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES, DelegationRegistryABI, CREDABI } from "@/lib/contracts";
import { formatEther, isAddress } from "viem";
import { useTranslations } from 'next-intl';

export default function DelegationSection() {
  const t = useTranslations();
  const { address, isConnected } = useAccount();
  const [delegateAddress, setDelegateAddress] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Get current delegatee (topic 0 = general governance delegation)
  const { data: currentDelegatee, refetch: refetchDelegatee } = useReadContract({
    address: CONTRACT_ADDRESSES.DelegationRegistry,
    abi: DelegationRegistryABI,
    functionName: 'getDelegate',
    args: address ? [address, BigInt(0)] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Get CRED balance
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
      setToast({ message: "Delegation updated successfully!", type: "success" });
      refetchDelegatee();
      setTimeout(() => setToast(null), 5000);
      setDelegateAddress("");
    }
  }, [isSuccess, refetchDelegatee]);

  useEffect(() => {
    if (writeError) {
      setToast({ 
        message: writeError.message || "Transaction failed. Please try again.", 
        type: "error" 
      });
      setTimeout(() => setToast(null), 5000);
    }
  }, [writeError]);

  const handleDelegate = () => {
    if (!isAddress(delegateAddress)) {
      setToast({ message: "Please enter a valid Ethereum address", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESSES.DelegationRegistry,
      abi: DelegationRegistryABI,
      functionName: 'setDelegate',
      args: [BigInt(0), delegateAddress as `0x${string}`],
    });
  };

  const handleUndelegate = () => {
    if (!address) return;
    // Undelegate by setting delegate back to yourself (topic 0)
    writeContract({
      address: CONTRACT_ADDRESSES.DelegationRegistry,
      abi: DelegationRegistryABI,
      functionName: 'setDelegate',
      args: [BigInt(0), address],
    });
  };

  if (!isConnected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">🤝 {t('governance.votingDelegation')}</h2>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">{t('governance.connectWalletToDelegate')}</p>
        </div>
      </div>
    );
  }

  const isDelegating = currentDelegatee && currentDelegatee !== "0x0000000000000000000000000000000000000000";
  const votingPower = credBalance ? formatEther(credBalance) : "0";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">🤝 {t('governance.votingDelegation')}</h2>
      <p className="text-gray-600 mb-6">
        {t('governance.delegationDescription')}
      </p>

      {toast && (
        <div
          className={`mb-4 p-4 rounded-md ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 mb-1">{t('governance.yourVotingPower')}</p>
        <p className="text-2xl font-bold text-blue-900">{votingPower} CRED</p>
      </div>

      {isDelegating ? (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-green-800 mb-1">{t('governance.currentlyDelegatedTo')}</p>
              <p className="text-lg font-mono text-green-900 break-all">{currentDelegatee as string}</p>
              <p className="text-xs text-green-700 mt-2">
                {t('governance.delegateCanVote')}
              </p>
            </div>
            <button
              onClick={handleUndelegate}
              disabled={isWriting || isConfirming}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              {isConfirming ? t('governance.removing') : t('governance.undelegate')}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('governance.delegateAddress')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={delegateAddress}
              onChange={(e) => setDelegateAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleDelegate}
              disabled={!delegateAddress || isWriting || isConfirming}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isConfirming ? t('governance.delegating') : t('governance.delegate')}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('governance.enterDelegateAddress')}
          </p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">ℹ️ {t('governance.howDelegationWorks')}</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• {t('governance.delegationInfo1')}</li>
          <li>• {t('governance.delegationInfo2')}</li>
          <li>• {t('governance.delegationInfo3')}</li>
          <li>• {t('governance.delegationInfo4')}</li>
        </ul>
      </div>
    </div>
  );
}
