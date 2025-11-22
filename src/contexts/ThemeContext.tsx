'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type Theme =
  // Light themes
  | 'light' | 'cupcake' | 'bumblebee' | 'emerald' | 'corporate' | 'retro'
  | 'valentine' | 'garden' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe'
  | 'cmyk' | 'autumn' | 'acid' | 'lemonade' | 'winter' | 'nord'
  | 'sunset' | 'caramellatte' | 'silk'
  // Dark themes
  | 'dark' | 'synthwave' | 'cyberpunk' | 'halloween' | 'forest' | 'aqua'
  | 'black' | 'luxury' | 'dracula' | 'business' | 'night' | 'coffee'
  | 'dim' | 'abyss';

export const lightThemes: Theme[] = [
  'light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'retro',
  'valentine', 'garden', 'lofi', 'pastel', 'fantasy', 'wireframe',
  'cmyk', 'autumn', 'acid', 'lemonade', 'winter', 'nord',
  'sunset', 'caramellatte', 'silk'
];

export const darkThemes: Theme[] = [
  'dark', 'synthwave', 'cyberpunk', 'halloween', 'forest', 'aqua',
  'black', 'luxury', 'dracula', 'business', 'night', 'coffee',
  'dim', 'abyss'
];

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
  const [theme, setThemeState] = useState<Theme>('light');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage after component mounts (client-side only)
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && [...lightThemes, ...darkThemes].includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    setIsMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isMounted]);

  const value = {
    theme,
    setTheme,
    isMounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
