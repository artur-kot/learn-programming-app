import { AppShell } from '@mantine/core';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar/TopBar';
import { withProtected } from '../../auth/ProtectedRoute';

export const MainLayout = withProtected(() => {
  const location = useLocation();
  const isTopicPage = location.pathname.includes('/topic/');

  return (
    <AppShell transitionDuration={0} header={isTopicPage ? undefined : { height: 70 }} padding="md">
      {!isTopicPage && <TopBar />}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
});
