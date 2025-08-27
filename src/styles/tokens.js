// src/styles/tokens.js - Updated for unified design system
export const tokens = {
  // Typography Scale - Unified across all components
  typography: {
    fontFamily: {
      primary: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
    },
    fontSize: {
      xs: '0.75rem',    // 12px - Small labels, captions
      sm: '0.875rem',   // 14px - Body text, form inputs  
      base: '1rem',     // 16px - Primary body text
      lg: '1.125rem',   // 18px - Large body text
      xl: '1.25rem',    // 20px - Small headings
      '2xl': '1.5rem',  // 24px - Medium headings
      '3xl': '1.875rem', // 30px - Large headings
      '4xl': '2.25rem', // 36px - Page titles
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },

  // Unified spacing system
  spacing: {
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
  },

  // Theme colors - cleaner and more consistent
  colors: {
    primary: {
      tsa: '#6b5ca5',
      plew: '#2b55a1',
      maths: '#3f72af',
    },
    secondary: {
      tsa: '#221368',
      plew: '#1a4490',
      maths: '#2d4059',
    },
    background: {
      tsa: '#f8f6fc',
      plew: '#f6f8fc',
      maths: '#f5f8ff',
      light: '#f9fafb',
      white: '#ffffff',
    },
    surface: {
      tsa: '#f0e7f8',
      plew: '#e8f1fc',
      maths: '#dce5ff',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // Consistent border radius
  borderRadius: {
    sm: '0.25rem',  // 4px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    full: '9999px',
  },

  // Unified shadow system
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },

  // Smooth transitions
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },

  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Helper functions to get theme-specific values
export const getThemeColor = (theme, colorType = 'primary') => {
  const themeMap = {
    'tsa-theme': 'tsa',
    'alternate-theme': 'plew',
    'plew-theme': 'plew',
    'maths-theme': 'maths',
    'tsa': 'tsa',
    'plew': 'plew',
    'maths': 'maths',
  };

  const themeKey = themeMap[theme] || 'tsa';
  return tokens.colors[colorType]?.[themeKey] || tokens.colors.primary.tsa;
};

export const getThemeBackground = (theme) => {
  const themeMap = {
    'tsa-theme': 'tsa',
    'alternate-theme': 'plew',
    'plew-theme': 'plew', 
    'maths-theme': 'maths',
    'tsa': 'tsa',
    'plew': 'plew',
    'maths': 'maths',
  };

  const themeKey = themeMap[theme] || 'tsa';
  return tokens.colors.background[themeKey] || tokens.colors.background.tsa;
};

export const getThemeSurface = (theme) => {
  const themeMap = {
    'tsa-theme': 'tsa',
    'alternate-theme': 'plew',
    'plew-theme': 'plew',
    'maths-theme': 'maths',
    'tsa': 'tsa',
    'plew': 'plew', 
    'maths': 'maths',
  };

  const themeKey = themeMap[theme] || 'tsa';
  return tokens.colors.surface[themeKey] || tokens.colors.surface.tsa;
};

// CSS custom properties generator for React components
export const generateCSSVariables = (theme) => {
  const themeKey = {
    'tsa-theme': 'tsa',
    'alternate-theme': 'plew',
    'plew-theme': 'plew',
    'maths-theme': 'maths',
    'tsa': 'tsa',
    'plew': 'plew',
    'maths': 'maths',
  }[theme] || 'tsa';

  return {
    '--color-primary': tokens.colors.primary[themeKey],
    '--color-secondary': tokens.colors.secondary[themeKey],
    '--color-background': tokens.colors.background[themeKey],
    '--color-surface': tokens.colors.surface[themeKey],
    '--color-success': tokens.colors.semantic.success,
    '--color-warning': tokens.colors.semantic.warning,
    '--color-error': tokens.colors.semantic.error,
    '--color-info': tokens.colors.semantic.info,
    '--font-family-primary': tokens.typography.fontFamily.primary,
    '--font-size-base': tokens.typography.fontSize.base,
    '--spacing-base': tokens.spacing[4],
    '--border-radius-base': tokens.borderRadius.md,
    '--shadow-base': tokens.shadows.md,
    '--transition-base': tokens.transitions.normal,
  };
};

// Component style generators
export const buttonStyles = {
  base: {
    fontFamily: tokens.typography.fontFamily.primary,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
    borderRadius: tokens.borderRadius.md,
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: tokens.transitions.fast,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    lineHeight: '1',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  sizes: {
    sm: {
      fontSize: tokens.typography.fontSize.xs,
      padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
    },
    md: {
      fontSize: tokens.typography.fontSize.sm,
      padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
    },
    lg: {
      fontSize: tokens.typography.fontSize.base,
      padding: `${tokens.spacing[4]} ${tokens.spacing[8]}`,
    },
  },
};

export const cardStyles = {
  base: {
    backgroundColor: tokens.colors.background.white,
    borderRadius: tokens.borderRadius.lg,
    boxShadow: tokens.shadows.sm,
    border: `1px solid ${tokens.colors.neutral[200]}`,
    overflow: 'hidden',
    transition: tokens.transitions.normal,
  },
  hover: {
    boxShadow: tokens.shadows.md,
    transform: 'translateY(-2px)',
  },
  header: {
    padding: tokens.spacing[6],
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
    backgroundColor: tokens.colors.neutral[50],
  },
  body: {
    padding: tokens.spacing[6],
  },
  footer: {
    padding: tokens.spacing[6],
    borderTop: `1px solid ${tokens.colors.neutral[200]}`,
    backgroundColor: tokens.colors.neutral[50],
  },
};

export const inputStyles = {
  base: {
    fontFamily: tokens.typography.fontFamily.primary,
    fontSize: tokens.typography.fontSize.sm,
    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
    border: `1px solid ${tokens.colors.neutral[300]}`,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.background.white,
    transition: tokens.transitions.fast,
    width: '100%',
  },
  focus: {
    outline: 'none',
    borderColor: tokens.colors.semantic.info,
    boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.1)`,
  },
};

// Utility functions for consistent spacing
export const spacing = {
  xs: tokens.spacing[1],
  sm: tokens.spacing[2],
  md: tokens.spacing[4],
  lg: tokens.spacing[6],
  xl: tokens.spacing[8],
  xxl: tokens.spacing[12],
};

// Typography utilities
export const typography = {
  h1: {
    fontSize: tokens.typography.fontSize['4xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    lineHeight: tokens.typography.lineHeight.tight,
    marginBottom: tokens.spacing[6],
  },
  h2: {
    fontSize: tokens.typography.fontSize['3xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    lineHeight: tokens.typography.lineHeight.tight,
    marginBottom: tokens.spacing[5],
  },
  h3: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    lineHeight: tokens.typography.lineHeight.tight,
    marginBottom: tokens.spacing[4],
  },
  body: {
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.lineHeight.relaxed,
    marginBottom: tokens.spacing[4],
  },
  small: {
    fontSize: tokens.typography.fontSize.sm,
    lineHeight: tokens.typography.lineHeight.normal,
  },
};

// Layout utilities
export const layout = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `0 ${tokens.spacing[6]}`,
  },
  containerSm: {
    maxWidth: '640px',
  },
  containerMd: {
    maxWidth: '768px',
  },
  containerLg: {
    maxWidth: '1024px',
  },
  section: {
    padding: `${tokens.spacing[16]} 0`,
  },
  sectionSm: {
    padding: `${tokens.spacing[8]} 0`,
  },
  sectionLg: {
    padding: `${tokens.spacing[20]} 0`,
  },
};

export default tokens;