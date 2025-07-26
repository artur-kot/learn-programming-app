import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Container,
  Text,
  FocusTrap,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../services/auth';
import { setStatus } from '../../store/features/authSlice';
import { links } from '../links';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import logo from '~/assets/learnfrontend-logo.svg';
import { BackButton } from '~/components/BackButton';

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const from = location.state?.from?.pathname || '/';

  const form = useForm<LoginForm>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? t('common.passwordLength') : null),
    },
  });

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    dispatch(setStatus('loading'));
    const { user, error } = await login(values.email, values.password);

    if (error) {
      if (error.code === 429) {
        notifications.show({
          title: t('common.error'),
          message: t('auth.tooManyLoginAttempts'),
          color: 'red',
        });
      } else {
        notifications.show({
          title: t('common.error'),
          message: error.message,
          color: 'red',
        });
      }
    } else if (user) {
      navigate(from, { replace: true });
    }
    setLoading(false);
    dispatch(setStatus('finished'));
  };

  return (
    <FocusTrap>
      <Container size={420} py={40}>
        <BackButton label="Home" />
        <Title ta="center">{t('auth.login')}</Title>
        <img src={logo} alt="logo" style={{ width: '100%' }} />
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
            <Button fullWidth mt="xl" type="submit" loading={loading}>
              {t('auth.login')}
            </Button>
            <Text ta="center" mt="md">
              {t('auth.noAccount')}{' '}
              <Link to={links.register()} style={{ textDecoration: 'none' }}>
                {t('auth.register')}
              </Link>
            </Text>
            <Text ta="center" mt="xs">
              <Link to={links.forgotPassword()} style={{ textDecoration: 'none' }}>
                {t('auth.forgotPassword')}
              </Link>
            </Text>
          </form>
        </Paper>
      </Container>
    </FocusTrap>
  );
};
