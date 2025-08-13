'use client';

import { Coins, Download, Globe } from 'lucide-react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: var(--background);
  border-top: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 3rem 0 1rem;
`;

const FooterContent = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FooterSection = styled.div`
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.5rem;
  }

  a {
    color: #9ca3af;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;

    &:hover {
      color: var(--primary-color);
    }
  }
`;

const BrandSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BrandHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  span {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
  }
`;

const QRCodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const QRCode = styled.div`
  width: 120px;
  height: 120px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
  font-size: 0.75rem;
`;

const AppStores = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AppStoreButton = styled.button`
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: var(--text-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: var(--input-background);
    border-color: var(--primary-color);
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const LanguageSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  font-size: 0.875rem;
`;

const GlobalFooter = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterGrid>
          <BrandSection>
            <BrandHeader>
              <Coins size={28} color="#10b981" strokeWidth={2} />
              <span>LendX</span>
            </BrandHeader>
          </BrandSection>

          <FooterSection>
            <h3>Company</h3>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/press">Press</a></li>
              <li><a href="/news">News</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </FooterSection>

          <QRCodeSection>
            <h3>Download App</h3>
            <QRCode>
              <div>QR Code</div>
            </QRCode>
            <AppStores>
              <AppStoreButton>
                <Download size={16} />
                Google Play
              </AppStoreButton>
              <AppStoreButton>
                <Download size={16} />
                App Store
              </AppStoreButton>
            </AppStores>
          </QRCodeSection>
        </FooterGrid>

        <FooterBottom>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            © 2024 LendX. All rights reserved.
          </div>
          <LanguageSelector>
            <Globe size={16} />
            <span>English</span>
          </LanguageSelector>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default GlobalFooter;
