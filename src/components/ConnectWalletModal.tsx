import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle } from "lucide-react";

const ConnectWalletModal = ({ isOpen, onClose, onNavigate }: {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Your Wallet is Ready</DialogTitle>
          <DialogDescription>
            GreenCryoPay automatically creates and manages your wallet. No browser extension needed.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Wallet auto-created</p>
              <p className="text-xs text-green-700 mt-0.5">
                An Ethereum wallet was generated for you when you registered. Your private key is encrypted and stored securely.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <Wallet className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-800">GRN Token Wallet</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Your wallet receives GRN tokens when you recycle. Redeem them for transit, grocery, or charity vouchers.
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => { onClose(); onNavigate('dashboard'); }} className="w-full">
          Go to Dashboard
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectWalletModal;
