import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Shield, Bell, Wallet, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, refreshUser } = useAuth();
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
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdateResponse, setLastUpdateResponse] = useState<any>(null);
  const [lastGetUserResponse, setLastGetUserResponse] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Load full user info from Supabase
        const { data } = await supabase.auth.getUser();
        const supUser = (data as any)?.user;
        if (supUser) {
          setProfile({
            firstName: (supUser.user_metadata as any)?.firstName || (user?.firstName ?? ''),
            lastName: (supUser.user_metadata as any)?.lastName || '',
            email: supUser.email || '',
            phone: (supUser.user_metadata as any)?.phone || '',
          });

          // load notifications from metadata if present
          const meta = (supUser.user_metadata as any) || {};
          if (meta.notifications) {
            setNotifications({
              emailNotifications: !!meta.notifications.emailNotifications,
              transactionAlerts: !!meta.notifications.transactionAlerts,
              weeklyReports: !!meta.notifications.weeklyReports,
              marketingEmails: !!meta.notifications.marketingEmails,
            });
          }

          // check TOTP factor presence
          try {
            // @ts-ignore experimental API
            const factors = await supabase.auth.mfa.listFactors();
            const hasTotp = !!factors?.data?.totp?.length;
            setSecurity((s) => ({ ...s, twoFactorEnabled: !!hasTotp }));
          } catch (err) {
            console.warn('[Settings] could not read MFA factors', err);
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
      const metaUpdate: any = {
        ...(profile.firstName ? { firstName: profile.firstName } : {}),
        ...(profile.lastName ? { lastName: profile.lastName } : {}),
        ...(profile.phone ? { phone: profile.phone } : {}),
      };

      // First try the common v2 shape (user_metadata) then fall back to data if necessary.
      let updateError: any = null;
      let updatedUser: any = null;
      let updateResponse: any = null;
      try {
        // @ts-ignore
        const res = await supabase.auth.updateUser({ user_metadata: metaUpdate, ...(profile.email ? { email: profile.email } : {}) });
        updateResponse = res;
        if ((res as any).error) throw (res as any).error;
        updatedUser = (res as any).data?.user || (res as any).user || null;
      } catch (e1) {
        console.warn('[Settings] updateUser with user_metadata failed, trying data key', e1);
        try {
          // @ts-ignore
          const res2 = await supabase.auth.updateUser({ data: metaUpdate, ...(profile.email ? { email: profile.email } : {}) });
          updateResponse = res2;
          if ((res2 as any).error) throw (res2 as any).error;
          updatedUser = (res2 as any).data?.user || (res2 as any).user || null;
        } catch (e2) {
          updateError = e2;
        }
      }

      if (updateError) throw updateError;

      // We now store profile data in the Supabase Auth user metadata only.

  // If the update call returned a user object, use it to immediately reflect updated metadata
      if (updatedUser) {
        try {
          setProfile({
            firstName: (updatedUser.user_metadata as any)?.firstName || (user?.firstName ?? ''),
            lastName: (updatedUser.user_metadata as any)?.lastName || '',
            email: updatedUser.email || '',
            phone: (updatedUser.user_metadata as any)?.phone || '',
          });
        } catch (e) {
          console.warn('[Settings] could not set profile from update response', e);
        }
      } else {
        try {
          const getUserRes = await supabase.auth.getUser();
          setLastGetUserResponse(getUserRes);
          const supUser = (getUserRes as any)?.data?.user;
          // if getUser returned null, also capture session for diagnosis
          if (!supUser) {
            try {
              const sessionRes = await supabase.auth.getSession();
              setLastGetUserResponse({ getUser: getUserRes, session: sessionRes });
            } catch (e) {
              // ignore
            }
          }
          if (supUser) {
            setProfile({
              firstName: (supUser.user_metadata as any)?.firstName || (user?.firstName ?? ''),
              lastName: (supUser.user_metadata as any)?.lastName || '',
              email: supUser.email || '',
              phone: (supUser.user_metadata as any)?.phone || '',
            });
          }
        } catch (e) {
          console.warn('[Settings] could not reload user after update', e);
        }
      }

      // also refresh the global auth context user so headers/navigation update
      try {
        await refreshUser();
      } catch (e) {
        console.warn('[Settings] refreshUser failed', e);
      }

      setMessage('Profile updated successfully');
      // record last responses for debugging
      setLastUpdateResponse(updateResponse || null);
    } catch (e: any) {
      console.error('[Settings] saveProfile error', e);
      setMessage(e?.message || String(e));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveNotifications = async () => {
    setIsSavingNotifications(true);
    setMessage(null);
    try {
      // merge notifications into user_metadata
      const { data } = await supabase.auth.getUser();
      const supUser = (data as any)?.user;
      const meta = (supUser?.user_metadata as any) || {};
      const newMeta = { ...meta, notifications };
      // @ts-ignore
      const { error } = await supabase.auth.updateUser({ user_metadata: newMeta });
      if (error) throw error;
      setMessage('Notification preferences saved');
    } catch (e: any) {
      console.error('[Settings] saveNotifications error', e);
      setMessage(e?.message || String(e));
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
    setMessage('Disabling two-factor authentication is not supported via this UI.');
  };

  // We use auth.user_metadata as the single source of truth for profile details.

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account preferences and security</p>
      </div>
      {/* Profile Settings */}
      {message && <div className="mb-4 text-sm text-slate-700">{message}</div>}
      { (lastUpdateResponse || lastGetUserResponse) && (
        <div className="mb-4 text-xs text-slate-600">
          <details>
            <summary className="cursor-pointer font-medium">Debug: last update/getUser responses</summary>
            <div className="mt-2">
              <div className="mb-2">
                <strong>updateUser response:</strong>
                <pre className="text-xs bg-slate-100 p-3 rounded mt-1">{JSON.stringify(lastUpdateResponse, null, 2)}</pre>
              </div>
              <div>
                <strong>getUser response:</strong>
                <pre className="text-xs bg-slate-100 p-3 rounded mt-1">{JSON.stringify(lastGetUserResponse, null, 2)}</pre>
              </div>
            </div>
          </details>
        </div>
      )}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <User className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile({...profile, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile({...profile, lastName: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveProfile} disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Shield className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-slate-500">Add an extra layer of security</p>
            </div>
            <div className="text-sm">
              {security.twoFactorEnabled ? (
                <span className="text-green-600">Enabled</span>
              ) : (
                <Button onClick={handleToggle2FA}>Enable 2FA</Button>
              )}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Biometric Authentication</h4>
              <p className="text-sm text-slate-500">Use fingerprint or Face ID</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={security.biometricsEnabled}
                onChange={(e) => setSecurity({...security, biometricsEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Change Password</h4>
            <div className="space-y-3">
              <Input type="password" placeholder="New password" id="newPassword" />
              <Button variant="outline" onClick={async () => {
                const el = document.getElementById('newPassword') as HTMLInputElement | null;
                if (!el || !el.value) return setMessage('Please enter a new password');
                try {
                  // @ts-ignore
                  const { error } = await supabase.auth.updateUser({ password: el.value });
                  if (error) throw error;
                  setMessage('Password updated successfully');
                  el.value = '';
                } catch (e: any) {
                  console.error('[Settings] update password error', e);
                  setMessage(e?.message || String(e));
                }
              }}>Update Password</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Bell className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Control how you receive updates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium capitalize">
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <Button onClick={saveNotifications} disabled={isSavingNotifications}>{isSavingNotifications ? 'Saving...' : 'Save Notifications'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Wallets */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Wallet className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <CardTitle>Connected Wallets</CardTitle>
              <CardDescription>Manage your external wallet connections</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <h4 className="font-medium">MetaMask</h4>
              <p className="text-sm text-slate-500">0x742d...0bEb</p>
            </div>
            <Button variant="outline" size="sm">Disconnect</Button>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Connect New Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Globe className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Language</Label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-md">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Japanese</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-md">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
              <option>INR (₹)</option>
              <option>JPY (¥)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Dark Mode</h4>
              <p className="text-sm text-slate-500">Toggle dark mode theme</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
  <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Export Private Keys</h4>
              <p className="text-sm text-slate-500">Download your wallet keys</p>
            </div>
            <Button variant="outline">Export</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-600">Delete Account</h4>
              <p className="text-sm text-slate-500">Permanently delete your account and data</p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </CardContent>
      </Card>

      {/* Using Supabase auth user metadata as the single source of truth for profile details */}
    </div>
  );
};

export default Settings;