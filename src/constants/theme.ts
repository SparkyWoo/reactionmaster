export const theme = {
  colors: {
    primary: {
      default: '#2D7FF9',
      light: '#5599FF',
      dark: '#1666E6',
      rgb: '45, 127, 249',
    },
    secondary: {
      default: '#6C47FF',
      light: '#8B6AFF',
      dark: '#5535E6',
      rgb: '108, 71, 255',
    },
    background: {
      primary: '#121214',
      secondary: '#1A1A1F',
      elevated: '#222228',
      dark: '#0A0A0B',
    },
    surface: {
      1: 'rgba(255, 255, 255, 0.03)',
      2: 'rgba(255, 255, 255, 0.05)',
      3: 'rgba(255, 255, 255, 0.08)',
      4: 'rgba(255, 255, 255, 0.12)',
    },
    text: {
      primary: {
        dark: '#FFFFFF',
        light: '#000000',
      },
      secondary: {
        dark: '#B4B4B4',
        light: '#666666',
      },
      tertiary: {
        dark: '#888888',
        light: '#888888',
      },
    },
    success: {
      default: '#22C55E',
      light: '#4ADE80',
      dark: '#16A34A',
    },
    error: {
      default: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    border: {
      dark: 'rgba(255, 255, 255, 0.1)',
      light: 'rgba(0, 0, 0, 0.1)',
    },
    shadow: '#000000',
  },
  typography: {
    fonts: {
      primary: 'System',  // System font for native feel
      secondary: 'System',
    },
    sizes: {
      xs: 12,      // Fine print, captions
      sm: 14,      // Secondary text
      md: 16,      // Body text
      lg: 19,      // Important info
      xl: 23,      // Subtitles
      xxl: 28,     // Section headers
      '2xl': 34,   // Major headers
      '3xl': 41,   // Hero text
      '4xl': 49,   // Display text
    },
    weights: {
      thin: '100',
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    lineHeights: {
      tight: 1.1,    // Headlines
      normal: 1.3,   // Body text
      relaxed: 1.5,  // Readable paragraphs
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      button: 1,
    }
  },
  spacing: {
    '2xs': 4,    // Minimal separation
    xs: 8,       // Tight spacing
    sm: 12,      // Compact elements
    md: 16,      // Standard spacing
    lg: 24,      // Comfortable spacing
    xl: 32,      // Section spacing
    '2xl': 48,   // Major sections
    '3xl': 64,   // Screen margins
    
    component: {
      button: {
        height: 56,
        paddingX: 24,
        gap: 12,
      },
      container: {
        paddingX: 24,
        paddingY: 32,
      },
      card: {
        padding: 20,
        gap: 16,
      }
    }
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  animation: {
    spring: {
      gentle: {
        damping: 15,
        stiffness: 150,
        mass: 1,
      },
      bouncy: {
        damping: 10,
        stiffness: 200,
        mass: 1,
      },
      snappy: {
        damping: 20,
        stiffness: 250,
        mass: 1,
      },
      default: {
        damping: 15,
        stiffness: 200,
        mass: 1,
      }
    },
    timing: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    scale: {
      press: 0.97,
      tap: 0.95,
    }
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    }
  },
} as const;

export type Theme = typeof theme; 