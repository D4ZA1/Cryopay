import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Send, Edit, Trash2, User } from 'lucide-react';
import { getContacts, createContact, deleteContact, getProfile, apiFetch, getBlocks, createBlock, updateContact } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { encryptJSONWithPassword } from '../lib/crypto';
import { setSymKey } from '../lib/symmetricSession';
import { JWK } from '../types/schemas';
import { getErrorMessage } from '@/lib/utils';

/**
 * Contact display type for UI rendering
 * Extends ContactOutput with parsed public_key for easier access
 */
interface ContactDisplayItem {
  id: number;
  name: string;
  address: string;
  email?: string | null;
  label?: string | null;
  publicKey?: JWK | null;
  contact_user_id?: string | null;
  public_key?: JWK | { raw: string } | null;
}

/**
 * New contact form state
 */
interface NewContactForm {
  name: string;
  address: string;
  email: string;
  label: string;
  publicKey: string;
}

/**
 * Send target for quick send modal
 */
interface SendTarget {
  address: string;
  email?: string | null;
  contact_user_id?: string | null;
  public_key?: JWK | { raw: string } | null;
}

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email format
 */
const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

// Start with an empty contacts list; contacts are added after verifying the target exists in `profiles`

const Contacts = () => {
  const [contacts, setContacts] = useState<ContactDisplayItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactDisplayItem | null>(null);
  const [newContact, setNewContact] = useState<NewContactForm>({ name: '', address: '', email: '', label: '', publicKey: '' });
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<SendTarget | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendCrypto, setSendCrypto] = useState('ETH');
  const [sendPassword, setSendPassword] = useState('');
  // TODO: Connect to real price feed - currently using Binance API fallback
  const [ethPrice, setEthPrice] = useState<number>(3000);
  const { user } = useAuth();

  // Fetch real ETH price on mount
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
        if (response.ok) {
          const data = await response.json();
          setEthPrice(parseFloat(data.price));
        }
      } catch (e) {
        console.warn('Failed to fetch ETH price, using default');
      }
    };
    fetchEthPrice();
  }, []);

  const filteredContacts = contacts.filter(contact =>
    (contact?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact?.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact?.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Load contacts for signed-in user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user || !user.id) return;
        const response = await getContacts();
        if (!response.ok) {
          console.warn('failed to load contacts', response.error);
          return;
        }
        if (!mounted) return;
        setContacts(response.data?.contacts || []);
      } catch (e) {
        console.error('contacts load error', e);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const handleAddContact = async () => {
    try {
      if (!user) return alert('You must be signed in to add a contact');
      if (!newContact.email) return alert('Enter the user email to verify');
      
      // Validate email format
      if (!isValidEmail(newContact.email)) {
        return alert('Please enter a valid email address');
      }
      
      if (!newContact.publicKey) return alert('Enter the receiver public key');

      // Verify that a profile with this email exists by calling the profile search endpoint
      const searchRes = await apiFetch(`/api/profile/search?email=${encodeURIComponent(newContact.email)}`);
      if (!searchRes.ok || !searchRes.data?.profile) {
        return alert('No user with that email found in the system');
      }
      const prof = searchRes.data.profile;

      // Minimal public key check (best-effort)
      let walletMatches = true;
      try {
        const supplied = newContact.publicKey.trim();
        const profThumb = prof?.public_key?.thumbprint;
        const looksLikeThumb = /^[0-9a-fA-F]{32,64}$/.test(supplied);
        if (profThumb && looksLikeThumb) {
          walletMatches = profThumb === supplied;
        }
      } catch (e) {
        // ignore
      }

      if (!walletMatches) return alert('Provided public key does not match the stored public key for that user');

      const displayName = prof.first_name ? `${prof.first_name} ${prof.last_name || ''}`.trim() : newContact.name || prof.email;

      // Safely parse public key JSON; if it's not valid JSON, store as { raw: '<value>' }
      let publicKeyVal: JWK | { raw: string } | null = null;
      if (newContact.publicKey) {
        try {
          // Attempt to parse if it looks like JSON
          const trimmed = newContact.publicKey.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            publicKeyVal = JSON.parse(trimmed) as JWK;
          } else {
            // treat as a plain string/thumbprint
            publicKeyVal = { raw: newContact.publicKey };
          }
        } catch (e) {
          publicKeyVal = { raw: newContact.publicKey };
        }
      }

       const response = await createContact({
         name: displayName,
         address: newContact.address || newContact.publicKey,
         email: prof.email,
         label: newContact.label || undefined,
         public_key: JSON.stringify(publicKeyVal),
       });

        if (!response.ok) {
          console.error('contacts insert failed', response.error);
          return alert('Failed to add contact: ' + getErrorMessage(response.error));
        }

      setContacts([...(contacts || []), response.data?.contact]);
      setNewContact({ name: '', address: '', email: '', label: '', publicKey: '' });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('add contact unexpected error', err);
      alert('Failed to add contact');
    }
  };

  const handleDeleteContact = async (id: number | string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
     try {
        const response = await deleteContact(Number(id));
        if (!response.ok) {
          console.error('delete contact failed', response.error);
          return alert('Failed to delete contact: ' + getErrorMessage(response.error));
        }
      setContacts(contacts.filter(c => c.id !== id));
    } catch (e) {
      console.error('delete failed', e);
      alert('Failed to delete contact');
    }
  };

  const handleEditContact = async () => {
    if (!editingContact) return;
    try {
       const response = await updateContact(Number(editingContact.id), {
         name: editingContact.name,
         address: editingContact.address,
         label: editingContact.label || undefined,
       });

        if (!response.ok) {
          console.error('update contact failed', response.error);
          return alert('Failed to update contact: ' + getErrorMessage(response.error));
        }

      setContacts(contacts.map(c => c.id === editingContact.id ? { ...c, ...editingContact } : c));
      setIsEditModalOpen(false);
      setEditingContact(null);
    } catch (e) {
      console.error('update failed', e);
      alert('Failed to update contact');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLabelColor = (label: string) => {
    switch((label || '').toLowerCase()) {
      case 'friend': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'family': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'merchant': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'colleague': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      default: return 'bg-slate-700/50 text-slate-300 border border-slate-600/50';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Contacts</h1>
          <p className="text-slate-400 mt-2">Manage your frequently used addresses</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6 bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search contacts by name, address, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No contacts found</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <Card key={contact.id} className="bg-slate-900/60 backdrop-blur-xl border-white/[0.06] rounded-2xl hover:bg-white/[0.02] transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/[0.06] flex items-center justify-center text-emerald-400 font-semibold flex-shrink-0">
                    {getInitials(contact?.name || 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{contact?.name || 'Unknown'}</h3>
                    {contact?.label && (
                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${getLabelColor(contact.label)}`}>
                        {contact.label}
                      </span>
                    )}
                    <p className="text-xs text-slate-400 mt-2 break-all">{contact?.address || 'N/A'}</p>
                    {contact?.email && (
                      <p className="text-xs text-slate-400 mt-1">{contact.email}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                      <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0" onClick={() => { setSendTarget(contact); setSendAmount(''); setSendCrypto('ETH'); setSendPassword(''); setIsSendModalOpen(true); }}>
                        <Send className="h-3 w-3 mr-1" />
                        Quick Send
                      </Button>
                      <Button size="sm" variant="outline" className="bg-white/[0.06] border-white/[0.06] text-slate-400 hover:bg-white/[0.08] hover:text-emerald-400" onClick={() => { setEditingContact(contact); setIsEditModalOpen(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteContact(contact.id)}
                        className="bg-white/[0.06] border-white/[0.06] text-red-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Send Modal */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-white">Send to Contact</DialogTitle>
            <DialogDescription className="text-slate-400">Enter receiver public key (pre-filled) and your wallet key to encrypt and persist the transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Receiver Public Key / Address</Label>
              <Input value={sendTarget?.address || ''} onChange={(e) => setSendTarget({ ...(sendTarget || {}), address: e.target.value })} className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-slate-400">Amount (fiat USD)</Label>
                <Input value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Crypto</Label>
                <Input value={sendCrypto} onChange={(e) => setSendCrypto(e.target.value)} className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Your Wallet Key (session password)</Label>
              <Input type="password" value={sendPassword} onChange={(e) => setSendPassword(e.target.value)} placeholder="Enter wallet-derived key or session password" className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={async () => {
                if (!user) return alert('You must be signed in');
                if (!sendTarget?.address) return alert('Enter receiver address');
                if (!sendAmount || isNaN(Number(sendAmount))) return alert('Enter amount');
                if (!sendPassword) return alert('Enter your wallet key');

                // build payload
                // Attempt to include sender/recipient thumbprints when available so we can determine Sent/Received later.
                let senderThumb: string | null = null;
                let recipientThumb: string | null = null;
                try {
                  const profRes = await getProfile();
                  if (profRes.ok && profRes.data?.profile) {
                    senderThumb = profRes.data.profile.public_key?.thumbprint || null;
                  }
                } catch (e) { /* ignore */ }

                let recipientProfileId: string | null = null;
                try {
                  // If the contact references a profile id, fetch its thumbprint
                  if ((sendTarget as any)?.contact_user_id) {
                    const profRes = await apiFetch(`/api/profile/search?id=${encodeURIComponent((sendTarget as any).contact_user_id)}`);
                    if (profRes.ok && profRes.data?.profile) {
                      recipientThumb = profRes.data.profile.public_key?.thumbprint || null;
                      recipientProfileId = profRes.data.profile.id || null;
                    }
                  } else if ((sendTarget as any)?.email) {
                    const profRes = await apiFetch(`/api/profile/search?email=${encodeURIComponent((sendTarget as any).email)}`);
                    if (profRes.ok && profRes.data?.profile) {
                      recipientThumb = profRes.data.profile.public_key?.thumbprint || null;
                      recipientProfileId = profRes.data.profile.id || null;
                    }
                  } else if ((sendTarget as any)?.public_key) {
                    recipientThumb = (sendTarget as any)?.public_key?.thumbprint || null;
                  }
                } catch (e) { /* ignore */ }

                const payload = {
                  kind: 'tx',
                  to: sendTarget.address,
                  to_user_id: recipientProfileId,
                  from: user.id,
                  from_thumbprint: senderThumb,
                  to_thumbprint: recipientThumb,
                  crypto: sendCrypto,
                  amountFiat: parseFloat(sendAmount),
                  amountCrypto: parseFloat((parseFloat(sendAmount) / ethPrice).toFixed(8)),
                  timestamp: new Date().toISOString(),
                  user_id: user.id,
                };

                try {
                  // compute global previous_hash (across all users) so encryption/salt chaining is global
                  let previous_hash: string | null = null;
                  try {
                    const blocksRes = await getBlocks();
                    if (blocksRes.ok && blocksRes.data?.blocks?.length) {
                      previous_hash = blocksRes.data.blocks[0].hash;
                    }
                  } catch (e) { /* ignore */ }

                  // Use the previous_hash as salt when encrypting (if present)
                  const encrypted = await encryptJSONWithPassword(payload, sendPassword, previous_hash || undefined);
                  // Note: Block hash is computed server-side during createBlock

                  interface QuickSendPublicSummary {
                    kind: 'tx';
                    to: string;
                    amountFiat: number;
                    amountCrypto: number;
                    to_user_id?: string;
                    to_thumbprint?: string;
                    from_thumbprint?: string;
                  }

                  const public_summary: QuickSendPublicSummary = { 
                    kind: 'tx', 
                    to: sendTarget.address, 
                    amountFiat: payload.amountFiat, 
                    amountCrypto: payload.amountCrypto 
                  };
                  if (recipientProfileId) public_summary.to_user_id = recipientProfileId;
                  if (recipientThumb) public_summary.to_thumbprint = recipientThumb;
                  if (senderThumb) public_summary.from_thumbprint = senderThumb;

                   const blockData = JSON.stringify({ public_summary, encrypted_blob: encrypted, user_id: user.id });
                    const blockRes = await createBlock(blockData, previous_hash || undefined);
                    if (!blockRes.ok) {
                      console.error('send insert error', blockRes.error);
                      return alert('Failed to send: ' + getErrorMessage(blockRes.error));
                    }

                  // store session key for convenience
                  setSymKey(sendPassword);
                  setIsSendModalOpen(false);
                  alert('Transaction saved locally (encrypted)');
                } catch (e: any) {
                  console.error('send failed', e);
                  alert('Send failed: ' + (e?.message || String(e)));
                }
              }} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0">Send</Button>
              <Button variant="outline" onClick={() => setIsSendModalOpen(false)} className="bg-white/[0.06] border-white/[0.06] text-slate-400 hover:bg-white/[0.08]">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Contact</DialogTitle>
            <DialogDescription className="text-slate-400">
              Save a frequently used address for quick transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name" className="text-slate-400">Name *</Label>
              <Input
                id="contact-name"
                placeholder="John Doe"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-address" className="text-slate-400">Wallet Address *</Label>
              <Input
                id="contact-address"
                placeholder="0x..."
                value={newContact.address}
                onChange={(e) => setNewContact({...newContact, address: e.target.value})}
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-public-key" className="text-slate-400">Public Key / Thumbprint *</Label>
              <Input
                id="contact-public-key"
                placeholder="Enter public key JSON or thumbprint"
                value={newContact.publicKey}
                onChange={(e) => setNewContact({...newContact, publicKey: e.target.value})}
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="text-slate-400">Email (Optional)</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="john@example.com"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-label" className="text-slate-400">Label</Label>
              <select
                id="contact-label"
                value={newContact.label}
                onChange={(e) => setNewContact({...newContact, label: e.target.value})}
                className="w-full px-3 py-2 border bg-slate-800/50 border-white/[0.06] text-white rounded-md"
              >
                <option value="">Select a label</option>
                <option value="Friend">Friend</option>
                <option value="Family">Family</option>
                <option value="Merchant">Merchant</option>
                <option value="Colleague">Colleague</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddContact} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                Add Contact
              </Button>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="bg-white/[0.06] border-white/[0.06] text-slate-400 hover:bg-white/[0.08]">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Contact</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update contact details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-contact-name" className="text-slate-400">Name *</Label>
              <Input
                id="edit-contact-name"
                placeholder="John Doe"
                value={editingContact?.name || ''}
                onChange={(e) => editingContact && setEditingContact({...editingContact, name: e.target.value})}
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-address" className="text-slate-400">Wallet Address</Label>
              <Input
                id="edit-contact-address"
                placeholder="0x..."
                value={editingContact?.address || ''}
                onChange={(e) => editingContact && setEditingContact({...editingContact, address: e.target.value})}
                disabled
                className="bg-slate-800/50 border-white/[0.06] text-slate-500 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-label" className="text-slate-400">Label</Label>
              <select
                id="edit-contact-label"
                value={editingContact?.label || ''}
                onChange={(e) => editingContact && setEditingContact({...editingContact, label: e.target.value})}
                className="w-full px-3 py-2 border bg-slate-800/50 border-white/[0.06] text-white rounded-md"
              >
                <option value="">Select a label</option>
                <option value="Friend">Friend</option>
                <option value="Family">Family</option>
                <option value="Merchant">Merchant</option>
                <option value="Colleague">Colleague</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditContact} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingContact(null); }} className="bg-white/[0.06] border-white/[0.06] text-slate-400 hover:bg-white/[0.08]">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;