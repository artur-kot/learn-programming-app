import { Tabs } from '@mantine/core';
import { VscFileCode } from 'react-icons/vsc';
import { useState } from 'react';
import { CodeEditor } from './CodeEditor';

interface File {
  id: string;
  name: string;
  language: string;
  content: string;
}

interface CodeFilesProps {
  initialFiles?: File[];
}

export const CodeFiles = ({ initialFiles = [] }: CodeFilesProps) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(
    initialFiles.length > 0 ? initialFiles[0].id : null
  );

  const handleFileContentChange = (value: string | undefined) => {
    if (!activeFileId || !value) return;

    setFiles(files.map((file) => (file.id === activeFileId ? { ...file, content: value } : file)));
  };

  const activeFile = files.find((file) => file.id === activeFileId);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={activeFileId} onChange={setActiveFileId}>
        <Tabs.List>
          {files.map((file) => (
            <Tabs.Tab key={file.id} value={file.id} leftSection={<VscFileCode size={14} />}>
              {file.name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <div style={{ flex: 1, position: 'relative' }}>
        {activeFile && (
          <CodeEditor
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleFileContentChange}
          />
        )}
      </div>
    </div>
  );
};
