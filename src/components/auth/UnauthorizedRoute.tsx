import { useCurrentUser } from '../../services/auth';
import { Navigate } from 'react-router-dom';

interface UnauthorizedRouteProps {
  children: React.ReactNode;
}

export const UnauthorizedRoute = ({ children }: UnauthorizedRouteProps) => {
  const user = useCurrentUser();

  if (user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export const withUnauthorized = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <UnauthorizedRoute>
      <Component {...props} />
    </UnauthorizedRoute>
  );
};
