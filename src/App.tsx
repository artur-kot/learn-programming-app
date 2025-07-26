import { HashRouter, Route, Routes } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { NavigationProgress } from '@mantine/nprogress';
import { ModalsProvider } from '@mantine/modals';
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
import { AdminLayout } from './components/layouts/AdminLayout/AdminLayout';
import { CodeHighlightAdapterProvider, createShikiAdapter } from '@mantine/code-highlight';

async function loadShiki() {
  const { createHighlighter } = await import('shiki');
  const shiki = await createHighlighter({
    langs: ['tsx', 'scss', 'html', 'bash', 'json', 'css', 'javascript', 'typescript'],
    themes: [],
  });

  return shiki;
}

const shikiAdapter = createShikiAdapter(loadShiki);

const AppRoutes = () => {
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

      {import.meta.env.DEV && (
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="/admin/users" element={<h1>Users</h1>} />
        </Route>
      )}
    </Routes>
  );
};

export const App = () => {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <MantineProvider defaultColorScheme={colorScheme}>
        <ModalsProvider>
          <ThemeInitializer />
          <NavigationProgress />
          <Notifications />
          <CodeHighlightAdapterProvider adapter={shikiAdapter}>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </CodeHighlightAdapterProvider>
        </ModalsProvider>
      </MantineProvider>
    </Provider>
  );
};
