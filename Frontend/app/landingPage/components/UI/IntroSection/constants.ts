import ic_document_duplicate from '../../../../public/svgs/ic_document_duplicate.svg';
import ic_identification from '../../../../public/svgs/ic_identification.svg';
import ic_lock_closed from '../../../../public/svgs/ic_lock_closed.svg';

// For desktop
export const desktopHeaderPhrase = ['Introducing LendX’s', 'Micro-Lending Tools'];
export const desktopParagraphPhrase = [
  'Discover LendX’s innovative platform for unbanked farmers and entrepreneurs.',
  'Access micro-loans, NFT collateral, and M-Pesa integration on the Sonic network with ease and security.',
];

// For mobile
export const mobileHeaderPhrase = ['Introducing LendX’s', 'Micro-Lending Tools'];
export const mobileParagraphPhrase = [
  'Discover LendX’s innovative platform for unbanked',
  'farmers and entrepreneurs. Access micro-loans, NFT',
  'collateral, and M-Pesa integration with ease and security.',
];

export const edges = [
  {
    point: 'Seamless Wallet Integration',
    details:
      'Connect your MetaMask wallet to the Sonic Blaze testnet for quick access to micro-loans, repayments, and token swaps with a single click.',
    icon: ic_document_duplicate,
  },
  {
    point: 'Flexible Collateral Options',
    details:
      'Lock NFTs or ERC20 tokens as collateral for micro-loans, with cross-chain verification on Ethereum via Chainlink CCIP.',
    icon: ic_identification,
  },
  {
    point: 'Secure Transactions',
    details:
      'Your funds are protected by Sonic’s blockchain and smart contracts, ensuring secure loan requests, repayments, and automated liquidations.',
    icon: ic_lock_closed,
  },
];