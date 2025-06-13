import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar/TopBar';
import { withProtected } from '../../auth/ProtectedRoute';
import { NavigationBar } from '~/components/NavigationBar';
import { Course } from '~/types/shared.types';

// Topics with support for subtopics
const topics: Record<Course, { name: string; subtopics?: string[] }[]> = {
  [Course.HTML]: [
    { name: 'Introduction' },
    { name: 'Basic Elements' },
    { name: 'Forms', subtopics: ['Input Types', 'Form Validation', 'Form Submission'] },
    { name: 'Tables', subtopics: ['Basic Tables', 'Complex Tables', 'Table Styling'] },
  ],
  [Course.CSS]: [
    { name: 'Selectors' },
    { name: 'Box Model' },
    { name: 'Flexbox', subtopics: ['Flex Container', 'Flex Items', 'Flex Properties'] },
    { name: 'Grid', subtopics: ['Grid Container', 'Grid Items', 'Grid Areas'] },
  ],
  [Course.JS]: [
    { name: 'Variables' },
    { name: 'Functions', subtopics: ['Function Types', 'Arrow Functions', 'Closures'] },
    { name: 'Objects' },
    { name: 'Arrays', subtopics: ['Array Methods', 'Array Iteration', 'Array Transformation'] },
  ],
  [Course.TS]: [
    { name: 'Types' },
    { name: 'Interfaces' },
    { name: 'Generics' },
    { name: 'Type Guards' },
  ],
  [Course.REACT]: [
    {
      name: 'Components',
      subtopics: ['Functional Components', 'Class Components', 'Component Lifecycle'],
    },
    { name: 'Hooks', subtopics: ['useState', 'useEffect', 'Custom Hooks'] },
    { name: 'State Management', subtopics: ['Context API', 'Redux', 'Zustand'] },
    { name: 'Routing', subtopics: ['React Router', 'Route Parameters', 'Nested Routes'] },
  ],
  [Course.NEXT]: [
    { name: 'Pages' },
    { name: 'API Routes' },
    { name: 'Server Components' },
    { name: 'Deployment' },
  ],
};

export const MainLayout = withProtected(() => {
  return (
    <AppShell header={{ height: 70 }} navbar={{ width: 300, breakpoint: 'sm' }}>
      <TopBar />
      <NavigationBar topics={topics} />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
});
