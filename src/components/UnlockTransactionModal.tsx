import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { decryptJSONWithPassword } from '../lib/crypto';
import { setSymKey } from '../lib/symmetricSession';

interface UnlockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // When provided, the modal will attempt to decrypt this encrypted blob and show the result
  encryptedBlob?: { salt: string; iv: string; ciphertext: string } | null;
  // Called when the user successfully unlocks (supply the symmetric password)
  onUnlocked?: (password: string) => void;
}

const UnlockTransactionModal: React.FC<UnlockTransactionModalProps> = ({ isOpen, onClose, encryptedBlob = null, onUnlocked }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<any | null>(null);

  const handleUnlock = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // If there's an encrypted blob, attempt to decrypt and show result.
      if (encryptedBlob) {
        const plain = await decryptJSONWithPassword(encryptedBlob, password);
        setDecrypted(plain);
      }

      // Save symmetric key in-memory for subsequent operations
      setSymKey(password);
      if (onUnlocked) onUnlocked(password);
      // do not auto-close if we decrypted data; user can close after inspection
      if (!encryptedBlob) onClose();
    } catch (e: any) {
      console.error('Unlock/decrypt failed', e);
      setError(e?.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    setDecrypted(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{encryptedBlob ? 'Unlock & View Transaction' : 'Unlock Wallet (enter key)'} </DialogTitle>
          <DialogDescription>
            {encryptedBlob ? 'Enter your wallet-derived symmetric key to decrypt the selected transaction.' : 'Enter the wallet-derived symmetric key (passphrase) to unlock and sign transactions.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Input
            type="password"
            placeholder="Enter your wallet key or passphrase"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            className="h-12"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleUnlock} className="flex-1" disabled={isLoading || password.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {encryptedBlob ? 'Decrypt & Show' : 'Unlock'}
            </Button>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          </div>

          {decrypted && (
            <div className="mt-3 p-3 bg-slate-50 rounded">
              <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(decrypted, null, 2)}</pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnlockTransactionModal;
