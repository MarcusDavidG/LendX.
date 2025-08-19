// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/chainlink-ccip/contracts/src/v0.8/automation/AutomationCompatible.sol";

import "./CollateralContract.sol";

contract LendingContract is Ownable, AutomationCompatible {
    CollateralContract public collateralContract;
    ISwapRouter public immutable uniswapRouter;
    address public constant USDC_ADDRESS = 0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6; 
    struct Loan {
        uint256 amount;
        uint256 interest;
        uint256 dueDate;
        address collateral;
        address nftAddress; // Address of the NFT contract if NFT collateral
        uint256 tokenId;    // Token ID of the NFT if NFT collateral
        bool isNFTCollateral; // True if NFT is used as collateral
    }
    mapping(address => Loan) public loans;
    
    // Track borrowers for automation
    address[] public borrowers;
    mapping(address => bool) public isBorrower;

    event LoanRequested(address indexed user, uint256 amount, address tokenIn, address collateralAddress, uint256 tokenId, bool isNFTCollateral);
    event LoanRepaid(address indexed user, uint256 amount);
    event TokenTransferred(address indexed user, address token, address to, uint256 amount);
    event LoanLiquidated(address indexed user, uint256 amount);

    constructor(address _uniswapRouter, address payable _collateralContract) Ownable(msg.sender) {
        uniswapRouter = ISwapRouter(_uniswapRouter);
        collateralContract = CollateralContract(_collateralContract);
    }

    /**
     * @notice Checks if any loans are overdue and need to be liquidated
     * @param /*checkData data passed to the contract by the keeper
     * @return upkeepNeeded boolean to indicate whether the keeper should call performUpkeep
     * @return performData data to be passed to performUpkeep
     */
    function checkUpkeep(bytes calldata /*checkData*/) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 overdueCount = 0;
        
        // Iterate through all borrowers to find overdue loans
        for (uint256 i = 0; i < borrowers.length; i++) {
            address borrower = borrowers[i];
            Loan storage loan = loans[borrower];
            
            // Check if the loan is overdue
            if (loan.amount > 0 && block.timestamp > loan.dueDate) {
                // Note: In a production implementation, you would need a more efficient way to handle this
                overdueCount++;
            }
        }
        
        // Create array for overdue borrowers
        address[] memory overdueBorrowers = new address[](overdueCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < borrowers.length; i++) {
            address borrower = borrowers[i];
            Loan storage loan = loans[borrower];
            
            // Check if the loan is overdue
            if (loan.amount > 0 && block.timestamp > loan.dueDate) {
                overdueBorrowers[index] = borrower;
                index++;
            }
        }
        
        upkeepNeeded = overdueCount > 0;
        performData = abi.encode(overdueBorrowers);
    }

    /**
     * @notice Liquidates overdue loans
     * @param performData data passed to the contract by the keeper
     */
    function performUpkeep(bytes calldata performData) external override {
        // Decode the performData to get the list of overdue borrowers
        address[] memory overdueBorrowers = abi.decode(performData, (address[]));
        
        // Liquidate each overdue loan
        for (uint256 i = 0; i < overdueBorrowers.length; i++) {
            address borrower = overdueBorrowers[i];
            Loan storage loan = loans[borrower];
            
            // Check if the loan is actually overdue
            if (loan.amount > 0 && block.timestamp > loan.dueDate) {
                // Liquidate the loan
                // In a real implementation, you would:
                // 1. Transfer the collateral to the treasury
                // 2. Distribute any remaining funds to the lender
                // 3. Delete the loan from the mapping
                
                // For this example, we'll just delete the loan and emit an event
                emit LoanLiquidated(borrower, loan.amount);
                delete loans[borrower];
            }
        }
    }

    function requestLoan(uint256 amount, address tokenIn, uint256 amountInMax, address nftAddress, uint256 tokenId) external {
        require(amount > 0, "Invalid loan amount");
        require(loans[msg.sender].amount == 0, "Active loan exists"); // Ensure no active loan

        bool isNFT = (nftAddress != address(0) && tokenId != 0);

        if (isNFT) {
            // Lock NFT collateral
            collateralContract.lockCollateral(nftAddress, tokenId);
        } else {
            require(tokenIn != address(0), "Invalid tokenIn address");
            // Transfer tokenIn from user to this contract
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountInMax);
            IERC20(tokenIn).approve(address(uniswapRouter), amountInMax);

            // Swap tokenIn to USDC
            ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
                tokenIn: tokenIn,
                tokenOut: USDC_ADDRESS,
                fee: 3000, // 0.3% fee tier
                recipient: address(this),
                deadline: block.timestamp + 300,
                amountOut: amount,
                amountInMaximum: amountInMax,
                sqrtPriceLimitX96: 0
            });
            uniswapRouter.exactOutputSingle(params);
        }

        // Add borrower to the borrowers array if not already added
        if (!isBorrower[msg.sender]) {
            borrowers.push(msg.sender);
            isBorrower[msg.sender] = true;
        }

        loans[msg.sender] = Loan(
            amount,
            amount * 5 / 100,
            block.timestamp + 30 days,
            isNFT ? address(0) : tokenIn, // Collateral address is tokenIn if not NFT
            isNFT ? nftAddress : address(0),
            isNFT ? tokenId : 0,
            isNFT
        );
        emit LoanRequested(msg.sender, amount, tokenIn, nftAddress, tokenId, isNFT);
    }

    function repayLoan(address tokenIn, uint256 amountInMax) external {
        require(loans[msg.sender].amount > 0, "No active loan");
        uint256 amountOut = loans[msg.sender].amount + loans[msg.sender].interest;

        Loan storage loan = loans[msg.sender];

        if (loan.isNFTCollateral) {
            collateralContract.releaseCollateral(msg.sender);
        } else {
            if (tokenIn != USDC_ADDRESS) {
                IERC20(tokenIn).transferFrom(msg.sender, address(this), amountInMax);
                IERC20(tokenIn).approve(address(uniswapRouter), amountInMax);
                ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: USDC_ADDRESS,
                    fee: 3000,
                    recipient: address(this),
                    deadline: block.timestamp + 300,
                    amountOut: amountOut,
                    amountInMaximum: amountInMax,
                    sqrtPriceLimitX96: 0
                });
                uniswapRouter.exactOutputSingle(params);
            } else {
                IERC20(USDC_ADDRESS).transferFrom(msg.sender, address(this), amountOut);
            }
        }
        
        // Remove borrower from the borrowers array if they have no other loans
        // In this simple implementation, we assume each borrower has only one loan at a time
        delete loans[msg.sender];
        emit LoanRepaid(msg.sender, amountOut);
    }

    function transferTokens(address token, address to, uint256 amount) external {
        require(amount > 0, "Invalid amount");
        IERC20(token).transferFrom(msg.sender, to, amount);
        emit TokenTransferred(msg.sender, token, to, amount);
    }
}
