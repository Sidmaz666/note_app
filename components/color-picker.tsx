import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { getContrastingTextColor } from '@/lib/utils/color-utils';

// Softer, more pastel colors for notes
export const NOTE_COLORS = [
  null, // Default (no color)
  '#FFF9C4', // Soft Yellow
  '#FFE0B2', // Soft Orange
  '#F8BBD0', // Soft Pink
  '#E1BEE7', // Soft Purple
  '#BBDEFB', // Soft Blue
  '#C8E6C9', // Soft Green
  '#FFCDD2', // Soft Red
  '#F5F5F5', // Soft Gray
];

interface ColorPickerProps {
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
}

export function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { themeColor } = useAppTheme();
  const styles = getStyles(isDark, themeColor);

  return (
    <View style={styles.container}>
      {NOTE_COLORS.map((color, index) => {
        const isSelected = color === selectedColor;
        // Use contrast calculation for checkmark color
        const checkmarkColor = getContrastingTextColor(color, isDark);
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              color ? { backgroundColor: color } : styles.defaultColor,
              isSelected && styles.selectedColor,
            ]}
            onPress={() => onColorSelect(color)}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={16} color={checkmarkColor} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getStyles = (isDark: boolean, themeColor: string) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: isDark ? '#374151' : '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultColor: {
    backgroundColor: isDark ? '#000000' : '#ffffff',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: themeColor,
  },
});
