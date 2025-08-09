import WalletScreen from '../components/WalletScreen';
import { WalletProvider } from '../contexts/WalletContext';
import Navigation from '../components/Navigation';

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <WalletProvider>
        <Navigation />
        <main className="pt-16">
          <WalletScreen />
        </main>
      </WalletProvider>
    </div>
  );
}
