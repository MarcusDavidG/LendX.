"use client";

import React from 'react';
import NFTCollateralScreen from '../components/NFTCollateralScreen';
import AppLayout from '../components/AppLayout';

export default function CollateralPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <NFTCollateralScreen />
      </div>
    </AppLayout>
  );
}
