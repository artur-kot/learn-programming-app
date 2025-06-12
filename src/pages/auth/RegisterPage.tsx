import { TextInput, PasswordInput, Button, Paper, Title, Container, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { register } from '../../services/auth';
import { setUser } from '../../store/features/authSlice';
import { links } from '../links';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { withUnauthorizedRoute } from '~/components/auth/UnauthorizedRoute';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage = withUnauthorizedRoute(() => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const form = useForm<RegisterForm>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? t('common.passwordLength') : null),
      confirmPassword: (value, values) =>
        value !== values.password ? t('common.passwordsDoNotMatch') : null,
    },
  });

  const handleSubmit = async (values: RegisterForm) => {
    setLoading(true);
    const { user, error } = await register(values.email, values.password);

    if (error) {
      notifications.show({
        title: t('common.error'),
        message: error.message,
        color: 'red',
      });
    } else if (user) {
      dispatch(setUser(user));
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">{t('auth.register')}</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label={t('auth.email')}
            placeholder="you@example.com"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label={t('auth.password')}
            placeholder={t('auth.password')}
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <PasswordInput
            label={t('auth.confirmPassword')}
            placeholder={t('auth.confirmPassword')}
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            {t('auth.register')}
          </Button>
          <Text ta="center" mt="md">
            {t('auth.haveAccount')}{' '}
            <Link to={links.login} style={{ textDecoration: 'none' }}>
              {t('auth.login')}
            </Link>
          </Text>
        </form>
      </Paper>
    </Container>
  );
});
