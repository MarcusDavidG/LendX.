'use client';

import { Coins, Send, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: #0D1117;
  color: #8B949E;
  padding: 5rem 2rem 2rem;
  border-top: 1px solid #30363D;
`;

const FooterContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 3rem;
  margin-bottom: 4rem;
`;

const FooterSection = styled.div`
  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #C9D1D9;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.75rem;
  }

  a {
    color: #8B949E;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: #238636;
    }
  }
`;

const BrandSection = styled(FooterSection)`
  grid-column: span 2 / span 2;
  @media (max-width: 768px) {
    grid-column: auto;
  }
`;

const BrandHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  span {
    font-size: 1.5rem;
    font-weight: 700;
    color: #C9D1D9;
  }
`;

const NewsletterForm = styled.form`
  margin-top: 1.5rem;
  display: flex;
  gap: 0.5rem;

  input {
    background-color: #010409;
    border: 1px solid #30363D;
    color: #C9D1D9;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    flex-grow: 1;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

    &:focus {
      outline: none;
      border-color: #238636;
      box-shadow: 0 0 0 3px rgba(35, 134, 54, 0.2);
    }
  }

  button {
    background-color: #238636;
    color: white;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    transition: background-color 0.2s ease-in-out;

    &:hover {
      background-color: #2EA043;
    }
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid #30363D;
  padding-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    align-items: center;
    gap: 2rem;
  }
`;

const Copyright = styled.p`
  color: #8B949E;
  font-size: 0.8rem;
  margin: 0;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1.5rem;

  a {
    color: #8B949E;
    transition: color 0.2s ease-in-out, transform 0.2s ease-in-out;

    &:hover {
      color: #C9D1D9;
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
              <Coins size={28} strokeWidth={2} color="#238636" />
              <span>LendX</span>
            </BrandHeader>
            <p>Your trusted partner in decentralized finance. Access loans, earn interest, and grow your crypto portfolio with our secure and transparent platform.</p>
            <NewsletterForm onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" />
              <button type="submit">
                <Send size={16} />
                <span>Stay up to date</span>
              </button>
            </NewsletterForm>
          </BrandSection>

          <FooterSection>
            <h3>Resources</h3>
            <ul>
              <li><a href="/docs">Documentation</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/support">Support</a></li>
              <li><a href="/security">Security</a></li>
            </ul>
          </FooterSection>

          <FooterSection>
            <h3>Company</h3>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/press">Press Kit</a></li>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
            </ul>
          </FooterSection>
        </FooterGrid>

        <FooterBottom>
          <Copyright>© {new Date().getFullYear()} LendX. All rights reserved.</Copyright>
          <SocialLinks>
            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={20} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
          </SocialLinks>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default GlobalFooter;