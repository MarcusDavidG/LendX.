// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TestTokens.sol";

contract FundDemoWallets is Script {
    // Test token addresses from addresses.md
    address constant TEST_S = 0x90b88C638A233EF78d8f54e60e0e27352C03F59e;
    address constant TEST_USDC = 0x97a15306364e1025e07010a7f79B9664638598AE;
    address constant TEST_ETH = 0x844cf0dcAFE0c305df0f15eB8bde02459AaB74aB;
    
    // Demo wallet addresses
    address constant AMINA = 0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8A0;
    address constant BRIAN = 0x8ba1f109551bD432803012645a136c82C3e8C9a;
    address constant CHARITY = 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed;
    
    function run() external {
        vm.startBroadcast();
        
        // Fund Amina's wallet
        TestSToken(TEST_S).mint(AMINA, 1250 * 10**18);
        TestUSDCToken(TEST_USDC).mint(AMINA, 45 * 10**6);
        TestETHToken(TEST_ETH).mint(AMINA, 25 * 10**16); // 0.25 ETH
        
        // Fund Brian's wallet
        TestSToken(TEST_S).mint(BRIAN, 800 * 10**18);
        TestUSDCToken(TEST_USDC).mint(BRIAN, 120 * 10**6);
        TestETHToken(TEST_ETH).mint(BRIAN, 15 * 10**16); // 0.15 ETH
        
        // Fund Charity's wallet
        TestSToken(TEST_S).mint(CHARITY, 2000 * 10**18);
        TestUSDCToken(TEST_USDC).mint(CHARITY, 75 * 10**6);
        TestETHToken(TEST_ETH).mint(CHARITY, 5 * 10**16); // 0.05 ETH
        
        console.log("Demo wallets funded successfully!");
        console.log("Amina balances:", "1250 S, 45 USDC, 0.25 ETH");
        console.log("Brian balances:", "800 S, 120 USDC, 0.15 ETH");
        console.log("Charity balances:", "2000 S, 75 USDC, 0.05 ETH");
        
        vm.stopBroadcast();
    }
}
