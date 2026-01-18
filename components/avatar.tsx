import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { User } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  user: User | null;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

const SIZE_MAP = {
  small: 32,
  medium: 40,
  large: 56,
};

// Generate a consistent color based on user ID or email
function getAvatarColor(identifier: string | null): string {
  if (!identifier) return '#6b7280';
  
  const colors = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Orange
    '#10b981', // Green
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#6366f1', // Indigo
  ];
  
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get user initials
function getInitials(user: User | null): string {
  if (!user) return 'G';
  
  // Try to get name from user metadata
  const fullName = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   '';
  
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }
  
  // Fallback to email initials
  if (user.email) {
    const emailParts = user.email.split('@')[0];
    if (emailParts.length >= 2) {
      return emailParts.substring(0, 2).toUpperCase();
    }
    return emailParts[0].toUpperCase();
  }
  
  return 'U';
}

export function Avatar({ user, size = 'medium', onPress }: AvatarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const avatarSize = SIZE_MAP[size];
  const initials = getInitials(user);
  const backgroundColor = getAvatarColor(user?.id || user?.email || null);
  const styles = getStyles(isDark, avatarSize, backgroundColor);

  const content = (
    <View style={styles.container}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const getStyles = (isDark: boolean, size: number, backgroundColor: string) => StyleSheet.create({
  container: {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDark ? '#374151' : '#e5e7eb',
  },
  initials: {
    color: '#ffffff',
    fontSize: size * 0.4,
    fontWeight: '600',
  },
});
