import React from 'react'

/**
 * Toro Strata design tokens.
 * Brand red (#D71920) paired with an Airbnb-grade neutral palette:
 * generous whitespace, soft shadows, refined type. All legacy keys are
 * preserved for backward compatibility.
 */
export const colors = {
  // Brand
  toroRed: '#D71920',
  toroRedHover: '#B5141A',
  toroRedDark: '#8E0F14',
  toroRedTint: '#FDECEC',

  // Ink / text
  charcoal: '#1F2328',
  ink: '#222222',
  body: '#484848',
  black: '#111111',
  gray900: '#202124',
  gray700: '#4B5563',
  gray500: '#717171',
  gray400: '#9CA3AF',
  gray300: '#DDDDDD',
  gray200: '#EBEBEB',
  gray100: '#F3F4F6',
  gray50: '#F7F7F7',
  white: '#FFFFFF',
  surface: '#FFFFFF',
  canvas: '#F7F7F7',

  // Status
  success: '#0F7B3F',
  successTint: '#E7F6EC',
  warning: '#B45309',
  warningTint: '#FEF3CD',
  error: '#C0291F',
  errorTint: '#FDECEC',
  info: '#2563EB',
  infoTint: '#E7F0FE',
  mapBlue: '#2563EB',
}

export const space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 56, '6xl': 72,
}

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, '2xl': 28, pill: 999,
}

export const shadow = {
  xs: '0 1px 2px rgba(0,0,0,0.06)',
  sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.12)',
  xl: '0 16px 40px rgba(0,0,0,0.16)',
  ring: '0 0 0 4px rgba(215,25,32,0.14)',
}

export const font = {
  sans: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
}

export const theme = { colors, space, radius, shadow, font }
export type Theme = typeof theme

interface ThemeContextType {
  colors: typeof colors
  space: typeof space
  radius: typeof radius
  shadow: typeof shadow
  font: typeof font
}

const ThemeContext = React.createContext<ThemeContextType>(theme)

export const useTheme = () => React.useContext(ThemeContext)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
