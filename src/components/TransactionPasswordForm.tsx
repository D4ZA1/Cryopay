import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  onSubmit: (password: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
};

const TransactionPasswordForm: React.FC<Props> = ({ onSubmit, onCancel, title = 'Encrypt Transaction', description = 'Enter a password to encrypt this transaction. You will need this password to decrypt and verify the transaction later.' }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm max-w-md">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm">Encryption password</Label>
          <div className="mt-1 flex gap-2">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} className="flex-1" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 py-2 border rounded">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
          <Button onClick={() => onSubmit(password)} disabled={!password}>Encrypt & Save</Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionPasswordForm;
