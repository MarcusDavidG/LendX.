# LendX - Micro-Lending Platform with Wallet, Uniswap V3, and Chainlink CCIP

LendX is a decentralized micro-lending platform built for the Sonic network that combines wallet functionality, token swapping via Uniswap V3, and cross-chain NFT collateral using Chainlink CCIP. It's designed to address financial inclusion challenges in Africa by providing a seamless financial tool for unbanked farmers and entrepreneurs.

## Features

### Core Functionality
- **Wallet**: View token balances, send/receive tokens
- **Lending**: Request and repay micro-loans with token swaps
- **Swapping**: Exchange tokens via Uniswap V3
- **Treasury**: Deposit funds to earn FeeM rewards
- **Collateral**: Lock NFTs as cross-chain collateral using Chainlink CCIP

### Technical Highlights
- Built on Sonic network for fast, low-cost transactions
- Smart contracts with 90%+ test coverage using Foundry
- MetaMask integration for wallet functionality
- Uniswap V3 integration for token swaps
- Chainlink CCIP for cross-chain NFT collateral
- Mobile-first responsive design

## Prerequisites

- Node.js (v16 or higher)
- Foundry (for smart contract development)
- MetaMask wallet
- Sonic testnet ETH (get from faucet)

## Setup Instructions

### Smart Contracts

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
forge --version
```

2. Install dependencies:
```bash
forge install OpenZeppelin/openzeppelin-contracts chainlink/contracts-ccip uniswap/v3-periphery --no-commit
```

3. Deploy contracts (requires PRIVATE_KEY environment variable):
```bash
forge script script/Deploy.s.sol --rpc-url https://rpc.blaze.soniclabs.com/ --private-key $PRIVATE_KEY --broadcast
forge script script/DeployCollateral.s.sol --rpc-url https://rpc.blaze.soniclabs.com/ --private-key $PRIVATE_KEY --broadcast
forge script script/DeployTreasury.s.sol --rpc-url https://rpc.blaze.soniclabs.com/ --private-key $PRIVATE_KEY --broadcast
```

### Frontend

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Contract Addresses

Deployed contracts on Sonic Blaze testnet:
- LendingContract: `0xD30e5677076cd736d0704D0B1A1E57D7766F3B6f`
- CollateralContract: `0x2cb425975626593A35D570C6E0bCEe53fca1eaFE`
- TreasuryContract: `0x793310d9254D801EF86f829264F04940139e9297`
- Uniswap V3 Router: `0x086d426f8b653b88a2d6d03051c8b4ab8783be2b`
