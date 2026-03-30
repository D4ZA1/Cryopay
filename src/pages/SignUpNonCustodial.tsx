import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useEthereum } from '@/context/EthereumContext';
import { useAuth } from '@/context/AuthContext';
import { WalletConnect } from '@/components/WalletConnect';
import { connectMetaMask } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

// SVG Icon Components for Wallets
const CoinbaseIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#0052FF" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10ZM8 9v6h8V9H8Zm1-2h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/></svg>);
const WalletconnectIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#3B99FC" d="M4.332 11.137a7.915 7.915 0 0 1 0-5.833l-1.9-1.9a10.82 10.82 0 0 0 0 9.633l1.9-1.9zM19.668 12.863a7.915 7.915 0 0 1 0 5.833l1.9 1.9a10.82 10.82 0 0 0 0-9.633l-1.9 1.9zM16.19 5.308a7.915 7.915 0 0 1 3.478 7.555l1.9-1.9a10.82 10.82 0 0 0-6.791-6.791l1.413 1.136zM7.81 18.692a7.915 7.915 0 0 1-3.478-7.555l-1.9 1.9a10.82 10.82 0 0 0 6.791 6.791l-1.413-1.136z"/></svg>);

const CryoPayLogo = () => ( <div className="text-2xl font-bold tracking-tighter">Cryo<span className="text-slate-500">Pay</span></div> );
const WalletButton = ({ name, tag, icon, onClick, disabled }: { name: string; tag?: string; icon: React.ReactNode; onClick?: () => void; disabled?: boolean }) => ( <Button onClick={onClick} variant="outline" className="w-full h-16 justify-start p-4 text-lg" disabled={disabled}><span className="w-8 h-8 mr-4 flex items-center justify-center">{icon}</span>{name}{tag && <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{tag}</span>}</Button> );

const SignUpNonCustodial = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggeredRegistration, setHasTriggeredRegistration] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { address, isConnected, signMessage, isMetaMaskInstalled } = useEthereum();

  const handleMetaMaskConnect = useCallback(async () => {
    if (!isConnected || !address) return;
    
    setIsRegistering(true);
    setError(null);
    
    try {
      // Create a message to sign
      const message = `Sign this message to register with CryoPay.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      
      // Request signature from MetaMask
      const signature = await signMessage(message);
      
      // Register with backend
      const response = await connectMetaMask({
        address,
        signature,
        message,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      
      if (response.ok && response.data?.token) {
        // Login the user
        login(response.data.token, {
          id: response.data.user.id,
          firstName: firstName || 'User',
          lastName,
        });
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setIsRegistering(false);
    }
  }, [isConnected, address, signMessage, firstName, lastName, login, navigate]);

  // Trigger registration when wallet connects
  useEffect(() => {
    if (isConnected && address && firstName && !hasTriggeredRegistration && !isRegistering) {
      setHasTriggeredRegistration(true);
      handleMetaMaskConnect();
    }
  }, [isConnected, address, firstName, hasTriggeredRegistration, isRegistering, handleMetaMaskConnect]);

  // Reset trigger when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasTriggeredRegistration(false);
    }
  }, [isConnected]);

  const handleWalletError = (err: Error) => {
    setError(err.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 font-sans">
      <header className="w-full max-w-md mx-auto py-6 flex-shrink-0">
        <div className="flex justify-center"><CryoPayLogo /></div>
        <div className="mt-4">
          <p className="text-sm text-slate-500 font-medium mb-1 text-center">Step 2 of 3</p>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '66%' }}></div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter text-slate-900">Create Your Profile</h1>
            <p className="text-slate-500 mt-2">Just a few details before you connect your wallet.</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="Satoshi" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isRegistering}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Nakamoto" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isRegistering}
                />
              </div>
            </div>
            
            <Separator className="!my-6" />
            
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {/* Registration loading state */}
            {isRegistering && (
              <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
                <p className="text-slate-600 font-medium">Registering your account...</p>
              </div>
            )}
            
            <div>
              <Label>Connect Your Wallet</Label>
              <p className="text-sm text-slate-500 mb-4">Choose your wallet to create and secure your account.</p>
              
              {!firstName && (
                <p className="text-sm text-amber-600 mb-4">Please enter your first name before connecting your wallet.</p>
              )}
              
              <div className="space-y-3">
                {/* MetaMask - Real integration via WalletConnect component */}
                {isMetaMaskInstalled ? (
                  <div className="relative">
                    <WalletConnect
                      onConnected={() => {
                        // Registration is handled by useEffect
                      }}
                      onError={handleWalletError}
                      showBalance={false}
                      className={!firstName ? 'opacity-50 pointer-events-none' : ''}
                    />
                    {!firstName && (
                      <div className="absolute inset-0 cursor-not-allowed" />
                    )}
                  </div>
                ) : (
                  <WalletConnect onError={handleWalletError} />
                )}
                
                {/* Other wallets - Coming soon */}
                <WalletButton 
                  name="WalletConnect" 
                  icon={<WalletconnectIcon />} 
                  disabled={true}
                />
                <WalletButton 
                  name="Coinbase Wallet" 
                  icon={<CoinbaseIcon />} 
                  disabled={true}
                />
                <p className="text-xs text-slate-400 text-center mt-2">
                  WalletConnect and Coinbase Wallet coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="w-full text-center py-4 flex-shrink-0">
        <p className="text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-800 hover:underline">
            Log In
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default SignUpNonCustodial;
