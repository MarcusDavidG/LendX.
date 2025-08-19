// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract TreasuryContract is Ownable, Pausable {
    // USDC token address
    address public immutable USDC_ADDRESS;
    // Mapping of lender addresses to their FeeM rewards
    mapping(address => uint256) public feeMRewards;
    
    // Total FeeM rewards distributed
    uint256 public totalFeeMRewards;
    
    // Total funds in the treasury
    uint256 public totalFunds;
    
    // Events
    event FeeMDistributed(address indexed lender, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event FundsDeposited(address indexed from, uint256 amount);
    event TreasuryPaused();
    event TreasuryUnpaused();
    
    constructor(address _usdcAddress) Ownable(msg.sender) {
        USDC_ADDRESS = _usdcAddress;
    }
    
    /// @notice Deposit funds into the treasury
    /// @param amount The amount of USDC to deposit
    function depositFunds(uint256 amount) external whenNotPaused {
        require(amount > 0, "Invalid amount");
        IERC20(USDC_ADDRESS).transferFrom(msg.sender, address(this), amount);
        totalFunds += amount;
        emit FundsDeposited(msg.sender, amount);
    }
    
    /// @notice Withdraw funds from the treasury (only owner)
    /// @param to The address to send funds to
    /// @param amount The amount of USDC to withdraw
    function withdrawFunds(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(amount > 0, "Invalid amount");
        require(amount <= totalFunds, "Insufficient funds");
        IERC20(USDC_ADDRESS).transfer(to, amount);
        totalFunds -= amount;
        emit FundsWithdrawn(to, amount);
    }
    
    /// @notice Distribute FeeM rewards to a lender
    /// @param lender The address of the lender
    /// @param amount The amount of USDC to distribute as FeeM rewards
    function distributeFeeM(address lender, uint256 amount) external onlyOwner whenNotPaused {
        require(lender != address(0), "Invalid lender address");
        require(amount > 0, "Invalid amount");
        require(amount <= totalFunds, "Insufficient funds");
        
        // Update the lender's FeeM rewards
        feeMRewards[lender] += amount;
        totalFeeMRewards += amount;
        totalFunds -= amount;
        
        // Transfer the FeeM rewards to the lender
        IERC20(USDC_ADDRESS).transfer(lender, amount);
        
        emit FeeMDistributed(lender, amount);
    }
    
    /// @notice Distribute FeeM rewards to multiple lenders
    /// @param lenders The addresses of the lenders
    /// @param amounts The amounts of USDC to distribute to each lender
    function distributeFeeMToMany(address[] calldata lenders, uint256[] calldata amounts) external onlyOwner whenNotPaused {
        require(lenders.length == amounts.length, "Mismatched arrays");
        require(lenders.length > 0, "Empty arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalAmount <= totalFunds, "Insufficient funds");
        
        // Update the FeeM rewards for each lender and transfer the rewards
        for (uint256 i = 0; i < lenders.length; i++) {
            address lender = lenders[i];
            uint256 amount = amounts[i];
            
            require(lender != address(0), "Invalid lender address");
            require(amount > 0, "Invalid amount");
            
            // Update the lender's FeeM rewards
            feeMRewards[lender] += amount;
            totalFeeMRewards += amount;
            
            // Transfer the FeeM rewards to the lender
            IERC20(USDC_ADDRESS).transfer(lender, amount);
            
            emit FeeMDistributed(lender, amount);
        }
        
        totalFunds -= totalAmount;
    }
    
    /// @notice Get the FeeM rewards for a lender
    /// @param lender The address of the lender
    /// @return The amount of FeeM rewards for the lender
    function getFeeMRewards(address lender) external view returns (uint256) {
        return feeMRewards[lender];
    }
    
    /// @notice Pause the treasury (only owner)
    function pause() external onlyOwner {
        _pause();
        emit TreasuryPaused();
    }
    
    /// @notice Unpause the treasury (only owner)
    function unpause() external onlyOwner {
        _unpause();
        emit TreasuryUnpaused();
    }
    
    /// @notice Get the USDC balance of the treasury
    /// @return The USDC balance of the treasury
    function getTreasuryBalance() external view returns (uint256) {
        return IERC20(USDC_ADDRESS).balanceOf(address(this));
    }
}
