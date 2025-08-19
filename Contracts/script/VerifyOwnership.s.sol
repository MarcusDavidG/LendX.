// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockEthereumNFT.sol";

contract VerifyOwnership is Script {
    function run() external view {
        // MockEthereumNFT contract address from deployment
        address mockNFTAddress = 0x0caC4e3004c452134eD59Db4bcb63128d2140Ace;
        address deployerAddress = 0x1D72DB7feb21bf0A3C3D094401C7c56fA10ab013;
        
        MockEthereumNFT mockNFT = MockEthereumNFT(mockNFTAddress);
        
        console.log("=== MockEthereumNFT Ownership Verification ===");
        console.log("Contract Address:", mockNFTAddress);
        console.log("Deployer Address:", deployerAddress);
        
        // Check balance of deployer
        uint256 balance = mockNFT.balanceOf(deployerAddress);
        console.log("NFTs owned by deployer:", balance);
        
        // Check token IDs 1 and 2 (minted during deployment)
        if (balance >= 1) {
            address owner1 = mockNFT.ownerOf(1);
            console.log("Token ID 1 owner:", owner1);
        }
        
        if (balance >= 2) {
            address owner2 = mockNFT.ownerOf(2);
            console.log("Token ID 2 owner:", owner2);
        }
        
        console.log("=== Verification Complete ===");
    }
}
