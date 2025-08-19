// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import "../src/EthereumCollateralVerifier.sol";

contract DeployEthereumVerifierScript is Script {
    // Chainlink CCIP Router address on Ethereum Sepolia testnet
    address constant CCIP_ROUTER_ADDRESS = 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59;

    function run() external {
        // Read private key from environment variable
        string memory privateKeyString = vm.envString("PRIVATE_KEY");
        if (bytes(privateKeyString).length == 64) {
            // Add "0x" prefix if missing
            privateKeyString = string(abi.encodePacked("0x", privateKeyString));
        }
        uint256 deployerPrivateKey = vm.parseUint(privateKeyString);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy EthereumCollateralVerifier
        EthereumCollateralVerifier verifier = new EthereumCollateralVerifier();
        
        console.log("EthereumCollateralVerifier deployed at: ", address(verifier));

        vm.stopBroadcast();
    }
}
