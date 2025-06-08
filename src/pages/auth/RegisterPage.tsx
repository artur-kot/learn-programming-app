import { TextInput, PasswordInput, Button, Paper, Title, Container, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { register } from '../../services/auth';
import { setUser } from '../../store/features/authSlice';
import { links } from '../links';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage = () => {
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
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords did not match' : null,
    },
  });

  const handleSubmit = async (values: RegisterForm) => {
    const user = await register(values.email, values.password);
    if (user) {
      dispatch(setUser(user));
      navigate('/', { replace: true });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Create an account</Title>
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
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
          <Button fullWidth mt="xl" type="submit">
            Register
          </Button>
          <Text ta="center" mt="md">
            Already have an account?{' '}
            <Link to={links.login} style={{ textDecoration: 'none' }}>
              Sign in
            </Link>
          </Text>
        </form>
      </Paper>
    </Container>
  );
};
