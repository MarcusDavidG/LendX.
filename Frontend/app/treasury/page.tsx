import TreasuryScreen from '../components/TreasuryScreen';
import { WalletProvider } from '../contexts/WalletContext';
import Navigation from '../components/Navigation';

export default function TreasuryPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <WalletProvider>
        <Navigation />
        <main className="pt-16">
          <TreasuryScreen />
        </main>
      </WalletProvider>
    </div>
  );
}
