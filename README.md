# Gono Moncho: Decentralized News Verification Platform

A blockchain-based platform for verifiable journalism that leverages decentralized technology to combat misinformation and enable transparent news verification.

> **Project Status:** 🚧 Active Development - Core functionality implemented, some features in progress

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

## Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Smart Contracts](#smart-contracts)
- [Project Structure](#project-structure)
- [Development Status](#development-status)
- [Contributing](#contributing)
- [License](#license)

## About The Project

Gono Moncho addresses critical challenges in modern journalism:

- **Censorship Resistance**: Decentralized publishing protects journalists from government oppression
- **Misinformation Combat**: Community-driven verification reduces fake news spread
- **Transparent Credibility**: On-chain voting and verification create accountable journalism
- **Permanent Storage**: Integration with Arweave ensures news cannot be deleted or altered

### Core Components

- **Dual-Token Economics**: NEWS (governance) + CRED (reputation) tokens
- **DAO Governance**: Community-driven decision making through NewsDAO
- **Role-Based Access**: Reporters, Analyzers, and Verifiers with distinct responsibilities
- **Decentralized Storage**: Permanent article storage via Arweave
- **Multi-Layer Verification**: Community voting and stake-weighted credibility scoring

## Key Features

```
gono-moncho/
├── backend/          # Solidity smart contracts (Foundry)
│   ├── src/         # Smart contract source code
│   ├── test/        # Contract tests
│   └── script/      # Deployment scripts
└── frontend/         # Next.js Web3 DApp
    ├── src/         # Frontend source code
    └── public/      # Static assets
```

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- MetaMask browser extension
- Git

### 1. Clone & Install
```bash
git clone https://github.com/ByzentineGenerals/Gono-Moncho.git
cd Gono-Moncho/frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Access at: http://localhost:3000

### 3. Configure MetaMask

**Add Polygon Amoy Testnet:**
- Network Name: `Polygon Amoy Testnet`
- RPC URL: `https://polygon-amoy.infura.io/v3/b0f04bd3f6a949e59cd25a1bc364d588`
- Chain ID: `80002`
- Currency Symbol: `MATIC`
- Block Explorer: `https://amoy.polygonscan.com/`

**Get Test MATIC:**
Visit https://faucet.polygon.technology/

---

## Demo / Judge Presentation

### Complete Demo Flow (5 minutes)

**All operations are FREE in testing mode!**

#### 1. Reporter Registration (1 min)
1. Navigate to **Reporter Portal** (top navigation)
2. Fill in credentials form
3. Select Role: **Reporter**
4. Click **Register as Reporter** → FREE (no MetaMask prompt)

#### 2. Auto-Verification (30 sec)
1. Click **Demo Helper** button (bottom-right floating button)
2. Click **"Auto-Verify Me as Reporter"**
3. Approve MetaMask transaction (FREE on testnet)
4. Wait for confirmation → Status shows "VERIFIED" ✅

#### 3. Upload Article to Arweave (1 min)
1. Go to **Upload Content** tab
2. Paste article JSON:
```json
{
  "title": "Blockchain Revolutionizes Journalism",
  "content": "Decentralized platforms are changing how news is verified...",
  "author": "Your Name",
  "date": "2025-11-25"
}
```
3. Click **Upload JSON to Arweave**
4. Copy generated Arweave hash

#### 4. Publish to Blockchain (1 min)
1. Go to **Publish Article** tab
2. Paste Arweave hash
3. Click **Publish to Blockchain**
4. Approve MetaMask (FREE testnet transaction)
5. Article published! 🎉

#### 5. Vote on Articles (30 sec)
1. Navigate to **Home** page
2. Click **Vote** on any article
3. Choose Support (👍) or Against (👎)
4. Enter vote weight (1-10)
5. Approve MetaMask (FREE testnet)
6. Vote recorded on-chain!

### 🎤 Presentation Script

**Opening (30 sec):**
> "Gono Moncho solves fake news through blockchain transparency and permanent storage. Reporters verify credentials, articles are stored permanently on Arweave, and community governance determines credibility through on-chain voting."

**Live Demo (3.5 min):**
Follow the 5-step flow above

**Technical Highlights (1 min):**
- ✅ Role-Based Access Control (Reporter/Analyzer/Verifier)
- ✅ Permanent Storage on Arweave
- ✅ Scalable on Polygon L2
- ✅ DAO Governance with Quadratic Voting
- ✅ Testing Mode for Easy Demos

**Closing (30 sec):**
> "Production-ready architecture with clear migration from testing to mainnet. All smart contracts deployed, frontend responsive, end-to-end features working."

---

## 📋 Deployed Contracts (Polygon Amoy Testnet)

| Contract | Address |
|----------|----------|
| NEWS Token | `0xd3091433da9a925c38682b28ffbae975ed06617a` |
| CRED Token | `0x95e29667e07767bd019b4a79f3979a416c30f573` |
| NewsStaking | `0x58321d7cb23248ca3f39f01e4480f4a8b166bfec` |
| NewsDAO | `0xccf0212b8c443ee148a36106f109b7b3c5250f51` |
| Verification | `0xe5672b7bf38e11d81feb07d77a35cf5499a0adeb` |
| ArweaveStorage | `0xc7311a7c71647edd9556938ad6f22afe4dc01a66` |
| DelegationRegistry | `0xea67b90c7d566ae98c4906fa8962844fb424e4f0` |
| ReporterRegistry | *Deploy before demo (see below)* |

---

## 🔧 Deploy ReporterRegistry (Optional)

### Option 1: Using Foundry
```bash
cd backend
export PRIVATE_KEY=your_private_key_here

forge script script/DeployReporterRegistry.s.sol \
  --rpc-url https://polygon-amoy.infura.io/v3/b0f04bd3f6a949e59cd25a1bc364d588 \
  --broadcast -vvvv
```

### Option 2: Using Remix IDE
1. Go to https://remix.ethereum.org
2. Copy `backend/src/verification/ReporterRegistry.sol`
3. Compile with Solidity 0.8.24
4. Deploy with:
   - `_newsToken`: `0xd3091433da9a925c38682b28ffbae975ed06617a`
   - `initialOwner`: Your wallet address
5. Copy deployed address

### Update Frontend
Edit `frontend/src/lib/contracts.ts`:
```typescript
ReporterRegistry: '0xYOUR_DEPLOYED_ADDRESS',
```

---

## 💻 Development
### ✅ Currently Implemented

- **Wallet Integration**: MetaMask connection with Polygon Amoy testnet support
- **Article Browsing**: View and filter news articles by category
- **Reporter Portal**: Registration interface for journalists and contributors
- **Smart Contract Infrastructure**: Deployed token contracts and governance system
- **Testing Mode**: Free registration and demonstration capabilities

### 🚧 In Development

- **Reporter Verification**: Full verification workflow with stake requirements
- **On-Chain Publishing**: Complete article publishing to blockchain
- **Voting Mechanism**: Community credibility scoring for articles
- **DAO Proposals**: Full governance proposal creation and voting interface
- **Arweave Integration**: Production-ready permanent storage implementation

### 📋 Planned Features

- **Zero-Knowledge Proofs**: Anonymous journalist identity protection
- **AI Analysis Integration**: Automated credibility assessment
- **Mobile Application**: Native mobile app for iOS and Android
- **Advanced Analytics**: Comprehensive reporting dashboard

## Technology Stack

**Blockchain & Smart Contracts**
- Solidity 0.8.24
- Foundry (development framework)
- OpenZeppelin (security-audited contracts)
- Polygon Amoy Testnet (Layer 2 scaling)

**Frontend**
- Next.js 15 (React 19)
- TypeScript
- TailwindCSS
- Wagmi + Viem (Web3 integration)
- MetaMask connectivity

**Storage**
- Arweave (permanent decentralized storage)

## Getting Started

### 🚀 Live Demo

**Try the platform now**: [https://gono-moncho.vercel.app](https://gono-moncho.vercel.app)

> **Note**: Connect MetaMask to Polygon Amoy Testnet (Chain ID: 80002) to interact with the platform.

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **MetaMask** browser extension ([Install](https://metamask.io/download/))
- **Git** ([Download](https://git-scm.com/downloads))

For smart contract development:
- **Foundry** toolkit ([Installation Guide](https://book.getfoundry.sh/getting-started/installation))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ByzentineGenerals/Gono-Moncho.git
   cd Gono-Moncho
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   
   Open [http://localhost:3000](http://localhost:3000) in your browser

### MetaMask Configuration

To interact with the platform, add the Polygon Amoy Testnet to MetaMask:

- **Network Name**: Polygon Amoy Testnet
- **RPC URL**: `https://polygon-amoy.infura.io/v3/b0f04bd3f6a949e59cd25a1bc364d588`
- **Chain ID**: `80002`
- **Currency Symbol**: `MATIC`
- **Block Explorer**: `https://amoy.polygonscan.com/`

**Get Test MATIC**: Visit the [Polygon Faucet](https://faucet.polygon.technology/) to receive testnet tokens for transaction fees.

## Smart Contracts

### Deployed Addresses (Polygon Amoy Testnet)

| Contract | Address | Description |
|----------|---------|-------------|
| **NEWS Token** | `0xd3091433da9a925c38682b28ffbae975ed06617a` | Governance & staking token |
| **CRED Token** | `0x95e29667e07767bd019b4a79f3979a416c30f573` | Non-transferable reputation token |
| **NewsStaking** | `0x58321d7cb23248ca3f39f01e4480f4a8b166bfec` | Token staking & rewards |
| **NewsDAO** | `0xccf0212b8c443ee148a36106f109b7b3c5250f51` | DAO governance with quadratic voting |
| **Verification** | `0xe5672b7bf38e11d81feb07d77a35cf5499a0adeb` | Article verification system |
| **ArweaveStorage** | `0xc7311a7c71647edd9556938ad6f22afe4dc01a66` | Permanent storage integration |
| **DelegationRegistry** | `0xea67b90c7d566ae98c4906fa8962844fb424e4f0` | Liquid democracy & vote delegation |

### Contract Architecture

**Token Layer**
- `NEWS.sol`: ERC-20 governance token with minting controls
- `CRED.sol`: Non-transferable reputation token for contributors

**Governance Layer**
- `NewsDAO.sol`: Decentralized autonomous organization with proposal system
- `DelegationRegistry.sol`: Vote delegation and liquid democracy
- `MonchoGovernor.sol`: OpenZeppelin-based governor implementation

**Verification Layer**
- `Verification.sol`: Multi-layer article verification protocol
- `ReporterRegistry.sol`: Role-based access control (Reporter/Analyzer/Verifier)
- `SANUB.sol`: Sybil resistance mechanism

**Storage & Integration**
- `ArweaveStorage.sol`: Permanent article storage via Arweave
- `AIOracle.sol`: AI-powered credibility analysis integration

### Development Commands

```bash
cd backend

# Compile contracts
forge build

# Run test suite
forge test

# Run tests with verbose output
forge test -vvv

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## Project Structure

```
gono-moncho/
├── backend/                    # Smart Contract Layer
│   ├── src/
│   │   ├── tokens/            # NEWS & CRED token contracts
│   │   ├── governance/        # NewsDAO & voting mechanisms
│   │   ├── verification/      # Reporter registry & verification
│   │   ├── staking/           # Token staking system
│   │   └── external/          # Arweave & AI oracle integrations
│   ├── test/                  # Contract test suites
│   └── script/                # Deployment scripts
│
└── frontend/                   # Web Application
    ├── src/
    │   ├── app/               # Next.js app router pages
    │   ├── components/        # React components
    │   ├── context/           # State management
    │   ├── lib/               # Contract ABIs & utilities
    │   └── Hooks/             # Custom React hooks
    └── public/                # Static assets
```

## Development Status

### Phase 1: Foundation ✅ (Completed)
- [x] Smart contract architecture design
- [x] Token contracts (NEWS & CRED)
- [x] Basic DAO governance structure
- [x] Frontend scaffolding with Next.js
- [x] MetaMask integration
- [x] Contract deployment to Polygon Amoy testnet

### Phase 2: Core Features 🚧 (In Progress)
- [x] Reporter registration interface
- [ ] Complete verification workflow
- [ ] On-chain article publishing
- [ ] Community voting mechanism
- [ ] Stake-weighted credibility scoring
- [ ] DAO proposal creation & voting interface

### Phase 3: Advanced Features 📋 (Planned)
- [ ] Zero-Knowledge proof integration
- [ ] AI credibility analysis
- [ ] Production Arweave integration
- [ ] Mobile responsive optimization
- [ ] Comprehensive security auditing

### Known Limitations

The following limitations exist in the current implementation:

- **Testing Mode Active**: Some operations bypass stake requirements for demonstration purposes
- **Mock Arweave**: Currently using mock API endpoints; production Arweave integration planned
- **Limited Verification**: Simplified verification workflow for testing; full multi-layer system in development
- **UI Polish**: Some components require additional refinement and error handling
- **ReporterRegistry**: Requires deployment for full reporter functionality

We're actively working to address these limitations and welcome community contributions.

## Contributing

We welcome contributions from the community! This project was built for the Build4Democracy hackathon and continues to evolve.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution

- Smart contract optimization and security improvements
- Frontend UI/UX enhancements
- Documentation and tutorials
- Bug reports and testing
- Feature development from the roadmap

### Development Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

- **Stage:** Beta / Demo Ready
- **Smart Contracts:** Deployed on Polygon Amoy
- **Frontend:** Fully functional
- **Testing Mode:** Active
- **Production Ready:** Architecture complete, migration path documented

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the **Build4Democracy** hackathon
- Powered by **Polygon** Layer 2 scaling solution
- Permanent storage via **Arweave** protocol
- Smart contract security by **OpenZeppelin** libraries
- Web3 integration with **Wagmi** and **Viem**

## Contact & Resources

- **GitHub Repository**: [ByzentineGenerals/Gono-Moncho](https://github.com/ByzentineGenerals/Gono-Moncho)
- **Report Issues**: [GitHub Issues](https://github.com/ByzentineGenerals/Gono-Moncho/issues)
- **Polygon Amoy Explorer**: [View Contracts](https://amoy.polygonscan.com/)

---

**Note**: This project is under active development. Features and functionality may change as we continue to build and improve the platform. Always refer to the latest version in the main branch for the most up-to-date information.
