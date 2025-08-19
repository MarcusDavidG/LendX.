// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockEthereumNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    constructor() ERC721("MockEthereumNFT", "MENFT") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }
    
    /// @notice Mint a new NFT for testing purposes
    /// @param to The address to mint the NFT to
    /// @return tokenId The ID of the newly minted NFT
    function mint(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }
    
    /// @notice Batch mint NFTs for testing
    /// @param to The address to mint NFTs to
    /// @param amount The number of NFTs to mint
    /// @return tokenIds Array of token IDs minted
    function batchMint(address to, uint256 amount) external returns (uint256[] memory tokenIds) {
        tokenIds = new uint256[](amount);
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            _mint(to, tokenId);
            tokenIds[i] = tokenId;
        }
        return tokenIds;
    }
    
    /// @notice Get the base URI for token metadata
    /// @return The base URI string
    function _baseURI() internal pure override returns (string memory) {
        return "https://mock-ethereum-nft.example.com/metadata/";
    }
}
