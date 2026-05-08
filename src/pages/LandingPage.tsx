import '../styles/landing.css';
import ScrollBackground from '../components/landing/ScrollBackground';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import TextRevealSection from '../components/landing/TextRevealSection';
import BinAnimation from '../components/landing/BinAnimation';
import ValueProposition from '../components/landing/ValueProposition';
import HowItWorks from '../components/landing/HowItWorks';
import HorizontalFeatures from '../components/landing/HorizontalFeatures';
import ImpactStats from '../components/landing/ImpactStats';
import BlockchainSection from '../components/landing/BlockchainSection';
import CTASection from '../components/landing/CTASection';
import FooterSection from '../components/landing/FooterSection';

const LandingPage = () => {
  return (
    <div className="landing-root">
      {/* Full-page shader background that changes as you scroll */}
      <ScrollBackground />

      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <TextRevealSection />
        <BinAnimation />
        <ValueProposition />
        <HowItWorks />
        <HorizontalFeatures />
        <ImpactStats />
        <BlockchainSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
};

export default LandingPage;
