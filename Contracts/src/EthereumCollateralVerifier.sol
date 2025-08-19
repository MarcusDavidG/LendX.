// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../lib/chainlink-ccip/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "../lib/chainlink-ccip/contracts/src/v0.8/ccip/libraries/Client.sol";

contract EthereumCollateralVerifier {
    // Chainlink CCIP Router on Ethereum (Sepolia testnet)
    IRouterClient public constant CCIP_ROUTER = IRouterClient(0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59);
    
    // Chain selectors for different chains
    uint64 public constant SEPOLIA_CHAIN_SELECTOR = 16015286601757825753;
    uint64 public constant SONIC_CHAIN_SELECTOR = 3676871237479449268; 
    
    // Mapping to track verified collaterals
    mapping(bytes32 => bool) public verifiedCollaterals;
    
    // Events
    event CollateralVerified(address indexed user, address nftAddress, uint256 tokenId, bytes32 verificationId);
    event MessageSent(bytes32 indexed messageId, uint64 indexed destinationChainSelector);
    
    /// @notice Verify NFT collateral on Ethereum
    /// @param user The user who locked the collateral
    /// @param nftAddress The address of the NFT contract
    /// @param tokenId The ID of the NFT token
    /// @return verificationId The ID of the verification
    function verifyCollateral(address user, address nftAddress, uint256 tokenId) external returns (bytes32 verificationId) {
        // Create a unique verification ID
        verificationId = keccak256(abi.encodePacked(user, nftAddress, tokenId, block.timestamp));
        
        // Check that the NFT is actually owned by the user on Ethereum
        IERC721 nftContract = IERC721(nftAddress);
        require(nftContract.ownerOf(tokenId) == user, "User does not own this NFT");
        
        // Mark as verified
        verifiedCollaterals[verificationId] = true;
        
        // Send verification confirmation back to Sonic
        _sendVerificationToSonic(user, nftAddress, tokenId, verificationId);
        
        emit CollateralVerified(user, nftAddress, tokenId, verificationId);
        
        return verificationId;
    }
    
    /// @notice Send verification confirmation to Sonic
    /// @param user The user who locked the collateral
    /// @param nftAddress The address of the NFT contract
    /// @param tokenId The ID of the NFT token
    /// @param verificationId The ID of the verification
    function _sendVerificationToSonic(address user, address nftAddress, uint256 tokenId, bytes32 verificationId) private {
        // Create the message data
        bytes memory messageData = abi.encode(user, nftAddress, tokenId, verificationId, true);
        
        // Create the CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)), // Will be set to actual contract address on Sonic
            data: messageData,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV2({gasLimit: 200_000, allowOutOfOrderExecution: false}))
        });
        
        // Get the fee for the message
        uint256 fee = CCIP_ROUTER.getFee(SONIC_CHAIN_SELECTOR, message);
        
        // Send the message
        bytes32 messageId = CCIP_ROUTER.ccipSend{value: fee}(SONIC_CHAIN_SELECTOR, message);
        
        emit MessageSent(messageId, SONIC_CHAIN_SELECTOR);
    }
    
    /// @notice Check if a collateral is verified
    /// @param verificationId The ID of the verification
    /// @return bool Whether the collateral is verified
    function isVerified(bytes32 verificationId) external view returns (bool) {
        return verifiedCollaterals[verificationId];
    }
    
    // Required for receiving native tokens for CCIP fees
    receive() external payable {}
}
