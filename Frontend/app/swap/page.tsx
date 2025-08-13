import SwapScreen from '../components/SwapScreen';
import AppLayout from '../components/AppLayout';

export default function SwapPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <SwapScreen />
      </div>
    </AppLayout>
  );
}
