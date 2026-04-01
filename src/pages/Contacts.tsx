import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Send, Edit, Trash2, User } from 'lucide-react';
import { getContacts, createContact, deleteContact, getProfile, apiFetch, getBlocks, createBlock, updateContact, recordTransaction } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useEthereum } from '../context/EthereumContext';
import { useSendEth } from '../hooks/useSendTransaction';
import { encryptJSONWithPassword } from '../lib/crypto';
import { setSymKey } from '../lib/symmetricSession';
import { JWK } from '../types/schemas';
import { getErrorMessage } from '@/lib/utils';
import { toast, Slide } from 'react-toastify';

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
  
  // State for searched profile in Add Contact flow
  const [searchedProfile, setSearchedProfile] = useState<{
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    ethereum_address?: string;
    public_key?: { thumbprint?: string; [key: string]: any } | null;
  } | null>(null);
  const [isSearchingProfile, setIsSearchingProfile] = useState(false);
  const { user, balance } = useAuth();
  const { isConnected, balance: ethBalance } = useEthereum();
  const { sendEthAndWait, isSending, isConfirming } = useSendEth();

  // Helper to check if current user is a MetaMask wallet user
  const isMetaMaskUser = user?.email?.endsWith('@wallet.cryopay') ?? false;
  
  // Toggle for real blockchain transactions - default to true only for MetaMask users
  // Note: Simple account users cannot send blockchain transactions (they have no ETH wallet)
  const [useBlockchain, setUseBlockchain] = useState(false);
  
  // Sync useBlockchain default when user changes (e.g., after login)
  useEffect(() => {
    setUseBlockchain(isMetaMaskUser && isConnected);
  }, [isMetaMaskUser, isConnected]);

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

  // Helper to check if a user is a MetaMask wallet user by email
  const isMetaMaskEmail = (email: string): boolean => {
    return email?.endsWith('@wallet.cryopay') ?? false;
  };

  // Search for a profile by email
  const handleSearchProfile = async () => {
    if (!newContact.email) {
      toast.warning('Enter the user email to search', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
      return;
    }

    if (!isValidEmail(newContact.email)) {
      toast.warning('Please enter a valid email address', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
      return;
    }

    setIsSearchingProfile(true);
    try {
      const searchRes = await apiFetch(`/api/profile/search?email=${encodeURIComponent(newContact.email)}`);
      if (!searchRes.ok || !searchRes.data?.profile) {
        toast.error('No user with that email found in the system', {
          position: 'top-center',
          autoClose: 5000,
          theme: 'dark',
          transition: Slide,
        });
        setSearchedProfile(null);
        return;
      }
      
      const prof = searchRes.data.profile;
      setSearchedProfile(prof);
      
      // Auto-fill the name if available
      if (prof.first_name) {
        setNewContact(prev => ({
          ...prev,
          name: `${prof.first_name} ${prof.last_name || ''}`.trim()
        }));
      }

      // For MetaMask users, auto-fill the address with ethereum_address
      if (prof.ethereum_address) {
        setNewContact(prev => ({
          ...prev,
          address: prof.ethereum_address,
          publicKey: prof.ethereum_address // Use ETH address as the identifier
        }));
      }
      
      toast.success('User found!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'dark',
        transition: Slide,
      });
    } catch (err) {
      console.error('profile search error', err);
      toast.error('Failed to search for user', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
      setSearchedProfile(null);
    } finally {
      setIsSearchingProfile(false);
    }
  };

  const handleAddContact = async () => {
    try {
      if (!user) {
        toast.error('You must be signed in to add a contact', {
          position: 'top-center',
          autoClose: 5000,
          theme: 'dark',
          transition: Slide,
        });
        return;
      }
      if (!newContact.email) {
        toast.warning('Enter the user email to verify', {
          position: 'top-center',
          autoClose: 5000,
          theme: 'dark',
          transition: Slide,
        });
        return;
      }
      
      // Validate email format
      if (!isValidEmail(newContact.email)) {
        toast.warning('Please enter a valid email address', {
          position: 'top-center',
          autoClose: 5000,
          theme: 'dark',
          transition: Slide,
        });
        return;
      }

      // If we haven't searched for the profile yet, do it now
      let prof = searchedProfile;
      if (!prof || prof.email !== newContact.email) {
        const searchRes = await apiFetch(`/api/profile/search?email=${encodeURIComponent(newContact.email)}`);
        if (!searchRes.ok || !searchRes.data?.profile) {
          toast.error('No user with that email found in the system', {
            position: 'top-center',
            autoClose: 5000,
            theme: 'dark',
            transition: Slide,
          });
          return;
        }
        prof = searchRes.data.profile;
      }

      // Ensure prof is not null at this point
      if (!prof) {
        toast.error('Profile not found', {
          position: 'top-center',
          autoClose: 5000,
          theme: 'dark',
          transition: Slide,
        });
        return;
      }

      // Determine if the profile is a MetaMask user
      const isMetaMaskProfile = isMetaMaskEmail(prof.email) && !!prof.ethereum_address;
      
      let contactAddress: string;
      let publicKeyVal: JWK | { raw: string } | null = null;

      if (isMetaMaskProfile) {
        // MetaMask user: use ethereum_address as the contact's address
        contactAddress = prof.ethereum_address!;
        publicKeyVal = { raw: prof.ethereum_address! };
      } else {
        // Simple account user: validate thumbprint
        if (!newContact.publicKey) {
          toast.warning('Enter the receiver thumbprint for verification', {
            position: 'top-center',
            autoClose: 5000,
            theme: 'dark',
            transition: Slide,
          });
          return;
        }

        // Validate thumbprint matches
        const supplied = newContact.publicKey.trim();
        const profThumb = prof?.public_key?.thumbprint;
        
        if (profThumb) {
          const looksLikeThumb = /^[0-9a-fA-F]{32,64}$/.test(supplied);
          if (looksLikeThumb && profThumb !== supplied) {
            toast.error('Provided thumbprint does not match the stored public key for that user', {
              position: 'top-center',
              autoClose: 5000,
              theme: 'dark',
              transition: Slide,
            });
            return;
          }
        }

        // Use thumbprint as the address for simple accounts
        contactAddress = profThumb || newContact.publicKey;

        // Parse public key if it looks like JSON, otherwise store as raw
        try {
          const trimmed = newContact.publicKey.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            publicKeyVal = JSON.parse(trimmed) as JWK;
          } else {
            publicKeyVal = { raw: newContact.publicKey };
          }
        } catch (e) {
          publicKeyVal = { raw: newContact.publicKey };
        }
      }

      const displayName = prof.first_name 
        ? `${prof.first_name} ${prof.last_name || ''}`.trim() 
        : newContact.name || prof.email;

      const response = await createContact({
        name: displayName,
        address: contactAddress,
        email: prof.email,
        label: newContact.label || undefined,
        public_key: JSON.stringify(publicKeyVal),
        contact_user_id: prof.id,
      });

      if (!response.ok) {
        console.error('contacts insert failed', response.error);
        toast.error('Failed to add contact: ' + getErrorMessage(response.error), {
          position: 'top-center',
          autoClose: 5000,
          theme: 'dark',
          transition: Slide,
        });
        return;
      }

      setContacts([...(contacts || []), response.data?.contact]);
      setNewContact({ name: '', address: '', email: '', label: '', publicKey: '' });
      setSearchedProfile(null);
      setIsAddModalOpen(false);
      
      toast.success('Contact added successfully!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'dark',
        transition: Slide,
      });
    } catch (err) {
      console.error('add contact unexpected error', err);
      toast.error('Failed to add contact', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
    }
  };

  const handleDeleteContact = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
     try {
        const response = await deleteContact(Number(id));
        if (!response.ok) {
          console.error('delete contact failed', response.error);
          toast.error('Failed to delete contact: ' + getErrorMessage(response.error), {
            position: 'top-center',
            autoClose: 5000,
            theme: 'dark',
            transition: Slide,
          });
          return;
        }
      setContacts(contacts.filter(c => c.id !== id));
    } catch (e) {
      console.error('delete failed', e);
      toast.error('Failed to delete contact', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
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
          toast.error('Failed to update contact: ' + getErrorMessage(response.error), {
            position: 'top-center',
            autoClose: 5000,
            theme: 'dark',
            transition: Slide,
          });
          return;
        }

      setContacts(contacts.map(c => c.id === editingContact.id ? { ...c, ...editingContact } : c));
      setIsEditModalOpen(false);
      setEditingContact(null);
    } catch (e) {
      console.error('update failed', e);
      toast.error('Failed to update contact', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
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
                      <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0" onClick={() => { setSendTarget(contact); setSendAmount(''); setSendCrypto('ETH'); setSendPassword(''); setUseBlockchain(isMetaMaskUser && isConnected); setIsSendModalOpen(true); }}>
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
            <DialogDescription className="text-slate-400">
              {isMetaMaskUser 
                ? (useBlockchain 
                    ? 'Send real ETH via MetaMask (on-chain transaction)' 
                    : 'Off-chain transaction (encrypted database record)')
                : 'Encrypted off-chain transaction (Simple Account mode)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Transaction Mode Toggle - Only show for MetaMask users who can send blockchain tx */}
            {isMetaMaskUser ? (
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-white/[0.06]">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Blockchain Transaction</span>
                  <span className="text-xs text-slate-400">
                    {useBlockchain ? 'Real ETH transfer (shows in MetaMask)' : 'Off-chain mode (database only)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseBlockchain(!useBlockchain)}
                  disabled={!isConnected}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useBlockchain ? 'bg-emerald-500' : 'bg-slate-600'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useBlockchain ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ) : (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  Off-chain transaction mode. Simple accounts use encrypted database records.
                </p>
              </div>
            )}
            
            {/* Warning for non-ETH addresses in blockchain mode */}
            {useBlockchain && sendTarget?.address && !/^0x[a-fA-F0-9]{40}$/.test(sendTarget.address) && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-xs text-orange-300">
                  ⚠️ Recipient doesn't have a valid Ethereum address. Disable blockchain mode to send via off-chain transaction.
                </p>
              </div>
            )}
            
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
                <Input value={sendCrypto} onChange={(e) => setSendCrypto(e.target.value)} className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" disabled={useBlockchain} />
                {useBlockchain && <p className="text-xs text-slate-500">ETH only for blockchain mode</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">
                Your Wallet Key (session password){!useBlockchain && ' - Required'}
              </Label>
              <Input 
                type="password" 
                value={sendPassword} 
                onChange={(e) => setSendPassword(e.target.value)} 
                placeholder={useBlockchain ? 'Optional - for encrypted record' : 'Required - to encrypt transaction'} 
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" 
              />
              {useBlockchain && (
                <p className="text-xs text-slate-500">
                  Blockchain transactions use MetaMask for signing. Password is optional for record-keeping.
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={async () => {
                  if (!user) {
                    toast.error('You must be signed in', {
                      position: 'top-center',
                      autoClose: 5000,
                      theme: 'dark',
                      transition: Slide,
                    });
                    return;
                  }
                  if (!sendTarget?.address) {
                    toast.warning('Enter receiver address', {
                      position: 'top-center',
                      autoClose: 5000,
                      theme: 'dark',
                      transition: Slide,
                    });
                    return;
                  }
                  if (!sendAmount || isNaN(Number(sendAmount))) {
                    toast.warning('Enter amount', {
                      position: 'top-center',
                      autoClose: 5000,
                      theme: 'dark',
                      transition: Slide,
                    });
                    return;
                  }
                  
                   // Check if recipient has a valid Ethereum address for blockchain transactions
                   const isValidEthAddress = sendTarget.address && /^0x[a-fA-F0-9]{40}$/.test(sendTarget.address);
                   
                   // If blockchain is enabled but sender is not a MetaMask user, show error
                   // This is a safety check - the toggle should already be hidden for simple accounts
                   if (useBlockchain && !isMetaMaskUser) {
                     toast.error('Blockchain transactions require a MetaMask wallet. Please use off-chain mode.', {
                       position: 'top-center',
                       autoClose: 5000,
                       theme: 'dark',
                       transition: Slide,
                     });
                     setUseBlockchain(false);
                     return;
                   }
                   
                   // If blockchain is enabled but recipient doesn't have a valid ETH address, show error
                   if (useBlockchain && !isValidEthAddress) {
                     toast.error('Recipient does not have an Ethereum address. Please disable blockchain mode to send via off-chain transaction.', {
                       position: 'top-center',
                       autoClose: 5000,
                       theme: 'dark',
                       transition: Slide,
                     });
                     return;
                   }
                  
                   // Check if MetaMask is connected for blockchain transactions
                   if (useBlockchain && !isConnected) {
                     toast.error('Please connect MetaMask wallet to send real blockchain transactions', {
                       position: 'top-center',
                       autoClose: 5000,
                       theme: 'dark',
                       transition: Slide,
                     });
                     return;
                   }

                    // Check balance based on user type and transaction mode
                    let currentBalance: number;
                    if (useBlockchain && isMetaMaskUser && isConnected) {
                      // Blockchain mode: use ETH balance converted to USD
                      const ethBalanceNum = ethBalance ? parseFloat(ethBalance) : 0;
                      currentBalance = ethBalanceNum * ethPrice;
                    } else {
                      // Off-chain mode or simple account: use database balance
                      currentBalance = balance;
                    }
                    
                   if (currentBalance < Number(sendAmount)) {
                     toast.error(`Insufficient balance. You have $${currentBalance.toFixed(2)} available.`, {
                       position: 'top-center',
                       autoClose: 5000,
                       theme: 'dark',
                       transition: Slide,
                     });
                     return;
                   }

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

                  const amountCrypto = parseFloat((parseFloat(sendAmount) / ethPrice).toFixed(8));
                  
                  const payload = {
                    kind: 'tx',
                    to: sendTarget.address,
                    to_user_id: recipientProfileId,
                    from: user.id,
                    from_thumbprint: senderThumb,
                    to_thumbprint: recipientThumb,
                    crypto: sendCrypto,
                    amountFiat: parseFloat(sendAmount),
                    amountCrypto,
                    timestamp: new Date().toISOString(),
                    user_id: user.id,
                    tx_hash: null as string | null,
                  };

                   try {
                     // STEP 1: Send real blockchain transaction if enabled
                     if (useBlockchain && sendCrypto === 'ETH') {
                       try {
                         console.log(`Sending ${amountCrypto} ETH to ${sendTarget.address}...`);
                         const { hash: txHash, receipt } = await sendEthAndWait(sendTarget.address, amountCrypto.toString());
                         
                         // Transaction is confirmed, we have both hash and receipt
                         if (txHash && receipt) {
                           payload.tx_hash = txHash;
                           console.log('Transaction confirmed!');
                           console.log('Hash:', txHash);
                           console.log('Block Number:', receipt.blockNumber);
                           console.log('Gas Used:', receipt.gasUsed);
                           
                           // Record transaction on blockchain_transactions table
                           try {
                             const amountWei = (amountCrypto * 1e18).toFixed(0); // Convert ETH to Wei
                             const recordRes = await recordTransaction({
                               to: sendTarget.address,
                               amount: amountWei,
                               currency: 'ETH',
                               offChainTxHash: txHash,
                             });
                             
                             if (!recordRes.ok) {
                               console.warn('Failed to record on blockchain_transactions:', recordRes.error);
                               // Don't fail the whole transaction just because of this
                             }
                           } catch (e) {
                             console.warn('Error recording blockchain transaction:', e);
                           }
                         }
                        } catch (error: any) {
                          console.error('Blockchain transaction failed:', error);
                          toast.error('Blockchain transaction failed: ' + (error?.message || 'Unknown error'), {
                            position: 'top-center',
                            autoClose: 5000,
                            theme: 'dark',
                            transition: Slide,
                          });
                          return;
                        }
                     }

                    // STEP 2: Record transaction in database
                    if (!sendPassword && useBlockchain) {
                      // For blockchain transactions, password is optional
                      // Store unencrypted summary
                      interface QuickSendPublicSummary {
                        kind: 'tx';
                        to: string;
                        amountFiat: number;
                        amountCrypto: number;
                        to_user_id?: string;
                        to_thumbprint?: string;
                        from_thumbprint?: string;
                        tx_hash?: string | null;
                      }

                      const public_summary: QuickSendPublicSummary = { 
                        kind: 'tx', 
                        to: sendTarget.address, 
                        amountFiat: payload.amountFiat, 
                        amountCrypto: payload.amountCrypto,
                        tx_hash: payload.tx_hash
                      };
                      if (recipientProfileId) public_summary.to_user_id = recipientProfileId;
                      if (recipientThumb) public_summary.to_thumbprint = recipientThumb;
                      if (senderThumb) public_summary.from_thumbprint = senderThumb;

                      const blockData = JSON.stringify({ public_summary, user_id: user.id });
                      const blockRes = await createBlock(blockData, undefined);
                      if (!blockRes.ok) {
                        console.error('Database record failed', blockRes.error);
                        // Don't fail here - blockchain tx already succeeded
                      }

                      setIsSendModalOpen(false);
                      if (payload.tx_hash) {
                        toast.success(`Transaction sent!\nHash: ${payload.tx_hash}\n\nCheck MetaMask for status.`, {
                          position: 'top-center',
                          autoClose: 5000,
                          theme: 'dark',
                          transition: Slide,
                        });
                      } else {
                        toast.success('Transaction sent! Check MetaMask for status.', {
                          position: 'top-center',
                          autoClose: 5000,
                          theme: 'dark',
                          transition: Slide,
                        });
                      }
                    } else if (sendPassword) {
                      // Original encrypted flow for non-blockchain or when password provided
                      let previous_hash: string | null = null;
                      try {
                        const blocksRes = await getBlocks();
                        if (blocksRes.ok && blocksRes.data?.blocks?.length) {
                          previous_hash = blocksRes.data.blocks[0].hash;
                        }
                      } catch (e) { /* ignore */ }

                      const encrypted = await encryptJSONWithPassword(payload, sendPassword, previous_hash || undefined);

                      interface QuickSendPublicSummary {
                        kind: 'tx';
                        to: string;
                        amountFiat: number;
                        amountCrypto: number;
                        to_user_id?: string;
                        to_thumbprint?: string;
                        from_thumbprint?: string;
                        tx_hash?: string | null;
                      }

                      const public_summary: QuickSendPublicSummary = { 
                        kind: 'tx', 
                        to: sendTarget.address, 
                        amountFiat: payload.amountFiat, 
                        amountCrypto: payload.amountCrypto,
                        tx_hash: payload.tx_hash
                      };
                      if (recipientProfileId) public_summary.to_user_id = recipientProfileId;
                      if (recipientThumb) public_summary.to_thumbprint = recipientThumb;
                      if (senderThumb) public_summary.from_thumbprint = senderThumb;

                      const blockData = JSON.stringify({ public_summary, encrypted_blob: encrypted, user_id: user.id });
                      const blockRes = await createBlock(blockData, previous_hash || undefined);
                      if (!blockRes.ok) {
                        console.error('send insert error', blockRes.error);
                        toast.error('Failed to record transaction: ' + getErrorMessage(blockRes.error), {
                          position: 'top-center',
                          autoClose: 5000,
                          theme: 'dark',
                          transition: Slide,
                        });
                        return;
                      }

                      setSymKey(sendPassword);
                      setIsSendModalOpen(false);
                      if (payload.tx_hash) {
                        toast.success(`Transaction saved!\nBlockchain Hash: ${payload.tx_hash}`, {
                          position: 'top-center',
                          autoClose: 5000,
                          theme: 'dark',
                          transition: Slide,
                        });
                      } else {
                        toast.success('Transaction saved locally (encrypted)', {
                          position: 'top-center',
                          autoClose: 5000,
                          theme: 'dark',
                          transition: Slide,
                        });
                      }
                    } else {
                      toast.warning('Please enter your wallet key or enable blockchain mode', {
                        position: 'top-center',
                        autoClose: 5000,
                        theme: 'dark',
                        transition: Slide,
                      });
                      return;
                    }
                  } catch (e: any) {
                    console.error('send failed', e);
                    toast.error('Send failed: ' + (e?.message || String(e)), {
                      position: 'top-center',
                      autoClose: 5000,
                      theme: 'dark',
                      transition: Slide,
                    });
                  }
                }} 
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                disabled={isSending || isConfirming}
              >
                {isSending ? 'Awaiting Approval...' : isConfirming ? 'Confirming...' : 'Send'}
              </Button>
              <Button variant="outline" onClick={() => setIsSendModalOpen(false)} className="bg-white/[0.06] border-white/[0.06] text-slate-400 hover:bg-white/[0.08]">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open: boolean) => {
        setIsAddModalOpen(open);
        if (!open) {
          setSearchedProfile(null);
          setNewContact({ name: '', address: '', email: '', label: '', publicKey: '' });
        }
      }}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Contact</DialogTitle>
            <DialogDescription className="text-slate-400">
              Search for a user by email to add them as a contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Email Search Field */}
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="text-slate-400">Email *</Label>
              <div className="flex gap-2">
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newContact.email}
                  onChange={(e) => {
                    setNewContact({...newContact, email: e.target.value});
                    // Clear searched profile if email changes
                    if (searchedProfile && searchedProfile.email !== e.target.value) {
                      setSearchedProfile(null);
                    }
                  }}
                  className="flex-1 bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
                />
                <Button 
                  onClick={handleSearchProfile} 
                  disabled={isSearchingProfile}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-0"
                >
                  {isSearchingProfile ? 'Searching...' : 'Find User'}
                </Button>
              </div>
            </div>

            {/* Show searched profile info */}
            {searchedProfile && (
              <div className="p-3 bg-slate-800/30 rounded-lg border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                    {getInitials(searchedProfile.first_name ? `${searchedProfile.first_name} ${searchedProfile.last_name || ''}` : searchedProfile.email)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {searchedProfile.first_name ? `${searchedProfile.first_name} ${searchedProfile.last_name || ''}` : searchedProfile.email}
                    </p>
                    <p className="text-xs text-slate-400">{searchedProfile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                    searchedProfile.ethereum_address 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {searchedProfile.ethereum_address ? 'MetaMask Wallet' : 'Simple Account'}
                  </span>
                </div>
                {searchedProfile.ethereum_address && (
                  <p className="text-xs text-slate-400 break-all">
                    ETH Address: {searchedProfile.ethereum_address}
                  </p>
                )}
                {searchedProfile.public_key?.thumbprint && !searchedProfile.ethereum_address && (
                  <p className="text-xs text-slate-400 break-all">
                    Thumbprint: {searchedProfile.public_key.thumbprint}
                  </p>
                )}
              </div>
            )}

            {/* Name field - auto-filled if profile found */}
            <div className="space-y-2">
              <Label htmlFor="contact-name" className="text-slate-400">Name</Label>
              <Input
                id="contact-name"
                placeholder="Contact name (auto-filled if found)"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
              />
            </div>

            {/* Show public key/thumbprint field only for simple accounts */}
            {searchedProfile && !searchedProfile.ethereum_address && (
              <div className="space-y-2">
                <Label htmlFor="contact-public-key" className="text-slate-400">
                  Verify Thumbprint *
                </Label>
                <Input
                  id="contact-public-key"
                  placeholder="Enter thumbprint to verify identity"
                  value={newContact.publicKey}
                  onChange={(e) => setNewContact({...newContact, publicKey: e.target.value})}
                  className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  Ask the user for their public key thumbprint to verify their identity
                </p>
              </div>
            )}

            {/* Label selector */}
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
              <Button 
                onClick={handleAddContact} 
                disabled={!searchedProfile}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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