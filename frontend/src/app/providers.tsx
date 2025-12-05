"use client";

import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/context/ToastContext';
import { ArticleProvider } from '@/context/ArticleContext';

// 1. Create a wagmi config pointed at Polygon Amoy
export const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http('https://polygon-amoy.infura.io/v3/b0f04bd3f6a949e59cd25a1bc364d588'),
  },
});

// 2. Set up a QueryClient for data fetching
const queryClient = new QueryClient();

// 3. Create the Provider component
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ArticleProvider>
            {children}
          </ArticleProvider>
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}