import { HashRouter, Route, Routes } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { Provider } from 'react-redux';
import { store } from './store';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { RegisterPage } from './pages/auth/RegisterPage';

export const App = () => {
  return (
    <Provider store={store}>
      <MantineProvider>
        <HashRouter>
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

            {/* Auth routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          </Routes>
        </HashRouter>
      </MantineProvider>
    </Provider>
  );
};
