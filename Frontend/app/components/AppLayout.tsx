'use client';

import GlobalHeader from './GlobalHeader';
import GlobalFooter from './GlobalFooter';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <GlobalHeader />
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        paddingTop: '80px' // Account for sticky header height
      }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <GlobalFooter />
      </div>
    </>
  );
}
