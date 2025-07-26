import { Container, Title, Stack, Card } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { Course } from '~/types/shared.types';
import { useAppSelector } from '~/store/hooks';
import { BackButton } from '~/components/BackButton';
import { TopicItem } from '~/components/TopicItem';
import { RiPlayFill } from 'react-icons/ri';
import { links } from '../links';

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

export const CoursePage = () => {
  const { courseId } = useParams<{ courseId: Course }>();
  const course = courseId as Course;

  if (!course || !topics[course]) {
    return (
      <Container>
        <BackButton to={links.home()} label="Courses" />
        <Title>Course not found</Title>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <BackButton to={links.home()} label="Courses" />
      <Title order={1} mb="xl">
        {course.toUpperCase()} Course
      </Title>
      <Stack gap="md">
        {topics[course].map((chapter, index) => (
          <Card key={chapter.name} withBorder shadow="sm" p="lg">
            <Title order={3} mb="md">
              Chapter {index + 1}: {chapter.name}
            </Title>
            {chapter.subtopics ? (
              <Stack gap="xs">
                {chapter.subtopics.map((topic, topicIndex) => (
                  <TopicItem
                    key={topic}
                    topicName={topic}
                    chapterIndex={index}
                    topicIndex={topicIndex}
                    courseId={course}
                  />
                ))}
              </Stack>
            ) : (
              <TopicItem topicName={chapter.name} chapterIndex={index} courseId={course} />
            )}
          </Card>
        ))}
      </Stack>
    </Container>
  );
};
