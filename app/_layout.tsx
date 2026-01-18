import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import 'react-native-reanimated';

// Enable screens for better performance
enableScreens();

import { ColorSchemeProvider, useColorScheme } from '@/hooks/use-color-scheme-preference';
import { AppThemeProvider, useAppTheme } from '@/hooks/use-app-theme';

export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { getBackgroundColor } = useAppTheme();
  const backgroundColor = getBackgroundColor();

  // Create custom theme with proper background colors
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#000000',
      card: '#000000',
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: backgroundColor,
      card: backgroundColor,
    },
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
      <View style={{ flex: 1, backgroundColor: backgroundColor }}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            animationDuration: 200,
            contentStyle: {
              backgroundColor: backgroundColor,
            },
            headerStyle: {
              backgroundColor: backgroundColor,
            },
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false,
              contentStyle: {
                backgroundColor: backgroundColor,
              },
            }} 
          />
          <Stack.Screen 
            name="note/[id]" 
            options={{ 
              presentation: 'card',
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
              contentStyle: {
                backgroundColor: backgroundColor,
              },
            }} 
          />
          <Stack.Screen 
            name="auth" 
            options={{ 
              presentation: 'modal', 
              headerShown: false,
              animation: 'fade',
              animationDuration: 200,
              contentStyle: {
                backgroundColor: backgroundColor,
              },
            }} 
          />
          <Stack.Screen 
            name="auth/callback" 
            options={{ 
              headerShown: false,
              contentStyle: {
                backgroundColor: backgroundColor,
              },
            }} 
          />
          <Stack.Screen 
            name="profile" 
            options={{ 
              presentation: 'card',
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
              contentStyle: {
                backgroundColor: backgroundColor,
              },
            }} 
          />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', 
              title: 'Modal',
              contentStyle: {
                backgroundColor: backgroundColor,
              },
            }} 
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ColorSchemeProvider>
      <AppThemeProvider>
        <RootLayoutContent />
      </AppThemeProvider>
    </ColorSchemeProvider>
  );
}
