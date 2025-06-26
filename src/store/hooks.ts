import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { setTheme, toggleTheme, ThemeMode } from './features/globalSlice';
import { useMantineColorScheme } from '@mantine/core';
import { useEffect } from 'react';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useUnifiedTheme = () => {
  const dispatch = useAppDispatch();
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const theme = useAppSelector((state: RootState) => state.global.theme);

  // Sync theme changes to UI
  useEffect(() => {
    // Set Mantine UI theme
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  const setUnifiedTheme = (newTheme: ThemeMode) => {
    dispatch(setTheme(newTheme));
  };

  const toggleUnifiedTheme = () => {
    dispatch(toggleTheme());
  };

  // Helper function to convert unified theme to code editor theme
  const getCodeEditorTheme = (): 'vs-dark' | 'light' => {
    if (theme === 'auto') {
      // For auto theme, check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'light';
    }
    return theme === 'dark' ? 'vs-dark' : 'light';
  };

  return {
    theme,
    setTheme: setUnifiedTheme,
    toggleTheme: toggleUnifiedTheme,
    getCodeEditorTheme,
  };
};
