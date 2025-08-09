import { describe, it, expect } from 'vitest';
import { 
  DEMO_USERS, 
  generateDemoTransactions, 
  formatTokenBalance, 
  getTokenContractAddress,
  populateDemoData 
} from '../demoDataPopulator';
import { CONTRACT_ADDRESSES } from '../../config/addresses';

describe('Demo Data Populator', () => {
  describe('DEMO_USERS', () => {
    it('should contain 3 demo users', () => {
      expect(DEMO_USERS).toHaveLength(3);
    });

    it('should have valid addresses for all users', () => {
      DEMO_USERS.forEach(user => {
        expect(user.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    it('should have positive balances for all tokens', () => {
      DEMO_USERS.forEach(user => {
        expect(parseFloat(user.balances.S)).toBeGreaterThan(0);
        expect(parseFloat(user.balances.USDC)).toBeGreaterThan(0);
        expect(parseFloat(user.balances.ETH)).toBeGreaterThan(0);
      });
    });
  });

  describe('generateDemoTransactions', () => {
    it('should generate 3 transactions', () => {
      const transactions = generateDemoTransactions('0x123...');
      expect(transactions).toHaveLength(3);
    });

    it('should have valid transaction types', () => {
      const transactions = generateDemoTransactions('0x123...');
      const validTypes = ['borrow', 'repay', 'deposit'];
      transactions.forEach(tx => {
        expect(validTypes).toContain(tx.type);
      });
    });

    it('should have positive amounts', () => {
      const transactions = generateDemoTransactions('0x123...');
      transactions.forEach(tx => {
        expect(parseFloat(tx.amount)).toBeGreaterThan(0);
      });
    });
  });

  describe('formatTokenBalance', () => {
    it('should format USDC with 2 decimal places', () => {
      expect(formatTokenBalance('45.50', 6)).toBe('45.50');
    });

    it('should format ETH with 4 decimal places', () => {
      expect(formatTokenBalance('0.25', 18)).toBe('0.2500');
    });
  });

  describe('getTokenContractAddress', () => {
    it('should return correct address for S token', () => {
      expect(getTokenContractAddress('S')).toBe(CONTRACT_ADDRESSES.TEST_S);
    });

    it('should return correct address for USDC token', () => {
      expect(getTokenContractAddress('USDC')).toBe(CONTRACT_ADDRESSES.TEST_USDC);
    });

    it('should return correct address for ETH token', () => {
      expect(getTokenContractAddress('ETH')).toBe(CONTRACT_ADDRESSES.TEST_ETH);
    });
  });

  describe('populateDemoData', () => {
    it('should return populated users with transactions', async () => {
      const populatedUsers = await populateDemoData({} as any);
      expect(populatedUsers).toHaveLength(3);
      populatedUsers.forEach(user => {
        expect(user.transactions).toHaveLength(3);
      });
    });
  });
});
