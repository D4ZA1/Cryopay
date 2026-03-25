import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  // MFA check removed - Worker API doesn't implement MFA yet
  // TODO: Add MFA support when Worker implements it

  return <Outlet />;
};

export default ProtectedRoute;
