import { useEffect } from 'react';
import { useUnifiedTheme } from '../store/hooks';

export const ThemeInitializer = () => {
  const { theme } = useUnifiedTheme();

  // This component ensures the theme is properly initialized
  // The actual theme synchronization is handled in the useUnifiedTheme hook
  useEffect(() => {
    // Theme initialization is handled by the useUnifiedTheme hook
    // This component just ensures the hook is called on app startup
  }, [theme]);

  return null; // This component doesn't render anything
};
