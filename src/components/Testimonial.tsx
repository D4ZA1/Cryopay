import { motion } from 'framer-motion';
import { ScaleIn, FadeInUp, ParallaxSection } from '@/components/ScrollAnimations';

const Testimonial = () => {
  return (
    <ParallaxSection speed={0.3} className="py-24 bg-slate-900 text-white">
      <div className="container mx-auto px-6 text-center relative">
        {/* Decorative animated quote marks */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="absolute top-0 left-1/2 -translate-x-[120px] -translate-y-4 text-[120px] font-serif leading-none text-white select-none pointer-events-none"
        >
          &ldquo;
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          viewport={{ once: true }}
          className="absolute bottom-0 left-1/2 translate-x-[60px] translate-y-4 text-[120px] font-serif leading-none text-white select-none pointer-events-none"
        >
          &rdquo;
        </motion.span>

        <ScaleIn>
          <blockquote className="text-2xl italic font-light max-w-3xl mx-auto text-slate-300 relative z-10">
            "CryoPay made accepting crypto payments incredibly simple. It's the first platform that feels like it was designed for my business, not just for crypto experts."
          </blockquote>
        </ScaleIn>
        <FadeInUp delay={0.3}>
          <p className="mt-6 font-semibold text-slate-100">- Jane Doe, CEO of E-Shop</p>
        </FadeInUp>
      </div>
    </ParallaxSection>
  );
};

export default Testimonial;
