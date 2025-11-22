'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useHasMounted } from '@/hooks/useHasMounted';

export type Theme =
  // Light themes
  | 'light' | 'cupcake' | 'bumblebee' | 'emerald' | 'corporate' | 'retro'
  | 'valentine' | 'garden' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe'
  | 'cmyk' | 'autumn' | 'acid' | 'lemonade' | 'winter' | 'nord'
  | 'caramellatte' | 'silk'
  // Dark themes
  | 'dark' | 'synthwave' | 'halloween' | 'forest'
  | 'black' | 'luxury' | 'dracula' | 'business' | 'night' | 'coffee'
  | 'dim' | 'abyss';

export const lightThemes: Theme[] = [
  'light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'retro',
  'valentine', 'garden', 'lofi', 'pastel', 'fantasy', 'wireframe',
  'cmyk', 'autumn', 'acid', 'lemonade', 'winter', 'nord',
  'caramellatte', 'silk',
];

export const darkThemes: Theme[] = [
  'dark', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula',
  'business', 'night', 'coffee', 'dim', 'abyss',
];

const allThemes: string[] = [...lightThemes, ...darkThemes];

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme') as Theme;
  return saved && allThemes.includes(saved) ? saved : 'light';
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isMounted: boolean;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  isMounted: false,
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const isMounted = useHasMounted();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}
