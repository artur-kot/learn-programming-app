import { TextInput, PasswordInput, Button, Paper, Title, Container, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../services/auth';
import { setUser } from '../../store/features/authSlice';
import { links } from '../links';

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
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
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  const handleSubmit = async (values: LoginForm) => {
    const user = await login(values.email, values.password);
    if (user) {
      dispatch(setUser(user));
      navigate(from, { replace: true });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Welcome back!</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <Button fullWidth mt="xl" type="submit">
            Sign in
          </Button>
          <Text ta="center" mt="md">
            Don't have an account?{' '}
            <Link to={links.register} style={{ textDecoration: 'none' }}>
              Register
            </Link>
          </Text>
          <Text ta="center" mt="xs">
            <Link to={links.forgotPassword} style={{ textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </Text>
        </form>
      </Paper>
    </Container>
  );
};
