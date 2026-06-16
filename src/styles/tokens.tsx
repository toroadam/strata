import React from 'react'

export const colors = {
  toroRed: '#D71920',
  toroRedDark: '#A80F16',
  charcoal: '#1F2328',
  black: '#111111',
  gray900: '#202124',
  gray700: '#4B5563',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  white: '#FFFFFF',
  success: '#15803D',
  warning: '#B45309',
  error: '#B91C1C',
  mapBlue: '#2563EB'
}

interface ThemeContextType {
  colors: typeof colors
}

const ThemeContext = React.createContext<ThemeContextType>({ colors })

export const useTheme = () => React.useContext(ThemeContext)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeContext.Provider value={{ colors }}>{children}</ThemeContext.Provider>
}
