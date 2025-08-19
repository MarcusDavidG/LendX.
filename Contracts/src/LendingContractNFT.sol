// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/chainlink-ccip/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface ICollateralContract {
    function lockCollateral(address nftAddress, uint256 tokenId) external;
    function releaseCollateral(address user) external;
}

contract LendingContractNFT is Ownable, AutomationCompatible {
    ISwapRouter public immutable uniswapRouter;
    address public constant USDC_ADDRESS = 0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6; 
    
    // Collateral contract for NFT collateral
    address public immutable collateralContract;
    
    struct Loan { 
        uint256 amount; 
        uint256 interest; 
        uint256 dueDate; 
        address collateral; // For token collateral
        address nftAddress; // For NFT collateral
        uint256 tokenId;    // For NFT collateral
        bool isNFTCollateral;
        bool isActive;
    }
    
    mapping(address => Loan) public loans;
    
    // Track borrowers for automation
    address[] public borrowers;
    mapping(address => bool) public isBorrower;

    event LoanRequested(address indexed user, uint256 amount, address collateralType, bool isNFT);
    event LoanRepaid(address indexed user, uint256 amount);
    event TokenTransferred(address indexed user, address token, address to, uint256 amount);
    event LoanLiquidated(address indexed user, uint256 amount);
    event NFTCollateralLocked(address indexed user, address nftAddress, uint256 tokenId);

    constructor(address _uniswapRouter, address _collateralContract) Ownable(msg.sender) {
        uniswapRouter = ISwapRouter(_uniswapRouter);
        collateralContract = _collateralContract;
    }

    /**
     * @notice Request a loan with token swap as collateral
     * @param amount The loan amount in USDC
     * @param tokenIn The token to swap for USDC
     * @param amountInMax Maximum amount of tokenIn to swap
     */
    function requestLoan(uint256 amount, address tokenIn, uint256 amountInMax) external {
        require(amount > 0, "Invalid loan amount");
        require(!loans[msg.sender].isActive, "Active loan exists");
        
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

        // Add borrower to the borrowers array if not already added
        if (!isBorrower[msg.sender]) {
            borrowers.push(msg.sender);
            isBorrower[msg.sender] = true;
        }

        loans[msg.sender] = Loan({
            amount: amount,
            interest: amount * 5 / 100,
            dueDate: block.timestamp + 30 days,
            collateral: tokenIn,
            nftAddress: address(0),
            tokenId: 0,
            isNFTCollateral: false,
            isActive: true
        });
        
        emit LoanRequested(msg.sender, amount, tokenIn, false);
    }

    /**
     * @notice Request a loan with NFT as collateral
     * @param amount The loan amount in USDC
     * @param nftAddress The NFT contract address
     * @param tokenId The NFT token ID
     */
    function requestLoanWithNFTCollateral(uint256 amount, address nftAddress, uint256 tokenId) external {
        require(amount > 0, "Invalid loan amount");
        require(!loans[msg.sender].isActive, "Active loan exists");
        require(nftAddress != address(0), "Invalid NFT address");

        // Lock NFT in collateral contract
        ICollateralContract(collateralContract).lockCollateral(nftAddress, tokenId);

        // Add borrower to the borrowers array if not already added
        if (!isBorrower[msg.sender]) {
            borrowers.push(msg.sender);
            isBorrower[msg.sender] = true;
        }

        loans[msg.sender] = Loan({
            amount: amount,
            interest: amount * 5 / 100,
            dueDate: block.timestamp + 30 days,
            collateral: address(0),
            nftAddress: nftAddress,
            tokenId: tokenId,
            isNFTCollateral: true,
            isActive: true
        });
        
        emit LoanRequested(msg.sender, amount, nftAddress, true);
        emit NFTCollateralLocked(msg.sender, nftAddress, tokenId);
    }

    /**
     * @notice Repay an active loan
     * @param tokenIn The token to use for repayment (USDC or other tokens)
     * @param amountInMax Maximum amount of tokenIn to use for repayment
     */
    function repayLoan(address tokenIn, uint256 amountInMax) external {
        require(loans[msg.sender].isActive, "No active loan");
        
        Loan storage loan = loans[msg.sender];
        uint256 amountOut = loan.amount + loan.interest;
        
        if (loan.isNFTCollateral) {
            // For NFT collateral, just transfer USDC
            IERC20(USDC_ADDRESS).transferFrom(msg.sender, address(this), amountOut);
            
            // Release NFT from collateral contract
            ICollateralContract(collateralContract).releaseCollateral(msg.sender);
        } else {
            // For token collateral, handle token swap
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
        
        // Remove borrower from the borrowers array
        _removeBorrower(msg.sender);
        
        // Delete the loan
        delete loans[msg.sender];
        
        emit LoanRepaid(msg.sender, amountOut);
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
            if (loan.isActive && block.timestamp > loan.dueDate) {
                overdueCount++;
            }
        }
        
        // Create array for overdue borrowers
        address[] memory overdueBorrowers = new address[](overdueCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < borrowers.length; i++) {
            address borrower = borrowers[i];
            Loan storage loan = loans[borrower];
            
            if (loan.isActive && block.timestamp > loan.dueDate) {
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
            if (loan.isActive && block.timestamp > loan.dueDate) {
                // Handle liquidation based on collateral type
                if (loan.isNFTCollateral) {
                    // NFT collateral - handle liquidation
                    emit LoanLiquidated(borrower, loan.amount);
                } else {
                    // Token collateral - handle liquidation
                    emit LoanLiquidated(borrower, loan.amount);
                }
                
                // Delete the loan
                delete loans[borrower];
                _removeBorrower(borrower);
            }
        }
    }

    /**
     * @notice Get loan information for a user
     * @param user The user address
     * @return amount The loan amount
     * @return interest The interest amount
     * @return dueDate The due date
     * @return isNFTCollateral Whether NFT is used as collateral
     * @return isActive Whether the loan is active
     */
    function getLoanInfo(address user) external view returns (
        uint256 amount,
        uint256 interest,
        uint256 dueDate,
        bool isNFTCollateral,
        bool isActive
    ) {
        Loan storage loan = loans[user];
        return (
            loan.amount,
            loan.interest,
            loan.dueDate,
            loan.isNFTCollateral,
            loan.isActive
        );
    }

    /**
     * @notice Internal function to remove borrower from array
     * @param borrower The borrower address to remove
     */
    function _removeBorrower(address borrower) private {
        if (isBorrower[borrower]) {
            isBorrower[borrower] = false;
            
            // Find and remove from borrowers array
            for (uint256 i = 0; i < borrowers.length; i++) {
                if (borrowers[i] == borrower) {
                    borrowers[i] = borrowers[borrowers.length - 1];
                    borrowers.pop();
                    break;
                }
            }
        }
    }

    function transferTokens(address token, address to, uint256 amount) external {
        require(amount > 0, "Invalid amount");
        IERC20(token).transferFrom(msg.sender, to, amount);
        emit TokenTransferred(msg.sender, token, to, amount);
    }
}
