"use client";

import React from 'react';
import RepayScreen from '../components/RepayScreen';
import AppLayout from '../components/AppLayout';

export default function RepayPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <RepayScreen />
      </div>
    </AppLayout>
  );
}
