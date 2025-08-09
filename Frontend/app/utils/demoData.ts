import { ethers } from 'ethers';

// Sonic Hackathon Demo Data - African Farmer Persona
export interface DemoTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'swap' | 'mpesa';
  amount: string;
  token: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

export interface Loan {
  id: string;
  amount: string;
  collateral: string;
  interestRate: string;
  dueDate: string;
  status: 'active' | 'repaid';
  purpose: string;
}

export interface DemoWallet {
  address: string;
  balances: {
    S: string;
    USDC: string;
    ETH: string;
  };
  transactions: DemoTransaction[];
  loans: {
    active: Loan[];
    history: Loan[];
  };
  profile: {
    name: string;
    location: string;
    occupation: string;
    avatar: string;
  };
}

// Demo addresses for the hackathon
export const DEMO_ADDRESSES = {
  amina: '0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8A0', // Amina - Kenyan Farmer
  brian: '0x8ba1f109551bD432803012645a136c82C3e8C9a',   // Brian - Local Trader
  charity: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' // Charity - Shop Owner
};

// Create Amina's demo wallet - Kenyan farmer persona
export const createDemoWallet = (address: string = DEMO_ADDRESSES.amina): DemoWallet => {
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  
  return {
    address,
    balances: {
      S: '1250.75',  // S tokens from previous farming profits
      USDC: '45.50', // USDC from M-Pesa conversion
      ETH: '0.25'    // ETH for gas
    },
    transactions: [
      {
        id: 'tx-amina-001',
        type: 'mpesa',
        amount: '3000',
        token: 'USDC',
        timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
        status: 'completed',
        description: 'M-Pesa deposit converted to USDC'
      },
      {
        id: 'tx-amina-002',
        type: 'borrow',
        amount: '200',
        token: 'USDC',
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
        status: 'completed',
        description: 'Borrowed USDC for maize seeds'
      }
    ],
    loans: [
      {
        id: 'loan-2024-001',
        amount: '200',
        collateral: '400',
        interestRate: '3.5',
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        purpose: 'Maize seeds and fertilizer for 2-acre farm'
      }
    ]
  };
};

// Pre-configured demo wallet for hackathon
export const getHackathonDemoWallet = () => {
  return createDemoWallet(DEMO_ADDRESSES.amina);
};

// Demo statistics for the hackathon
export const getDemoStats = () => {
  return {
    totalUsers: 247,
    totalLoans: 1,234,
    totalVolume: '$89,450',
    averageLoan: '$72',
    repaymentRate: '96.8%',
    activeLoans: 156,
    collateralLocked: '$45,230',
    topRegions: ['Nakuru', 'Kisumu', 'Mombasa', 'Nairobi'],
    cropTypes: ['Maize', 'Beans', 'Tomatoes', 'Kale']
  };
};

// Demo scenarios for hackathon presentation
export const createDemoScenarios = () => {
  return {
    scenario1: {
      title: 'Amina Needs Seeds',
      description: 'Kenyan farmer needs $200 for maize seeds',
      steps: [
        'Deposit 3000 KES via M-Pesa',
        'Convert to 20 USDC',
        'Request $200 loan with collateral',
        'Receive funds instantly'
      ]
    },
    scenario2: {
      title: 'Cross-Chain Collateral',
      description: 'Use Ethereum NFT as additional collateral',
      steps: [
        'Connect Ethereum wallet',
        'Verify NFT ownership',
        'Lock NFT via CCIP',
        'Get better loan terms'
      ]
    },
    scenario3: {
      title: 'Seasonal Repayment',
      description: 'Repay loan after harvest',
      steps: [
        'Sell harvest for USDC',
        'Repay loan with interest',
        'Release collateral',
        'Keep profits'
      ]
    }
  };
};

// Export for use in components
export default {
  createDemoWallet,
  createDemoNFT,
  getDemoStats,
  getHackathonDemoWallet,
  DEMO_ADDRESSES
};
