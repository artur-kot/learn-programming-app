import { AppShell, Group, UnstyledButton, Avatar, Text, Menu, rem } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '~/services/auth';
import { links } from '~/pages/links';
import { RiUserLine, RiLogoutBoxLine, RiArrowDownSLine, RiRobotFill } from 'react-icons/ri';
import { account } from '~/services/appwrite';
import { setUser } from '~/store/features/authSlice';
import { useDispatch } from 'react-redux';
import logo from '~/public/learnfrontend-logo.svg';

export const TopBar = () => {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      dispatch(setUser(null));
      navigate(links.login);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AppShell.Header>
      <Group h="100%" px="md" align="center" justify="space-between">
        <img src={logo} alt="logo" style={{ height: '100%' }} />
        {user && (
          <Menu width={200} position="bottom-end" transitionProps={{ transition: 'pop-top-right' }}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap={7}>
                  <Avatar size={30} radius="xl" />
                  <Text size="sm" fw={500}>
                    {user.email}
                  </Text>
                  <RiArrowDownSLine style={{ width: rem(12), height: rem(12) }} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<RiUserLine style={{ width: rem(16), height: rem(16) }} />}
                component={Link}
                to={links.profile}
              >
                Profile
              </Menu.Item>
              <Menu.Item
                leftSection={<RiRobotFill style={{ width: rem(16), height: rem(16) }} />}
                component={Link}
                to={links.aiAssistant}
              >
                AI Assistant
              </Menu.Item>
              <Menu.Item
                leftSection={<RiLogoutBoxLine style={{ width: rem(16), height: rem(16) }} />}
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </AppShell.Header>
  );
};
