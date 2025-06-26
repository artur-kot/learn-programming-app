import { HashRouter, Route, Routes } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { NavigationProgress } from '@mantine/nprogress';
import { Provider } from 'react-redux';
import { store } from './store';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { CoursePage } from './pages/course/CoursePage';
import { TopicPage } from './pages/course/TopicPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import './i18n/i18n';
import { useColorScheme } from '@mantine/hooks';
import { MainLayout } from './components/layouts/MainLayout/MainLayout';
import { AuthLayout } from './components/layouts/AuthLayout/AuthLayout';
import { ThemeInitializer } from './components/ThemeInitializer';

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/" index element={<HomePage />} />
        <Route path="/course/:courseId" element={<CoursePage />} />
        <Route path="/course/:courseId/topic/:topicId" element={<TopicPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
    </Routes>
  );
};

export const App = () => {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <MantineProvider defaultColorScheme={colorScheme}>
        <ThemeInitializer />
        <NavigationProgress />
        <Notifications />
        <HashRouter>
          <AppContent />
        </HashRouter>
      </MantineProvider>
    </Provider>
  );
};
