// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TreasuryContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing (USDC)
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TreasuryContractTest is Test {
    TreasuryContract treasuryContract;
    MockUSDC mockUSDC;
    
    address constant OWNER = address(0x1111111111111111111111111111111111111111);
    address constant LENDER1 = address(0x2222222222222222222222222222222222222222);
    address constant LENDER2 = address(0x3333333333333333333333333333333333333333);
    address constant USER1 = address(0x4444444444444444444444444444444444444444);
    
    uint256 constant INITIAL_FUNDS = 10000 * 1e6; // 10,000 USDC (6 decimals)
    uint256 constant DEPOSIT_AMOUNT = 1000 * 1e6; // 1,000 USDC
    uint256 constant FEE_M_REWARD = 100 * 1e6; // 100 USDC
    
    function setUp() public {
        // Deploy contracts
        vm.startPrank(OWNER);
        mockUSDC = new MockUSDC();
        treasuryContract = new TreasuryContract(address(mockUSDC));
        vm.stopPrank();
        
        // Mint USDC for testing
        mockUSDC.mint(OWNER, INITIAL_FUNDS);
        mockUSDC.mint(USER1, DEPOSIT_AMOUNT);
        
        // Approve TreasuryContract to spend USDC
        vm.prank(OWNER);
        mockUSDC.approve(address(treasuryContract), INITIAL_FUNDS);
        
        vm.prank(USER1);
        mockUSDC.approve(address(treasuryContract), DEPOSIT_AMOUNT);
    }
    
    function testDeployment() public view {
        // Test that the contract is deployed correctly
        assertEq(treasuryContract.owner(), OWNER);
        // The USDC_ADDRESS is a constant in the contract, so we can't directly check it
        // Instead, we'll check that the contract deployed successfully
    }
    
    function testDepositFunds() public {
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Deposit funds
        treasuryContract.depositFunds(DEPOSIT_AMOUNT);
        
        // Check that the funds were deposited
        assertEq(treasuryContract.totalFunds(), DEPOSIT_AMOUNT);
        assertEq(mockUSDC.balanceOf(address(treasuryContract)), DEPOSIT_AMOUNT);
        assertEq(mockUSDC.balanceOf(USER1), 0);
        
        vm.stopPrank();
    }
    
    function testWithdrawFunds() public {
        // First deposit funds
        testDepositFunds();
        
        // Prank as OWNER
        vm.startPrank(OWNER);
        
        // Withdraw funds
        treasuryContract.withdrawFunds(LENDER1, DEPOSIT_AMOUNT / 2);
        
        // Check that the funds were withdrawn
        assertEq(treasuryContract.totalFunds(), DEPOSIT_AMOUNT / 2);
        assertEq(mockUSDC.balanceOf(LENDER1), DEPOSIT_AMOUNT / 2);
        
        vm.stopPrank();
    }
    
    function testDistributeFeeM() public {
        // First deposit funds
        testDepositFunds();
        
        // Prank as OWNER
        vm.startPrank(OWNER);
        
        // Distribute FeeM rewards
        treasuryContract.distributeFeeM(LENDER1, FEE_M_REWARD);
        
        // Check that the FeeM rewards were distributed
        assertEq(treasuryContract.feeMRewards(LENDER1), FEE_M_REWARD);
        assertEq(treasuryContract.totalFeeMRewards(), FEE_M_REWARD);
        assertEq(treasuryContract.totalFunds(), DEPOSIT_AMOUNT - FEE_M_REWARD);
        assertEq(mockUSDC.balanceOf(LENDER1), FEE_M_REWARD);
        
        vm.stopPrank();
    }
    
    function testDistributeFeeMToMany() public {
        // First deposit funds
        testDepositFunds();
        
        // Prank as OWNER
        vm.startPrank(OWNER);
        
        // Prepare arrays for distribution
        address[] memory lenders = new address[](2);
        lenders[0] = LENDER1;
        lenders[1] = LENDER2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = FEE_M_REWARD;
        amounts[1] = FEE_M_REWARD / 2;
        
        // Distribute FeeM rewards to multiple lenders
        treasuryContract.distributeFeeMToMany(lenders, amounts);
        
        // Check that the FeeM rewards were distributed
        assertEq(treasuryContract.feeMRewards(LENDER1), FEE_M_REWARD);
        assertEq(treasuryContract.feeMRewards(LENDER2), FEE_M_REWARD / 2);
        assertEq(treasuryContract.totalFeeMRewards(), FEE_M_REWARD + FEE_M_REWARD / 2);
        assertEq(treasuryContract.totalFunds(), DEPOSIT_AMOUNT - (FEE_M_REWARD + FEE_M_REWARD / 2));
        assertEq(mockUSDC.balanceOf(LENDER1), FEE_M_REWARD);
        assertEq(mockUSDC.balanceOf(LENDER2), FEE_M_REWARD / 2);
        
        vm.stopPrank();
    }
    
    function testGetFeeMRewards() public {
        // Initially no FeeM rewards
        assertEq(treasuryContract.getFeeMRewards(LENDER1), 0);
        
        // Distribute FeeM rewards
        testDistributeFeeM();
        
        // Check that the FeeM rewards are correct
        assertEq(treasuryContract.getFeeMRewards(LENDER1), FEE_M_REWARD);
    }
    
    function testPauseAndUnpause() public {
        // Prank as OWNER
        vm.startPrank(OWNER);
        
        // Pause the treasury
        treasuryContract.pause();
        
        // Try to deposit funds when paused (should fail)
        vm.expectRevert();
        treasuryContract.depositFunds(DEPOSIT_AMOUNT);
        
        // Unpause the treasury
        treasuryContract.unpause();
        
        // Now deposit should work
        vm.stopPrank();
        vm.startPrank(USER1);
        treasuryContract.depositFunds(DEPOSIT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function test_RevertWhen_DepositZeroAmount() public {
        // Prank as USER1
        vm.startPrank(USER1);
        
        // Try to deposit zero amount (should fail)
        vm.expectRevert(bytes("Invalid amount"));
        treasuryContract.depositFunds(0);
        
        vm.stopPrank();
    }
    
    function test_RevertWhen_WithdrawInsufficientFunds() public {
        // Prank as OWNER
        vm.startPrank(OWNER);
        
        // Try to withdraw more than available (should fail)
        vm.expectRevert(bytes("Insufficient funds"));
        treasuryContract.withdrawFunds(LENDER1, DEPOSIT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function test_RevertWhen_DistributeFeeMInsufficientFunds() public {
        // Prank as OWNER
        vm.startPrank(OWNER);
        
        // Try to distribute FeeM rewards when no funds are available (should fail)
        vm.expectRevert(bytes("Insufficient funds"));
        treasuryContract.distributeFeeM(LENDER1, FEE_M_REWARD);
        
        vm.stopPrank();
    }
    
    function testGetTreasuryBalance() public {
        // Initially zero balance
        assertEq(treasuryContract.getTreasuryBalance(), 0);
        
        // Deposit funds
        testDepositFunds();
        
        // Check treasury balance
        assertEq(treasuryContract.getTreasuryBalance(), DEPOSIT_AMOUNT);
    }
}
