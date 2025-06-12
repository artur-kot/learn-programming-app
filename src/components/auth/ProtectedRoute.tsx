import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '~/services/auth';
import { useAppSelector } from '~/store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useCurrentUser();
  const userStatus = useAppSelector((store) => store.auth.status);
  const location = useLocation();

  console.log('user', user, userStatus);

  if ((!user && userStatus === 'finished') || userStatus === 'error') {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
