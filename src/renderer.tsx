import { createRoot } from 'react-dom/client';
import { App } from './App';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/nprogress/styles.css';
import '@mantine/code-highlight/styles.css';

createRoot(document.getElementById('root')!).render(<App />);
