import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Send, Edit, Trash2, User } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { encryptJSONWithPassword, sha256Hex } from '../lib/crypto';
import { setSymKey } from '../lib/symmetricSession';
import { useEffect } from 'react';

// Start with an empty contacts list; contacts are added after verifying the target exists in `profiles`

const Contacts = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', address: '', email: '', label: '', publicKey: '' });
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<any | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendCrypto, setSendCrypto] = useState('ETH');
  const [sendPassword, setSendPassword] = useState('');
  const { user } = useAuth();

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Load contacts for signed-in user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user || !user.id) return;
        const { data, error } = await supabase.from('contacts').select('id, contact_user_id, name, address, email, label, public_key, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) {
          console.warn('failed to load contacts', error);
          return;
        }
        if (!mounted) return;
        setContacts((data as any[]) || []);
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
      if (!newContact.publicKey) return alert('Enter the receiver public key');

      // Verify that a profile with this email exists
      const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, first_name, last_name, email, public_key').eq('email', newContact.email).limit(1);
      if (profileErr) {
        console.error('profiles query failed', profileErr);
        return alert('Failed to verify user: ' + profileErr.message);
      }
      if (!profiles || (profiles as any).length === 0) {
        return alert('No user with that email found in the system');
      }
      const prof = (profiles as any)[0];

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
      let publicKeyVal: any = null;
      if (newContact.publicKey) {
        try {
          // Attempt to parse if it looks like JSON
          const trimmed = newContact.publicKey.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            publicKeyVal = JSON.parse(trimmed);
          } else {
            // treat as a plain string/thumbprint
            publicKeyVal = { raw: newContact.publicKey };
          }
        } catch (e) {
          publicKeyVal = { raw: newContact.publicKey };
        }
      }

      const insertObj = {
        user_id: user.id,
        contact_user_id: prof.id,
        name: displayName,
        address: newContact.address || newContact.publicKey,
        email: prof.email,
        label: newContact.label || null,
        public_key: publicKeyVal,
      };

      const { data: inserted, error: insertErr } = await supabase.from('contacts').insert([insertObj]).select('id, name, address, email, label, public_key, contact_user_id, created_at').limit(1);
      if (insertErr) {
        console.error('contacts insert failed', insertErr);
        return alert('Failed to add contact: ' + insertErr.message);
      }

      setContacts([...(contacts || []), (inserted as any)[0]]);
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
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) {
        console.error('delete contact failed', error);
        return alert('Failed to delete contact: ' + error.message);
      }
      setContacts(contacts.filter(c => c.id !== id));
    } catch (e) {
      console.error('delete failed', e);
      alert('Failed to delete contact');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLabelColor = (label: string) => {
    switch((label || '').toLowerCase()) {
      case 'friend': return 'bg-blue-100 text-blue-800';
      case 'family': return 'bg-purple-100 text-purple-800';
      case 'merchant': return 'bg-green-100 text-green-800';
      case 'colleague': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-600 mt-2">Manage your frequently used addresses</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search contacts by name, address, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No contacts found</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold flex-shrink-0">
                    {getInitials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{contact.name}</h3>
                    {contact.label && (
                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${getLabelColor(contact.label)}`}>
                        {contact.label}
                      </span>
                    )}
                    <p className="text-xs text-slate-500 mt-2 break-all">{contact.address}</p>
                    {contact.email && (
                      <p className="text-xs text-slate-500 mt-1">{contact.email}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="flex-1">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => { setSendTarget(contact); setSendAmount(''); setSendCrypto('ETH'); setSendPassword(''); setIsSendModalOpen(true); }}>
                        <Send className="h-3 w-3 mr-1" />
                        Quick Send
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 hover:text-red-700"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send to Contact</DialogTitle>
            <DialogDescription>Enter receiver public key (pre-filled) and your wallet key to encrypt and persist the transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Receiver Public Key / Address</Label>
              <Input value={sendTarget?.address || ''} onChange={(e) => setSendTarget({ ...(sendTarget || {}), address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Amount (fiat USD)</Label>
                <Input value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Crypto</Label>
                <Input value={sendCrypto} onChange={(e) => setSendCrypto(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Your Wallet Key (session password)</Label>
              <Input type="password" value={sendPassword} onChange={(e) => setSendPassword(e.target.value)} placeholder="Enter wallet-derived key or session password" />
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
                  const { data: myProf } = await supabase.from('profiles').select('public_key').eq('id', user.id).limit(1);
                  if (myProf && (myProf as any).length) senderThumb = (myProf as any)[0]?.public_key?.thumbprint || null;
                } catch (e) { /* ignore */ }

                let recipientProfileId: string | null = null;
                try {
                  // If the contact references a profile id, fetch its thumbprint
                  if ((sendTarget as any)?.contact_user_id) {
                    const { data: recProf } = await supabase.from('profiles').select('id, public_key').eq('id', (sendTarget as any).contact_user_id).limit(1);
                    if (recProf && (recProf as any).length) {
                      recipientThumb = (recProf as any)[0]?.public_key?.thumbprint || null;
                      recipientProfileId = (recProf as any)[0]?.id || null;
                    }
                  } else if ((sendTarget as any)?.email) {
                    const { data: recProf } = await supabase.from('profiles').select('id, public_key').eq('email', (sendTarget as any).email).limit(1);
                    if (recProf && (recProf as any).length) {
                      recipientThumb = (recProf as any)[0]?.public_key?.thumbprint || null;
                      recipientProfileId = (recProf as any)[0]?.id || null;
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
                  amountCrypto: parseFloat((parseFloat(sendAmount) / 3000).toFixed(8)),
                  timestamp: new Date().toISOString(),
                  user_id: user.id,
                };

                try {
                  // compute global previous_hash (across all users) so encryption/salt chaining is global
                  let previous_hash: string | null = null;
                  try {
                    const { data: last, error: lastErr } = await supabase.from('blocks').select('hash').order('id', { ascending: false }).limit(1);
                    if (!lastErr && last && (last as any).length) previous_hash = (last as any)[0].hash;
                  } catch (e) { /* ignore */ }

                  // Use the previous_hash as salt when encrypting (if present)
                  const encrypted = await encryptJSONWithPassword(payload, sendPassword, previous_hash || undefined);
                  const hash = await sha256Hex(encrypted.ciphertext);

                  const public_summary: any = { kind: 'tx', to: sendTarget.address, amountFiat: payload.amountFiat, amountCrypto: payload.amountCrypto };
                  if (recipientProfileId) public_summary.to_user_id = recipientProfileId;
                  if (recipientThumb) public_summary.to_thumbprint = recipientThumb;
                  if (senderThumb) public_summary.from_thumbprint = senderThumb;

                  const { error } = await supabase.from('blocks').insert([
                    { data: { public_summary, encrypted_blob: encrypted, user_id: user.id }, previous_hash, hash, user_id: user.id }
                  ]);
                  if (error) {
                    console.error('send insert error', error);
                    return alert('Failed to send: ' + error.message);
                  }

                  // store session key for convenience
                  setSymKey(sendPassword);
                  setIsSendModalOpen(false);
                  alert('Transaction saved locally (encrypted)');
                } catch (e: any) {
                  console.error('send failed', e);
                  alert('Send failed: ' + (e?.message || String(e)));
                }
              }} className="flex-1">Send</Button>
              <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Save a frequently used address for quick transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                placeholder="John Doe"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-address">Wallet Address *</Label>
              <Input
                id="contact-address"
                placeholder="0x..."
                value={newContact.address}
                onChange={(e) => setNewContact({...newContact, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-public-key">Public Key / Thumbprint *</Label>
              <Input
                id="contact-public-key"
                placeholder="Enter public key JSON or thumbprint"
                value={newContact.publicKey}
                onChange={(e) => setNewContact({...newContact, publicKey: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email (Optional)</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="john@example.com"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-label">Label</Label>
              <select
                id="contact-label"
                value={newContact.label}
                onChange={(e) => setNewContact({...newContact, label: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-md"
              >
                <option value="">Select a label</option>
                <option value="Friend">Friend</option>
                <option value="Family">Family</option>
                <option value="Merchant">Merchant</option>
                <option value="Colleague">Colleague</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddContact} className="flex-1">
                Add Contact
              </Button>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
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