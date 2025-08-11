import { StaticImageData } from 'next/image';
import robert_fox from '../../../../public/images/robert_fox.png';
import cameron_williamson from '../../../../public/images/cameron_williamson.png';
import esther_howard from '../../../../public/images/esther_howard.png';

export type Props = {
  testimony: string;
  person: string;
  avatar: StaticImageData;
};

export const testimonials = [
  {
    testimony:
      "LendX has empowered me to start my small farm. The micro-loan process on the Sonic network was fast, and using NFT collateral was so easy. Now I can grow my business with confidence.",
    person: 'Robert Fox',
    avatar: robert_fox,
  },
  {
    testimony:
      "Thanks to LendX, I accessed a micro-loan to expand my market stall. The M-Pesa integration made it simple to deposit funds, and the platform’s security gives me peace of mind.",
    person: 'Cameron Williamson',
    avatar: cameron_williamson,
  },
  {
    testimony:
      "LendX’s platform changed how I manage my finances. The ability to lock NFTs as collateral and repay loans in USDC has been a game-changer for my entrepreneurial journey.",
    person: 'Esther Howard',
    avatar: esther_howard,
  },
  {
    testimony:
      "LendX helped me secure a micro-loan for my business without needing a bank account. The Sonic network’s low fees and the mock M-Pesa system made everything seamless and affordable.",
    person: 'Cameron Williamson',
    avatar: cameron_williamson,
  },
  {
    testimony:
      "With LendX, I’ve been able to borrow and repay micro-loans effortlessly. The user-friendly interface and cross-chain NFT verification make it a powerful tool for unbanked entrepreneurs like me.",
    person: 'Robert Fox',
    avatar: robert_fox,
  },
];

export const desktopHeaderPhrase = ['Join our growing', 'community'];