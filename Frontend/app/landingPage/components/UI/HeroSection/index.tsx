'use client';
import Image from 'next/image';
import { Wrapper, Inner, Pill, HeroTextContainer } from './styles';
import ic_chevron_right from '../../../../public/svgs/ic_chevron_right.svg';
import GetStartedButton from '../../../components/Common/GetStartedButton';
import MaskText from '../../../components/Common/MaskText';
import {
  phrases as desktopPhrases,
  paragraphPhrases as desktopParagraphPhrases,
  mobilePhrases,
  mobileParagraphPhrases,
} from './constants';

const HeroSection = () => {
  return (
    <Wrapper>
      <Inner>
        <Pill>
          <span>Introducing Africa's No.1 Lending dApp</span>
          <Image src={ic_chevron_right} alt="chevron-right" />
        </Pill>
        <HeroTextContainer>
          {/* Desktop content */}
          <div className="desktop-content">
            <MaskText phrases={desktopPhrases} tag="h1" />
            <MaskText phrases={desktopParagraphPhrases} tag="p" />
          </div>
          
          {/* Mobile content */}
          <div className="mobile-content">
            <MaskText phrases={mobilePhrases} tag="h1" />
            <MaskText phrases={mobileParagraphPhrases} tag="p" />
          </div>
        </HeroTextContainer>
        <GetStartedButton padding="1rem 2rem" />
      </Inner>
    </Wrapper>
  );
};

export default HeroSection;
