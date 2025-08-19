// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestSToken
 * @dev Test S token for Sonic hackathon demo
 */
contract TestSToken is ERC20, Ownable {
    constructor() ERC20("Test S Token", "TEST_S") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens
    }
    
    /**
     * @dev Mint tokens to specified address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

/**
 * @title TestUSDCToken
 * @dev Test USDC token for Sonic hackathon demo (6 decimals)
 */
contract TestUSDCToken is ERC20, Ownable {
    constructor() ERC20("Test USDC", "TEST_USDC") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC (6 decimals)
    }
    
    /**
     * @dev Mint tokens to specified address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Override decimals to 6 for USDC compatibility
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

/**
 * @title TestETHToken
 * @dev Test ETH token for Sonic hackathon demo
 */
contract TestETHToken is ERC20, Ownable {
    constructor() ERC20("Test ETH", "TEST_ETH") Ownable(msg.sender) {
        _mint(msg.sender, 1000 * 10**18); // 1000 ETH
    }
    
    /**
     * @dev Mint tokens to specified address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

/**
 * @title TokenFaucet
 * @dev Faucet contract for demo wallet funding
 */
contract TokenFaucet is Ownable {
    TestSToken public testS;
    TestUSDCToken public testUSDC;
    TestETHToken public testETH;
    
    uint256 public constant FAUCET_AMOUNT_S = 1000 * 10**18; // 1000 S
    uint256 public constant FAUCET_AMOUNT_USDC = 100 * 10**6; // 100 USDC
    uint256 public constant FAUCET_AMOUNT_ETH = 1 * 10**18; // 1 ETH
    
    mapping(address => bool) public hasReceivedS;
    mapping(address => bool) public hasReceivedUSDC;
    mapping(address => bool) public hasReceivedETH;
    
    constructor(
        address _testS,
        address _testUSDC,
        address _testETH
    ) Ownable(msg.sender) {
        testS = TestSToken(_testS);
        testUSDC = TestUSDCToken(_testUSDC);
        testETH = TestETHToken(_testETH);
    }
    
    /**
     * @dev Request test S tokens from faucet
     */
    function requestS() external {
        require(!hasReceivedS[msg.sender], "Already received S tokens");
        testS.mint(msg.sender, FAUCET_AMOUNT_S);
        hasReceivedS[msg.sender] = true;
    }
    
    /**
     * @dev Request test USDC tokens from faucet
     */
    function requestUSDC() external {
        require(!hasReceivedUSDC[msg.sender], "Already received USDC tokens");
        testUSDC.mint(msg.sender, FAUCET_AMOUNT_USDC);
        hasReceivedUSDC[msg.sender] = true;
    }
    
    /**
     * @dev Request test ETH tokens from faucet
     */
    function requestETH() external {
        require(!hasReceivedETH[msg.sender], "Already received ETH tokens");
        testETH.mint(msg.sender, FAUCET_AMOUNT_ETH);
        hasReceivedETH[msg.sender] = true;
    }
    
    /**
     * @dev Fund demo wallets directly (only owner)
     */
    function fundDemoWallet(
        address wallet,
        uint256 sAmount,
        uint256 usdcAmount,
        uint256 ethAmount
    ) external onlyOwner {
        testS.mint(wallet, sAmount);
        testUSDC.mint(wallet, usdcAmount);
        testETH.mint(wallet, ethAmount);
    }
}
