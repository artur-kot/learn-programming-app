import { Box, Group, Text, ActionIcon } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { toggleTheme } from '../store/slices/codeEditorSlice';
import { BsSun, BsMoon } from 'react-icons/bs';

interface EditorBottomBarProps {
  language: string;
}

export const EditorBottomBar = ({ language }: EditorBottomBarProps) => {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: RootState) => state.codeEditor.theme);

  return (
    <Box
      style={{
        padding: '6px 10px',
      }}
    >
      <Group justify="flex-end">
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {language}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => dispatch(toggleTheme())}
          title="Toggle theme"
        >
          {currentTheme === 'vs-dark' ? <BsSun size={14} /> : <BsMoon size={14} />}
        </ActionIcon>
      </Group>
    </Box>
  );
};
