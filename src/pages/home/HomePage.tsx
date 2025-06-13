import Editor from '@monaco-editor/react';
import { useMantineColorScheme } from '@mantine/core';

export const HomePage = () => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <div style={{ height: 'calc(100vh - 70px)' }}>
      <Editor
          height="100%"
          defaultLanguage="javascript"
          theme={colorScheme === 'dark' ? 'vs-dark' : 'light'}
          defaultValue="// Start coding here..."
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
    </div>
  );
};
