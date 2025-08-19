#!/bin/bash

# Deploy S Token and USDC to specific address
# Usage: ./deploy-to-address.sh

set -e

echo "🚀 Deploying S Token and USDC to address: 0xDD7ECB0428d2071532db71437e02C7FD2922Ea31"
echo ""

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable not set"
    echo "Please set your private key: export PRIVATE_KEY=your_private_key_here"
    exit 1
fi

# Check if RPC_URL is set
if [ -z "$RPC_URL" ]; then
    echo "❌ Error: RPC_URL environment variable not set"
    echo "Please set RPC_URL: export RPC_URL=https://rpc.blaze.soniclabs.com"
    exit 1
fi

# Run deployment
forge script script/DeployTokensToAddress.s.sol:DeployTokensToAddress \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --chain-id 57054

echo ""
echo "✅ Deployment complete!"
echo "Check the output above for contract addresses"
