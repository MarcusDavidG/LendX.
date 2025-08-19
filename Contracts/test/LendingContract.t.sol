// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LendingContract.sol";

contract LendingContractTest is Test {
    LendingContract lendingContract;
    address constant UNISWAP_ROUTER_ADDRESS = address(0x0c40Ae1c82401EA741953D3f026ADc07BE9e7943); // Mock Uniswap V3 Router
    address constant USDC_ADDRESS = address(0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6);
    address constant TEST_TOKEN_ADDRESS = address(0x1234567890123456789012345678901234567890);
    
    address user1 = address(0x1111111111111111111111111111111111111111);
    address user2 = address(0x2222222222222222222222222222222222222222);

    function setUp() public {
        // Deploy the lending contract
        lendingContract = new LendingContract(UNISWAP_ROUTER_ADDRESS);
        
        // Fund users with test tokens
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function testDeployment() public view {
        // Test that the contract is deployed correctly
        assertEq(address(lendingContract.uniswapRouter()), UNISWAP_ROUTER_ADDRESS);
    }

    function testRequestLoan() public {
        // Mock the token balances and approvals
        vm.mockCall(
            TEST_TOKEN_ADDRESS,
            abi.encodeWithSelector(IERC20.transferFrom.selector),
            abi.encode(true)
        );
        
        vm.mockCall(
            TEST_TOKEN_ADDRESS,
            abi.encodeWithSelector(IERC20.approve.selector),
            abi.encode(true)
        );
        
        // Mock the Uniswap router swap
        vm.mockCall(
            UNISWAP_ROUTER_ADDRESS,
            abi.encodeWithSelector(ISwapRouter.exactOutputSingle.selector),
            abi.encode(100)
        );
        
        // Prank as user1
        vm.startPrank(user1);
        
        // Request a loan with collateral address
        address mockCollateralAddress = address(0x1234567890123456789012345678901234567890);
        lendingContract.requestLoan(1000, TEST_TOKEN_ADDRESS, 1200, mockCollateralAddress);
        
        // Check that the loan was created
        (uint256 amount, uint256 interest, uint256 dueDate, address collateral) = lendingContract.loans(user1);
        assertEq(amount, 1000);
        assertEq(interest, 50); // 5% interest
        assertGt(dueDate, block.timestamp);
        assertEq(collateral, mockCollateralAddress); // collateral should be the mock address
        
        vm.stopPrank();
    }

    function testRepayLoan() public {
        // First request a loan
        testRequestLoan();
        
        // Mock the token balances and approvals for repayment
        vm.mockCall(
            TEST_TOKEN_ADDRESS,
            abi.encodeWithSelector(IERC20.transferFrom.selector),
            abi.encode(true)
        );
        
        vm.mockCall(
            TEST_TOKEN_ADDRESS,
            abi.encodeWithSelector(IERC20.approve.selector),
            abi.encode(true)
        );
        
        // Mock the Uniswap router swap for repayment
        vm.mockCall(
            UNISWAP_ROUTER_ADDRESS,
            abi.encodeWithSelector(ISwapRouter.exactOutputSingle.selector),
            abi.encode(1050) // 1000 + 50 interest
        );
        
        // Prank as user1
        vm.startPrank(user1);
        
        // Repay the loan
        lendingContract.repayLoan(TEST_TOKEN_ADDRESS, 1200);
        
        // Check that the loan was deleted
        (uint256 amount, , , ) = lendingContract.loans(user1);
        assertEq(amount, 0);
        
        vm.stopPrank();
    }

    function testTransferTokens() public {
        // Mock the token transfer
        vm.mockCall(
            TEST_TOKEN_ADDRESS,
            abi.encodeWithSelector(IERC20.transferFrom.selector),
            abi.encode(true)
        );
        
        // Prank as user1
        vm.startPrank(user1);
        
        // Transfer tokens
        lendingContract.transferTokens(TEST_TOKEN_ADDRESS, user2, 500);
        
        vm.stopPrank();
    }

    function test_RevertWhen_InvalidLoanAmount() public {
        // Prank as user1
        vm.startPrank(user1);
        
        // Try to request a loan with 0 amount
        vm.expectRevert();
        lendingContract.requestLoan(0, TEST_TOKEN_ADDRESS, 0, address(0x1234567890123456789012345678901234567890));
        
        vm.stopPrank();
    }

    function test_RevertWhen_NoActiveLoan() public {
        // Mock the token balances and approvals
        vm.mockCall(
            TEST_TOKEN_ADDRESS,
            abi.encodeWithSelector(IERC20.transferFrom.selector),
            abi.encode(true)
        );
        
        // Prank as user1
        vm.startPrank(user1);
        
        // Try to repay a loan when there is no active loan
        vm.expectRevert();
        lendingContract.repayLoan(TEST_TOKEN_ADDRESS, 1200);
        
        vm.stopPrank();
    }
}
