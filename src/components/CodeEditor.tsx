import Editor, { Monaco } from '@monaco-editor/react';
import { useMantineColorScheme } from '@mantine/core';
import { CodeTheme } from '../store/slices/codeEditorSlice';
import { useRef } from 'react';

interface CodeEditorProps {
  language?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  theme?: CodeTheme;
}

export const CodeEditor = ({
  language = 'javascript',
  value,
  onChange,
  theme = 'vs-dark',
}: CodeEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Add command palette shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      editor.trigger('', 'editor.action.quickCommand', '');
    });
  };

  return (
    <Editor
      height="calc(100vh - 103px)"
      language={language}
      theme={theme}
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
      }}
    />
  );
};
