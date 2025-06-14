import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar/TopBar';
import { withProtected } from '../../auth/ProtectedRoute';

export const MainLayout = withProtected(() => {
  return (
    <AppShell header={{ height: 70 }} padding="md">
      <TopBar />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
});
