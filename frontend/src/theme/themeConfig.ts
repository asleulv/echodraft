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
  // Text colors - inverted to warm cream tones
  textPrimary: '#faf8f5', // Light cream (inverted from light textPrimary)
  textSecondary: '#f5f1ec', // Medium cream (inverted from light textSecondary)
  textMuted: '#ede7e0', // Muted cream (inverted from light textMuted)
  
  // Background colors - inverted to warm dark charcoals  
  bgPrimary: '#0f0d0a', // Deep warm charcoal (inverted from light bgPrimary)
  bgSecondary: '#1c1713', // Medium charcoal (inverted from light bgSecondary)
  bgTertiary: '#2c2018', // Lighter charcoal (inverted from light bgTertiary)
  
  // Primary grays - perfectly inverted spectrum
  primary: {
    50: '#0f0d0a',   // Darkest charcoal (inverted from light 950)
    100: '#1c1713',  // Very deep charcoal (inverted from light 900)
    200: '#2c2018',  // Deep charcoal (inverted from light 800)
    300: '#4a3d32',  // Warm charcoal (inverted from light 700)
    400: '#6b5b50',  // Dark taupe (inverted from light 600)
    500: '#8f7e6f',  // Medium brown (inverted from light 500)
    600: '#b8a896',  // Warm taupe (inverted from light 400)
    700: '#ddd4c8',  // Medium beige (inverted from light 300)
    800: '#ede7e0',  // Soft beige (inverted from light 200)
    900: '#f5f1ec',  // Light cream (inverted from light 100)
    950: '#faf8f5'   // Warm cream (inverted from light 50)
  },
  
  // Secondary colors - inverted sophisticated browns
  secondary: {
    50: '#201a15',   // Darkest brown (inverted from light 950)
    100: '#3d3127',  // Deep chocolate (inverted from light 900)
    200: '#493a2e',  // Very dark brown (inverted from light 800)
    300: '#5a4837',  // Darker brown (inverted from light 700)
    400: '#6f5a43',  // Deep brown (inverted from light 600)
    500: '#8b7355',  // Main sophisticated brown (same as light - center point)
    600: '#a8947d',  // Warm brown (inverted from light 400)
    700: '#cbbba8',  // Medium brown-gray (inverted from light 300)
    800: '#e1d7cb',  // Soft brown-gray (inverted from light 200)
    900: '#f0ebe5',  // Light warm gray (inverted from light 100)
    950: '#f8f6f3'   // Lightest warm gray (inverted from light 50)
  },
  
  // Success colors - inverted spectrum
  success: {
    50: '#0f240f',   // Darkest green (inverted from light 950)
    100: '#234123',  // Very dark green (inverted from light 900)
    200: '#274f27',  // Dark green (inverted from light 800)
    300: '#2d5f2d',  // Medium dark green (inverted from light 700)
    400: '#367d36',  // Medium green (inverted from light 600)
    500: '#449944',  // Main green (same as light - center point)
    600: '#5cb85c',  // Bright green (inverted from light 400)
    700: '#8fd18f',  // Light green (inverted from light 300)
    800: '#bce5bc',  // Very light green (inverted from light 200)
    900: '#dcf2dc',  // Pale green (inverted from light 100)
    950: '#f0f9f0'   // Lightest green (inverted from light 50)
  },
  
  // Warning colors - inverted spectrum
  warning: {
    50: '#451a03',   // Darkest orange (inverted from light 950)
    100: '#78350f',  // Very dark orange (inverted from light 900)
    200: '#92400e',  // Dark orange (inverted from light 800)
    300: '#b45309',  // Medium dark orange (inverted from light 700)
    400: '#d97706',  // Medium orange (inverted from light 600)
    500: '#f59e0b',  // Main orange (same as light - center point)
    600: '#fbbf24',  // Bright orange (inverted from light 400)
    700: '#fcd34d',  // Light orange (inverted from light 300)
    800: '#fde68a',  // Very light orange (inverted from light 200)
    900: '#fef3c7',  // Pale orange (inverted from light 100)
    950: '#fffbeb'   // Lightest orange (inverted from light 50)
  },
  
  // Danger colors - inverted spectrum
  danger: {
    50: '#450a0a',   // Darkest red (inverted from light 950)
    100: '#7f1d1d',  // Very dark red (inverted from light 900)
    200: '#991b1b',  // Dark red (inverted from light 800)
    300: '#b91c1c',  // Medium dark red (inverted from light 700)
    400: '#dc2626',  // Medium red (inverted from light 600)
    500: '#ef4444',  // Main red (same as light - center point)
    600: '#f87171',  // Bright red (inverted from light 400)
    700: '#fca5a5',  // Light red (inverted from light 300)
    800: '#fecaca',  // Very light red (inverted from light 200)
    900: '#fee2e2',  // Pale red (inverted from light 100)
    950: '#fef2f2'   // Lightest red (inverted from light 50)
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
  bgLight: 'bg-primary-100',     // Light: light cream, Dark: deep charcoal  
  bgMedium: 'bg-primary-200',    // Light: soft beige, Dark: charcoal
  bgDark: 'bg-primary-800',      // Light: deep charcoal, Dark: soft beige
  
  // Text - automatically perfect contrast in both themes
  textStrong: 'text-primary-900', // Light: very deep charcoal, Dark: light cream
  textNormal: 'text-primary-700', // Light: warm charcoal, Dark: medium beige
  textMuted: 'text-primary-500',  // Light: medium brown, Dark: medium brown
  
  // Interactive elements
  btnPrimary: 'bg-secondary-600 text-primary-50 hover:bg-secondary-700',
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
