import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from './LoadingState';
import AppShell from './AppShell';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
}
