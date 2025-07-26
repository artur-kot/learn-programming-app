import { Navigate, useLocation } from 'react-router-dom';
import { isAdmin, useCurrentUser } from '~/services/auth';
import { useAppSelector } from '~/store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  admin?: boolean;
}

export const ProtectedRoute = ({ children, admin }: ProtectedRouteProps) => {
  const user = useCurrentUser();
  const userStatus = useAppSelector((store) => store.auth.status);
  const location = useLocation();

  if ((!user && userStatus === 'finished') || userStatus === 'error') {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (admin && !isAdmin(user!)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export const withProtected = (Component: React.ComponentType<any>, admin?: boolean) => {
  return (props: any) => (
    <ProtectedRoute admin={admin}>
      <Component {...props} />
    </ProtectedRoute>
  );
};
