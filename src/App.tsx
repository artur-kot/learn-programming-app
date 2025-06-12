import { HashRouter, Route, Routes, useLocation } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { store } from './store';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import './i18n/i18n';
import { useColorScheme } from '@mantine/hooks';
import { MainLayout } from './components/layouts/MainLayout';

const AppContent = () => {
  return (
        <Routes>
          {/* Protected routes */}
          <Route path="/" element={<MainLayout />}>
            <Route
              path="/"
              index
              element={<HomePage />}
            />
            <Route
              path="/profile"
              element={<ProfilePage />}
            />
          </Route>

          {/* Auth routes */}
          <Route
            path="/auth/login"
            element={<LoginPage />}
          />
          <Route
            path="/auth/register"
            element={<RegisterPage />}
          />
          <Route
            path="/auth/forgot-password"
            element={<ForgotPasswordPage />}
          />
      </Routes>
  );
};

export const App = () => {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <MantineProvider defaultColorScheme={colorScheme}>
        <Notifications />
        <HashRouter>
          <AppContent />
        </HashRouter>
      </MantineProvider>
    </Provider>
  );
};
