import { supabase } from '@/lib/supabase/client';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, Linking } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const [status, setStatus] = useState<string>('Processing...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback params:', Object.keys(params));
        console.log('Full params:', JSON.stringify(params));
        
        // Try to get the URL from Linking if params are empty
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        // Check direct params first
        if (params.access_token && params.refresh_token) {
          accessToken = params.access_token as string;
          refreshToken = params.refresh_token as string;
        } else {
          // Try to get the initial URL from Linking
          try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
              console.log('Initial URL from Linking:', initialUrl);
              const urlObj = new URL(initialUrl);
              
              if (urlObj.hash) {
                const hashParams = new URLSearchParams(urlObj.hash.substring(1));
                accessToken = hashParams.get('access_token');
                refreshToken = hashParams.get('refresh_token');
              }
              
              if (!accessToken || !refreshToken) {
                accessToken = urlObj.searchParams.get('access_token');
                refreshToken = urlObj.searchParams.get('refresh_token');
              }
            }
          } catch (e) {
            console.log('Error getting initial URL:', e);
          }
        }

        if (accessToken && refreshToken) {
          setStatus('Setting session...');
          console.log('Found tokens, setting session');
          
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Auth callback error:', error);
            setStatus('Error: ' + error.message);
            setTimeout(() => router.replace('/auth'), 2000);
          } else {
            console.log('Session set successfully');
            setStatus('Success! Redirecting...');
            setTimeout(() => {
              router.replace('/');
            }, 500);
          }
        } else {
          // Check if session is already established (might have been set automatically)
          setStatus('Checking session...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Session already exists');
            setStatus('Session found! Redirecting...');
            setTimeout(() => {
              router.replace('/');
            }, 500);
          } else {
            console.log('No tokens found and no session');
            setStatus('No session found. Please try again.');
            setTimeout(() => {
              router.replace('/auth');
            }, 3000);
          }
        }
      } catch (error: any) {
        console.error('Error handling auth callback:', error);
        setStatus('Error: ' + (error?.message || 'Unknown error'));
        setTimeout(() => {
          router.replace('/auth');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
