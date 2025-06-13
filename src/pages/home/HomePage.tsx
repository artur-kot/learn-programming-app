import { CodeFiles } from '../../components/CodeFiles';

export const HomePage = () => {
  const initialFiles = [
    {
      id: '1',
      name: 'index.js',
      language: 'javascript',
      content: '// Start coding here...',
    },
    {
      id: '2',
      name: 'styles.css',
      language: 'css',
      content: '/* Add your styles here */',
    },
  ];

  return (
    <div style={{ height: 'calc(100vh - 70px)' }}>
      <CodeFiles initialFiles={initialFiles} />
    </div>
  );
};
