"use client";

import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import ConnectWalletButton from './ConnectWalletButton';
import './components.css';

const RepayScreen = () => {
  const { isConnected } = useWallet();
  const [loanAmount, setLoanAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [isProcessing, setIsProcessing] = useState(false);

  const tokens = ['USDC', 'S', 'ETH'];

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Mock repay functionality
    setTimeout(() => {
      alert('Repayment processed successfully!');
      setIsProcessing(false);
      setRepayAmount('');
    }, 2000);
  };

  return (
    <div className="repay-container">
      <h2 className="text-3xl font-bold mb-6 text-center">Repay Loan</h2>
      
      {!isConnected ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Connect your wallet to repay loans</p>
          <ConnectWalletButton size="large" variant="primary" />
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <form onSubmit={handleRepay} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Loan Amount</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="0.0"
                className="form-input w-full"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Repay Amount</label>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="0.0"
                className="form-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Token</label>
              <select 
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="form-select w-full"
              >
                {tokens.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit"
              disabled={isProcessing || !repayAmount}
              className={`w-full font-bold py-2 px-4 rounded ${
                isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Repay Loan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default RepayScreen;
