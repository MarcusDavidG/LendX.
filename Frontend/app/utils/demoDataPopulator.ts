import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, TOKEN_DECIMALS } from '../config/addresses';

interface DemoUser {
  address: string;
  name: string;
  balances: {
    S: string;
    USDC: string;
    ETH: string;
  };
  transactions: any[];
}

interface DemoTransaction {
  id: string;
  type: 'borrow' | 'repay' | 'deposit' | 'withdraw';
  amount: string;
  token: string;
  timestamp: number;
  status: 'completed' | 'pending';
}

export const DEMO_USERS: DemoUser[] = [
  {
    address: "0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8A0",
    name: "Amina",
    balances: {
      S: "1250.75",
      USDC: "45.50",
      ETH: "0.25"
    },
    transactions: []
  },
  {
    address: "0x8ba1f109551bD432803012645a136c82C3e8C9a",
    name: "Brian",
    balances: {
      S: "850.25",
      USDC: "125.75",
      ETH: "0.15"
    },
    transactions: []
  },
  {
    address: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
    name: "Charity",
    balances: {
      S: "2000.00",
      USDC: "75.25",
      ETH: "0.50"
    },
    transactions: []
  }
];

export const generateDemoTransactions = (userAddress: string): DemoTransaction[] => {
  const now = Date.now();
  const transactions: DemoTransaction[] = [
    {
      id: `tx_${now}_1`,
      type: 'borrow',
      amount: "500",
      token: "USDC",
      timestamp: now - 86400000, // 1 day ago
      status: 'completed'
    },
    {
      id: `tx_${now}_2`,
      type: 'deposit',
      amount: "1000",
      token: "S",
      timestamp: now - 172800000, // 2 days ago
      status: 'completed'
    },
    {
      id: `tx_${now}_3`,
      type: 'repay',
      amount: "250",
      token: "USDC",
      timestamp: now - 259200000, // 3 days ago
      status: 'completed'
    }
  ];
  
  return transactions;
};

export const populateDemoData = async (provider: ethers.Provider) => {
  const populatedUsers = DEMO_USERS.map(user => ({
    ...user,
    transactions: generateDemoTransactions(user.address)
  }));
  
  return populatedUsers;
};

export const formatTokenBalance = (balance: string, decimals: number): string => {
  return parseFloat(balance).toFixed(decimals === 6 ? 2 : 4);
};

export const getTokenContractAddress = (symbol: string): string => {
  const mapping: Record<string, string> = {
    'S': CONTRACT_ADDRESSES.TEST_S,
    'USDC': CONTRACT_ADDRESSES.TEST_USDC,
    'ETH': CONTRACT_ADDRESSES.TEST_ETH
  };
  return mapping[symbol] || '';
};
