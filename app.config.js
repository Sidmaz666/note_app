export default {
  expo: {
    name: "Note App",
    slug: "note_app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "noteapp",
    description: "A modern, offline-first note-taking app with cloud sync. Create, edit, and search notes seamlessly across all your devices. Works completely offline with optional Google sign-in for cloud synchronization.",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      dark: {
        backgroundColor: "#000000"
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "github.sidmaz666.noteapp",
      icon: "./assets/images/icon.png"
    },
    android: {
      package: "github.sidmaz666.noteapp",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      icon: "./assets/images/icon.png",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      navigationBar: {
        backgroundColor: "#000000"
      }
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      eas: {
        projectId: "2e15327d-a48f-4052-a665-ec5fca909c59"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};
