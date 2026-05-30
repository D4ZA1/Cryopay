import { Routes, Route } from 'react-router-dom';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AnimatedBackground from './components/AnimatedBackground';
import LandingPage from './pages/LandingPage';
import OnboardingScreen from './pages/Onboarding';
import SignUpCustodial from './pages/SignUpCustodial';
import SignUpNonCustodial from './pages/SignUpNonCustodial';
import LoginScreen from './pages/LoginScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import SecureWalletScreen from './pages/SecureWalletScreen';
import ForceMFASetup from './pages/ForceMFASetup';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Transactions from './pages/Transactions';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import BuySell from './pages/BuySell';
import Wallet from './pages/Wallet';
import ConfirmKey from './pages/ConfirmKey';
import Blockchain from './pages/Blockchain';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';

function App() {
  return (
    <>
      <AnimatedBackground />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        limit={2}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
        theme="dark"
        transition={Slide}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/signup-custodial" element={<SignUpCustodial />} />
        <Route path="/signup-non-custodial" element={<SignUpNonCustodial />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/secure-wallet" element={<SecureWalletScreen />} />
        <Route path="/mfa-setup" element={<ForceMFASetup />} />

        {/* Public blockchain explorer — no login required, uses authenticated layout for nav */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="/blockchain" element={<Blockchain />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/confirm-key" element={<ConfirmKey />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/buy-sell" element={<BuySell />} />
          </Route>
        </Route>

        <Route path="*" element={<LandingPage />} />
      </Routes>
    </>
  );
}

export default App;
