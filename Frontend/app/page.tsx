import {
  FAQ,
  Featured,
  FinancialFuture,
  HeroSection,
  IntroSection,
  JoinSection,
  OffersSection,
} from './landingPage/components';
import Layout from './landingPage/components/Layout';

export default function Home() {
  return (
    <Layout>
      <main>
        <HeroSection />
        <Featured />
        <OffersSection />
        <FinancialFuture />
        <IntroSection />
        <JoinSection />
        <FAQ />
      </main>
    </Layout>
  );
}
