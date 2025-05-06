import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createThemeColors, ThemeColors } from '../theme/themeConfig';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Initialize with a function to prevent flash of incorrect theme
  const [theme, setTheme] = useState<Theme>(() => {
    // This code only runs on the client side
    if (typeof window !== 'undefined') {
      // Check if theme is stored in localStorage
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      
      if (storedTheme) {
        return storedTheme;
      }
      
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    
    // Default to light theme
    return 'light';
  });

  // Apply theme class immediately on client-side
  useEffect(() => {
    // This ensures we only run this code on the client
    if (typeof window !== 'undefined') {
      // Apply the initial theme immediately
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Update document class when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Generate colors based on current theme
  const colors = createThemeColors(theme === 'dark');

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
