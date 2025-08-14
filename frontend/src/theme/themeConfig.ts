// Theme configuration file that defines all color variables for both light and dark modes
// Uses warm cream base with sophisticated brown and charcoal accents


export const lightTheme = {
  // Text colors - warm charcoal tones
  textPrimary: '#2c2018', // Dark warm brown
  textSecondary: '#4a3d32', // Medium warm brown  
  textMuted: '#6b5b50', // Light warm brown
  
  // Background colors - warm cream base
  bgPrimary: '#faf8f5', // Warm cream background
  bgSecondary: '#f5f1ec', // Slightly deeper cream
  bgTertiary: '#ede7e0', // Deeper warm beige
  
  // Primary grays - warm charcoal spectrum
  primary: {
    50: '#faf8f5',   // Warm cream (matches bgPrimary)
    100: '#f5f1ec',  // Light cream
    200: '#ede7e0',  // Soft beige
    300: '#ddd4c8',  // Medium beige
    400: '#b8a896',  // Warm taupe
    500: '#8f7e6f',  // Medium brown
    600: '#6b5b50',  // Dark taupe
    700: '#4a3d32',  // Warm charcoal
    800: '#2c2018',  // Deep charcoal
    900: '#1c1713',  // Very deep charcoal
    950: '#0f0d0a'   // Darkest charcoal
  },
  
  // Secondary colors - sophisticated brown spectrum (NO ORANGE!)
  secondary: {
    50: '#f8f6f3',   // Lightest warm gray
    100: '#f0ebe5',  // Light warm gray
    200: '#e1d7cb',  // Soft brown-gray
    300: '#cbbba8',  // Medium brown-gray
    400: '#a8947d',  // Warm brown
    500: '#8b7355',  // Main sophisticated brown
    600: '#6f5a43',  // Deep brown
    700: '#5a4837',  // Darker brown
    800: '#493a2e',  // Very dark brown
    900: '#3d3127',  // Deep chocolate
    950: '#201a15'   // Darkest brown
  },
  
  success: {
    50: '#f0f9f0',
    100: '#dcf2dc',
    200: '#bce5bc',
    300: '#8fd18f',
    400: '#5cb85c',
    500: '#449944',
    600: '#367d36',
    700: '#2d5f2d',
    800: '#274f27',
    900: '#234123',
    950: '#0f240f',
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
  // Text colors - pure light grays (no blue tint)
  textPrimary: '#ffffff', // Pure white
  textSecondary: '#f5f5f5', // Very light gray
  textMuted: '#d4d4d4', // Light gray
  
  // Background colors - pure blacks and dark grays
  bgPrimary: '#000000', // Pure black
  bgSecondary: '#0a0a0a', // Very dark gray
  bgTertiary: '#141414', // Dark gray
  
  // Primary grays - pure neutral spectrum (no blue/brown tints)
  primary: {
    50: '#000000',   // Pure black
    100: '#0a0a0a',  // Very dark gray
    200: '#141414',  // Dark gray
    300: '#262626',  // Medium dark gray
    400: '#404040',  // Mid-dark gray
    500: '#737373',  // True mid gray
    600: '#a3a3a3',  // Light gray
    700: '#d4d4d4',  // Very light gray
    800: '#f5f5f5',  // Pale gray
    900: '#fafafa',  // Off-white
    950: '#ffffff'   // Pure white
  },
  
  // Secondary colors - subtle neutral gray accent (no blue tint)
  secondary: {
    50: '#0a0a0a',   // Very dark gray
    100: '#171717',  // Dark gray
    200: '#262626',  // Medium dark gray
    300: '#404040',  // Light dark gray
    400: '#525252',  // Medium gray
    500: '#737373',  // Main neutral gray accent
    600: '#a3a3a3',  // Light gray
    700: '#d4d4d4',  // Very light gray
    800: '#f5f5f5',  // Pale gray
    900: '#fafafa',  // Off-white
    950: '#ffffff'   // Pure white
  },
  
  // Success colors - clean green spectrum
  success: {
    50: '#0a0a0a',   // Dark bg for green
    100: '#14532d',  // Very dark green
    200: '#166534',  // Dark green
    300: '#15803d',  // Medium dark green
    400: '#16a34a',  // Bright green
    500: '#22c55e',  // Main bright green
    600: '#4ade80',  // Light green
    700: '#86efac',  // Very light green
    800: '#bbf7d0',  // Pale green
    900: '#dcfce7',  // Very pale green
    950: '#f0fdf4'   // Green tint
  },
  
  // Warning colors - clean orange spectrum
  warning: {
    50: '#0a0a0a',   // Dark bg for orange
    100: '#9a3412',  // Very dark orange
    200: '#c2410c',  // Dark orange
    300: '#ea580c',  // Medium orange
    400: '#f97316',  // Bright orange
    500: '#fb923c',  // Main bright orange
    600: '#fdba74',  // Light orange
    700: '#fed7aa',  // Very light orange
    800: '#ffedd5',  // Pale orange
    900: '#fff7ed',  // Very pale orange
    950: '#fffbeb'   // Orange tint
  },
  
  // Danger colors - clean red spectrum
  danger: {
    50: '#0a0a0a',   // Dark bg for red
    100: '#991b1b',  // Very dark red
    200: '#dc2626',  // Dark red
    300: '#ef4444',  // Medium red
    400: '#f87171',  // Bright red
    500: '#fca5a5',  // Main bright red
    600: '#fecaca',  // Light red
    700: '#fee2e2',  // Very light red
    800: '#fef2f2',  // Pale red
    900: '#fef7f7',  // Very pale red
    950: '#fffafa'   // Red tint
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


// Universal class mapping - works perfectly in both modes with single class names
export const getUniversalClasses = () => ({
  // Backgrounds - automatically perfect in both themes
  bgLight: 'bg-primary-100',     // Light: light cream, Dark: very dark gray
  bgMedium: 'bg-primary-200',    // Light: soft beige, Dark: dark gray
  bgDark: 'bg-primary-800',      // Light: deep charcoal, Dark: pale gray
  
  // Text - automatically perfect contrast in both themes
  textStrong: 'text-primary-900', // Light: very deep charcoal, Dark: off-white
  textNormal: 'text-primary-700', // Light: warm charcoal, Dark: very light gray
  textMuted: 'text-primary-500',  // Light: medium brown, Dark: mid gray
  
  // Interactive elements
  btnPrimary: 'bg-secondary-500 text-primary-50 hover:bg-secondary-600',
  btnSecondary: 'bg-primary-200 text-primary-800 hover:bg-primary-300',
  
  // Cards and containers
  cardBg: 'bg-primary-100 border border-primary-300',
  surfaceElevated: 'bg-primary-50 shadow-md',
  
  // Focus states
  focusRing: 'focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-primary-50'
});


// Generate CSS custom properties for the theme
export const generateCSSVariables = (isDark: boolean) => {
  const theme = createThemeColors(isDark);
  const cssVars: Record<string, string> = {};
  
  // Flatten the theme object into CSS custom properties
  Object.entries(theme).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (typeof subValue === 'string') {
          cssVars[`--color-${key}-${subKey}`] = subValue;
        } else if (typeof subValue === 'object' && subValue !== null) {
          Object.entries(subValue).forEach(([nestedKey, nestedValue]) => {
            cssVars[`--color-${key}-${subKey}-${nestedKey}`] = nestedValue as string;
          });
        }
      });
    } else {
      cssVars[`--color-${key}`] = value as string;
    }
  });
  
  return cssVars;
};


// Export theme types for TypeScript
export type ThemeColors = ReturnType<typeof createThemeColors>;
export type UniversalClasses = ReturnType<typeof getUniversalClasses>;


// Font recommendations for sophisticated design
export const warmFontConfig = {
  primary: "'Inter', 'Source Sans Pro', system-ui, -apple-system, sans-serif",
  heading: "'Lora', 'Merriweather', 'Source Serif Pro', Georgia, serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace"
};
