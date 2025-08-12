'use client';

import Image from 'next/image';
import { Coins } from 'lucide-react';
import {
  Wrapper,
  Inner,
  LogoContainer,
  Nav,
  CallToActions,
  AbsoluteLinks,
  BurgerMenu
} from './styles';
import ic_bars from '../../../../public/svgs/ic_bars.svg';
import GetStartedButton from '../../../components/Common/GetStartedButton';
import AnimatedLink from '../../../components/Common/AnimatedLink';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { links, menu } from './constants';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../../../app/contexts/ThemeContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Wrapper>
      <Inner>
        <LogoContainer>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Coins size={28} color="#10b981" strokeWidth={2} />
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-color)', letterSpacing: '-0.02em' }}>
              LendX
            </span>
          </div>
          <BurgerMenu onClick={() => setIsOpen(!isOpen)}>
            <motion.div
              variants={menu}
              animate={isOpen ? 'open' : 'closed'}
              initial="closed"
            ></motion.div>
            <Image src={ic_bars} alt="bars" />
          </BurgerMenu>
        </LogoContainer>
        <Nav className={isOpen ? 'active' : ''}>
          {links.map((link, i) => (
            <AnimatedLink key={i} title={link.linkTo} />
          ))}
        </Nav>
        <CallToActions className={isOpen ? 'active' : ''}>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
          <GetStartedButton />
        </CallToActions>
      </Inner>
    </Wrapper>
  );
};

export default Header;
