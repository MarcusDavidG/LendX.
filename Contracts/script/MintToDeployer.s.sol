// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockEthereumNFT.sol";

contract MintToDeployer is Script {
    function run() external {
        // MockEthereumNFT contract address from deployment
        address mockNFTAddress = 0x0caC4e3004c452134eD59Db4bcb63128d2140Ace;
        address deployerAddress = 0x1D72DB7feb21bf0A3C3D094401C7c56fA10ab013;
        
        vm.startBroadcast();
        
        MockEthereumNFT mockNFT = MockEthereumNFT(mockNFTAddress);
        
        console.log("Minting NFTs to deployer address...");
        
        // Mint 5 NFTs to the deployer address
        uint256 tokenId1 = mockNFT.mint(deployerAddress);
        uint256 tokenId2 = mockNFT.mint(deployerAddress);
        uint256 tokenId3 = mockNFT.mint(deployerAddress);
        uint256 tokenId4 = mockNFT.mint(deployerAddress);
        uint256 tokenId5 = mockNFT.mint(deployerAddress);
        
        console.log("Successfully minted NFTs to deployer:", deployerAddress);
        console.log("Token IDs:", tokenId1, tokenId2, tokenId3, tokenId4, tokenId5);
        
        vm.stopBroadcast();
    }
}
