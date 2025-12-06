"use client";

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId, useReadContract } from 'wagmi';

export const dynamic = 'force-dynamic';
import { CONTRACT_ADDRESSES, ReporterRegistryABI } from '@/lib/contracts';
import { polygonAmoy } from 'wagmi/chains';

export default function DemoAdminPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [reporterAddress, setReporterAddress] = useState('');
  const [message, setMessage] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const { writeContract: verifyReporter, data: verifyHash, isPending: isVerifying, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: verifySuccess, isError: txError } = useWaitForTransactionReceipt({ hash: verifyHash });
  
  // Read reporter profile to check status
  const { data: myProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.ReporterRegistry,
    abi: ReporterRegistryABI,
    functionName: 'reporters',
    args: address ? [address] : undefined,
  });
  
  const STATUS_LABELS = ['NONE', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'];
  const ROLE_LABELS = ['NONE', 'REPORTER', 'ANALYZER', 'VERIFIER'];

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage(`✅ Copied to clipboard: ${text.slice(0, 10)}...${text.slice(-8)}`);
    setTimeout(() => setMessage(''), 3000);
  };

  // Auto-switch to Polygon Amoy if on wrong network
  useEffect(() => {
    if (isConnected && chainId !== polygonAmoy.id) {
      switchChain({ chainId: polygonAmoy.id });
    }
  }, [isConnected, chainId, switchChain]);

  // Handle transaction success
  useEffect(() => {
    if (verifySuccess) {
      setMessage('✅ Success! Reporter verified. Go back to Reporter Portal and refresh the page.');
    }
  }, [verifySuccess]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      setMessage(`❌ Error: ${writeError.message}`);
    }
    if (txError) {
      setMessage('❌ Transaction failed. Please try again.');
    }
  }, [writeError, txError]);

  const handleVerifyReporter = async () => {
    if (!reporterAddress) {
      setMessage('⚠️ Please enter reporter address');
      return;
    }

    // Check reporter status first
    setCheckingStatus(true);
    setMessage('🔍 Checking reporter status...');
    
    try {
      const profile = await checkReporterStatus(reporterAddress as `0x${string}`);
      if (!profile) return;
      
      // Ensure we're on Polygon Amoy
      if (chainId !== polygonAmoy.id) {
        setMessage('🔄 Switching to Polygon Amoy...');
        await switchChain({ chainId: polygonAmoy.id });
        setTimeout(() => executeVerify(reporterAddress as `0x${string}`), 1000);
      } else {
        executeVerify(reporterAddress as `0x${string}`);
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleVerifyMyself = async () => {
    if (!address) {
      setMessage('⚠️ Please connect wallet first');
      return;
    }

    // Check my status first
    setCheckingStatus(true);
    setMessage('🔍 Checking your registration status...');
    
    try {
      const profile = await checkReporterStatus(address);
      if (!profile) return;
      
      // Ensure we're on Polygon Amoy
      if (chainId !== polygonAmoy.id) {
        setMessage('🔄 Switching to Polygon Amoy...');
        await switchChain({ chainId: polygonAmoy.id });
        setTimeout(() => executeVerify(address), 1000);
      } else {
        executeVerify(address);
      }
    } finally {
      setCheckingStatus(false);
    }
  };
  
  const checkReporterStatus = async (targetAddress: `0x${string}`) => {
    try {
      const response = await fetch(`https://polygon-amoy.infura.io/v3/b0f04bd3f6a949e59cd25a1bc364d588`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: CONTRACT_ADDRESSES.ReporterRegistry,
            data: `0x${ReporterRegistryABI.find(f => f.name === 'reporters')?.name}${targetAddress.slice(2).padStart(64, '0')}`
          }, 'latest'],
          id: 1
        })
      });
      
      // For now, just use the hook data if available
      if (myProfile && targetAddress === address) {
        const status = Number(myProfile[1]);
        const role = Number(myProfile[0]);
        
        if (status === 0) {
          setMessage(`❌ Error: Address not registered! Go to Reporter Portal first and register as ${targetAddress === address ? 'REPORTER, ANALYZER, or VERIFIER' : 'a reporter'}.`);
          return null;
        }
        if (status === 2) {
          setMessage(`✅ Already verified! Status: ${STATUS_LABELS[status]}`);
          return null;
        }
        if (status !== 1) {
          setMessage(`❌ Cannot verify. Current status: ${STATUS_LABELS[status]}. Must be PENDING (1).`);
          return null;
        }
        
        setMessage(`✓ Valid! Role: ${ROLE_LABELS[role]}, Status: ${STATUS_LABELS[status]} - Proceeding with verification...`);
        return myProfile;
      }
      
      // If checking different address, assume it's valid (we don't have the data)
      return true;
    } catch (error) {
      console.error('Status check error:', error);
      setMessage('⚠️ Could not check status, proceeding anyway...');
      return true;
    }
  };

  const executeVerify = (targetAddress: `0x${string}`) => {
    setMessage('');
    verifyReporter({
      address: CONTRACT_ADDRESSES.ReporterRegistry,
      abi: ReporterRegistryABI,
      functionName: 'verifyReporter',
      args: [targetAddress, true],
      chainId: polygonAmoy.id,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎬 Demo Admin Panel</h1>
          <p className="text-gray-600">Quick actions for live demonstration to judges</p>
          
          {/* Multi-Verifier Info */}
          <div className="mt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">💡 Multi-Verifier Setup (Recommended for Demo)</h3>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Option 1:</strong> Verify yourself from your main account (costs ~0.01 POL)
            </p>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Option 2 (Best for Demo):</strong> Use a different wallet with POL to verify others:
            </p>
            <ul className="text-sm text-blue-800 ml-6 list-disc">
              <li>Switch to another MetaMask account that has POL</li>
              <li>Enter the address you want to verify in the "Verify Another Reporter" field</li>
              <li>Click verify - this simulates DAO/admin verification</li>
              <li>Lower gas costs when verifying others vs yourself</li>
            </ul>
          </div>
          
          {/* Common Error Alert */}
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <h3 className="font-bold text-red-900 mb-2">⚠️ Common Error: "Reporter not pending verification"</h3>
            <p className="text-sm text-red-800 mb-2">
              This error means you haven't registered yet, or you're already verified. 
            </p>
            <p className="text-sm text-red-800 font-bold">
              ✅ Solution: Go to <a href="/bn/reporter" className="underline">Reporter Portal</a> first and complete registration!
            </p>
          </div>
          </div>
          
          {/* Network Status Indicator */}
          {isConnected && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              chainId === polygonAmoy.id 
                ? 'bg-green-100 border-2 border-green-300' 
                : 'bg-red-100 border-2 border-red-300'
            }`}>
              <span className={`text-sm font-semibold ${
                chainId === polygonAmoy.id ? 'text-green-800' : 'text-red-800'
              }`}>
                {chainId === polygonAmoy.id 
                  ? '✅ Connected to Polygon Amoy' 
                  : '⚠️ Wrong Network - Switching to Polygon Amoy...'}
              </span>
            </div>
          )}
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
            
            {/* Current Status Display */}
            {isConnected && myProfile && (
              <div className={`mb-6 p-4 rounded-lg border-2 ${
                Number(myProfile[1]) === 2 ? 'bg-green-50 border-green-300' :
                Number(myProfile[1]) === 1 ? 'bg-blue-50 border-blue-300' :
                'bg-gray-50 border-gray-300'
              }`}>
                <h3 className="font-bold text-lg mb-2">📊 Your Current Status</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Role:</strong> {ROLE_LABELS[Number(myProfile[0])]}</div>
                  <div><strong>Status:</strong> {STATUS_LABELS[Number(myProfile[1])]}</div>
                  <div><strong>Address:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}</div>
                </div>
                {Number(myProfile[1]) === 0 && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                    <strong>⚠️ Not Registered!</strong> Go to <a href="/bn/reporter" className="underline font-bold">Reporter Portal</a> first to register.
                  </div>
                )}
                {Number(myProfile[1]) === 2 && (
                  <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded text-green-800 text-sm">
                    <strong>✅ Already Verified!</strong> You can now publish articles.
                  </div>
                )}
                {Number(myProfile[1]) === 1 && (
                  <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded text-blue-800 text-sm">
                    <strong>⏳ Pending Verification</strong> - Click the button below to verify instantly!
                    <div className="mt-2 pt-2 border-t border-blue-300">
                      <p className="font-bold mb-1">💡 Low on gas? Use multi-wallet verification:</p>
                      <div className="bg-white p-2 rounded border border-blue-200 mb-2 flex items-center justify-between">
                        <code className="text-xs">{address}</code>
                        <button
                          onClick={() => copyToClipboard(address!)}
                          className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <ol className="list-decimal ml-4 text-xs">
                        <li>Click "📋 Copy" button above</li>
                        <li>Switch to another MetaMask account with POL</li>
                        <li>Paste address in "Verify Another Reporter" field below</li>
                        <li>Click verify - cheaper gas!</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Verify Myself Button */}
            <div className="mb-6">
              <button
                onClick={handleVerifyMyself}
                disabled={isVerifying || isConfirming || !address || checkingStatus || (myProfile && Number(myProfile[1]) !== 1)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {checkingStatus ? '🔍 Checking Status...' :
                 isVerifying || isConfirming ? '⏳ Verifying...' : 
                 myProfile && Number(myProfile[1]) === 2 ? '✅ Already Verified' :
                 myProfile && Number(myProfile[1]) === 0 ? '❌ Not Registered' :
                 '✨ Verify My Account (Instant)'}
              </button>
              {address && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Your address: <code className="bg-gray-100 px-2 py-1 rounded">{address.slice(0, 10)}...{address.slice(-8)}</code>
                </p>
              )}
            </div>

            {/* Manual Address Input */}
            <div className="pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-blue-900 mb-2">💰 Gas Saving Tip!</h3>
                <p className="text-sm text-blue-800">
                  If gas is too high (0.12 POL), switch to another wallet with POL and verify using this field below. 
                  This is actually the <strong>recommended demo approach</strong> - it shows how DAO members verify each other!
                </p>
              </div>
              
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                🔑 Verify Another Reporter (Multi-Wallet Verification):
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Paste reporter's address (0x...)"
                  value={reporterAddress}
                  onChange={(e) => setReporterAddress(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleVerifyReporter}
                  disabled={isVerifying || isConfirming || checkingStatus}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                <h3 className="font-bold text-green-900 mb-2">Step 2A: Verification (Same Wallet - If You Have Gas)</h3>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Return to this admin panel</li>
                  <li>• Click "Verify My Account" button above</li>
                  <li>• Cost: ~0.01 POL (or 0.12 POL if gas spikes)</li>
                  <li>• Wait for transaction confirmation (~3 seconds)</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                <h3 className="font-bold text-yellow-900 mb-2">Step 2B: Verification (Different Wallet - RECOMMENDED) 💡</h3>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• <strong>Copy your wallet address</strong> from the status display above</li>
                  <li>• Switch to another MetaMask account that has POL</li>
                  <li>• Paste the address in "Verify Another Reporter" field</li>
                  <li>• Click verify - this is cheaper and demonstrates DAO governance!</li>
                  <li>• <strong>Benefit:</strong> Shows how community members verify each other</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="font-bold text-blue-900 mb-2">Step 3: Register Verifier (Different Wallet)</h3>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Disconnect current wallet in MetaMask</li>
                  <li>• Connect different MetaMask account</li>
                  <li>• Network will auto-switch to Polygon Amoy</li>
                  <li>• Register as "Verifier" role in Reporter Portal</li>
                  <li>• Use Step 2B approach to verify this account too</li>
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
    );
}
