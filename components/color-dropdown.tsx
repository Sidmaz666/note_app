import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { ColorPicker, NOTE_COLORS } from './color-picker';
import { getContrastingTextColor } from '@/lib/utils/color-utils';

interface ColorDropdownProps {
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
  triggerButton: React.ReactNode;
}

export function ColorDropdown({ selectedColor, onColorSelect, triggerButton }: ColorDropdownProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [visible, setVisible] = useState(false);
  const styles = getStyles(isDark);

  const handleColorSelect = (color: string | null) => {
    onColorSelect(color);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)}>
        {triggerButton}
      </TouchableOpacity>
      
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdown} onStartShouldSetResponder={() => true}>
            <View style={styles.dropdownHeader}>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={isDark ? '#ffffff' : '#111827'} />
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownContent}>
              <ColorPicker selectedColor={selectedColor} onColorSelect={handleColorSelect} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: isDark ? '#000000' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    minWidth: 280,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: isDark ? '#1a1a1a' : '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  closeButton: {
    padding: 4,
  },
  dropdownContent: {
    paddingVertical: 8,
  },
});
