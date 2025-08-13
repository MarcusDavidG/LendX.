"use client";

import React from 'react';
import CollateralScreen from '../components/CollateralScreen';
import AppLayout from '../components/AppLayout';

export default function CollateralPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <CollateralScreen />
      </div>
    </AppLayout>
  );
}
