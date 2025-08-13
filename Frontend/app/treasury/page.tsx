import TreasuryScreen from '../components/TreasuryScreen';
import AppLayout from '../components/AppLayout';

export default function TreasuryPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <TreasuryScreen />
      </div>
    </AppLayout>
  );
}
