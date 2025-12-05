"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { polygonAmoy } from 'wagmi/chains';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ConnectButton() {
  const t = useTranslations();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  // Check if user is on wrong network and auto-switch
  useEffect(() => {
    if (isConnected && chainId !== polygonAmoy.id) {
      setShowNetworkWarning(true);
      // Auto-switch to Polygon Amoy after a short delay
      const timer = setTimeout(() => {
        switchChain({ chainId: polygonAmoy.id });
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNetworkWarning(false);
    }
  }, [isConnected, chainId, switchChain]);

  const handleSwitchNetwork = () => {
    switchChain({ chainId: polygonAmoy.id });
  };

  const handleConnect = async () => {
    try {
      await connect({ connector: injected() });
      // After connection, check and switch network if needed
      setTimeout(() => {
        if (chainId !== polygonAmoy.id) {
          switchChain({ chainId: polygonAmoy.id });
        }
      }, 500);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        {/* Network Warning - only show when wrong network */}
        {showNetworkWarning && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold text-red-700">
              ⚠️ {t('auth.wrongNetwork')}
            </span>
            <button
              onClick={handleSwitchNetwork}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-2 rounded transition-colors duration-200"
            >
              {t('auth.switchNetwork')}
            </button>
          </div>
        )}

        {/* Wallet Address with gradient background */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg px-4 py-2 border border-gray-300 shadow-sm">
          <span className="font-mono text-sm font-semibold text-gray-800">
            {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </span>
        </div>

        {/* Disconnect Button with modern styling */}
        <button
          onClick={() => disconnect()}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          {t('auth.disconnect')}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
    >
      <span>🔗</span>
      <span>{t('auth.connectWallet')}</span>
    </button>
  );
}