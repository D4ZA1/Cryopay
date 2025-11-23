import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// SVG Icon Components for Wallets
const MetamaskIcon = () => (<svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path fill="#E2761B" d="M136.23,127.31,104.75,95.83l-18.3,18.3,27.1,27.09,24.84,24.84,9.37-9.37-21.53-21.54Z"/><path fill="#E4761B" d="M104.75,95.83,75.45,125.13l13.59,13.59,15.71-15.71Z"/><path fill="#D96624" d="m136.23,127.31-4.1-12-11.67,11.67,15.77,4.1Z"/><path fill="#E3761B" d="M211.43,84.45,190.89,63.91l-14.28,14.28,20.54,20.54Z"/><path fill="#E3751A" d="M190.89,63.91,164.87,37.89,144.33,58.43l.35.35L124.14,79.32l12.09,4.1,27.1-27.09Z"/><path fill="#E97319" d="m190.89,63.91-26.02-26.02-22.9,22.9,20.54,20.54,28.38-17.42Z"/><path fill="#DF6C20" d="m144.33,58.43-.35-.35-19.84-19.84-24.15,24.15L89.28,73.1,75.45,84.45l38.64,38.64,12.09,4.1,27.1-27.09,20.54-20.54-22.39-1.1Z"/><path fill="#CD5D22" d="M100,62.59,89.28,73.1l-13.83,11.35,13.59,13.59L124.14,73,123.8,72.65Z"/><path fill="#C55823" d="m100,62.59-10.72,10.51,25.86-1.11Z"/><path fill="#CC591F" d="M100,62.59,75.45,84.45l-20.54-20.54,22.9-22.9Z"/><path fill="#F29322" d="m180.8,110.16-27.1,27.09-27.09,27.1,14.28,14.28,40.26-40.26Z"/><path fill="#EFA220" d="m126.61,164.35,27.1-27.1,9.37-9.37L144.33,146Z"/><path fill="#E8821E" d="M104.75,152.92l21.86,21.86,9.37-9.37-21.86-21.86-9.37,9.37Z"/><path fill="#DA6B20" d="m126.61,164.35,4.1,12,11.67-11.67-15.77-4.1Z"/><path fill="#EC8E1F" d="M44.57,84.45,65.11,63.91l14.28,14.28L59.05,98.53Z"/><path fill="#E9881C" d="M65.11,63.91,91.13,37.89,111.67,58.43l-.35.35,20.54,20.54-12.09,4.1-38.64-38.64Z"/><path fill="#EE8A1A" d="M65.11,63.91,91.13,37.89,114.07,60.8l-20.54,20.54-28.42-17.43Z"/><path fill="#E1771D" d="M111.67,58.43,89.28,73.1,75.45,84.45,48.43,57.43l24.15-24.15,19.84,19.84.35.35,18.86,18.86-12.09,4.1-38.64-38.64Z"/></svg>);
const CoinbaseIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#0052FF" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10ZM8 9v6h8V9H8Zm1-2h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/></svg>);
const WalletconnectIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#3B99FC" d="M4.332 11.137a7.915 7.915 0 0 1 0-5.833l-1.9-1.9a10.82 10.82 0 0 0 0 9.633l1.9-1.9zM19.668 12.863a7.915 7.915 0 0 1 0 5.833l1.9 1.9a10.82 10.82 0 0 0 0-9.633l-1.9 1.9zM16.19 5.308a7.915 7.915 0 0 1 3.478 7.555l1.9-1.9a10.82 10.82 0 0 0-6.791-6.791l1.413 1.136zM7.81 18.692a7.915 7.915 0 0 1-3.478-7.555l-1.9 1.9a10.82 10.82 0 0 0 6.791 6.791l-1.413-1.136z"/></svg>);

const CryoPayLogo = () => ( <div className="text-2xl font-bold tracking-tighter">Cryo<span className="text-slate-500">Pay</span></div> );
const WalletButton = ({ name, tag, icon, onClick }) => ( <Button onClick={onClick} variant="outline" className="w-full h-16 justify-start p-4 text-lg"><span className="w-8 h-8 mr-4 flex items-center justify-center">{icon}</span>{name}{tag && <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{tag}</span>}</Button> );

const SignUpNonCustodial = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 font-sans"><header className="w-full max-w-md mx-auto py-6 flex-shrink-0"><div className="flex justify-center"><CryoPayLogo /></div><div className="mt-4"><p className="text-sm text-slate-500 font-medium mb-1 text-center">Step 2 of 3</p><div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '66%' }}></div></div></div></header><main className="flex-grow flex items-center justify-center"><div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm"><div className="text-center mb-8"><h1 className="text-3xl font-bold tracking-tighter text-slate-900">Create Your Profile</h1><p className="text-slate-500 mt-2">Just a few details before you connect your wallet.</p></div><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" placeholder="Satoshi" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" placeholder="Nakamoto" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div></div><Separator className="!my-6" /><div><Label>Connect Your Wallet</Label><p className="text-sm text-slate-500 mb-4">Choose your wallet to create and secure your account.</p><div className="space-y-3">
      <WalletButton name="MetaMask" tag="Popular" icon={<MetamaskIcon />} />
      <WalletButton name="WalletConnect" icon={<WalletconnectIcon />} />
      <WalletButton name="Coinbase Wallet" icon={<CoinbaseIcon />} />
    </div></div></div></div></main><footer className="w-full text-center py-4 flex-shrink-0"><p className="text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-slate-800 hover:underline">Log In</Link></p></footer></div>
  );
};

export default SignUpNonCustodial;
