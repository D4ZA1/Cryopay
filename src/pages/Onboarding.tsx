import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Cloud, KeyRound, CheckCircle2, XCircle } from 'lucide-react';

const CryoPayLogo = () => ( <div className="text-2xl font-bold tracking-tighter">Cryo<span className="text-slate-500">Pay</span></div> );

const ChoiceCard = ({ icon, title, tagline, label, description, advantages, disadvantages, buttonText, to }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 400, damping: 20 }}
    className="group relative w-full md:w-1/2 max-w-md border border-slate-200 rounded-xl p-8 bg-white overflow-hidden transition-all duration-300 ease-in-out hover:border-slate-400"
  >
    <Link to={to} className="after:absolute after:inset-0">
      <div>
        <div className="inline-block p-3 bg-slate-100 text-slate-700 rounded-lg mb-4">{icon}</div>
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        <p className="text-slate-500 mt-1">{tagline}</p>
        <span className="absolute top-4 right-4 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{label}</span>
      </div>
      <div className="max-h-0 opacity-0 group-hover:opacity-100 group-hover:max-h-96 transition-all duration-500 ease-in-out mt-0 group-hover:mt-6">
        <p className="text-sm text-slate-600">{description}</p>
        <ul className="space-y-2 my-4 text-sm">
          {advantages.map((adv, i) => ( <li key={i} className="flex items-center text-slate-700"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />{adv}</li> ))}
          {disadvantages.map((dis, i) => ( <li key={i} className="flex items-center text-slate-700"><XCircle className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />{dis}</li> ))}
        </ul>
        <Button className="w-full mt-2" tabIndex={-1}>{buttonText}</Button>
      </div>
    </Link>
  </motion.div>
);

const OnboardingScreen = () => {
  // FIX: Restored original, more detailed descriptions
  const simpleAccount = { icon: <Cloud size={28} />, title: "Simple Account", tagline: "Best for beginners. We secure your keys.", label: "Custodial", description: "This is like a traditional online account. We create and manage the complex crypto details for you, allowing for easy access and password recovery.", advantages: ["Easy sign-up with email/password", "Forgot your password? No problem.", "Instant, gas-free payments"], disadvantages: ["We secure your keys (Third-Party Custody)"], buttonText: "Select & Continue", to: "/signup-custodial" };
  const selfCustody = { icon: <KeyRound size={28} />, title: "Self-Custody Wallet", tagline: "For experts. You control your own keys.", label: "Non-Custodial", description: "You are in complete control. You connect your own wallet (like MetaMask) and are solely responsible for securing your private keys.", advantages: ["You have 100% control of your funds", "Maximum decentralization and privacy"], disadvantages: ["Lose your keys, lose your funds forever", "You are responsible for gas fees"], buttonText: "Connect Wallet", to: "/signup-non-custodial" };

  return ( <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans"><header className="absolute top-0 left-0 right-0 p-6"><div className="flex justify-center"><CryoPayLogo /></div><div className="max-w-md mx-auto mt-4"><p className="text-sm text-slate-500 font-medium mb-1 text-center">Step 1 of 3</p><div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '33%' }}></div></div></div></header><div className="text-center mb-10"><h1 className="text-4xl font-bold tracking-tighter text-slate-900">How would you like to manage your funds?</h1><p className="text-slate-500 mt-2">Choose the account type that's right for you.</p></div><div className="flex flex-col md:flex-row items-start gap-8"><ChoiceCard {...simpleAccount} /><ChoiceCard {...selfCustody} /></div><footer className="absolute bottom-6 text-slate-500"><p>Already have an account? <Link to="/login" className="font-semibold text-slate-800 hover:underline">Log In</Link></p></footer></div> );
};

export default OnboardingScreen;

