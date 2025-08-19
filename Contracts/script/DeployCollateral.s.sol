// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import "../src/CollateralContract.sol";

contract DeployCollateralScript is Script {
    // Chainlink CCIP Router address on Sonic Blaze testnet
    address constant CCIP_ROUTER_ADDRESS = 0x2fBd4659774D468Db5ca5bacE37869905d8EfA34;

    function run() external {
        // Read private key as string and add "0x" prefix if missing
        string memory privateKeyString = vm.envString("PRIVATE_KEY");
        if (bytes(privateKeyString).length == 64) {
            // Add "0x" prefix if it's missing
            privateKeyString = string(abi.encodePacked("0x", privateKeyString));
        }
        uint256 deployerPrivateKey = vm.parseUint(privateKeyString);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the CollateralContract
        CollateralContract collateralContract = new CollateralContract(CCIP_ROUTER_ADDRESS);
        
        console.log("CollateralContract deployed at: ", address(collateralContract));

        vm.stopBroadcast();
    }
}
