# Frontend Integration Guide - New Features

This directory contains React components and hooks for integrating the new Gono Moncho platform features into the frontend.

## 📦 Components Created

### 1. **ProofOfHumanityCard.tsx**
Privacy-preserving Sybil resistance verification interface.

**Features:**
- Display verification status
- Show social metrics (connections, confidence score)
- Add social connections
- Submit verification proofs

**Usage:**
```tsx
import ProofOfHumanityCard from '@/components/ProofOfHumanityCard';

<ProofOfHumanityCard />
```

---

### 2. **AnonymousPublishCard.tsx**
Zero-knowledge proof anonymous publishing interface.

**Features:**
- Commit content hash (step 1)
- Reveal content with proof (step 2)
- Track commitment status
- Category selection

**Usage:**
```tsx
import AnonymousPublishCard from '@/components/AnonymousPublishCard';

<AnonymousPublishCard />
```

**Important:** Save the salt value after committing - it's needed for reveal!

---

### 3. **RewardsDashboard.tsx**
CRED token rewards tracking and claiming.

**Features:**
- Display total CRED earned
- Show contribution breakdown (publishing, verification, governance)
- Claim staking rewards
- Real-time balance updates

**Usage:**
```tsx
import RewardsDashboard from '@/components/RewardsDashboard';

<RewardsDashboard />
```

---

### 4. **CouncilReviewCard.tsx**
Journalistic Integrity Council review interface.

**Features:**
- Request expert review for content
- View review status and votes
- Cast votes (for council members)
- Provide detailed feedback

**Usage:**
```tsx
import CouncilReviewCard from '@/components/CouncilReviewCard';

<CouncilReviewCard />
```

---

### 5. **VotingPowerCard.tsx**
Reputation-weighted voting power visualization.

**Features:**
- Display total voting power
- Show stake vs. reputation breakdown
- Visual progress bars
- 50/50 hybrid model visualization

**Usage:**
```tsx
import VotingPowerCard from '@/components/VotingPowerCard';

<VotingPowerCard 
  stakingContract={STAKING_ADDRESS}
  credToken={CRED_ADDRESS}
/>
```

---

## 🎣 Hooks (useNewFeatures.ts)

### Token Economics
- `useTokenEconomicsStats()` - Get revenue/burn stats
- `useCollectRevenue()` - Collect syndication/analytics revenue

### Proof of Humanity
- `useIsVerifiedHuman(address)` - Check verification status
- `useSocialMetrics(address)` - Get social graph metrics
- `useSubmitProof()` - Submit verification proof

### Zero-Knowledge Publishing
- `useCommitAnonymousPublish()` - Commit content hash
- `useRevealContent()` - Reveal committed content
- `useGetCommitment(commitId)` - Get commitment details

### CRED Rewards
- `useUserRewardStats(address)` - Get user reward statistics
- `useClaimStakingRewards()` - Claim staking rewards

### Council Review
- `useRequestReview()` - Request expert review
- `useCastVote()` - Cast council vote
- `useGetReview(reviewId)` - Get review details

### Voting Power
- `useVotingPower(voter, staking, cred)` - Calculate voting power
- `useVotingPowerBreakdown(voter, staking, cred)` - Get detailed breakdown

---

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install viem wagmi
```

### 2. Update Contract Addresses
Edit `frontend/src/lib/contracts/newFeatures.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  TokenEconomics: "0xYOUR_DEPLOYED_ADDRESS",
  ProofOfHumanity: "0xYOUR_DEPLOYED_ADDRESS",
  ZeroKnowledgePublishing: "0xYOUR_DEPLOYED_ADDRESS",
  CREDRewardDistributor: "0xYOUR_DEPLOYED_ADDRESS",
  JournalisticIntegrityCouncil: "0xYOUR_DEPLOYED_ADDRESS",
  ReputationWeightedVoting: "0xYOUR_DEPLOYED_ADDRESS",
};
```

### 3. Import Components
Add to your main dashboard or feature pages:

```tsx
import ProofOfHumanityCard from '@/components/ProofOfHumanityCard';
import AnonymousPublishCard from '@/components/AnonymousPublishCard';
import RewardsDashboard from '@/components/RewardsDashboard';
import CouncilReviewCard from '@/components/CouncilReviewCard';
import VotingPowerCard from '@/components/VotingPowerCard';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ProofOfHumanityCard />
      <RewardsDashboard />
      <AnonymousPublishCard />
      <VotingPowerCard 
        stakingContract={STAKING_ADDRESS}
        credToken={CRED_ADDRESS}
      />
      <CouncilReviewCard />
    </div>
  );
}
```

---

## 🎨 UI Components Required

Ensure you have these shadcn/ui components installed:

```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
```

Install toast notifications:
```bash
npm install sonner
```

---

## 🔐 Security Considerations

### Anonymous Publishing
1. **Never lose the salt value** - it's required for reveal
2. Wait minimum 1 hour between commit and reveal
3. Use Tor/VPN for enhanced privacy
4. Don't reuse commitments

### Proof of Humanity
1. Only share trusted social connections
2. Don't link all accounts publicly
3. Confidence scores are visible on-chain

### Rewards
1. Claim staking rewards regularly (daily)
2. Monitor for cooldown periods
3. Track earned vs. available balance

---

## 📊 Event Listening

Listen to contract events for real-time updates:

```typescript
import { useWatchContractEvent } from 'wagmi';

// Listen for reward distributions
useWatchContractEvent({
  address: CONTRACT_ADDRESSES.CREDRewardDistributor,
  abi: CREDRewardDistributorABI,
  eventName: 'RewardDistributed',
  onLogs(logs) {
    console.log('New rewards:', logs);
    // Refresh UI, show notifications
  },
});

// Listen for anonymous publishes
useWatchContractEvent({
  address: CONTRACT_ADDRESSES.ZeroKnowledgePublishing,
  abi: ZeroKnowledgePublishingABI,
  eventName: 'AnonymousPublishCommitted',
  onLogs(logs) {
    console.log('New anonymous publish:', logs);
  },
});
```

---

## 🧪 Testing

Test components in isolation:

```bash
npm run dev
```

Navigate to:
- `/dashboard` - Main dashboard with all features
- `/rewards` - Rewards dashboard
- `/governance` - Voting power and council
- `/anonymous` - Anonymous publishing

---

## 📱 Responsive Design

All components are mobile-responsive:
- Grid layout adjusts for small screens
- Touch-friendly buttons
- Scrollable content areas
- Collapsible sections

---

## 🌐 Network Configuration

Update your wagmi config for Polygon Amoy testnet:

```typescript
import { polygonAmoy } from 'wagmi/chains';

export const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
});
```

---

## 🚀 Deployment Checklist

- [ ] Update all contract addresses
- [ ] Test on Polygon Amoy testnet
- [ ] Verify ABIs match deployed contracts
- [ ] Test all user flows (commit/reveal, vote, claim)
- [ ] Add error handling and loading states
- [ ] Implement event listeners
- [ ] Add analytics tracking
- [ ] Test mobile responsiveness
- [ ] Security review for anonymous features
- [ ] Load testing for concurrent users

---

## 📝 Next Steps

1. **Deploy Contracts** to testnet and update addresses
2. **Test Integration** with deployed contracts
3. **Add Analytics** for user behavior tracking
4. **Implement Notifications** for important events
5. **Create Admin Panel** for council member management
6. **Add Content Moderation** tools
7. **Build Mobile App** using React Native
8. **Implement Subgraph** for event indexing

---

## 🆘 Troubleshooting

### Component Not Rendering
- Check if wallet is connected
- Verify contract addresses are correct
- Ensure network is Polygon Amoy

### Transaction Failing
- Check gas limits
- Verify user has sufficient balance
- Ensure cooldown periods have passed
- Check contract is not paused

### Hook Returning Undefined
- Verify ABI matches deployed contract
- Check function name spelling
- Ensure contract is deployed at address
- Test contract on block explorer

---

## 📚 Additional Resources

- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Polygon Amoy Faucet](https://faucet.polygon.technology)

---

**For questions or issues, refer to the main project README or create a GitHub issue.**
