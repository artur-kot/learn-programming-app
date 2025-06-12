import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export const MainLayout = () => {
  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Main>
        <TopBar />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};
