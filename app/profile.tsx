import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useNotes } from '@/hooks/use-notes';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useColorSchemePreference, ColorSchemePreference } from '@/hooks/use-color-scheme-preference';
import { Avatar } from '@/components/avatar';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle, signOut } from '@/lib/supabase/auth';
import { getLocalNotes } from '@/lib/storage/notes';

const APP_THEME_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Orange
  '#10b981', // Green
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notes } = useNotes();
  const { themeColor, setThemeColor, getBackgroundColor } = useAppTheme();
  const { preference, setPreference, effectiveColorScheme } = useColorSchemePreference();
  const isDark = effectiveColorScheme === 'dark';
  const backgroundColor = getBackgroundColor();
  const styles = getStyles(isDark, backgroundColor, themeColor);
  
  const [stats, setStats] = useState({
    totalNotes: 0,
    syncedNotes: 0,
    lastSyncTime: null as string | null,
  });
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    loadStats();
  }, [notes, user]);

  const loadStats = async () => {
    if (!user) {
      const localNotes = await getLocalNotes();
      setStats({
        totalNotes: localNotes.length,
        syncedNotes: 0,
        lastSyncTime: null,
      });
      return;
    }

    const userNotes = notes.filter(n => n.user_id === user.id);
    const syncedNotes = userNotes.filter(n => n.synced_at && !n.isDirty);
    
    // Get last sync time
    let lastSync: string | null = null;
    if (syncedNotes.length > 0) {
      const syncTimes = syncedNotes
        .map(n => n.synced_at)
        .filter((t): t is string => t !== null)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      if (syncTimes.length > 0) {
        lastSync = syncTimes[0];
      }
    }

    setStats({
      totalNotes: userNotes.length,
      syncedNotes: syncedNotes.length,
      lastSyncTime: lastSync,
    });
  };

  const handleThemeColorSelect = async (color: string) => {
    await setThemeColor(color);
  };

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
      // Sign in will redirect automatically via OAuth callback, no need to navigate
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest User';
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User';
  };

  const getUserEmail = () => {
    return user?.email || 'Not signed in';
  };

  const getAccountCreationDate = () => {
    if (!user?.created_at) return 'N/A';
    return new Date(user.created_at).toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            setTimeout(() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }, 50);
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Sign In Section - Show at top if not signed in */}
        {!user && (
          <View style={styles.section}>
            <View style={styles.signInSection}>
              <Ionicons name="cloud-outline" size={48} color={themeColor} />
              <Text style={styles.signInTitle}>Sync Your Notes</Text>
              <Text style={styles.signInDescription}>
                Sign in with Google to sync your notes across all your devices
              </Text>
              <TouchableOpacity 
                style={styles.signInButtonTop} 
                onPress={handleGoogleSignIn}
                disabled={signingIn}
              >
                {signingIn ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#ffffff" />
                    <Text style={styles.signInButtonTopText}>Login with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* User Info Section */}
        {user && (
          <View style={styles.section}>
            <View style={styles.userInfo}>
              <Avatar user={user} size="large" />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{getUserDisplayName()}</Text>
                <Text style={styles.userEmail}>{getUserEmail()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalNotes}</Text>
                <Text style={styles.statLabel}>Total Notes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.syncedNotes}</Text>
                <Text style={styles.statLabel}>Synced</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Account Created:</Text>
              <Text style={styles.statValue}>{getAccountCreationDate()}</Text>
            </View>
            {stats.lastSyncTime && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Last Sync:</Text>
                <Text style={styles.statValue}>{formatDate(stats.lastSyncTime)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Color Scheme Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionDescription}>
            Choose your preferred color scheme
          </Text>
          <View style={styles.colorSchemeOptions}>
            {(['system', 'light', 'dark'] as ColorSchemePreference[]).map((scheme) => (
              <TouchableOpacity
                key={scheme}
                style={[
                  styles.colorSchemeOption,
                  preference === scheme && styles.colorSchemeOptionSelected,
                ]}
                onPress={() => setPreference(scheme)}
              >
                <View style={styles.colorSchemeOptionContent}>
                  <Ionicons
                    name={
                      scheme === 'system' ? 'phone-portrait-outline' :
                      scheme === 'light' ? 'sunny-outline' :
                      'moon-outline'
                    }
                    size={20}
                    color={preference === scheme ? themeColor : (isDark ? '#9ca3af' : '#6b7280')}
                  />
                  <Text style={[
                    styles.colorSchemeOptionText,
                    preference === scheme && { color: themeColor, fontWeight: '600' }
                  ]}>
                    {scheme === 'system' ? 'System' : scheme === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </View>
                {preference === scheme && (
                  <Ionicons name="checkmark" size={20} color={themeColor} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accent Color</Text>
          <Text style={styles.sectionDescription}>
            Choose an accent color for the app interface
          </Text>
          <View style={styles.themeColorGrid}>
            {APP_THEME_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.themeColorOption,
                  { backgroundColor: color },
                  themeColor === color && styles.themeColorSelected,
                ]}
                onPress={() => handleThemeColorSelect(color)}
              >
                {themeColor === color && (
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions Section */}
        {user && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ffffff" />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean, backgroundColor: string, themeColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor,
  },
  header: {
    backgroundColor: isDark ? '#000000' : '#ffffff',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1a1a1a' : '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? '#1a1a1a' : '#e5e7eb',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#6b7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: isDark ? '#9ca3af' : '#6b7280',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : '#f9fafb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#1a1a1a' : '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: isDark ? '#9ca3af' : '#6b7280',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#374151' : '#e5e7eb',
  },
  colorSchemeOptions: {
    gap: 8,
    marginBottom: 8,
  },
  colorSchemeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    backgroundColor: isDark ? '#000000' : '#f9fafb',
    borderWidth: 1,
    borderColor: isDark ? '#1a1a1a' : '#e5e7eb',
  },
  colorSchemeOptionSelected: {
    borderColor: themeColor,
    borderWidth: 2,
  },
  colorSchemeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorSchemeOptionText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#111827',
  },
  themeColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeColorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeColorSelected: {
    borderColor: themeColor,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444', // Red destructive color
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff', // Always white
  },
  signInSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  signInDescription: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  signInButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444', // Red destructive color
    width: '100%',
  },
  signInButtonTopText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff', // Always white
  },
});
