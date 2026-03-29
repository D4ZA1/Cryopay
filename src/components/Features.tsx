import { Wallet, QrCode, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/ScrollAnimations';

const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <motion.div
    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="p-8 bg-slate-50 rounded-lg text-left"
  >
    <div className="inline-block p-3 bg-slate-200 text-slate-800 rounded-lg mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600">{children}</p>
  </motion.div>
);

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-6 text-center">
        <FadeInUp>
          <h2 className="text-4xl font-bold tracking-tighter mb-16 text-slate-900">
            Why Choose CryoPay?
          </h2>
        </FadeInUp>
        <StaggerContainer className="grid md:grid-cols-3 gap-8">
          <StaggerItem>
            <FeatureCard icon={<Wallet size={24} />} title="You're in Control.">
              Choose between a simple custodial account or connect your own non-custodial wallet. The power is yours.
            </FeatureCard>
          </StaggerItem>
          <StaggerItem>
            <FeatureCard icon={<QrCode size={24} />} title="Pay Your Way.">
              Use our standard "push" flow for online checkout or our innovative "pull" request for in-person payments.
            </FeatureCard>
          </StaggerItem>
          <StaggerItem>
            <FeatureCard icon={<Zap size={24} />} title="Fast and Affordable.">
              Our serverless backend enables instant, gas-free payments for custodial users, with ultra-low fees for on-chain transactions.
            </FeatureCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
};

export default Features;
