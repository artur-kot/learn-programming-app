import { PasswordInput, Button, Paper, Title, Container, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCurrentUser } from '../../services/auth';
import { account } from '../../services/appwrite';
import { notifications } from '@mantine/notifications';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ProfilePage = () => {
  const user = useCurrentUser();

  const form = useForm<ChangePasswordForm>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) =>
        value.length < 6 ? 'Password must be at least 6 characters' : null,
      newPassword: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.newPassword ? 'Passwords did not match' : null,
    },
  });

  const handleSubmit = async (values: ChangePasswordForm) => {
    try {
      await account.updatePassword(values.newPassword, values.currentPassword);
      form.reset();
      notifications.show({
        title: 'Success',
        message: 'Password updated successfully!',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update password. Please check your current password and try again.',
        color: 'red',
      });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Profile Settings</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Text size="lg" mb="md">
          Email: {user?.email}
        </Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <PasswordInput
            label="Current Password"
            placeholder="Enter your current password"
            required
            {...form.getInputProps('currentPassword')}
          />
          <PasswordInput
            label="New Password"
            placeholder="Enter your new password"
            required
            mt="md"
            {...form.getInputProps('newPassword')}
          />
          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm your new password"
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
          <Button fullWidth mt="xl" type="submit">
            Update Password
          </Button>
        </form>
      </Paper>
    </Container>
  );
};
