'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Coins, Menu, X } from 'lucide-react';
import styled, { css } from 'styled-components';
import ConnectWalletButton from './ConnectWalletButton';

const HeaderContainer = styled.header`
  background-color: #0D1117;
  border-bottom: 1px solid #30363D;
  position: sticky;
  top: 0;
  z-index: 50;
  transition: background-color 0.3s ease, border-color 0.3s ease;
`;

const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
`;

const LogoSection = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #C9D1D9;
  font-weight: 600;
  font-size: 1.25rem;
`;

const LogoIcon = styled(Coins)`


color: #238636;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);

  ${LogoSection}:hover & {
    transform: rotate(180deg);
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 2.5rem;

  @media (max-width: 992px) {
    display: none;
  }
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  color: #8B949E;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.25rem 0;
  position: relative;
  transition: color 0.2s ease-in-out;

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background-color: #238636;
    transition: width 0.3s ease;
  }

  &:hover {
    color: #C9D1D9;
  }

  ${props => props.$isActive && css`
    color: #C9D1D9;
    &::after {
      width: 20px;
    }
  `}
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: #C9D1D9;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 101;

  @media (max-width: 992px) {
    display: block;
  }
`;

const MobileMenuContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(13, 17, 23, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
`;

const MobileNavLink = styled(Link)<{ $isActive: boolean }>`
  color: ${props => props.$isActive ? '#238636' : '#C9D1D9'};
  text-decoration: none;
  font-size: 1.75rem;
  font-weight: 500;
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #238636;
    transform: scale(1.05);
  }
`;

const GlobalHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Loans', href: '/loan' },
    { name: 'Swap', href: '/swap' },
    { name: 'Treasury', href: '/treasury' },
  ];

  return (
    <>
      <HeaderContainer>
        <HeaderContent>
          <LogoSection href="/">
            <LogoIcon size={26} />
            <span>LendX</span>
          </LogoSection>

          <Navigation>
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                $isActive={pathname.startsWith(item.href)}
              >
                {item.name}
              </NavLink>
            ))}
          </Navigation>

          <ActionButtons>
            <ConnectWalletButton size="medium" variant="primary" />
            <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </MobileMenuButton>
          </ActionButtons>
        </HeaderContent>
      </HeaderContainer>

      <MobileMenuContainer $isOpen={isMobileMenuOpen}>
        <MobileMenuButton 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: 'absolute', top: '2rem', right: '2rem' }}
        >
          <X size={30} />
        </MobileMenuButton>
        {navigationItems.map((item) => (
          <MobileNavLink
            key={item.name}
            href={item.href}
            $isActive={pathname.startsWith(item.href)}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {item.name}
          </MobileNavLink>
        ))}
      </MobileMenuContainer>
    </>
  );
};

export default GlobalHeader;