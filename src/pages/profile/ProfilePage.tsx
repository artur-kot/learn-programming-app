import {
  PasswordInput,
  Button,
  Paper,
  Title,
  Container,
  Text,
  Select,
  SegmentedControl,
  Center,
  Flex,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCurrentUser } from '../../services/auth';
import { account } from '../../services/appwrite';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { RiMoonFill, RiSunFill, RiComputerLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '~/components/BackButton';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const user = useCurrentUser();
  const { t, i18n } = useTranslation();
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const navigate = useNavigate();

  const form = useForm<ChangePasswordForm>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) => (value.length < 6 ? t('common.passwordLength') : null),
      newPassword: (value) => (value.length < 6 ? t('common.passwordLength') : null),
      confirmPassword: (value, values) =>
        value !== values.newPassword ? t('common.passwordsDoNotMatch') : null,
    },
  });

  const handleSubmit = async (values: ChangePasswordForm) => {
    setLoading(true);
    try {
      await account.updatePassword(values.newPassword, values.currentPassword);
      form.reset();
      notifications.show({
        title: t('common.success'),
        message: t('profile.passwordUpdated'),
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      notifications.show({
        title: t('common.error'),
        message: t('profile.passwordUpdateError'),
        color: 'red',
      });
    }
    setLoading(false);
  };

  const handleLanguageChange = (value: string | null) => {
    if (value) {
      i18n.changeLanguage(value);
    }
  };

  return (
    <Container size={420} my={40}>
      <BackButton />
      <Title ta="center">{t('profile.title')}</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Text size="lg" mb="md">
          {t('auth.email')}: {user?.email}
        </Text>

        <Text size="sm" fw={500} mb="xs">
          {t('profile.theme.title')}
        </Text>
        <SegmentedControl
          value={colorScheme}
          onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
          data={[
            {
              value: 'light',
              label: (
                <Center>
                  <Flex gap="xs" align="center">
                    <RiSunFill size="1rem" />
                    {t('profile.theme.light')}
                  </Flex>
                </Center>
              ),
            },
            {
              value: 'dark',
              label: (
                <Center>
                  <Flex gap="xs" align="center">
                    <RiMoonFill size="1rem" />
                    {t('profile.theme.dark')}
                  </Flex>
                </Center>
              ),
            },
            {
              value: 'auto',
              label: (
                <Center>
                  <Flex gap="xs" align="center">
                    <RiComputerLine size="1rem" />
                    {t('profile.theme.system')}
                  </Flex>
                </Center>
              ),
            },
          ]}
          mb="xl"
        />

        <Select
          label={t('profile.language')}
          placeholder={t('profile.selectLanguage')}
          value={i18n.language}
          onChange={handleLanguageChange}
          data={[
            { value: 'en', label: t('profile.english') },
            { value: 'pl', label: t('profile.polish') },
          ]}
          mb="xl"
        />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <PasswordInput
            label={t('profile.currentPassword')}
            placeholder={t('profile.enterCurrentPassword')}
            required
            {...form.getInputProps('currentPassword')}
          />
          <PasswordInput
            label={t('profile.newPassword')}
            placeholder={t('profile.enterNewPassword')}
            required
            mt="md"
            {...form.getInputProps('newPassword')}
          />
          <PasswordInput
            label={t('profile.confirmNewPassword')}
            placeholder={t('profile.confirmNewPassword')}
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            {t('profile.updatePassword')}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};
