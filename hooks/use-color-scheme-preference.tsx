import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';

const COLOR_SCHEME_STORAGE_KEY = '@app_color_scheme_preference';
export type ColorSchemePreference = 'system' | 'light' | 'dark';

interface ColorSchemeContextType {
  preference: ColorSchemePreference;
  setPreference: (pref: ColorSchemePreference) => Promise<void>;
  effectiveColorScheme: 'light' | 'dark';
}

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ColorSchemePreference>('system');
  const systemColorScheme = useRNColorScheme();

  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
      if (savedPreference === 'light' || savedPreference === 'dark' || savedPreference === 'system') {
        setPreferenceState(savedPreference as ColorSchemePreference);
      }
    } catch (error) {
      console.error('Error loading color scheme preference:', error);
    }
  };

  const setPreference = async (pref: ColorSchemePreference) => {
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_STORAGE_KEY, pref);
      setPreferenceState(pref);
    } catch (error) {
      console.error('Error saving color scheme preference:', error);
    }
  };

  // Calculate effective color scheme
  const effectiveColorScheme: 'light' | 'dark' = 
    preference === 'system' 
      ? (systemColorScheme ?? 'light')
      : preference;

  return (
    <ColorSchemeContext.Provider value={{ preference, setPreference, effectiveColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorSchemePreference() {
  const context = useContext(ColorSchemeContext);
  if (context === undefined) {
    throw new Error('useColorSchemePreference must be used within a ColorSchemeProvider');
  }
  return context;
}

// Hook that returns the effective color scheme (for backward compatibility)
export function useColorScheme(): 'light' | 'dark' | null {
  const { effectiveColorScheme } = useColorSchemePreference();
  return effectiveColorScheme;
}
