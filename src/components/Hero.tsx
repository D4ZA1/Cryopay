import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="pt-36 pb-24 text-center bg-white">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-slate-900"
        >
          The Future of Payments is Here.
          <br />
          <span className="text-slate-500">Simple, Secure Crypto.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          className="text-lg text-slate-600 max-w-2xl mx-auto mb-8"
        >
          CryoPay unifies the power of blockchain with the simplicity you expect.
          Accept and send payments globally with confidence.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
        >
          {/* FIX: Use asChild prop to make Link work inside Button */}
          <Button asChild size="lg">
            <Link to="/onboarding">
              Get Started for Free
              <ArrowRight className="inline ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

