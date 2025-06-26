import { Tabs, ActionIcon } from '@mantine/core';
import { VscFileCode, VscAdd, VscClose } from 'react-icons/vsc';
import { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { EditorBottomBar } from './EditorBottomBar';
import { useUnifiedTheme } from '../store/hooks';

interface File {
  id: string;
  name: string;
  language: string;
  content: string;
  isStatic?: boolean;
}

interface CodeFilesProps {
  initialFiles?: File[];
}

export const CodeFiles = ({ initialFiles = [] }: CodeFilesProps) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(
    initialFiles.length > 0 ? initialFiles[0].id : null
  );
  const { getCodeEditorTheme } = useUnifiedTheme();

  const handleFileContentChange = (value: string | undefined) => {
    if (!activeFileId || !value) return;

    setFiles(files.map((file) => (file.id === activeFileId ? { ...file, content: value } : file)));
  };

  const handleAddFile = () => {
    const newFile: File = {
      id: `file-${Date.now()}`,
      name: 'new-file.js',
      language: 'javascript',
      content: '',
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleRemoveFile = (fileId: string) => {
    const fileToRemove = files.find((f) => f.id === fileId);
    if (fileToRemove?.isStatic) return;

    const newFiles = files.filter((f) => f.id !== fileId);
    setFiles(newFiles);

    if (activeFileId === fileId) {
      setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
    }
  };

  const activeFile = files.find((file) => file.id === activeFileId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={activeFileId} onChange={setActiveFileId}>
        <Tabs.List>
          {files.map((file) => (
            <Tabs.Tab
              key={file.id}
              value={file.id}
              leftSection={<VscFileCode size={14} />}
              rightSection={
                !file.isStatic && (
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.id);
                    }}
                  >
                    <VscClose size={12} />
                  </ActionIcon>
                )
              }
            >
              {file.name}
            </Tabs.Tab>
          ))}
          <Tabs.Tab value="add" onClick={handleAddFile}>
            <VscAdd size={14} />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <div
        style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {activeFile && (
          <>
            <div style={{ flex: 1, height: '100%' }}>
              <CodeEditor
                language={activeFile.language}
                value={activeFile.content}
                onChange={handleFileContentChange}
                theme={getCodeEditorTheme()}
              />
            </div>
            <EditorBottomBar language={activeFile.language} />
          </>
        )}
      </div>
    </div>
  );
};
