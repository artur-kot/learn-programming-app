import { Button, Container, Title, Text } from '@mantine/core';
import { useCurrentUser } from '~/services/auth';
import { Link } from 'react-router-dom';
import { links } from '../links';

export const HomePage = () => {
  const user = useCurrentUser();

  return (
    <Container size="md" my={40}>
      <Title ta="center">Welcome to LearnFrontend</Title>
      <Text ta="center" mt="md">
        Logged in as: {user?.email}
      </Text>
      <Button component={Link} to={links.profile} variant="light" fullWidth mt="xl">
        Profile Settings
      </Button>
    </Container>
  );
};
