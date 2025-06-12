import { HashRouter, Route, Routes, useLocation } from 'react-router';
import { MantineProvider, AppShell } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { store } from './store';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { TopBar } from './components/layout/TopBar';
import { useCurrentUser } from './services/auth';
import './i18n/i18n';
import { UnauthorizedRoute } from './components/auth/UnauthorizedRoute';

const AppContent = () => {
  const location = useLocation();
  const showTopBar = !location.pathname.startsWith('/auth');

  return (
    <AppShell header={{ height: showTopBar ? 60 : 0 }}>
      {showTopBar && <TopBar />}
      <AppShell.Main>
        <Routes>
          {/* Protected routes */}
          <Route
            path="/"
            index
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Auth routes */}
          <Route
            path="/auth/login"
            element={
              <UnauthorizedRoute>
                <LoginPage />
              </UnauthorizedRoute>
            }
          />
          <Route
            path="/auth/register"
            element={
              <UnauthorizedRoute>
                <RegisterPage />
              </UnauthorizedRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <UnauthorizedRoute>
                <ForgotPasswordPage />
              </UnauthorizedRoute>
            }
          />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
};

export const App = () => {
  return (
    <Provider store={store}>
      <MantineProvider>
        <Notifications />
        <HashRouter>
          <AppContent />
        </HashRouter>
      </MantineProvider>
    </Provider>
  );
};
