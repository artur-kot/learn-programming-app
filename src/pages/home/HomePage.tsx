import { Container, Title, SimpleGrid, Card, Text, Group, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Course } from '~/types/shared.types';
import {
  RiHtml5Line,
  RiCss3Line,
  RiJavascriptLine,
  RiReactjsLine,
  RiNextjsLine,
} from 'react-icons/ri';

const courses = [
  {
    icon: <RiHtml5Line size={32} />,
    value: Course.HTML,
    label: 'HTML',
    description: 'Learn the fundamentals of HTML and web structure',
  },
  {
    icon: <RiCss3Line size={32} />,
    value: Course.CSS,
    label: 'CSS',
    description: 'Master styling and layout with modern CSS',
  },
  {
    icon: <RiJavascriptLine size={32} />,
    value: Course.JS,
    label: 'JavaScript',
    description: 'Build interactive web applications with JavaScript',
  },
  {
    icon: <RiJavascriptLine size={32} />,
    value: Course.TS,
    label: 'TypeScript',
    description: 'Add type safety to your JavaScript code',
  },
  {
    icon: <RiReactjsLine size={32} />,
    value: Course.REACT,
    label: 'React',
    description: 'Create powerful user interfaces with React',
  },
  {
    icon: <RiNextjsLine size={32} />,
    value: Course.NEXT,
    label: 'Next.js',
    description: 'Build full-stack React applications with Next.js',
  },
];

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl" ta="center">
        Frontend Development Courses
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {courses.map((course) => (
          <Card key={course.value} withBorder shadow="sm" p="lg">
            <Group justify="center" mb="md">
              {course.icon}
            </Group>
            <Title order={3} ta="center" mb="xs">
              {course.label}
            </Title>
            <Text c="dimmed" ta="center" mb="md">
              {course.description}
            </Text>
            <Button variant="light" fullWidth onClick={() => navigate(`/course/${course.value}`)}>
              Start Learning
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};
