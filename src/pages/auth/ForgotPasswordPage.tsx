import { TextInput, Button, Paper, Title, Container, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../services/auth';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { links } from '../links';

interface ForgotPasswordForm {
  email: string;
}

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const form = useForm<ForgotPasswordForm>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: ForgotPasswordForm) => {
    setLoading(true);
    const { success, error } = await resetPassword(values.email);

    if (error) {
      notifications.show({
        title: t('common.error'),
        message: error.message,
        color: 'red',
      });
    } else if (success) {
      notifications.show({
        title: t('common.success'),
        message: t('auth.resetPasswordEmailSent'),
        color: 'green',
      });
      form.reset();
    }
    setLoading(false);
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">{t('auth.forgotPassword')}</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label={t('auth.email')}
            placeholder="you@example.com"
            required
            {...form.getInputProps('email')}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            {t('auth.resetPassword')}
          </Button>
          <Text ta="center" mt="md">
            {t('auth.rememberPassword')}{' '}
            <Link to={links.login} style={{ textDecoration: 'none' }}>
              {t('auth.login')}
            </Link>
          </Text>
        </form>
      </Paper>
    </Container>
  );
};
