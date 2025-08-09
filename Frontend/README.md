# Micro-Lending Wallet Frontend

This is the frontend implementation for the Micro-Lending Wallet dApp, featuring wallet functionality, token swapping, and loan management.

## Features Implemented

1. **Wallet Screen** - View token balances and send tokens
2. **Swap Screen** - Swap between S Token and USDC
3. **Loan Screen** - Request loans by swapping tokens
4. **Repay Screen** - Repay loans using wallet balance or token swaps
5. **Dashboard** - Overview of all activities

## Components

- `WalletScreen.tsx` - Wallet interface for viewing balances and sending tokens
- `SwapScreen.tsx` - Token swapping interface
- `LoanScreen.tsx` - Loan request interface
- `RepayScreen.tsx` - Loan repayment interface
- `DashboardScreen.tsx` - Main dashboard with overview of all activities
- `web3.ts` - Mock web3 utilities for blockchain interactions
- `components.css` - Additional styling for components

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Implementation Details

This implementation follows the requirements from TODO #11 in TODOS.md:
- Built UI Components with Wallet and Swap functionality
- Used minimal styling with Tailwind CSS
- Integrated mock web3 utilities for blockchain interactions
- Created a responsive dashboard with tab navigation

The components are designed to be modular and reusable, with each screen handling its specific functionality while sharing common styling and utilities.
