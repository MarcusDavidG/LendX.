import FAQ from '../../components/UI/FAQ';
import Featured from '../../components/UI/Featured';
import FinancialFuture from '../../components/UI/FinancialFuture';
import FinancilaFreedom from '../../components/UI/FinancialFreedom';
import HeroSection from '../../components/UI/HeroSection';
import IntroSection from '../../components/UI/IntroSection';
import JoinSection from '../../components/UI/JoinSection';
import OffersSection from '../../components/UI/OffersSection';
import Layout from '../../components/Layout';

export default function Home() {
  return (
    <Layout>
      <main>
        <HeroSection />
        <Featured />
        <OffersSection />
        <FinancilaFreedom />
        <FinancialFuture />
        <IntroSection />
        <JoinSection />
        <FAQ />
      </main>
    </Layout>
  );
}
