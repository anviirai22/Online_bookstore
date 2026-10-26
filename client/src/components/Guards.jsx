import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './Feedback';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Checking permissions" />;
  if (!user) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
