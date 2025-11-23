import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// We'll need wallet logo assets later, for now we use placeholders
// import MetaMaskLogo from '../assets/metamask.svg'; 

const WalletButton = ({ logo, name, tag }) => (
  <Button variant="outline" className="w-full h-16 justify-start p-4 text-lg">
    {/* <img src={logo} alt={`${name} logo`} className="w-8 h-8 mr-4" /> */}
    <span className="w-8 h-8 mr-4 bg-gray-200 rounded-full" /> {/* Placeholder */}
    {name}
    {tag && <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{tag}</span>}
  </Button>
);

const ConnectWalletModal = ({ isOpen, onClose, onNavigate }) => {
  const handleConnect = (wallet) => {
    console.log(`Connecting with ${wallet}...`);
    // In a real app, this would trigger the connection logic (e.g., MetaMask SDK)
    // After a successful connection, we navigate to the dashboard.
    onClose();
    onNavigate('dashboard');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect your Wallet</DialogTitle>
          <DialogDescription>
            Select your wallet provider to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <WalletButton name="MetaMask" tag="Popular" onClick={() => handleConnect('MetaMask')} />
          <WalletButton name="WalletConnect" onClick={() => handleConnect('WalletConnect')} />
          <WalletButton name="Coinbase Wallet" onClick={() => handleConnect('Coinbase')} />
        </div>
        <p className="text-center text-sm text-slate-500">
          New to crypto wallets? <a href="#" className="underline">Learn More</a>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectWalletModal;