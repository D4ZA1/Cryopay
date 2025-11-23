import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OnboardingScreen from './pages/Onboarding';
import SignUpCustodial from './pages/SignUpCustodial';
import SignUpNonCustodial from './pages/SignUpNonCustodial';
import LoginScreen from './pages/LoginScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import SecureWalletScreen from './pages/SecureWalletScreen';
import ForceMFASetup from './pages/ForceMFASetup';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import Transactions from './pages/Transactions';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import BuySell from './pages/BuySell';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
// Wallet, confirm-key and blockchain pages removed per current requirements

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/signup-custodial" element={<SignUpCustodial />} />
      <Route path="/signup-non-custodial" element={<SignUpNonCustodial />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      
      {/* Secure wallet is part of onboarding and should be accessible immediately after signup */}
      <Route path="/secure-wallet" element={<SecureWalletScreen />} />
  <Route path="/mfa-setup" element={<ForceMFASetup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/contacts" element={<Contacts />} />
          {/* wallet, confirm-key and blockchain routes removed */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/buy-sell" element={<BuySell />} />
        </Route>
      </Route>

      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default App;

