// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "../lib/chainlink-ccip/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "../lib/chainlink-ccip/contracts/src/v0.8/ccip/libraries/Client.sol";
import "../lib/chainlink-ccip/contracts/src/v0.8/ccip/interfaces/IAny2EVMMessageReceiver.sol";

contract CollateralContract is Ownable, ERC721Holder, IAny2EVMMessageReceiver {
    // Chainlink CCIP Router
    IRouterClient public immutable ccipRouter;
    
    // Chain selectors for different chains
    // These would need to be updated with actual chain selectors for Sonic and Ethereum
    uint64 public constant ETHEREUM_CHAIN_SELECTOR = 16015286601757825753;
    uint64 public constant SONIC_CHAIN_SELECTOR = 3676871237479449268; 
    
    // Collateral information
    struct Collateral {
        address nftAddress;
        uint256 tokenId;
        address owner;
        bool isLocked;
        bool isVerified; // New field for verification status
        uint256 lockTime;
        bytes32 messageId; // For tracking CCIP messages
        bytes32 verificationId; // For tracking verification
    }
    
    // Mapping of user addresses to their collateral
    mapping(address => Collateral) public userCollateral;
    
    // Mapping of message IDs to collateral owners for CCIP tracking
    mapping(bytes32 => address) public messageIdToOwner;
    
    // Events
    event CollateralLocked(address indexed user, address nftAddress, uint256 tokenId, bytes32 messageId);
    event CollateralVerified(address indexed user, address nftAddress, uint256 tokenId);
    event CollateralReleased(address indexed user, address nftAddress, uint256 tokenId);
    event MessageSent(bytes32 indexed messageId, uint64 indexed destinationChainSelector);
    event MessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector);
    
    constructor(address _ccipRouter) Ownable(msg.sender) {
        ccipRouter = IRouterClient(_ccipRouter);
    }
    
    /// @notice Lock NFT collateral and send to Ethereum for verification
    /// @param nftAddress The address of the NFT contract
    /// @param tokenId The ID of the NFT token
    function lockCollateral(address nftAddress, uint256 tokenId) external {
        require(!userCollateral[msg.sender].isLocked, "Collateral already locked");
        
        // Transfer NFT from user to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);
        
        // Store collateral information
        userCollateral[msg.sender] = Collateral({
            nftAddress: nftAddress,
            tokenId: tokenId,
            owner: msg.sender,
            isLocked: true,
            isVerified: false, // Initially not verified
            lockTime: block.timestamp,
            messageId: bytes32(0),
            verificationId: bytes32(0) // Initially no verification ID
        });
        
        // Send message to Ethereum to verify collateral
        bytes32 messageId = _sendMessageToEthereum(msg.sender, nftAddress, tokenId);
        
        // Update collateral with message ID
        userCollateral[msg.sender].messageId = messageId;
        messageIdToOwner[messageId] = msg.sender;
        
        emit CollateralLocked(msg.sender, nftAddress, tokenId, messageId);
    }
    
    /// @notice Send message to Ethereum to verify collateral
    /// @param user The user who locked the collateral
    /// @param nftAddress The address of the NFT contract
    /// @param tokenId The ID of the NFT token
    /// @return messageId The ID of the CCIP message
    function _sendMessageToEthereum(address user, address nftAddress, uint256 tokenId) private returns (bytes32 messageId) {
        // Create the message data
        bytes memory messageData = abi.encode(user, nftAddress, tokenId);
        
        // Create the CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)), // Receiver on Ethereum (same contract address)
            data: messageData,
            tokenAmounts: new Client.EVMTokenAmount[](0), // No tokens being sent
            feeToken: address(0), // Pay with native token
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV2({gasLimit: 200_000, allowOutOfOrderExecution: false}))
        });
        
        // Get the fee for the message
        uint256 fee = ccipRouter.getFee(ETHEREUM_CHAIN_SELECTOR, message);
        
        // Send the message
        messageId = ccipRouter.ccipSend{value: fee}(ETHEREUM_CHAIN_SELECTOR, message);
        
        emit MessageSent(messageId, ETHEREUM_CHAIN_SELECTOR);
        
        return messageId;
    }
    
    /// @notice Verify collateral on Ethereum (this would be called on Ethereum)
    /// @param user The user who locked the collateral
    /// @param nftAddress The address of the NFT contract
    /// @param tokenId The ID of the NFT token
    function verifyCollateralOnEthereum(address user, address nftAddress, uint256 tokenId) external {
        // In a real implementation, this would check:
        // 1. That the NFT is actually owned by the user on Ethereum
        // 2. That the NFT is not already used as collateral elsewhere
        // 3. Any other verification logic
        
        // For this example, we'll just emit an event
        emit CollateralVerified(user, nftAddress, tokenId);
        
        // In a real implementation, you might store this verification
        // or send a message back to Sonic to confirm verification
    }
    
    /// @notice Release collateral after loan repayment
    /// @param user The user whose collateral to release
    function releaseCollateral(address user) external onlyOwner {
        Collateral storage collateral = userCollateral[user];
        require(collateral.isLocked, "No collateral locked");
        
        // Transfer NFT back to user
        IERC721(collateral.nftAddress).transferFrom(address(this), user, collateral.tokenId);
        
        // Clear collateral information
        delete userCollateral[user];
        
        emit CollateralReleased(user, collateral.nftAddress, collateral.tokenId);
    }
    
    /// @notice CCIP receiver function
    /// @param message The incoming CCIP message
    function ccipReceive(Client.Any2EVMMessage calldata message) external override {
        // Ensure the sender is the CCIP router
        require(msg.sender == address(ccipRouter), "Only CCIP router can call this function");
        
        emit MessageReceived(message.messageId, message.sourceChainSelector);
        
        // Handle the incoming message based on source chain
        if (message.sourceChainSelector == ETHEREUM_CHAIN_SELECTOR) {
            // This is a message from Ethereum
            _handleMessageFromEthereum(message);
        }
        // Add other chain handlers as needed
    }
    
    /// @notice Handle message from Ethereum
    /// @param message The incoming CCIP message
    function _handleMessageFromEthereum(Client.Any2EVMMessage calldata message) private {
        // Decode the message data
        (address user, address nftAddress, uint256 tokenId, bytes32 verificationId, bool isVerified) = abi.decode(message.data, (address, address, uint256, bytes32, bool));
        
        // Verify that this message corresponds to a locked collateral
        require(userCollateral[user].isLocked, "No collateral locked for user");
        require(userCollateral[user].nftAddress == nftAddress, "NFT address mismatch");
        require(userCollateral[user].tokenId == tokenId, "Token ID mismatch");
        
        // Update the collateral verification status
        userCollateral[user].isVerified = isVerified;
        userCollateral[user].verificationId = verificationId;
        
        // Emit event for successful verification
        if (isVerified) {
            emit CollateralVerified(user, nftAddress, tokenId);
        }
    }
    
    /// @notice Get collateral information for a user
    /// @param user The user address
    /// @return nftAddress The NFT contract address
    /// @return tokenId The NFT token ID
    /// @return isLocked Whether the collateral is locked
    /// @return isVerified Whether the collateral is verified
    /// @return lockTime When the collateral was locked
    function getCollateralInfo(address user) external view returns (
        address nftAddress,
        uint256 tokenId,
        bool isLocked,
        bool isVerified,
        uint256 lockTime
    ) {
        Collateral storage collateral = userCollateral[user];
        return (
            collateral.nftAddress,
            collateral.tokenId,
            collateral.isLocked,
            collateral.isVerified,
            collateral.lockTime
        );
    }
    
    /// @notice Get the collateral address for a user
    /// @param user The user address
    /// @return The collateral NFT address if locked, otherwise zero address
    function getCollateralAddress(address user) external view returns (address) {
        Collateral storage collateral = userCollateral[user];
        if (collateral.isLocked) {
            return collateral.nftAddress;
        }
        return address(0);
    }
    
    // Required for receiving native tokens for CCIP fees
    receive() external payable {}
}
