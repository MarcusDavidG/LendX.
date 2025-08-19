// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockEthereumNFT.sol";

contract DeployMockNFT is Script {
    function run() external {
        vm.startBroadcast();

        MockEthereumNFT mockNFT = new MockEthereumNFT();
        
        console.log("MockEthereumNFT deployed at:", address(mockNFT));
        
        // Mint some test NFTs for demo purposes
        address testUser = 0x1234567890123456789012345678901234567890;
        uint256 tokenId1 = mockNFT.mint(testUser);
        uint256 tokenId2 = mockNFT.mint(testUser);
        
        console.log("Minted NFTs for test user:");
        console.log("Token ID 1:", tokenId1);
        console.log("Token ID 2:", tokenId2);
        
        vm.stopBroadcast();
    }
}
