// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TreasuryContract.sol";

contract DeployTreasuryScript is Script {
    // USDC token address on Sonic Blaze testnet (provided by user)
    address constant USDC_ADDRESS = 0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6;

    function run() external {
        // Read private key from environment variable
        string memory privateKeyString = vm.envString("PRIVATE_KEY");
        if (bytes(privateKeyString).length == 64) {
            // Add "0x" prefix if missing
            privateKeyString = string(abi.encodePacked("0x", privateKeyString));
        }
        uint256 deployerPrivateKey = vm.parseUint(privateKeyString);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy TreasuryContract with verified USDC address
        TreasuryContract treasuryContract = new TreasuryContract(USDC_ADDRESS);
        
        console.log("TreasuryContract deployed at: ", address(treasuryContract));

        vm.stopBroadcast();
    }
}
