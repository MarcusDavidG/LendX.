import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/WalletContext';
import "./globals.css";
import GlobalHeader from './components/GlobalHeader';
import GlobalFooter from './components/GlobalFooter';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LendX - Decentralized Lending Platform",
  description: "Borrow and lend crypto assets with LendX",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <GlobalHeader />
          <main style={{ minHeight: 'calc(100vh - 200px)' }}>
            {children}
          </main>
          <GlobalFooter />
          <Toaster position="top-right" />
        </WalletProvider>
      </body>
    </html>
  );
}
