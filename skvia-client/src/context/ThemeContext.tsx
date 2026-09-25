import React, { createContext, useContext, useState, useEffect } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('skvia_theme_dark');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('skvia_theme_dark', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = isDarkMode ? webDarkTheme : webLightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <FluentProvider theme={theme} style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  );
};
