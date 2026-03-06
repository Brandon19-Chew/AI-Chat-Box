import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizeScale = 'small' | 'medium' | 'large' | 'extra-large';

interface FontSizeContextType {
  fontSizeScale: FontSizeScale;
  setFontSizeScale: (scale: FontSizeScale) => Promise<void>;
  fontSizeMultiplier: number;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FONT_SIZE_MULTIPLIERS: Record<FontSizeScale, number> = {
  'small': 0.85,
  'medium': 1,
  'large': 1.15,
  'extra-large': 1.3,
};

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeScale, setFontSizeScaleState] = useState<FontSizeScale>('medium');
  const [isLoading, setIsLoading] = useState(true);

  // Load font size preference on mount
  useEffect(() => {
    loadFontSizePreference();
  }, []);

  const loadFontSizePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('fontSizeScale');
      if (saved && (saved === 'small' || saved === 'medium' || saved === 'large' || saved === 'extra-large')) {
        setFontSizeScaleState(saved as FontSizeScale);
      }
    } catch (error) {
      console.error('Failed to load font size preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setFontSizeScale = async (scale: FontSizeScale) => {
    try {
      setFontSizeScaleState(scale);
      await AsyncStorage.setItem('fontSizeScale', scale);
    } catch (error) {
      console.error('Failed to save font size preference:', error);
    }
  };

  const fontSizeMultiplier = FONT_SIZE_MULTIPLIERS[fontSizeScale];

  return (
    <FontSizeContext.Provider value={{ fontSizeScale, setFontSizeScale, fontSizeMultiplier }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within FontSizeProvider');
  }
  return context;
}
