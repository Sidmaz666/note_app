import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabase } from './client';

WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async () => {
  try {
    const redirectUrl = makeRedirectUri({
      scheme: 'noteapp',
      path: 'auth/callback',
      preferLocalhost: false, // Don't use localhost
    });

    console.log('Starting Google OAuth with redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // We'll handle the browser ourselves
      },
    });

    if (error) {
      console.error('OAuth error:', error);
      throw error;
    }

    if (data?.url) {
      console.log('OAuth URL:', data.url);
      console.log('Redirect URL:', redirectUrl);
      
      if (Platform.OS !== 'web') {
        // Use openAuthSessionAsync to properly capture the redirect
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('OAuth result type:', result.type);
        console.log('OAuth result:', result);

        if (result.type === 'success') {
          // Parse tokens from the callback URL
          const url = 'url' in result ? result.url : null;
          if (!url) {
            throw new Error('No URL in OAuth result');
          }
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          try {
            // Try parsing as URL first
            const urlObj = new URL(url);
            
            // Check hash fragment first (Supabase uses hash for OAuth)
            if (urlObj.hash) {
              const hashParams = new URLSearchParams(urlObj.hash.substring(1));
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
            }
            
            // Fallback to query params
            if (!accessToken || !refreshToken) {
              accessToken = urlObj.searchParams.get('access_token');
              refreshToken = urlObj.searchParams.get('refresh_token');
            }
          } catch (e) {
            // Fallback regex parsing
            const accessTokenMatch = url.match(/[#&]access_token=([^&]+)/);
            const refreshTokenMatch = url.match(/[#&]refresh_token=([^&]+)/);
            
            if (accessTokenMatch) accessToken = decodeURIComponent(accessTokenMatch[1]);
            if (refreshTokenMatch) refreshToken = decodeURIComponent(refreshTokenMatch[1]);
          }

          if (accessToken && refreshToken) {
            console.log('Found tokens, setting session');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('Error setting session:', sessionError);
              throw sessionError;
            }

            console.log('Session set successfully');
            return { success: true };
          } else {
            // Check if session was set automatically
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              console.log('Session established automatically');
              return { success: true };
            }
            throw new Error('Missing tokens in OAuth callback');
          }
        } else if (result.type === 'cancel') {
          throw new Error('OAuth cancelled by user');
        } else {
          throw new Error(`OAuth failed: ${result.type}`);
        }
      } else {
        // For web, redirect directly
        if (typeof window !== 'undefined') {
          window.location.href = data.url;
        }
        return { success: true };
      }
    } else {
      throw new Error('No OAuth URL returned');
    }
  } catch (error: any) {
    console.error('Error in signInWithGoogle:', error);
    throw new Error(error?.message || 'Failed to initiate Google sign in');
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
