import SwapScreen from '../components/SwapScreen';
import { WalletProvider } from '../contexts/WalletContext';
import Navigation from '../components/Navigation';

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <WalletProvider>
        <Navigation />
        <main className="pt-16">
          <SwapScreen />
        </main>
      </WalletProvider>
    </div>
  );
}
