import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Shield, Bell, Wallet, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, apiFetch, getWallet } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/lib/utils';
import { toast, Slide } from 'react-toastify';
import DeleteButton from '../components/DeleteButton';
import ConfirmationModal from '../components/ConfirmationModal';
import ConfirmationModalWithInput from '../components/ConfirmationModalWithInput';

const Settings = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    transactionAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    biometricsEnabled: false,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isExportingKeys, setIsExportingKeys] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdateResponse, setLastUpdateResponse] = useState<any>(null);
  const [lastGetUserResponse, setLastGetUserResponse] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Load full user info from Worker API
        const profRes = await getProfile();
        if (profRes.ok && profRes.data?.profile) {
          const prof = profRes.data.profile;
          setProfile({
            firstName: prof.first_name || user?.firstName || '',
            lastName: prof.last_name || '',
            email: prof.email || '',
            phone: prof.phone || '',
          });

          // load notifications from profile if present
          if (prof.notifications) {
            setNotifications({
              emailNotifications: !!prof.notifications.emailNotifications,
              transactionAlerts: !!prof.notifications.transactionAlerts,
              weeklyReports: !!prof.notifications.weeklyReports,
              marketingEmails: !!prof.notifications.marketingEmails,
            });
          }

          // check if MFA is enabled via the auth API
          try {
            const mfaRes = await apiFetch('/api/auth/mfa-status');
            if (mfaRes.ok && mfaRes.data) {
              setSecurity((s) => ({ ...s, twoFactorEnabled: !!mfaRes.data.enabled }));
            }
          } catch (err) {
            console.warn('[Settings] could not read MFA status', err);
          }
        }
      } catch (e) {
        console.error('[Settings] error loading user', e);
      }
    })();
  }, [user]);

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setMessage(null);
    try {
      const updateRes = await updateProfile({
        first_name: profile.firstName || undefined,
        last_name: profile.lastName || undefined,
        phone: profile.phone || undefined,
      });

       if (!updateRes.ok) {
         throw new Error(getErrorMessage(updateRes.error || 'Failed to update profile'));
       }

      // Refresh profile data
      const profRes = await getProfile();
      if (profRes.ok && profRes.data?.profile) {
        const prof = profRes.data.profile;
        setProfile({
          firstName: prof.first_name || '',
          lastName: prof.last_name || '',
          email: prof.email || '',
          phone: prof.phone || '',
        });
      }

      // also refresh the global auth context user so headers/navigation update
      try {
        await refreshUser();
      } catch (e) {
        console.warn('[Settings] refreshUser failed', e);
      }

      toast.success('Profile updated successfully', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
    } catch (e: any) {
      console.error('[Settings] saveProfile error', e);
      toast.error(e?.message || String(e), {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveNotifications = async () => {
    setIsSavingNotifications(true);
    setMessage(null);
    try {
      const updateRes = await updateProfile({
        notifications: JSON.stringify(notifications),
      });
       if (!updateRes.ok) {
         throw new Error(getErrorMessage(updateRes.error || 'Failed to save notifications'));
       }
      toast.success('Notification preferences saved', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
    } catch (e: any) {
      console.error('[Settings] saveNotifications error', e);
      toast.error(e?.message || String(e), {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleToggle2FA = () => {
    if (!security.twoFactorEnabled) {
      // enable -> redirect to MFA setup
      navigate('/mfa-setup');
      return;
    }
    // disabling 2FA is intentionally not allowed from the client in this app
    toast.info('Disabling two-factor authentication is not supported via this UI.', {
      position: 'top-center',
      autoClose: 5000,
      theme: 'dark',
      transition: Slide,
    });
  };

  const handleExportKeys = async () => {
    setIsExportingKeys(true);
    setMessage(null);
    try {
      // Fetch wallet data
      const walletRes = await getWallet();
      
      if (!walletRes.ok) {
        throw new Error(walletRes.error || 'Failed to fetch wallet data');
      }

      if (!walletRes.data?.wallet) {
        throw new Error('No wallet data found');
      }

      const wallet = walletRes.data.wallet;
      
      // Prepare export data
      const exportData = {
        exportedAt: new Date().toISOString(),
        publicKey: wallet.public_key,
        encryptedPrivateKey: wallet.encrypted_private_key,
        userId: wallet.user_id,
        createdAt: wallet.created_at,
      };

      // Create blob and download
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `cryopay-wallet-keys-${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Wallet keys exported successfully. Keep this file secure!', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
    } catch (e: any) {
      console.error('[Settings] export keys error', e);
      toast.error(`Export failed: ${e?.message || String(e)}`, {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
    } finally {
      setIsExportingKeys(false);
      setShowExportModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Show loading toast
      const toastId = toast.loading('Deleting account...', {
        position: 'top-center',
        theme: 'dark',
      });

      // Call the API to delete the account
      const deleteRes = await apiFetch('/api/profile', {
        method: 'DELETE',
      });

      if (!deleteRes.ok) {
        throw new Error(getErrorMessage(deleteRes.error || 'Failed to delete account'));
      }

      // Update toast to success
      toast.update(toastId, {
        render: 'Account deleted successfully. Logging you out...',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
        theme: 'dark',
        transition: Slide,
      });

      // Wait a moment before logging out
      setTimeout(() => {
        logout();
      }, 2000);

    } catch (e: any) {
      console.error('[Settings] delete account error', e);
      toast.error(`Failed to delete account: ${e?.message || String(e)}`, {
        position: 'top-center',
        autoClose: 5000,
        theme: 'dark',
        transition: Slide,
      });
    } finally {
      setShowDeleteModal(false);
    }
  };

  // We use auth.user_metadata as the single source of truth for profile details.

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-2">Manage your account preferences and security</p>
      </div>
      {/* Profile Settings */}
      {message && <div className="mb-4 text-sm text-emerald-400">{message}</div>}
      { (lastUpdateResponse || lastGetUserResponse) && (
        <div className="mb-4 text-xs text-slate-400">
          <details>
            <summary className="cursor-pointer font-medium">Debug: last update/getUser responses</summary>
            <div className="mt-2">
              <div className="mb-2">
                <strong>updateUser response:</strong>
                <pre className="text-xs bg-slate-800/50 p-3 rounded mt-1">{JSON.stringify(lastUpdateResponse, null, 2)}</pre>
              </div>
              <div>
                <strong>getUser response:</strong>
                <pre className="text-xs bg-slate-800/50 p-3 rounded mt-1">{JSON.stringify(lastGetUserResponse, null, 2)}</pre>
              </div>
            </div>
          </details>
        </div>
      )}
      <Card className="mb-6 bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/[0.06] rounded-lg">
              <User className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription className="text-slate-500">Update your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-slate-400">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-slate-400">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-400">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-400">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500"
              autoComplete="tel"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveProfile} disabled={isSavingProfile} className="bg-emerald-500 hover:bg-emerald-600 text-white">{isSavingProfile ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="mb-6 bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/[0.06] rounded-lg">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white">Security</CardTitle>
              <CardDescription className="text-slate-500">Manage your account security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-slate-500">Add an extra layer of security</p>
            </div>
            <div className="text-sm">
              {security.twoFactorEnabled ? (
                <span className="text-emerald-400">Enabled</span>
              ) : (
                <Button onClick={handleToggle2FA} className="bg-emerald-500 hover:bg-emerald-600 text-white">Enable 2FA</Button>
              )}
            </div>
          </div>
          <Separator className="border-white/[0.06]" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Biometric Authentication</h4>
              <p className="text-sm text-slate-500">Use fingerprint or Face ID</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={security.biometricsEnabled}
                onChange={(e) => setSecurity({...security, biometricsEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-400"></div>
            </label>
          </div>
          <Separator className="border-white/[0.06]" />
          <div>
            <h4 className="font-medium mb-2 text-white">Change Password</h4>
            <div className="space-y-3">
              <Input type="password" placeholder="New password" id="newPassword" className="bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500" autoComplete="new-password" />
              <Button variant="outline" onClick={async () => {
                const el = document.getElementById('newPassword') as HTMLInputElement | null;
                if (!el || !el.value) {
                  toast.warning('Please enter a new password', {
                    position: 'top-center',
                    autoClose: 5000,
                    theme: 'dark',
                    transition: Slide,
                  });
                  return;
                }
                try {
                  const pwRes = await apiFetch('/api/auth/change-password', {
                    method: 'POST',
                    body: JSON.stringify({ password: el.value }),
                  });
                  if (!pwRes.ok) throw new Error(getErrorMessage(pwRes.error || 'Failed to update password'));
                  toast.success('Password updated successfully', {
                    position: 'top-center',
                    autoClose: 5000,
                    theme: 'dark',
                    transition: Slide,
                  });
                  el.value = '';
                } catch (e: any) {
                  console.error('[Settings] update password error', e);
                  toast.error(e?.message || String(e), {
                    position: 'top-center',
                    autoClose: 5000,
                    theme: 'dark',
                    transition: Slide,
                  });
                }
              }} className="bg-white/[0.06] border-white/[0.06] text-white hover:bg-white/[0.1]">Update Password</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6 bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/[0.06] rounded-lg">
              <Bell className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white">Notifications</CardTitle>
              <CardDescription className="text-slate-500">Control how you receive updates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium capitalize text-white">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-slate-500">
                  {key === 'emailNotifications' && 'Receive email updates'}
                  {key === 'transactionAlerts' && 'Get notified of all transactions'}
                  {key === 'weeklyReports' && 'Weekly summary of your activity'}
                  {key === 'marketingEmails' && 'Promotions and feature updates'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-400"></div>
              </label>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <Button onClick={saveNotifications} disabled={isSavingNotifications} className="bg-emerald-500 hover:bg-emerald-600 text-white">{isSavingNotifications ? 'Saving...' : 'Save Notifications'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Wallets */}
      <Card className="mb-6 bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/[0.06] rounded-lg">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white">Connected Wallets</CardTitle>
              <CardDescription className="text-slate-500">Manage your external wallet connections</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-white/[0.06]">
            <div>
              <h4 className="font-medium text-white">Crypto Wallet</h4>
              <p className="text-sm text-slate-500">0x742d...0bEb</p>
            </div>
            <Button variant="outline" size="sm" className="bg-white/[0.06] border-white/[0.06] text-white hover:bg-white/[0.1]">Disconnect</Button>
          </div>
          <Button variant="outline" className="w-full mt-4 bg-white/[0.06] border-white/[0.06] text-white hover:bg-white/[0.1]">
            Connect New Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="mb-6 bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/[0.06] rounded-lg">
              <Globe className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white">Preferences</CardTitle>
              <CardDescription className="text-slate-500">Customize your experience</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-400">Language</Label>
            <select className="w-full px-3 py-2 bg-slate-800/50 border border-white/[0.06] rounded-md text-white">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Japanese</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">Default Currency</Label>
            <select className="w-full px-3 py-2 bg-slate-800/50 border border-white/[0.06] rounded-md text-white">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
              <option>INR (₹)</option>
              <option>JPY (¥)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Dark Mode</h4>
              <p className="text-sm text-slate-500">Toggle dark mode theme</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-800/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-400"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
  <Card className="border-red-500/30 bg-slate-900/80 backdrop-blur-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription className="text-slate-500">Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Export Private Keys</h4>
              <p className="text-sm text-slate-500">Download your wallet keys</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowExportModal(true)}
              disabled={isExportingKeys}
              className="bg-white/[0.06] border-white/[0.06] text-white hover:bg-white/[0.1]"
            >
              {isExportingKeys ? 'Exporting...' : 'Export'}
            </Button>
          </div>
          <Separator className="border-white/[0.06]" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-400">Delete Account</h4>
              <p className="text-sm text-slate-500">Permanently delete your account and data</p>
            </div>
            <DeleteButton onClick={() => setShowDeleteModal(true)} />
          </div>
        </CardContent>
      </Card>

      {/* Using Supabase auth user metadata as the single source of truth for profile details */}

      {/* Export Private Keys Modal */}
      <ConfirmationModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleExportKeys}
        title="Export Private Keys"
        message="⚠️ WARNING: Your private keys will be downloaded. Keep them safe and never share them with anyone!"
        type="warning"
        confirmText="Export Keys"
        cancelText="Cancel"
      />

      {/* Delete Account Modal */}
      <ConfirmationModalWithInput
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This will permanently delete your account and all data. This action cannot be undone. Type DELETE to confirm."
        requiredInput="DELETE"
        placeholder="Type DELETE to confirm"
        confirmText="Delete Account"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Settings;