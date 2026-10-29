import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'sage' | 'slate' | 'stone' | 'lavender' | 'clay' | 'dark' | 'clinical' | 'nordic' | 'sand' | 'rose';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  dotColor: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'sage',
    name: 'Calm Sage',
    description: 'Soothing eucalyptus and botanical tones for clinical calm',
    dotColor: '#3d6052',
    isDark: false,
  },
  {
    id: 'slate',
    name: 'Coastal Slate',
    description: 'Serene sea-mist slate blue for focused, tranquil work',
    dotColor: '#3c5667',
    isDark: false,
  },
  {
    id: 'stone',
    name: 'Warm Stone',
    description: 'Natural linen and soft earthy taupe for private therapy',
    dotColor: '#5c4f45',
    isDark: false,
  },
  {
    id: 'lavender',
    name: 'Muted Heather',
    description: 'Gentle twilight lavender-slate for psychological ease',
    dotColor: '#524a63',
    isDark: false,
  },
  {
    id: 'clay',
    name: 'Earthy Clay',
    description: 'Warm cedar and terracotta for grounded humanistic care',
    dotColor: '#684e50',
    isDark: false,
  },
  {
    id: 'dark',
    name: 'Obsidian Calm',
    description: 'Restful nocturnal mode with muted spruce accents',
    dotColor: '#4a786d',
    isDark: true,
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  themeOptions: ThemeOption[];
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('mindwell_active_theme');
      // Normalize legacy IDs
      if (saved === 'clinical') return 'sage';
      if (saved === 'nordic') return 'slate';
      if (saved === 'sand') return 'stone';
      if (saved === 'rose') return 'clay';
      if (saved && THEME_OPTIONS.some(t => t.id === saved)) {
        return saved as AppTheme;
      }
      const legacyMode = localStorage.getItem('mindwell_theme_mode');
      if (legacyMode === 'dark') return 'dark';
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      // fallback
    }
    return 'sage';
  });

  const currentOption = THEME_OPTIONS.find(t => t.id === theme) || THEME_OPTIONS[0];
  const isDark = currentOption.isDark || theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    
    // Set data-theme attribute
    root.setAttribute('data-theme', theme);

    // Maintain .dark class for Tailwind dark variant support
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('mindwell_active_theme', theme);
      localStorage.setItem('mindwell_theme_mode', isDark ? 'dark' : 'light');
    } catch (e) {
      // ignore
    }
  }, [theme, isDark]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const ids: AppTheme[] = ['sage', 'slate', 'stone', 'lavender', 'clay', 'dark'];
    setThemeState(prev => {
      const normalized = prev === 'clinical' ? 'sage' : prev === 'nordic' ? 'slate' : prev === 'sand' ? 'stone' : prev === 'rose' ? 'clay' : prev;
      const idx = ids.indexOf(normalized as any);
      const nextIdx = (idx + 1) % ids.length;
      return ids[nextIdx];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themeOptions: THEME_OPTIONS, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
