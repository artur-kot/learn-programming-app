import { HashRouter, Route, Routes } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { HomePage } from './pages/home/HomePage';

export const App = () => {
  return (
    <MantineProvider>
      <HashRouter>
        <Routes>
          <Route path="/" Component={HomePage} />
        </Routes>
      </HashRouter>
    </MantineProvider>
  );
};
