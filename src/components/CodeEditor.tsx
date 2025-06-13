import Editor from '@monaco-editor/react';
import { useMantineColorScheme } from '@mantine/core';

interface CodeEditorProps {
  language?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
}

export const CodeEditor = ({ language = 'javascript', value, onChange }: CodeEditorProps) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
      }}
    />
  );
};
