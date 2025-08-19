// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LendingContract.sol";

contract DeployScript is Script {
    // Uniswap V3 Router address on Sonic Blaze testnet
    address constant UNISWAP_ROUTER_ADDRESS = 0x086D426f8B653b88a2d6D03051C8b4aB8783Be2b;

    function run() external {
        // Read private key as string and add "0x" prefix if missing
        string memory privateKeyString = vm.envString("PRIVATE_KEY");
        if (bytes(privateKeyString).length == 64) {
            // Add "0x" prefix if it's missing
            privateKeyString = string(abi.encodePacked("0x", privateKeyString));
        }
        uint256 deployerPrivateKey = vm.parseUint(privateKeyString);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the LendingContract
        LendingContract lendingContract = new LendingContract(UNISWAP_ROUTER_ADDRESS);
        
        console.log("LendingContract deployed at: ", address(lendingContract));

        vm.stopBroadcast();
    }
}
