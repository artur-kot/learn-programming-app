import { TextInput, Button, Paper, Title, Container, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../services/auth';

interface ForgotPasswordForm {
  email: string;
}

export const ForgotPasswordPage = () => {
  const form = useForm<ForgotPasswordForm>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: ForgotPasswordForm) => {
    await resetPassword(values.email);
    // You might want to show a success message here
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Forgot Password</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps('email')}
          />
          <Button fullWidth mt="xl" type="submit">
            Reset Password
          </Button>
          <Text ta="center" mt="md">
            Remember your password?{' '}
            <Link to="/login" style={{ textDecoration: 'none' }}>
              Sign in
            </Link>
          </Text>
        </form>
      </Paper>
    </Container>
  );
};
