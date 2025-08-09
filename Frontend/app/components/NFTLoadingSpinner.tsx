import React from 'react';

interface NFTLoadingSpinnerProps {
  loading: boolean;
  message?: string;
}

export const NFTLoadingSpinner: React.FC<NFTLoadingSpinnerProps> = ({ loading, message = 'Loading NFTs...' }) => {
  if (!loading) return null;

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDelay: '0.1s' }}></div>
      </div>
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
};
