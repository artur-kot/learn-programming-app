import { Container, Text, AppShell, Stack, Button } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { setSelectedTopic } from '~/store/features/globalSlice';
import { Course } from '~/types/shared.types';

// Hardcoded topics for now
const topics: Record<Course, string[]> = {
  [Course.HTML]: ['Introduction', 'Basic Elements', 'Forms', 'Tables'],
  [Course.CSS]: ['Selectors', 'Box Model', 'Flexbox', 'Grid'],
  [Course.JS]: ['Variables', 'Functions', 'Objects', 'Arrays'],
  [Course.TS]: ['Types', 'Interfaces', 'Generics', 'Type Guards'],
  [Course.REACT]: ['Components', 'Hooks', 'State Management', 'Routing'],
  [Course.NEXT]: ['Pages', 'API Routes', 'Server Components', 'Deployment'],
};

export const HomePage = () => {
  const dispatch = useAppDispatch();
  const { course, selectedTopic } = useAppSelector((state) => state.global);

  return (
    <div style={{ display: 'flex' }}>
      <AppShell.Navbar p="xs" style={{ width: 300 }}>
        <Stack gap={"xs"}>
          {topics[course].map((topic: string) => (
            <Button
              key={topic}
              variant={selectedTopic === topic ? 'filled' : 'light'}
              onClick={() => dispatch(setSelectedTopic(topic))}
              fullWidth
            >
              {topic}
            </Button>
          ))}
        </Stack>
      </AppShell.Navbar>
      <Container size="md" my={40} style={{ flex: 1 }}>
        <Text size="xl">Selected Topic: {selectedTopic || 'None'}</Text>
      </Container>
    </div>
  );
};
