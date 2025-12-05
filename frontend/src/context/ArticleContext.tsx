"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { CONTRACT_ADDRESSES, VerificationABI } from "@/lib/contracts";

interface Article {
  id: number;
  headline: string;
  summary: string;
  author: string;
  status: "Verified" | "Pending";
  statusLabel?: string; // Detailed status: "Pending", "AI Verified", "Human Verified", "Disputed"
  category: string;
  contentHash?: string;
  credibilityScore?: number;
  imageUrl?: string;
  videoUrl?: string;
  isOnChain?: boolean;
  body?: string;
}

interface ArticleContextType {
  articles: Article[];
  filteredArticles: Article[];
  categories: string[];
  selectedCategory: string;
  isLoading: boolean;
  setSelectedCategory: (category: string) => void;
  addArticle: (
    newArticle: Omit<Article, "id" | "status" | "author" | "category">
  ) => void;
  refreshArticles: () => Promise<void>;
  refreshArticleByHash: (contentHash: string) => Promise<void>;
}

const mockArticles: Article[] = [
  {
    id: 1,
    headline:
      "Bangladesh, Malaysia sign eight deals to boost bilateral cooperation",
    summary:
      "The signing ceremony took place in Putrajaya this morning, witnessed by prominent figures...",
    author: "Jane Doe",
    status: "Verified",
    category: "National",
    imageUrl: "https://picsum.photos/seed/politics/800/600",
  },
  {
    id: 2,
    headline: "Six banks shine, five hit record losses in first half of year",
    summary:
      "How did the first half of this year treat the banking sector? The answer depends on who you ask...",
    author: "John Smith",
    status: "Verified",
    category: "Business",
    imageUrl: "https://picsum.photos/seed/business/800/400",
  },
  {
    id: 3,
    headline: "AI Oracles in Decentralized Finance",
    summary:
      "A deep dive into how AI is making DeFi protocols smarter and more secure.",
    author: "AI Analyst",
    status: "Pending",
    category: "Tech & Startup",
    imageUrl: "https://picsum.photos/seed/tech/800/400",
  },
  {
    id: 4,
    headline: "Satyajit Ray's 'Tagore' Films: A Timeless Tribute",
    summary:
      "Before taking a close look at the three feature films that comprise Ray's tribute...",
    author: "Cultural Critic",
    status: "Verified",
    category: "Entertainment",
    imageUrl: "https://picsum.photos/seed/films/800/400",
  },
  {
    id: 5,
    headline: "Tigers begin practice for upcoming home series",
    summary:
      "The national cricket team has started their training camp at Mirpur stadium ahead of the series...",
    author: "Sports Desk",
    status: "Verified",
    category: "Sports",
    imageUrl: "https://picsum.photos/seed/sports/800/400",
  },
  {
    id: 6,
    headline: "Global markets react to new US tariff policies on China",
    summary:
      "The White House's halt on steeper tariffs will be in place until November 10, causing a stir in the global economy.",
    author: "Intl. Correspondent",
    status: "Verified",
    category: "World",
    imageUrl: "https://picsum.photos/seed/world/800/400",
  },
];

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

const newsPublishedEvent = parseAbiItem(
  "event NewsPublished(string indexed arweaveHash, address indexed reporter)"
);

// Map VerificationStatus enum: 0=PENDING, 1=AI_VERIFIED, 2=HUMAN_VERIFIED, 3=DISPUTED
const statusFromChain = (status: bigint): Article["status"] => {
  const statusNum = Number(status);
  if (statusNum >= 2) return "Verified"; // HUMAN_VERIFIED or DISPUTED
  return "Pending"; // PENDING or AI_VERIFIED (still pending human verification)
};

const getStatusLabel = (status: bigint): string => {
  const statusNum = Number(status);
  switch (statusNum) {
    case 0: return "Pending";
    case 1: return "AI Verified";
    case 2: return "Human Verified";
    case 3: return "Disputed";
    default: return "Unknown";
  }
};

const deriveCategories = (articles: Article[]) => [
  "All",
  ...Array.from(new Set(articles.map((a) => a.category))),
];

const MAX_CHAIN_ITEMS = 20;

const fetchArweaveMetadata = async (
  hash: string
): Promise<Partial<Article>> => {
  try {
    const response = await fetch(`https://arweave.net/${hash}`, {
      cache: "no-cache",
    });
    if (!response.ok) {
      throw new Error(`Arweave responded with ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return {
        headline: data.headline ?? data.title,
        summary:
          data.summary ??
          data.description ??
          (data.content ? String(data.content).slice(0, 280) : undefined),
        body: data.content ?? data.body,
        category: data.category ?? data.tag ?? "On-Chain",
        imageUrl: data.imageUrl ?? data.coverImage,
      };
    }

    const text = await response.text();
    return {
      headline: text.slice(0, 90),
      summary: text.slice(0, 240),
      body: text,
      category: "On-Chain",
    };
  } catch (error) {
    console.warn("Unable to load Arweave content for", hash, error);
    return {};
  }
};

export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const publicClient = usePublicClient();
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(false);

  const fetchArticlesFromChain = useCallback(async () => {
    // DEMO MODE: Prioritize localStorage, skip blockchain for now
    console.log('=== Fetching Articles (Demo Mode) ===');
    const storedArticles = localStorage.getItem('demoArticles');
    
    if (!publicClient) {
      // If no public client, only use localStorage
      console.log('No publicClient - Loading from localStorage only');
      console.log('localStorage content:', storedArticles);
      
      if (storedArticles) {
        const parsed = JSON.parse(storedArticles);
        console.log('Total demo articles:', parsed.length);
        
        const verifiedDemoArticles = parsed
          .filter((a: any) => a.verificationStatus === 2)
          .map((a: any, index: number) => ({
            id: index + 1,
            headline: a.headline || `Article ${a.contentHash.slice(0, 10)}...`,
            summary: a.content || `Content hash: ${a.contentHash}`,
            author: a.author,
            status: "Verified" as const,
            statusLabel: "Human Verified",
            category: "Demo",
            contentHash: a.contentHash,
            credibilityScore: a.credibilityScore || 0,
            imageUrl: `https://picsum.photos/seed/${a.contentHash.slice(0, 6)}/800/400`,
            isOnChain: false,
          }));
        
        console.log('Verified demo articles:', verifiedDemoArticles.length);
        setArticles(verifiedDemoArticles.length > 0 ? verifiedDemoArticles : mockArticles);
      } else {
        setArticles(mockArticles);
      }
      return;
    }
    
    // DEMO MODE: Load verified localStorage articles + always show mock articles
    let demoArticles: Article[] = [];
    if (storedArticles) {
      const parsed = JSON.parse(storedArticles);
      demoArticles = parsed
        .filter((a: any) => a.verificationStatus === 2)
        .map((a: any, index: number) => ({
          id: mockArticles.length + index + 1,
          headline: a.headline || `Article ${a.contentHash.slice(0, 10)}...`,
          summary: a.content || `Content hash: ${a.contentHash}`,
          author: a.author,
          status: "Verified" as const,
          statusLabel: "Human Verified",
          category: "Demo",
          contentHash: a.contentHash,
          credibilityScore: a.credibilityScore || 0,
          imageUrl: `https://picsum.photos/seed/${a.contentHash.slice(0, 6)}/800/400`,
          isOnChain: false,
        }));
      
      console.log('Demo mode - verified articles:', demoArticles.length);
    }
    
    // Combine demo articles with mock articles (demo articles first)
    const allArticles = [...demoArticles, ...mockArticles];
    console.log('Total articles (demo + mock):', allArticles.length);
    setArticles(allArticles);
    
    if (storedArticles) {
      return; // Skip blockchain if we have localStorage
    }
    
    setIsLoading(true);
    try {
      // Use pagination: fetch from last 10000 blocks instead of block 0 for better performance
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > BigInt(10000) ? latestBlock - BigInt(10000) : BigInt(0);
      
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.Verification,
        event: newsPublishedEvent,
        fromBlock,
        toBlock: "latest",
      });

      const uniqueHashes: string[] = [];
      const seen = new Set<string>();
      logs.forEach((log) => {
        const hash = log.args?.arweaveHash as string | undefined;
        if (hash && !seen.has(hash)) {
          seen.add(hash);
          uniqueHashes.push(hash);
        }
      });

      const recentHashes = uniqueHashes.slice(-MAX_CHAIN_ITEMS);

      const chainArticles = await Promise.all(
        recentHashes.map(async (hash, index) => {
          try {
            const response = (await publicClient.readContract({
              address: CONTRACT_ADDRESSES.Verification,
              abi: VerificationABI,
              functionName: "newsItems",
              args: [hash],
            })) as readonly [`0x${string}`, string, readonly bigint[], readonly bigint[], number, bigint];

            const [reporter, arweaveHash, analyzerScores, verifierScores, statusRaw, credibilityScore] = response;
            
            // Skip if reporter address is zero (article doesn't exist)
            if (reporter === "0x0000000000000000000000000000000000000000") {
              console.log(`Article ${hash.slice(0, 10)} not found on-chain, skipping`);
              return null;
            }
            
            const statusBigInt =
              typeof statusRaw === "bigint" ? statusRaw : BigInt(statusRaw);
            const metadata = await fetchArweaveMetadata(arweaveHash || hash);

            return {
              id: index + 1,
              headline:
                metadata.headline ?? `Submission ${hash.slice(0, 10)}…`,
              summary:
                metadata.summary ?? `Arweave reference ${arweaveHash || hash}`,
              author: reporter,
              status: statusFromChain(statusBigInt),
              statusLabel: getStatusLabel(statusBigInt),
              category: metadata.category ?? "On-Chain",
              contentHash: hash,
              credibilityScore: Number(credibilityScore),
              imageUrl:
                metadata.imageUrl ??
                `https://picsum.photos/seed/${hash.slice(0, 6)}/800/400`,
              body: metadata.body,
              isOnChain: true,
            } satisfies Article;
          } catch (error) {
            console.error(`Failed to fetch article ${hash}:`, error);
            return null;
          }
        })
      ).then(articles => articles.filter(Boolean) as Article[]);

      if (chainArticles.length > 0) {
        // Also load demo articles from localStorage
        const storedArticles = localStorage.getItem('demoArticles');
        let demoArticles: Article[] = [];
        
        console.log('=== Loading demo articles alongside chain articles ===');
        console.log('localStorage:', storedArticles);
        
        if (storedArticles) {
          const parsed = JSON.parse(storedArticles);
          console.log('Parsed demo articles:', parsed);
          console.log('Checking verification status of each article:');
          parsed.forEach((a: any) => {
            console.log(`- ${a.contentHash.slice(0, 10)}: status=${a.verificationStatus}`);
          });
          
          demoArticles = parsed
            .filter((a: any) => {
              const isVerified = a.verificationStatus === 2;
              console.log(`Article ${a.contentHash.slice(0, 10)} verified: ${isVerified}`);
              return isVerified;
            })
            .map((a: any, index: number) => ({
              id: chainArticles.length + index + 1,
              headline: a.headline || `Article ${a.contentHash.slice(0, 10)}...`,
              summary: a.content || `Content hash: ${a.contentHash}`,
              author: a.author,
              status: "Verified" as const,
              statusLabel: "Human Verified",
              category: "Demo",
              contentHash: a.contentHash,
              credibilityScore: a.credibilityScore || 0,
              imageUrl: `https://picsum.photos/seed/${a.contentHash.slice(0, 6)}/800/400`,
              isOnChain: false,
            }));
          
          console.log('Verified demo articles to display:', demoArticles.length);
        }
        
        const allArticles = [...demoArticles, ...chainArticles.reverse()];
        console.log('Total articles to display:', allArticles.length);
        setArticles(allArticles);
      } else {
        // Check localStorage even if no chain articles
        const storedArticles = localStorage.getItem('demoArticles');
        console.log('=== No chain articles, loading ONLY from localStorage ===');
        console.log('localStorage content:', storedArticles);
        
        if (storedArticles) {
          const parsed = JSON.parse(storedArticles);
          console.log('Total demo articles in storage:', parsed.length);
          console.log('Verification statuses:', parsed.map((a: any) => `${a.contentHash.slice(0, 8)}: ${a.verificationStatus}`));
          
          const demoArticles = parsed
            .filter((a: any) => {
              const isVerified = a.verificationStatus === 2;
              if (!isVerified) {
                console.log(`Filtering out ${a.contentHash.slice(0, 8)} - status: ${a.verificationStatus}`);
              }
              return isVerified;
            })
            .map((a: any, index: number) => ({
              id: index + 1,
              headline: a.headline || `Article ${a.contentHash.slice(0, 10)}...`,
              summary: a.content || `Content hash: ${a.contentHash}`,
              author: a.author,
              status: "Verified" as const,
              statusLabel: "Human Verified",
              category: "Demo",
              contentHash: a.contentHash,
              credibilityScore: a.credibilityScore || 0,
              imageUrl: `https://picsum.photos/seed/${a.contentHash.slice(0, 6)}/800/400`,
              isOnChain: false,
            }));
          
          console.log('Final verified articles to show:', demoArticles.length);
          setArticles(demoArticles.length > 0 ? demoArticles : mockArticles);
        } else {
          console.log('No localStorage data found, using mock articles');
          setArticles(mockArticles);
        }
      }
    } catch (error) {
      console.error("Failed to fetch on-chain articles", error);
      setArticles(mockArticles);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchArticlesFromChain();
    
    // Poll localStorage every 2 seconds for demo articles (ensures we catch updates)
    const pollInterval = setInterval(() => {
      const storedArticles = localStorage.getItem('demoArticles');
      if (storedArticles) {
        const parsed = JSON.parse(storedArticles);
        const verifiedCount = parsed.filter((a: any) => a.verificationStatus === 2).length;
        const currentVerifiedCount = articles.filter(a => a.category === "Demo").length;
        
        if (verifiedCount !== currentVerifiedCount) {
          console.log(`Detected change: ${currentVerifiedCount} -> ${verifiedCount} verified articles`);
          fetchArticlesFromChain();
        }
      }
    }, 2000);
    
    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demoArticles') {
        console.log('Storage changed, refreshing articles...');
        fetchArticlesFromChain();
      }
    };
    
    // Listen for custom refresh event
    const handleRefreshEvent = () => {
      console.log('Refresh event triggered, reloading articles...');
      fetchArticlesFromChain();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('refreshArticles', handleRefreshEvent);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refreshArticles', handleRefreshEvent);
    };
  }, [fetchArticlesFromChain, articles]);

  const filteredArticles = useMemo(
    () =>
      articles.filter(
        (article) =>
          selectedCategory === "All" || article.category === selectedCategory
      ),
    [articles, selectedCategory]
  );

  const addArticle = useCallback(
    (
      newArticle: Omit<Article, "id" | "status" | "author" | "category">
    ) => {
      const articleToAdd: Article = {
        ...newArticle,
        id: Date.now(),
        status: "Pending",
        author: "Pending Reporter",
        category: "User Submitted",
        imageUrl: newArticle.imageUrl ?? "https://picsum.photos/seed/new/800/400",
      };
      setArticles((prevArticles) => [articleToAdd, ...prevArticles]);
    },
    []
  );

  const refreshArticleByHash = useCallback(async (contentHash: string) => {
    if (!publicClient) return;
    
    try {
      const response = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.Verification,
        abi: VerificationABI,
        functionName: "newsItems",
        args: [contentHash],
      })) as readonly [`0x${string}`, string, readonly bigint[], readonly bigint[], number, bigint];

      const [reporter, arweaveHash, analyzerScores, verifierScores, statusRaw, credibilityScore] = response;
      const statusBigInt = typeof statusRaw === "bigint" ? statusRaw : BigInt(statusRaw);
      const metadata = await fetchArweaveMetadata(arweaveHash || contentHash);

      const updatedArticle: Article = {
        id: articles.find(a => a.contentHash === contentHash)?.id || Date.now(),
        headline: metadata.headline ?? `Submission ${contentHash.slice(0, 10)}…`,
        summary: metadata.summary ?? `Arweave reference ${arweaveHash || contentHash}`,
        author: reporter,
        status: statusFromChain(statusBigInt),
        statusLabel: getStatusLabel(statusBigInt),
        category: metadata.category ?? "On-Chain",
        contentHash,
        credibilityScore: Number(credibilityScore),
        imageUrl: metadata.imageUrl ?? `https://picsum.photos/seed/${contentHash.slice(0, 6)}/800/400`,
        body: metadata.body,
        isOnChain: true,
      };

      setArticles(prev => {
        const index = prev.findIndex(a => a.contentHash === contentHash);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = updatedArticle;
          return updated;
        }
        return [updatedArticle, ...prev];
      });
    } catch (error) {
      console.error("Failed to refresh article by hash", error);
    }
  }, [publicClient, articles]);

  const categories = useMemo(
    () => deriveCategories(articles),
    [articles]
  );

  const value = {
    articles,
    filteredArticles,
    categories,
    selectedCategory,
    isLoading,
    setSelectedCategory,
    addArticle,
    refreshArticles: fetchArticlesFromChain,
    refreshArticleByHash,
  };

  return (
    <ArticleContext.Provider value={value}>
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticles = () => {
  const context = useContext(ArticleContext);
  if (context === undefined) {
    throw new Error("useArticles must be used within an ArticleProvider");
  }
  return context;
};

