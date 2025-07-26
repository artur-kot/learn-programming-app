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
import { links } from '../links';

import css from '~/assets/img/css.png';
import html from '~/assets/img/html.png';
import js from '~/assets/img/js.png';
import next from '~/assets/img/nextjs.png';
import react from '~/assets/img/react.png';
import ts from '~/assets/img/ts.png';

const courses = [
  {
    icon: <img src={html} alt="HTML" style={{ width: '64px', height: '64px' }} />,
    value: Course.HTML,
    label: 'HTML',
    description: 'Learn the fundamentals of HTML and web structure',
  },
  {
    icon: <img src={css} alt="CSS" style={{ width: '64px', height: '64px' }} />,
    value: Course.CSS,
    label: 'CSS',
    description: 'Master styling and layout with modern CSS',
  },
  {
    icon: <img src={js} alt="JavaScript" style={{ width: '64px', height: '64px' }} />,
    value: Course.JS,
    label: 'JavaScript',
    description: 'Build interactive web applications with JavaScript',
  },
  {
    icon: <img src={ts} alt="TypeScript" style={{ width: '64px', height: '64px' }} />,
    value: Course.TS,
    label: 'TypeScript',
    description: 'Add type safety to your JavaScript code',
  },
  {
    icon: <img src={react} alt="React" style={{ width: '70px', height: '64px' }} />,
    value: Course.REACT,
    label: 'React',
    description: 'Create powerful user interfaces with React',
  },
  {
    icon: <img src={next} alt="Next.js" style={{ width: 'auto', height: '64px' }} />,
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
          <Card key={course.value} withBorder shadow="sm" p="lg" pt="xl">
              <Group justify="center" mb="md">
                {course.icon}
              </Group>
              <Title order={3} ta="center" mb="xs">
                {course.label}
              </Title>
              <Text ta="center" mb="lg" mt="auto">
                {course.description}
              </Text>
              <Button mt="auto" variant="light" fullWidth onClick={() => navigate(links.course(course.value))}>
                Start Learning
              </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};
