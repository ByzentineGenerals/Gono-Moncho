# Quick Start Guide - Testing & Integration

## ✅ What's Ready to Test Now

### 1. Run Existing Contract Tests

These tests already work and will verify the platform's core functionality:

```bash
cd backend

# Test governance token
forge test --match-contract TokenTest -vv

# Test staking mechanism
forge test --match-contract StakingTest -vv

# Test DAO functionality
forge test --match-contract NewsDAOTest -vv

# Test reporter registration
forge test --match-contract ReporterRegistryTest -vv

# Test verification system
forge test --match-contract VerificationTest -vv
```

### 2. Frontend Integration (Ready to Use)

#### Install Components

```bash
cd frontend

# Install required dependencies
npm install viem wagmi sonner

# Install shadcn/ui components
npx shadcn-ui@latest add card button badge progress
```

#### Use Components

```tsx
// In your dashboard or feature page
import ProofOfHumanityCard from '@/components/ProofOfHumanityCard';
import RewardsDashboard from '@/components/RewardsDashboard';
import AnonymousPublishCard from '@/components/AnonymousPublishCard';
import VotingPowerCard from '@/components/VotingPowerCard';
import CouncilReviewCard from '@/components/CouncilReviewCard';

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gono Moncho Platform</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Proof of Humanity Verification */}
        <ProofOfHumanityCard />
        
        {/* CRED Rewards Dashboard */}
        <RewardsDashboard />
        
        {/* Anonymous Publishing */}
        <AnonymousPublishCard />
        
        {/* Voting Power Display */}
        <VotingPowerCard 
          stakingContract="0xYOUR_STAKING_ADDRESS"
          credToken="0xYOUR_CRED_ADDRESS"
        />
        
        {/* Council Review System */}
        <CouncilReviewCard />
      </div>
    </div>
  );
}
```

### 3. Deploy Contracts to Testnet

```bash
cd backend

# Set environment variables
export PRIVATE_KEY="your_private_key"
export POLYGON_AMOY_RPC="https://rpc-amoy.polygon.technology"

# Deploy all contracts
forge script script/Deploy.s.sol \
  --rpc-url $POLYGON_AMOY_RPC \
  --broadcast \
  --verify
```

After deployment, update contract addresses in:
- `frontend/src/lib/contracts/newFeatures.ts`

### 4. Test Smart Contracts Individually

```bash
cd backend

# Compile all contracts
forge build

# Check for compilation errors
forge build 2>&1 | grep "Error"

# If compilation succeeds, run tests
forge test -vv
```

---

## 📋 Deployment Order

When deploying to testnet, follow this order:

1. **Deploy Core Tokens**
   ```bash
   # NEWS token
   # CRED token
   ```

2. **Deploy Infrastructure**
   ```bash
   # NewsStaking
   # ReporterRegistry
   # NewsDAO
   ```

3. **Deploy New Features**
   ```bash
   # TokenEconomics
   # ProofOfHumanity
   # ZeroKnowledgePublishing
   # ChainlinkAIOracle (requires oracle setup)
   # JournalisticIntegrityCouncil
   # CREDRewardDistributor
   ```

4. **Configure Permissions**
   ```bash
   # Transfer CRED ownership to CREDRewardDistributor
   # Add verifiers to ProofOfHumanity
   # Add council members to JournalisticIntegrityCouncil
   # Setup oracle nodes for ChainlinkAIOracle
   ```

---

## 🔍 Verify Deployment

After deploying, test each contract:

### TokenEconomics
```bash
# Check revenue collection
cast call $TOKEN_ECONOMICS "getStats()" --rpc-url $POLYGON_AMOY_RPC
```

### ProofOfHumanity
```bash
# Check if address is verified
cast call $PROOF_OF_HUMANITY "isVerified(address)" <ADDRESS> --rpc-url $POLYGON_AMOY_RPC
```

### CREDRewardDistributor
```bash
# Get user reward stats
cast call $CRED_DISTRIBUTOR "getUserRewardStats(address)" <ADDRESS> --rpc-url $POLYGON_AMOY_RPC
```

---

## 🧪 Frontend Testing Locally

```bash
cd frontend

# Start development server
npm run dev

# Open browser to http://localhost:3000

# Test flows:
# 1. Connect wallet (MetaMask with Polygon Amoy)
# 2. Submit Proof of Humanity
# 3. Claim CRED rewards
# 4. Create anonymous publish commitment
# 5. View voting power breakdown
```

---

## 📊 Monitor Events

Listen to contract events in real-time:

```bash
# Watch for reward distributions
cast logs --address $CRED_DISTRIBUTOR \
  --event "RewardDistributed(address,uint256,string)" \
  --rpc-url $POLYGON_AMOY_RPC \
  --follow

# Watch for anonymous publishes
cast logs --address $ZK_PUBLISHING \
  --event "AnonymousPublishCommitted(uint256,bytes32)" \
  --rpc-url $POLYGON_AMOY_RPC \
  --follow
```

---

## 🐛 Troubleshooting

### Compilation Errors

If you get import errors:
1. Check `remappings.txt` in backend folder
2. Run `forge remappings` to regenerate
3. Ensure all dependencies in `lib/` folder

### Frontend Not Connecting

1. Check wallet is on Polygon Amoy testnet
2. Verify contract addresses in `newFeatures.ts`
3. Ensure ABIs match deployed contracts
4. Check console for RPC errors

### Tests Failing

1. Run `forge clean` to clear cache
2. Run `forge build` to recompile
3. Check for Solidity version mismatches
4. Verify OpenZeppelin contracts are installed

---

## 📚 Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Security Audit | `backend/SECURITY_AUDIT.md` |
| Integration Guide | `frontend/INTEGRATION_GUIDE.md` |
| Implementation Summary | `IMPLEMENTATION_SUMMARY.md` |
| Contract ABIs | `frontend/src/lib/contracts/newFeatures.ts` |
| React Hooks | `frontend/src/Hooks/useNewFeatures.ts` |
| UI Components | `frontend/src/components/*.tsx` |

---

## 🚀 Production Checklist

Before mainnet deployment:

- [ ] All tests passing (90%+ coverage)
- [ ] External security audit complete
- [ ] zkSNARK trusted setup ceremony
- [ ] Multi-sig wallet setup (3-of-5 minimum)
- [ ] Timelock controller deployed (48h delay)
- [ ] Oracle nodes configured (3+ independent)
- [ ] Emergency pause tested
- [ ] Bug bounty program running (30+ days)
- [ ] Community testing complete
- [ ] Gas optimization review
- [ ] Frontend production build tested
- [ ] Monitoring & alerting setup
- [ ] Incident response plan documented

---

## 🎯 Quick Commands

```bash
# Backend testing
cd backend && forge test -vv

# Frontend development
cd frontend && npm run dev

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast

# Check contract
cast call $CONTRACT "functionName()" --rpc-url $RPC

# Send transaction
cast send $CONTRACT "functionName()" --private-key $KEY --rpc-url $RPC
```

---

**You're all set!** Start with testing existing contracts, then deploy to testnet, and finally integrate the frontend components.
