'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Coins, Menu, X } from 'lucide-react';
import styled, { css } from 'styled-components';
import ConnectWalletButton from './ConnectWalletButton';

const HeaderContainer = styled.header`
  background: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
`;

const HeaderContent = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
`;

const LogoSection = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 700;
  font-size: 1.5rem;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const LogoIcon = styled(Coins)`
  color: var(--primary-color);
  transition: transform 0.3s ease;

  ${LogoSection}:hover & {
    transform: rotate(-15deg);
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const activeLinkStyles = css`
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
  transform: translateY(-1px);
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  position: relative;
  
  &:hover {
    color: var(--primary-color);
    transform: translateY(-1px);
  }

  ${props => props.$isActive && activeLinkStyles}

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--primary-color);
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 100%;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
  transition: transform 0.2s ease;
  z-index: 101;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div<{ $isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  background: var(--card-background);
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-100%)'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 99;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileNavLink = styled(Link)<{ $isActive: boolean }>`
  display: block;
  color: ${props => props.$isActive ? 'var(--primary-color)' : 'var(--text-color)'};
  text-decoration: none;
  padding: 1rem 0;
  font-size: 1rem;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--primary-color);
    padding-left: 0.5rem;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const GlobalHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Loans', href: '/loan' },
    { name: 'Treasury', href: '/treasury' },
    { name: 'Collateral', href: '/collateral' },
    { name: 'Repay', href: '/repay' },
    { name: 'Swap', href: '/swap' },
  ];

  return (
    <HeaderContainer>
      <HeaderContent>
        <LogoSection href="/">
          <LogoIcon size={28} />
          <span>LendX</span>
        </LogoSection>

        <Navigation>
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              href={item.href}
              $isActive={pathname === item.href}
            >
              {item.name}
            </NavLink>
          ))}
        </Navigation>

        <ActionButtons>
          <ConnectWalletButton 
            size="medium" 
            variant="primary"
            redirectOnConnect={true}
            redirectTo="/dashboard"
          />
          
          <MobileMenuButton
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </MobileMenuButton>
        </ActionButtons>
      </HeaderContent>

      <MobileMenu $isOpen={isMobileMenuOpen}>
        {navigationItems.map((item) => (
          <MobileNavLink
            key={item.name}
            href={item.href}
            $isActive={pathname === item.href}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {item.name}
          </MobileNavLink>
        ))}
      </MobileMenu>
    </HeaderContainer>
  );
};

export default GlobalHeader;