'use client';

import { Coins, Download, Globe, ChevronDown } from 'lucide-react';
import styled, { css } from 'styled-components';

const FooterContainer = styled.footer`
  background: var(--background);
  border-top: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 4rem 0 1.5rem;
  position: relative;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 3rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FooterSection = styled.div`
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
    color: var(--heading-color, var(--text-color));
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 40px;
      height: 2px;
      background: var(--primary-color);
      transition: width 0.3s ease;
    }

    &:hover::after {
      width: 60px;
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.75rem;
    transform: translateX(0);
    transition: transform 0.2s ease;
    
    &:hover {
      transform: translateX(4px);
    }
  }

  a {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.9375rem;
    transition: all 0.2s ease;
    display: inline-block;
    padding: 0.125rem 0;

    &:hover {
      color: var(--primary-color);
      transform: translateX(2px);
    }
  }
`;

const BrandSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 280px;

  p {
    color: var(--text-secondary);
    font-size: 0.9375rem;
    line-height: 1.5;
    margin: 0;
  }
`;

const BrandHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  span {
    font-size: 1.625rem;
    font-weight: 700;
    color: var(--text-color);
    background: linear-gradient(to right, var(--primary-color), #10b981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: rotate(-15deg);
  }
`;

const QRCodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
`;

const QRCode = styled.div`
  width: 140px;
  height: 140px;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
`;

const AppStores = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 200px;
`;

const AppStoreButton = styled.button`
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;

  &:hover {
    background: var(--input-background);
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateY(-1px);
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
`;

const Copyright = styled.div`
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  a {
    color: var(--primary-color);
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }
`;

const LanguageSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9375rem;
  position: relative;
  cursor: pointer;

  svg {
    transition: transform 0.2s ease;
  }

  &:hover {
    color: var(--text-color);

    svg {
      transform: translateY(-1px);
    }
  }
`;

const LanguageDropdown = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem 0;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.2s ease;
  z-index: 10;

  ${LanguageSelector}:hover & {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  button {
    width: 100%;
    text-align: left;
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--input-background);
      color: var(--primary-color);
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;

  a {
    color: var(--text-secondary);
    transition: all 0.2s ease;

    &:hover {
      color: var(--primary-color);
      transform: translateY(-2px);
    }
  }
`;

const GlobalFooter = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterGrid>
          <BrandSection>
            <BrandHeader>
              <Coins size={32} strokeWidth={2} />
              <span>LendX</span>
            </BrandHeader>
            <p>
              The decentralized lending platform that empowers you to borrow and lend crypto assets with competitive rates.
            </p>
          </BrandSection>

          <FooterSection>
            <h3>Company</h3>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/press">Press</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </FooterSection>

          <FooterSection>
            <h3>Products</h3>
            <ul>
              <li><a href="/lending">Lending</a></li>
              <li><a href="/borrowing">Borrowing</a></li>
              <li><a href="/staking">Staking</a></li>
              <li><a href="/swap">Swap</a></li>
              <li><a href="/wallet">Wallet</a></li>
            </ul>
          </FooterSection>

          <FooterSection>
            <h3>Resources</h3>
            <ul>
              <li><a href="/help">Help Center</a></li>
              <li><a href="/guides">Guides</a></li>
              <li><a href="/status">System Status</a></li>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/privacy">Privacy</a></li>
            </ul>
          </FooterSection>

          <QRCodeSection>
            <h3>Download App</h3>
            <QRCode>
              <div>Scan to Download</div>
            </QRCode>
            <AppStores>
              <AppStoreButton>
                <Download size={18} />
                Google Play
              </AppStoreButton>
              <AppStoreButton>
                <Download size={18} />
                App Store
              </AppStoreButton>
            </AppStores>
          </QRCodeSection>
        </FooterGrid>

        <FooterBottom>
          <Copyright>
            © {new Date().getFullYear()} LendX. All rights reserved.
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </Copyright>
          
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <SocialLinks>
              <a href="#" aria-label="Twitter"><Globe size={18} /></a>
              <a href="#" aria-label="Discord"><Globe size={18} /></a>
              <a href="#" aria-label="Telegram"><Globe size={18} /></a>
              <a href="#" aria-label="Github"><Globe size={18} /></a>
            </SocialLinks>
            
            <LanguageSelector>
              <Globe size={18} />
              <span>English</span>
              <ChevronDown size={16} />
              <LanguageDropdown>
                <button>English</button>
                <button>中文</button>
                <button>Español</button>
                <button>日本語</button>
              </LanguageDropdown>
            </LanguageSelector>
          </div>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default GlobalFooter;