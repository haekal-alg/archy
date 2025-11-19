// Modern Dark Theme Configuration for Archy
// This file contains all color tokens and styling variables

export const darkTheme = {
  // Background Colors
  background: {
    canvas: '#1a1f2e',           // Lighter dark blue for main canvas (easier on eyes)
    primary: '#151923',          // Main dark background
    secondary: '#1e2433',        // Slightly lighter for panels
    tertiary: '#252d3f',         // Cards and inputs
    elevated: '#2a3347',         // Elevated elements
    hover: '#303948',            // Hover states
    active: '#3a4556',           // Active states
  },

  // Text Colors
  text: {
    primary: '#e8ecf4',          // Main text
    secondary: '#b4bcc9',        // Secondary text
    tertiary: '#8892a6',         // Muted text
    disabled: '#5a6375',         // Disabled state
    inverted: '#0a0e1a',         // Text on light backgrounds
  },

  // Border Colors
  border: {
    subtle: '#2d3548',           // Subtle borders (slightly lighter for grid visibility)
    default: '#3a4556',          // Default borders
    strong: '#4a5568',           // Strong borders
    focus: '#4d7cfe',            // Focus state
  },

  // Accent Colors (vibrant for dark backgrounds)
  accent: {
    blue: '#4d7cfe',             // Primary blue
    blueLight: '#6b96ff',        // Lighter blue
    blueDark: '#3461e8',         // Darker blue
    green: '#3dd68c',            // Success green
    greenLight: '#5de4a5',       // Lighter green
    greenDark: '#2ab871',        // Darker green
    red: '#ff5c5c',              // Error/danger red
    redLight: '#ff7878',         // Lighter red
    redDark: '#e84545',          // Darker red
    orange: '#ffab40',           // Warning orange
    orangeLight: '#ffc164',      // Lighter orange
    orangeDark: '#f59518',       // Darker orange
    purple: '#9d5cff',           // Purple accent
    purpleLight: '#b380ff',      // Lighter purple
    purpleDark: '#8040e8',       // Darker purple
    pink: '#ff5c9d',             // Pink accent
    teal: '#3dd6d6',             // Teal accent
    yellow: '#ffd93d',           // Yellow accent
  },

  // Device Type Colors (adjusted for dark theme)
  device: {
    router: '#4d7cfe',           // Blue
    server: '#3dd68c',           // Green
    firewall: '#ff5c5c',         // Red
    windows: '#00d4ff',          // Cyan
    linux: '#ffab40',            // Orange
    switch: '#7b8fa3',           // Blue-gray
    cloud: '#6b96ff',            // Light blue
    database: '#9d5cff',         // Purple
    laptop: '#8892a6',           // Gray
    attacker: '#ff5c9d',         // Pink
    endpoint: '#3dd6d6',         // Teal
  },

  // Preset Color Swatches (for style panel)
  swatches: {
    blue: '#4d7cfe',
    green: '#3dd68c',
    red: '#ff5c5c',
    orange: '#ffab40',
    purple: '#9d5cff',
    pink: '#ff5c9d',
    teal: '#3dd6d6',
    gray: '#8892a6',
  },

  // Shadows (lighter for dark theme)
  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.5)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.5)',
    md: '0 4px 8px rgba(0, 0, 0, 0.6)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.7)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.8)',
    glow: '0 0 20px rgba(77, 124, 254, 0.3)',
    glowStrong: '0 0 30px rgba(77, 124, 254, 0.5)',
  },

  // Gradients
  gradient: {
    nodeDefault: 'linear-gradient(135deg, #2a3347 0%, #1e2433 100%)',
    nodeHover: 'linear-gradient(135deg, #303948 0%, #252d3f 100%)',
    nodeSelected: 'linear-gradient(135deg, #3a4556 0%, #2a3347 100%)',
    panel: 'linear-gradient(180deg, #1e2433 0%, #151923 100%)',
    button: 'linear-gradient(135deg, #4d7cfe 0%, #3461e8 100%)',
    buttonHover: 'linear-gradient(135deg, #6b96ff 0%, #4d7cfe 100%)',
  },

  // Border Radius
  radius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    xxl: '16px',
    full: '9999px',
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '20px',
    xxxl: '24px',
  },

  // Font Sizes
  fontSize: {
    xs: '10px',
    sm: '11px',
    md: '13px',
    base: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '36px',
  },

  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Transitions
  transition: {
    fast: 'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },

  // Z-index
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
  },
};

// Export type for TypeScript autocomplete
export type Theme = typeof darkTheme;

// Helper function to create rgba colors
export const rgba = (color: string, opacity: number): string => {
  // Simple hex to rgba converter
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Default export
export default darkTheme;
