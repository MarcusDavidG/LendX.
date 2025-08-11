"use client";

import ConnectWalletButton from '../../../../../app/components/ConnectWalletButton';

interface GetStartedButtonProps {
  padding?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
}

const GetStartedButton = ({ padding, size = 'medium', variant = 'primary' }: GetStartedButtonProps) => {
  // Since ConnectWalletButton has different styling approach, we'll map padding to size
  const getSizeFromPadding = () => {
    if (padding?.includes('1rem')) return 'large';
    if (padding?.includes('0.5rem')) return 'small';
    return size;
  };

  return (
    <ConnectWalletButton 
      size={getSizeFromPadding()}
      variant={variant}
      showAddress={false}
    />
  );
};

export default GetStartedButton;
