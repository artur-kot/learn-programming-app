import { Box, Group, Text, ActionIcon, Tooltip, getThemeColor, useMantineTheme, virtualColor } from '@mantine/core';
import { TbSun, TbMoon, TbDeviceDesktop } from 'react-icons/tb';
import { useUnifiedTheme } from '../store/hooks';

interface EditorBottomBarProps {
  language: string;
}

const themeToIconMap = {
  dark: <TbMoon size={14} />,
  light: <TbSun size={14} />,
  auto: <TbDeviceDesktop size={14} />,
};

export const EditorBottomBar = ({ language }: EditorBottomBarProps) => {
  const { theme, toggleTheme } = useUnifiedTheme();
  const mantineTheme = useMantineTheme();

  return (
    <Box
      style={{
        height: '65px',
        padding: '6px 10px',
        borderTop: `1px solid rgba(0, 0, 0, 0.1)`,
      }}
    >
      <Group justify="flex-end" align="center" h="100%">
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {language}
          </Text>
        </Group>
        <Tooltip label={`Theme: ${theme}`}>
          <ActionIcon variant="subtle" color="gray" onClick={toggleTheme} title="Toggle theme">
            {themeToIconMap[theme]}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Box>
  );
};
