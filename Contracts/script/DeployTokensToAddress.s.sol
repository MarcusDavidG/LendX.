// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TestTokens.sol";

/**
 * @title DeployTokensToAddress
 * @dev Deployment script for S token and USDC tokens to specific address
 */
contract DeployTokensToAddress is Script {
    // Sonic testnet RPC: https://rpc.blaze.soniclabs.com
    // Chain ID: 57054
    
    function run() external {
        // Use actual private key for deployment
        uint256 deployerPrivateKey = 0xdc28a227753f7cb3c5955d363350c6d7b2050cdc79828dba983925a6b456cb05;
        address targetAddress = 0xDD7ECB0428d2071532db71437e02C7FD2922Ea31;
        
        console.log("Deploying tokens to address:", targetAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy S Token
        TestSToken sToken = new TestSToken();
        console.log("S Token deployed at:", address(sToken));
        
        // Deploy USDC Token
        TestUSDCToken usdcToken = new TestUSDCToken();
        console.log("USDC Token deployed at:", address(usdcToken));
        
        // Mint tokens to target address
        uint256 sAmount = 10000 * 10**18; // 10,000 S tokens
        uint256 usdcAmount = 10000 * 10**6; // 10,000 USDC (6 decimals)
        
        sToken.mint(targetAddress, sAmount);
        usdcToken.mint(targetAddress, usdcAmount);
        
        console.log("Minted", sAmount / 10**18, "S tokens to", targetAddress);
        console.log("Minted", usdcAmount / 10**6, "USDC tokens to", targetAddress);
        
        vm.stopBroadcast();
    }
}
