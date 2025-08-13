'use client';

import Image from 'next/image';
import { Coins } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: var(--background);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const HeaderContent = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
`;

const NavSection = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: var(--text-color);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: var(--primary-color);
  }
`;

const WalletSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ConnectButton = styled.button`
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const GlobalHeader = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <HeaderContainer>
      <HeaderContent>
        <LogoSection>
          <Logo>
            <Coins size={28} color="#10b981" strokeWidth={2} />
            <span>LendX</span>
          </Logo>
        </LogoSection>

        <NavSection>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/loan">Loans</NavLink>
          <NavLink href="/treasury">Treasury</NavLink>
          <NavLink href="/collateral">Collateral</NavLink>
          <NavLink href="/repay">Repay</NavLink>
          <NavLink href="/swap">Swap</NavLink>
        </NavSection>

        <WalletSection>
          <ConnectButton onClick={() => setIsConnected(!isConnected)}>
            {isConnected ? '0x1234...5678' : 'Connect Wallet'}
          </ConnectButton>
        </WalletSection>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default GlobalHeader;
