import { createRoot } from 'react-dom/client';
import { App } from './App';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/charts/styles.css';

createRoot(document.getElementById('root')!).render(<App />);
