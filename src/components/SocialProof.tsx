const SocialProof = () => {
  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500 tracking-wider uppercase">
            Trusted by leading businesses worldwide
          </p>
          <div className="flex justify-center items-center space-x-12 mt-6 text-slate-400">
            {/* Replace with actual logos later */}
            <span className="font-bold text-2xl">TechCo</span>
            <span className="font-bold text-2xl">E-Shop</span>
            <span className="font-bold text-2xl">Innovate Inc.</span>
            <span className="font-bold text-2xl">Quantum</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;