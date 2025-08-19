// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EthereumCollateralVerifier.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Mock ERC721 token for testing
contract MockNFT is ERC721 {
    constructor() ERC721("MockNFT", "MNFT") {}
    
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}

// Mock CCIP Router for testing
contract MockCCIPRouter {
    function getFee(uint64 /*destinationChainSelector*/, Client.EVM2AnyMessage memory /*message*/) external pure returns (uint256 fee) {
        return 0.1 ether;
    }
    
    function ccipSend(uint64 /*destinationChainSelector*/, Client.EVM2AnyMessage calldata /*message*/) external payable returns (bytes32) {
        return bytes32(uint256(12345)); // Mock message ID
    }
}

contract EthereumCollateralVerifierTest is Test {
    EthereumCollateralVerifier verifier;
    MockNFT mockNFT;
    MockCCIPRouter mockCCIPRouter;
    
    address constant USER1 = address(0x1111111111111111111111111111111111111111);
    uint256 constant NFT_TOKEN_ID = 1;
    
    function setUp() public {
        // Deploy mock contracts
        mockCCIPRouter = new MockCCIPRouter();
        
        // Deploy EthereumCollateralVerifier with the correct CCIP router address
        vm.etch(0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59, address(mockCCIPRouter).code);
        
        // Deploy EthereumCollateralVerifier
        verifier = new EthereumCollateralVerifier();
        
        // Create mock NFT
        mockNFT = new MockNFT();
        
        // Mint NFT for user
        mockNFT.mint(USER1, NFT_TOKEN_ID);
    }
    
    function testDeployment() public view {
        // Test that the contract is deployed correctly
        // Note: We can't directly check the ccipRouter since it's a constant
    }
    
    function testVerifyCollateral() public {
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Give USER1 some ETH for CCIP fees
        vm.deal(USER1, 1 ether);
        
        // Send ETH to the verifier contract to pay for CCIP fees
        vm.deal(address(verifier), 0.2 ether);
        
        // Verify collateral
        bytes32 verificationId = verifier.verifyCollateral(USER1, address(mockNFT), NFT_TOKEN_ID);
        
        // Check that the collateral was verified
        assertTrue(verifier.isVerified(verificationId));
        
        vm.stopPrank();
    }
    
    function testIsVerified() public {
        // Initially no collateral should be verified
        bytes32 fakeVerificationId = keccak256(abi.encodePacked("fake"));
        assertFalse(verifier.isVerified(fakeVerificationId));
        
        // Verify collateral
        vm.startPrank(USER1);
        vm.deal(USER1, 1 ether);
        // Send ETH to the verifier contract to pay for CCIP fees
        vm.deal(address(verifier), 0.2 ether);
        bytes32 verificationId = verifier.verifyCollateral(USER1, address(mockNFT), NFT_TOKEN_ID);
        vm.stopPrank();
        
        // Check that the collateral is now verified
        assertTrue(verifier.isVerified(verificationId));
    }
}
