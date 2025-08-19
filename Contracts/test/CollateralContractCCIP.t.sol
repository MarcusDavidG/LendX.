// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CollateralContract.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../lib/chainlink-ccip/contracts/src/v0.8/ccip/libraries/Client.sol";

// Mock ERC721 token for testing
contract MockNFT is ERC721 {
    constructor() ERC721("MockNFT", "MNFT") {}
    
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
    
    function tokenURI() public pure returns (string memory) {
        return "https://example.com/token/1";
    }
}

// Mock CCIP Router for testing
contract MockCCIPRouter {
    uint256 public constant MOCK_FEE = 0.1 ether;
    bytes32 public lastMessageId;
    uint64 public lastDestinationChainSelector;
    Client.EVM2AnyMessage public lastMessage;
    uint256 public lastFee;
    
    function isChainSupported(uint64 /*destChainSelector*/) external pure returns (bool supported) {
        return true;
    }
    
    function getFee(uint64 /*destinationChainSelector*/, Client.EVM2AnyMessage memory /*message*/) external pure returns (uint256 fee) {
        return MOCK_FEE;
    }
    
    function ccipSend(uint64 destinationChainSelector, Client.EVM2AnyMessage calldata message) external payable returns (bytes32) {
        require(msg.value >= MOCK_FEE, "Insufficient fee");
        
        lastDestinationChainSelector = destinationChainSelector;
        lastMessage = message;
        lastFee = msg.value;
        
        bytes32 messageId = keccak256(abi.encode(block.timestamp, destinationChainSelector, message));
        lastMessageId = messageId;
        
        return messageId;
    }
}

contract CollateralContractCCIPTest is Test {
    CollateralContract collateralContract;
    MockNFT mockNFT;
    MockCCIPRouter mockCCIPRouter;
    
    address constant OWNER = address(0x1111111111111111111111111111111111111111);
    address constant USER1 = address(0x2222222222222222222222222222222222222222);
    address constant USER2 = address(0x3333333333333333333333333333333333333333);
    
    uint256 constant NFT_TOKEN_ID_1 = 1;
    uint256 constant NFT_TOKEN_ID_2 = 2;
    
    function setUp() public {
        // Deploy contracts
        vm.startPrank(OWNER);
        mockCCIPRouter = new MockCCIPRouter();
        collateralContract = new CollateralContract(address(mockCCIPRouter));
        mockNFT = new MockNFT();
        vm.stopPrank();
        
        // Mint NFTs for testing
        mockNFT.mint(USER1, NFT_TOKEN_ID_1);
        mockNFT.mint(USER1, NFT_TOKEN_ID_2);
        
        // Approve CollateralContract to transfer NFTs
        vm.prank(USER1);
        mockNFT.setApprovalForAll(address(collateralContract), true);
        
        // Give USER1 some ETH for CCIP fees
        vm.deal(USER1, 1 ether);
    }
    
    function testDeployment() public view {
        // Test that the contract is deployed correctly
        assertEq(collateralContract.owner(), OWNER);
    }
    
    function testLockCollateralWithCCIPRouter() public {
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
        
        // Check that CCIP router was called
        assertEq(mockCCIPRouter.lastDestinationChainSelector(), collateralContract.ETHEREUM_CHAIN_SELECTOR());
        assertGt(mockCCIPRouter.lastFee(), 0);
        
        vm.stopPrank();
    }
    
    function testCCIPSendMessageWithRealRouterAddress() public view {
        
        // We can't actually call this router in testing, but we can verify the contract
        // is set up to use it correctly
        
        // Check that the chain selectors are correct
        assertEq(collateralContract.ETHEREUM_CHAIN_SELECTOR(), 16015286601757825753);
        // Sonic chain selector should be 3676871237479449268 based on the contract
        assertEq(collateralContract.SONIC_CHAIN_SELECTOR(), 3676871237479449268);
    }
}