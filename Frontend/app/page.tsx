import DashboardScreen from './components/DashboardScreen';
import { WalletProvider } from './contexts/WalletContext';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <WalletProvider>
        <DashboardScreen />
      </WalletProvider>
    </div>
  );
}
