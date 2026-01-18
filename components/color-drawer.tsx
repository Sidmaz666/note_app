import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorPicker, NOTE_COLORS } from './color-picker';

interface ColorDrawerProps {
  visible: boolean;
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
  onClose: () => void;
}

export function ColorDrawer({ visible, selectedColor, onColorSelect, onClose }: ColorDrawerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);

  const handleColorSelect = (color: string | null) => {
    onColorSelect(color);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.drawer} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Choose Color</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
            <ColorPicker selectedColor={selectedColor} onColorSelect={handleColorSelect} />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: isDark ? '#374151' : '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
});
