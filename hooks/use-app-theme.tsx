import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from './use-color-scheme-preference';

const THEME_STORAGE_KEY = '@app_theme_color';
const DEFAULT_THEME_COLOR = '#3b82f6';

interface AppThemeContextType {
  themeColor: string;
  setThemeColor: (color: string) => Promise<void>;
  getBackgroundColor: () => string;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Blend two colors
function blendColors(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  
  return rgbToHex(r, g, b);
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<string>(DEFAULT_THEME_COLOR);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadThemeColor();
  }, []);

  const loadThemeColor = async () => {
    try {
      const savedColor = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedColor) {
        setThemeColorState(savedColor);
      }
    } catch (error) {
      console.error('Error loading app theme:', error);
    }
  };

  const setThemeColor = async (color: string) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, color);
      setThemeColorState(color);
    } catch (error) {
      console.error('Error saving app theme:', error);
    }
  };

  // Generate background color based on theme color and mode
  const getBackgroundColor = (): string => {
    if (isDark) {
      // Pure black for dark mode
      return '#000000';
    } else {
      // For light mode, blend theme color (5%) with light gray background (95%)
      return blendColors('#f9fafb', themeColor, 0.05);
    }
  };

  return (
    <AppThemeContext.Provider value={{ themeColor, setThemeColor, getBackgroundColor }}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}
