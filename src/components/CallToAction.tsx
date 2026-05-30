import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FadeInUp, ScaleIn } from '@/components/ScrollAnimations';

const CallToAction = () => {
  return (
    <section className="py-24 text-center bg-white relative overflow-hidden">
      {/* Subtle animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(135deg, #e0e7ff, #f0fdfa, #faf5ff, #e0e7ff)',
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <FadeInUp>
          <h2 className="text-4xl font-bold tracking-tighter text-slate-900 mb-4">
            Ready to Get Started?
          </h2>
        </FadeInUp>
        <FadeInUp delay={0.15}>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Create an account in minutes and start accepting the future of payments today. No long-term contracts, no hidden fees.
          </p>
        </FadeInUp>
        <ScaleIn delay={0.3}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="inline-block"
          >
            <Button asChild size="lg">
              <Link to="/onboarding">Create Your Account</Link>
            </Button>
          </motion.div>
        </ScaleIn>
      </div>
    </section>
  );
};

export default CallToAction;
