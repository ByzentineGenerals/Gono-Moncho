"use client";

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, ReporterRegistryABI } from '@/lib/contracts';

export default function DemoAdminPanel() {
  const { address } = useAccount();
  const [reporterAddress, setReporterAddress] = useState('');
  const [message, setMessage] = useState('');
  
  const { writeContract: verifyReporter, data: verifyHash, isPending: isVerifying } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: verifySuccess } = useWaitForTransactionReceipt({ hash: verifyHash });

  const handleVerifyReporter = () => {
    if (!reporterAddress) {
      setMessage('⚠️ Please enter reporter address');
      return;
    }
    
    verifyReporter({
      address: CONTRACT_ADDRESSES.ReporterRegistry,
      abi: ReporterRegistryABI,
      functionName: 'verifyReporter',
      args: [reporterAddress as `0x${string}`, true] // true = approve
    });
  };

  const handleVerifyMyself = () => {
    if (!address) {
      setMessage('⚠️ Please connect wallet first');
      return;
    }
    
    verifyReporter({
      address: CONTRACT_ADDRESSES.ReporterRegistry,
      abi: ReporterRegistryABI,
      functionName: 'verifyReporter',
      args: [address, true]
    });
  };

  if (verifySuccess && !message.includes('Success')) {
    setMessage('✅ Success! Reporter verified. Go back to Reporter Portal and refresh the page.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎬 Demo Admin Panel</h1>
          <p className="text-gray-600">Quick actions for live demonstration to judges</p>
        </div>

        <div className="space-y-6">
          {/* Quick Verify Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">✅ Reporter Verification</h2>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>📋 Demo Purpose:</strong> Verify yourself or any reporter address instantly.
                This simulates the DAO verification process without waiting.
              </p>
            </div>

            {/* Quick Verify Myself Button */}
            <div className="mb-6">
              <button
                onClick={handleVerifyMyself}
                disabled={isVerifying || isConfirming || !address}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isVerifying || isConfirming ? '⏳ Verifying...' : '✨ Verify My Account (Instant)'}
              </button>
              {address && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Your address: <code className="bg-gray-100 px-2 py-1 rounded">{address.slice(0, 10)}...{address.slice(-8)}</code>
                </p>
              )}
            </div>

            {/* Manual Address Input */}
            <div className="pt-6 border-t border-gray-200">
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                Or verify another reporter by address:
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="0x..."
                  value={reporterAddress}
                  onChange={(e) => setReporterAddress(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleVerifyReporter}
                  disabled={isVerifying || isConfirming}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying || isConfirming ? '⏳' : 'Verify'}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg ${
                message.includes('Success') ? 'bg-green-50 border-2 border-green-200' : 
                'bg-yellow-50 border-2 border-yellow-200'
              }`}>
                <p className={`text-sm font-medium ${
                  message.includes('Success') ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {message}
                </p>
              </div>
            )}
          </div>

          {/* Demo Instructions */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
            <h2 className="text-2xl font-bold mb-4 text-purple-900">📋 Live Demo Script for Judges</h2>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <h3 className="font-bold text-purple-900 mb-2">Step 1: Reporter Registration</h3>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Connect your MetaMask wallet (Polygon Amoy network)</li>
                  <li>• Go to <code className="bg-gray-100 px-2 py-0.5 rounded">/reporter</code> page</li>
                  <li>• Fill in registration details and submit</li>
                  <li>• You'll see "Status: Pending Verification"</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <h3 className="font-bold text-green-900 mb-2">Step 2: Quick Verification (This Page)</h3>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Return to this admin panel</li>
                  <li>• Click "Verify My Account" button above</li>
                  <li>• Wait for transaction confirmation (~3 seconds)</li>
                  <li>• Go back to Reporter Portal and refresh page</li>
                  <li>• Status now shows "Verified ✅"</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="font-bold text-blue-900 mb-2">Step 3: Register Verifier (Different Wallet)</h3>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Disconnect current wallet in MetaMask</li>
                  <li>• Connect different MetaMask account</li>
                  <li>• Network will auto-switch to Polygon Amoy</li>
                  <li>• Register as "Verifier" role in Reporter Portal</li>
                  <li>• Return here and verify that account too</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                <h3 className="font-bold text-orange-900 mb-2">Step 4: Publish & Verify Article</h3>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Switch back to reporter account</li>
                  <li>• Publish a demo article (free during testing mode)</li>
                  <li>• Article appears on homepage with "Pending" status</li>
                  <li>• Switch to verifier account</li>
                  <li>• Vote on the article (✅ Verify or ❌ Flag)</li>
                  <li>• Article status updates to "Verified"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">⚙️ Technical Info</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">Network</p>
                <p className="text-gray-600">Polygon Amoy Testnet</p>
                <p className="text-xs text-gray-500 mt-1">Auto-switches on connect</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">Testing Mode</p>
                <p className="text-gray-600">Enabled (No staking required)</p>
                <p className="text-xs text-gray-500 mt-1">All operations are FREE</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">Storage</p>
                <p className="text-gray-600">Mock Arweave (Demo mode)</p>
                <p className="text-xs text-gray-500 mt-1">No actual upload costs</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">Verification</p>
                <p className="text-gray-600">Instant (bypasses DAO)</p>
                <p className="text-xs text-gray-500 mt-1">For demo purposes only</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <a
              href="/bn/reporter"
              className="flex-1 text-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              📝 Go to Reporter Portal
            </a>
            <a
              href="/bn"
              className="flex-1 text-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              🏠 Go to Homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
