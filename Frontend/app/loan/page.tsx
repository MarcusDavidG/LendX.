import LoanScreen from '../components/LoanScreen';
import { WalletProvider } from '../contexts/WalletContext';
import Navigation from '../components/Navigation';

export default function LoanPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <WalletProvider>
        <Navigation />
        <main className="pt-16">
          <LoanScreen />
        </main>
      </WalletProvider>
    </div>
  );
}
