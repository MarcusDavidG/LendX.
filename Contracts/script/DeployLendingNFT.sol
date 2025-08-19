// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LendingContractNFT.sol";

contract DeployLendingNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Addresses from existing deployments
        address uniswapRouter = 0x086D426f8B653b88a2d6D03051C8b4aB8783Be2b; // Uniswap V3 Router
        address collateralContract = 0xEb847E305bD74574cA2958B17128A406374298E2; // Replace with actual CollateralContract address
        
        vm.startBroadcast(deployerPrivateKey);
        
        LendingContractNFT lendingContract = new LendingContractNFT(
            uniswapRouter,
            collateralContract
        );
        
        console.log("LendingContractNFT deployed to:", address(lendingContract));
        
        vm.stopBroadcast();
    }
}
