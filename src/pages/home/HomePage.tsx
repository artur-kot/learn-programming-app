import { Button, Container, Title, Text } from '@mantine/core';
import { useCurrentUser } from '~/services/auth';
import { Link } from 'react-router-dom';
import { links } from '../links';
import { useTranslation } from 'react-i18next';
import { withProtectedRoute } from '~/components/auth/ProtectedRoute';

export const HomePage = withProtectedRoute(() => {
  const user = useCurrentUser();
  const { t } = useTranslation();

  return (
    <Container size="md" my={40}>
      <Title ta="center">{t('home.welcome')}</Title>
      <Text ta="center" mt="md">
        {t('home.loggedInAs')}: {user?.email}
      </Text>
      <Button component={Link} to={links.profile} variant="light" fullWidth mt="xl">
        {t('home.profileSettings')}
      </Button>
    </Container>
  );
});
