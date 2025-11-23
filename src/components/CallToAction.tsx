import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const CallToAction = () => {
  return (
    <section className="py-24 text-center bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold tracking-tighter text-slate-900 mb-4">Ready to Get Started?</h2>
        <p className="text-slate-600 mb-8 max-w-xl mx-auto">
          Create an account in minutes and start accepting the future of payments today. No long-term contracts, no hidden fees.
        </p>
        {/* FIX: Use asChild prop to make Link work inside Button */}
        <Button asChild size="lg">
          <Link to="/onboarding">Create Your Account</Link>
        </Button>
      </div>
    </section>
  );
};

export default CallToAction;

