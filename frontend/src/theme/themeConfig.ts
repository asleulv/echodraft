// Theme configuration file that defines all color variables for both light and dark modes

export const lightTheme = {
    // Text colors
    textPrimary: '#374151', // Adjusted for warmer, more readable gray
    textSecondary: '#475569', // gray-600
    textMuted: '#64748b', // gray-500
    
    // Background colors
    bgPrimary: '#ffffff', // white
    bgSecondary: '#f8fafc', // gray-50
    bgTertiary: '#f1f5f9', // gray-100
    
    // UI element colors
    primary: {
      50: '#ffffff',
      100: '#f1f5f9',
      200: '#efefef',
      300: '#e4e4e4',
      400: '#b8b8b9',
      500: '#767676',
      600: '#676768',
      700: '#525252',
      800: '#383838',
      900: '#1d1d1d',
      950: '#131313',
    },
    secondary: {
      50: '#f0fdf8', // Inverted from darkTheme.secondary[950]
      100: '#d7fef4', // Inverted from darkTheme.secondary[900]
      200: '#bbf9e1', // Inverted from darkTheme.secondary[800]
      300: '#86f0d0', // Inverted from darkTheme.secondary[700]
      400: '#4adecb', // Inverted from darkTheme.secondary[600]
      500: '#22c8b7', // Inverted from darkTheme.secondary[500]
      600: '#14b5a2', // Inverted from darkTheme.secondary[400]
      700: '#118a84', // Inverted from darkTheme.secondary[300]
      800: '#0f6a66', // Inverted from darkTheme.secondary[200]
      900: '#0d4e49', // Inverted from darkTheme.secondary[100]
      950: '#0a3d3b', // Inverted from darkTheme.secondary[50]
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
  };
  
export const darkTheme = {
    // Text colors
    textPrimary: '#f8fafc', // gray-50
    textSecondary: '#cbd5e1', // gray-300
    textMuted: '#a0aec0', // Lighter muted color for better readability
    
    // Background colors
    bgPrimary: '#121212', // Pure dark gray, almost black
    bgSecondary: '#1a1a1a', // Slightly lighter gray
    bgTertiary: '#2c2c2c', // Medium gray
    
    // UI element colors - Using a dark purple/gray accent color for interactive elements
    primary: {
      50: '#0a0a0a', // True grayscale instead of blue-gray
      100: '#111111',
      200: '#262626',
      300: '#404040',
      400: '#525252',
      500: '#737373',
      600: '#a3a3a3',
      700: '#d4d4d4',
      800: '#e5e5e5',
      900: '#f5f5f5',
      950: '#fafafa',
    },
    secondary: {
      50: '#0a3d3b', // Dark teal for a deep shade
      100: '#0d4e49', // Slightly lighter but still deep
      200: '#0f6a66', // A richer, more vibrant teal
      300: '#118a84', // Medium teal with a balanced tone
      400: '#14b5a2', // Bright, lively teal
      500: '#22c8b7', // Main teal color, balanced and fresh
      600: '#4adecb', // Lighter teal for use in dark mode or highlights
      700: '#86f0d0', // Light pastel teal
      800: '#bbf9e1', // Very light teal, almost mint
      900: '#d7fef4', // Nearly white with a hint of teal
      950: '#f0fdf8', // Faintest teal, almost off-white
    },
    success: {
      50: '#052e16', // Inverted from light theme
      100: '#14532d',
      200: '#166534',
      300: '#15803d',
      400: '#16a34a',
      500: '#22c55e',
      600: '#4ade80', // Lighter for dark mode
      700: '#86efac',
      800: '#bbf7d0',
      900: '#dcfce7',
      950: '#f0fdf4',
    },
    warning: {
      50: '#451a03', // Inverted from light theme
      100: '#78350f',
      200: '#92400e',
      300: '#b45309',
      400: '#d97706',
      500: '#f59e0b',
      600: '#fbbf24', // Lighter for dark mode
      700: '#fcd34d',
      800: '#fde68a',
      900: '#fef3c7',
      950: '#fffbeb',
    },
    danger: {
      50: '#450a0a', // Inverted from light theme
      100: '#7f1d1d',
      200: '#991b1b',
      300: '#b91c1c',
      400: '#dc2626',
      500: '#ef4444',
      600: '#f87171', // Lighter for dark mode
      700: '#fca5a5',
      800: '#fecaca',
      900: '#fee2e2',
      950: '#fef2f2',
    },
  };
  

// Define semantic color names that map to the appropriate theme
export const createThemeColors = (isDark: boolean) => {
  const theme = isDark ? darkTheme : lightTheme;
  
  return {
    // Text
    text: {
      primary: theme.textPrimary,
      secondary: theme.textSecondary,
      muted: theme.textMuted,
    },
    
    // Backgrounds
    background: {
      primary: theme.bgPrimary,
      secondary: theme.bgSecondary,
      tertiary: theme.bgTertiary,
    },
    
    // UI elements
    primary: theme.primary,
    secondary: theme.secondary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };
};

// Export theme types for TypeScript
export type ThemeColors = ReturnType<typeof createThemeColors>;
