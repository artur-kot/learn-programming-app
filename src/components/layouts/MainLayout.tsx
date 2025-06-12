import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { withProtected } from '../auth/ProtectedRoute';

export const MainLayout = withProtected(() => {
  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Main>
        <TopBar />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
});
