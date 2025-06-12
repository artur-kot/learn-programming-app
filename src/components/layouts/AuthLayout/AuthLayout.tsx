import { Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { withUnauthorized } from '../../auth/UnauthorizedRoute';

export const AuthLayout = withUnauthorized(() => {
  return (
    <Container size="xs" py="xl">
      <Outlet />
    </Container>
  );
});
