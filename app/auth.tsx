import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { signInWithGoogle, signOut } from '@/lib/supabase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your notes will remain on this device but won\'t sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setSigningOut(true);
              await signOut();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={user ? "checkmark-circle" : "person-circle-outline"}
            size={64}
            color={user ? "#10b981" : "#3b82f6"}
          />
          <Text style={styles.title}>
            {user ? 'Signed In' : 'Authentication'}
          </Text>
          <Text style={styles.subtitle}>
            {user
              ? `Signed in as ${user.email}`
              : 'Sign in with Google to sync your notes across devices'}
          </Text>
        </View>

        {user ? (
          <View style={styles.content}>
            <View style={styles.infoBox}>
              <View style={styles.infoHeader}>
                <Ionicons name="cloud-done" size={20} color="#10b981" />
                <Text style={styles.infoTitle}>
                  Cloud Sync Enabled
                </Text>
              </View>
              <Text style={styles.infoText}>
                Your notes are being synced to the cloud and will be available on all your devices.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSignOut}
              disabled={signingOut}
              style={styles.signOutButton}
            >
              {signingOut ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="white" />
                  <Text style={styles.buttonText}>Sign Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={[styles.infoBox, styles.warningBox]}>
              <View style={styles.infoHeader}>
                <Ionicons name="cloud-offline" size={20} color="#f59e0b" />
                <Text style={[styles.infoTitle, styles.warningTitle]}>
                  Local Only Mode
                </Text>
              </View>
              <Text style={styles.warningText}>
                Your notes are saved locally on this device. Sign in to sync across devices.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={signingIn}
              style={styles.signInButton}
            >
              {signingIn ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={24} color="#ffffff" />
                  <Text style={styles.signInButtonText}>
                    Sign in with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#111827' : '#f9fafb',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    gap: 16,
  },
  infoBox: {
    backgroundColor: isDark ? '#064e3b' : '#d1fae5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? '#065f46' : '#a7f3d0',
  },
  warningBox: {
    backgroundColor: isDark ? '#78350f' : '#fef3c7',
    borderColor: isDark ? '#92400e' : '#fde68a',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#6ee7b7' : '#065f46',
    marginLeft: 8,
  },
  warningTitle: {
    color: isDark ? '#fbbf24' : '#92400e',
  },
  infoText: {
    fontSize: 12,
    color: isDark ? '#a7f3d0' : '#047857',
  },
  warningText: {
    color: isDark ? '#fcd34d' : '#b45309',
  },
  signOutButton: {
    backgroundColor: '#ef4444', // Red destructive color
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButton: {
    backgroundColor: '#ef4444', // Red destructive color
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff', // Always white
    fontWeight: '600',
    marginLeft: 8,
  },
  signInButtonText: {
    color: '#ffffff', // Always white
    fontWeight: '600',
    marginLeft: 12,
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: isDark ? '#9ca3af' : '#6b7280',
    fontSize: 14,
  },
});
