import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useCurrentUser } from '~/services/auth';
import { useAppSelector } from '~/store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useCurrentUser();
  const userStatus = useAppSelector(store => store.auth.status);
  const location = useLocation();

  if (!user && userStatus === 'finished') {
    window.alert('You are not logged in');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
