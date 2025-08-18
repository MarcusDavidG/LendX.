"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getBalance, sendTokens, onBalanceRefresh, offBalanceRefresh, getGasFee, getConfirmationTime } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import FiatGatewayScreen from './FiatGatewayScreen';

export default WalletScreen;