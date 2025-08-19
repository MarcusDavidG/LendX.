// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CollateralContract.sol";
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
    bytes32 public lastMessageId;
    uint64 public lastDestinationChainSelector;
    Client.EVM2AnyMessage public lastMessage;
    uint256 public lastFee;
    
    function isChainSupported(uint64 /*destChainSelector*/) external pure returns (bool supported) {
        return true;
    }
    
    function getFee(uint64 /*destinationChainSelector*/, Client.EVM2AnyMessage memory /*message*/) external pure returns (uint256 fee) {
        return 0.1 ether;
    }
    
    function ccipSend(uint64 destinationChainSelector, Client.EVM2AnyMessage calldata message) external payable returns (bytes32) {
        lastDestinationChainSelector = destinationChainSelector;
        lastMessage = message;
        lastFee = msg.value;
        lastMessageId = bytes32(uint256(12345)); // Mock message ID
        return lastMessageId;
    }
}

contract CollateralContractTest is Test {
    CollateralContract collateralContract;
    MockNFT mockNFT;
    MockCCIPRouter mockCCIPRouter;
    
    address constant USER1 = address(0x1111111111111111111111111111111111111111);
    address constant USER2 = address(0x2222222222222222222222222222222222222222);
    uint256 constant NFT_TOKEN_ID_1 = 1;
    uint256 constant NFT_TOKEN_ID_2 = 2;
    
    function setUp() public {
        // Deploy mock contracts
        mockCCIPRouter = new MockCCIPRouter();
        mockNFT = new MockNFT();
        
        // Deploy CollateralContract
        collateralContract = new CollateralContract(address(mockCCIPRouter));
        
        // Mint NFTs for users
        mockNFT.mint(USER1, NFT_TOKEN_ID_1);
        mockNFT.mint(USER2, NFT_TOKEN_ID_2);
        
        // Approve CollateralContract to transfer NFTs
        vm.prank(USER1);
        mockNFT.approve(address(collateralContract), NFT_TOKEN_ID_1);
        
        vm.prank(USER2);
        mockNFT.approve(address(collateralContract), NFT_TOKEN_ID_2);
    }
    
    function testDeployment() public view {
        // Test that the contract is deployed correctly
        assertEq(address(collateralContract.ccipRouter()), address(mockCCIPRouter));
    }
    
    function testLockCollateral() public {
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Give USER1 some ETH for CCIP fees
        vm.deal(USER1, 1 ether);
        
        // Give the CollateralContract some ETH to pay for CCIP fees
        vm.deal(address(collateralContract), 1 ether);
        
        // Lock collateral
        collateralContract.lockCollateral(address(mockNFT), NFT_TOKEN_ID_1);
        
        // Check that the collateral was locked
        (address nftAddress, uint256 tokenId, bool isLocked, bool isVerified, uint256 lockTime) = collateralContract.getCollateralInfo(USER1);
        assertEq(nftAddress, address(mockNFT));
        assertEq(tokenId, NFT_TOKEN_ID_1);
        assertTrue(isLocked);
        assertFalse(isVerified);
        assertGt(lockTime, 0);
        
        // Check that the NFT is now owned by the contract
        assertEq(mockNFT.ownerOf(NFT_TOKEN_ID_1), address(collateralContract));
        
        vm.stopPrank();
    }
    
    function testReleaseCollateral() public {
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Give USER1 some ETH for CCIP fees
        vm.deal(USER1, 1 ether);
        
        // Give the CollateralContract some ETH to pay for CCIP fees
        vm.deal(address(collateralContract), 1 ether);
        
        // Lock collateral
        collateralContract.lockCollateral(address(mockNFT), NFT_TOKEN_ID_1);
        vm.stopPrank();
        
        // Release collateral (only owner can do this)
        vm.startPrank(address(this)); // Contract owner
        collateralContract.releaseCollateral(USER1);
        vm.stopPrank();
        
        // Check that the NFT is returned to USER1
        assertEq(mockNFT.ownerOf(NFT_TOKEN_ID_1), USER1);
        
        // Check that the collateral info is cleared
        (, , bool isLocked, , ) = collateralContract.getCollateralInfo(USER1);
        assertFalse(isLocked);
    }
    
    function test_RevertWhen_LockCollateralTwice() public {
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Give USER1 some ETH for CCIP fees
        vm.deal(USER1, 1 ether);
        
        // Give the CollateralContract some ETH to pay for CCIP fees
        vm.deal(address(collateralContract), 1 ether);
        
        // Lock collateral first time
        collateralContract.lockCollateral(address(mockNFT), NFT_TOKEN_ID_1);
        
        // Try to lock again (should fail)
        vm.expectRevert(bytes("Collateral already locked"));
        collateralContract.lockCollateral(address(mockNFT), NFT_TOKEN_ID_1);
        
        vm.stopPrank();
    }
    
    function testCCIPSendMessage() public {
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Give USER1 some ETH for CCIP fees
        vm.deal(USER1, 1 ether);
        
        // Give the CollateralContract some ETH to pay for CCIP fees
        vm.deal(address(collateralContract), 1 ether);
        
        // Lock collateral
        collateralContract.lockCollateral(address(mockNFT), NFT_TOKEN_ID_1);
        
        // Check that CCIP router was called
        assertEq(mockCCIPRouter.lastDestinationChainSelector(), collateralContract.ETHEREUM_CHAIN_SELECTOR());
        assertGt(mockCCIPRouter.lastFee(), 0);
        
        vm.stopPrank();
    }
    
    function testGetCollateralInfo() public {
        // Initially no collateral should be locked
        (, , bool isLocked, , ) = collateralContract.getCollateralInfo(USER1);
        assertFalse(isLocked);
        
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Give USER1 some ETH for CCIP fees
        vm.deal(USER1, 1 ether);
        
        // Give the CollateralContract some ETH to pay for CCIP fees
        vm.deal(address(collateralContract), 1 ether);
        
        // Lock collateral
        collateralContract.lockCollateral(address(mockNFT), NFT_TOKEN_ID_1);
        vm.stopPrank();
        
        // Now collateral should be locked
        (address nftAddress, uint256 tokenId, bool isLockedAfter, bool isVerifiedAfter, uint256 lockTime) = collateralContract.getCollateralInfo(USER1);
        assertEq(nftAddress, address(mockNFT));
        assertEq(tokenId, NFT_TOKEN_ID_1);
        assertTrue(isLockedAfter);
        assertFalse(isVerifiedAfter);
        assertGt(lockTime, 0);
    }
    
    function testMessageIdToOwnerMapping() public {
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Give USER1 some ETH for CCIP fees
        vm.deal(USER1, 1 ether);
        
        // Give the CollateralContract some ETH to pay for CCIP fees
        vm.deal(address(collateralContract), 1 ether);
        
        // Lock collateral
        collateralContract.lockCollateral(address(mockNFT), NFT_TOKEN_ID_1);
        
        // Get the message ID from the collateral info
        (, , , , , , bytes32 messageId, ) = collateralContract.userCollateral(USER1);
        
        // Check that the message ID maps to the correct owner
        assertEq(collateralContract.messageIdToOwner(messageId), USER1);
        
        vm.stopPrank();
    }
}
