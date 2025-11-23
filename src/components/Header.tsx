import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const CryoPayLogo = () => (
  <Link to="/" className="text-2xl font-bold tracking-tighter cursor-pointer">
    Cryo<span className="text-slate-500">Pay</span>
  </Link>
);

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-50">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <CryoPayLogo />
        <div className="hidden md:flex space-x-8 items-center font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Security</a>
        </div>
        <div className="flex space-x-2">
          {/* FIX: Use asChild prop to make Link work inside Button */}
          <Button asChild variant="ghost">
            <Link to="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/onboarding">Get Started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;

