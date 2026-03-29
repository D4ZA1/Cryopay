import { FadeInUp, StaggerContainer, StaggerItem, ScaleIn, CountUp } from '@/components/ScrollAnimations';

const SocialProof = () => {
  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <FadeInUp>
            <p className="text-sm font-semibold text-slate-500 tracking-wider uppercase">
              Trusted by leading businesses worldwide
            </p>
          </FadeInUp>
          <StaggerContainer className="flex justify-center items-center space-x-12 mt-6 text-slate-400">
            <StaggerItem>
              <ScaleIn>
                <span className="font-bold text-2xl">TechCo</span>
              </ScaleIn>
            </StaggerItem>
            <StaggerItem>
              <ScaleIn>
                <span className="font-bold text-2xl">E-Shop</span>
              </ScaleIn>
            </StaggerItem>
            <StaggerItem>
              <ScaleIn>
                <span className="font-bold text-2xl">Innovate Inc.</span>
              </ScaleIn>
            </StaggerItem>
            <StaggerItem>
              <ScaleIn>
                <span className="font-bold text-2xl">Quantum</span>
              </ScaleIn>
            </StaggerItem>
          </StaggerContainer>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 max-w-4xl mx-auto">
            <StaggerItem>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">
                  <CountUp to={10} duration={2} suffix="K+" />
                </span>
                <span className="text-sm text-slate-500 mt-1">Users</span>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">
                  <CountUp to={50} duration={2} prefix="$" suffix="M+" />
                </span>
                <span className="text-sm text-slate-500 mt-1">Processed</span>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">
                  <CountUp to={99.9} duration={2} suffix="%" decimals={1} />
                </span>
                <span className="text-sm text-slate-500 mt-1">Uptime</span>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">
                  <CountUp to={150} duration={2} suffix="+" />
                </span>
                <span className="text-sm text-slate-500 mt-1">Countries</span>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
