"use client";

import ReporterRegistration from "@/components/ReporterRegistration";
import ArweaveUploadHelper from "@/components/ArweaveUploadHelper";
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, ReporterRegistryABI } from "@/lib/contracts";
import dynamic from "next/dynamic";

// Dynamically import PublishForm to avoid SSR issues
const PublishForm = dynamic(() => import("@/components/PublishForm"), { ssr: false });

export default function ReporterPage() {
  const [activeTab, setActiveTab] = useState<"register" | "upload" | "publish">("register");
  const [uploadedHash, setUploadedHash] = useState("");
  const { address } = useAccount();

  // Check if user can publish
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

  const handleUploadComplete = (hash: string, metadata: any) => {
    setUploadedHash(hash);
    console.log("Uploaded metadata:", metadata);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎤 Reporter Portal</h1>
          <p className="text-gray-600">
            Register as a verified reporter and upload content to decentralized storage
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("register")}
            className={`px-6 py-3 rounded-t-lg font-semibold transition ${
              activeTab === "register"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            📝 Registration
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-3 rounded-t-lg font-semibold transition ${
              activeTab === "upload"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            📤 Upload Content
          </button>
          {canPublish && (
            <button
              onClick={() => setActiveTab("publish")}
              className={`px-6 py-3 rounded-t-lg font-semibold transition ${
                activeTab === "publish"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              ✍️ Publish Article
            </button>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === "register" && <ReporterRegistration />}
            {activeTab === "upload" && (
              <ArweaveUploadHelper onUploadComplete={handleUploadComplete} />
            )}
            {activeTab === "publish" && <PublishForm />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">📊 Platform Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified Reporters</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Published Articles</span>
                  <span className="font-semibold">5,678</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Staked</span>
                  <span className="font-semibold">12,345 NEWS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Testing Mode</span>
                  <span className="font-semibold text-green-600">Active ✅</span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">📋 Role Requirements</h3>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-800">Reporter</p>
                  <p className="text-sm text-blue-700">Stake: 100 NEWS</p>
                  <p className="text-xs text-blue-600">Publish news articles</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-semibold text-purple-800">Analyzer</p>
                  <p className="text-sm text-purple-700">Stake: 50 NEWS</p>
                  <p className="text-xs text-purple-600">Analyze credibility</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-800">Verifier</p>
                  <p className="text-sm text-green-700">Stake: 25 NEWS</p>
                  <p className="text-xs text-green-600">Verify and score</p>
                </div>
              </div>
            </div>

            {/* Recently Uploaded */}
            {uploadedHash && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-lg mb-4">📦 Recently Uploaded</h3>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Latest Upload</p>
                  <code className="text-xs font-mono break-all text-green-800">
                    {uploadedHash}
                  </code>
                </div>
              </div>
            )}

            {/* Help */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">❓ Need Help?</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Registration:</strong> Submit your credentials and wait for verification
                </p>
                <p>
                  <strong>Staking:</strong> Lock NEWS tokens to meet role requirements
                </p>
                <p>
                  <strong>Upload:</strong> Store content permanently on Arweave/IPFS
                </p>
                <p>
                  <strong>Testing Mode:</strong> No staking required during beta
                </p>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Read Full Guide
              </button>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="font-bold mb-2">Verified Identity</h3>
            <p className="text-sm text-gray-600">
              Stake-based verification ensures only credible reporters can publish
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-bold mb-2">Permanent Storage</h3>
            <p className="text-sm text-gray-600">
              Content stored on Arweave is permanent and censorship-resistant
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-bold mb-2">Reputation System</h3>
            <p className="text-sm text-gray-600">
              Earn CRED tokens and build reputation through quality reporting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
