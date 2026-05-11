import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AnimatedBackground from './components/AnimatedBackground';
import LandingPage from './pages/LandingPage';
import Leaderboard from './pages/Leaderboard';
import Coupons from './pages/Coupons';
import TestQr from './pages/TestQr';
import BinsAdmin from './pages/BinsAdmin';

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
        <Route path="/" element={<LandingPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/test-qr" element={<TestQr />} />
        <Route path="/bins" element={<BinsAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
