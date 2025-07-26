import { Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { withProtected } from '../../auth/ProtectedRoute';

export const AdminLayout = withProtected(() => {
  return (
    <Container size="xs" py="xl">
      <Outlet />
    </Container>
  );
}, true);
