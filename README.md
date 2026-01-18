# 📝 Note Taking App

A modern, offline-first note-taking app built with React Native, Expo, Supabase, and Tailwind CSS (NativeWind).

## 🚀 Quick Build Commands

**To build production APK:**
```bash
# 1. Login (first time only)
eas login

# 2. Set secrets (first time only)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_SUPABASE_URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_SUPABASE_ANON_KEY

# 3. Build APK
npm run build:android
```

**⚠️ CRITICAL: Configure Supabase URLs before building!**
- Go to: Supabase Dashboard → Authentication → URL Configuration
- **Site URL**: `noteapp://`
- **Redirect URLs**: Add both:
  - `noteapp://auth/callback`
  - `https://[your-project-ref].supabase.co/auth/v1/callback`

See [Step 5: Configure Supabase URL Settings](#step-5-configure-supabase-url-settings-critical) for detailed instructions.

## ✨ Features

- **📱 Offline-First**: Works completely offline - create, edit, and search notes without internet
- **☁️ Cloud Sync**: Sign in with Google to sync notes across all your devices
- **🔍 Advanced Search**: Full-text search across all your notes (works offline and online)
- **👤 Guest Mode**: Use the app without signing in - notes stored locally only
- **🔄 Smart Sync**: Automatic conflict resolution with "last write wins + append" strategy
- **🌙 Dark Mode**: Beautiful dark mode support
- **🎨 Modern UI**: Built with Tailwind CSS for a clean, responsive design

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these:**
- Go to your Supabase Dashboard → Project Settings → API
- Copy the "Project URL" and "anon public" key

### 3. Set Up Database

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase.sql`
4. Run the SQL script

This will create:
- `notes` table with proper schema
- Row Level Security (RLS) policies
- Indexes for performance
- Full-text search functions
- Sync functions with conflict resolution

### 4. Configure Google OAuth

#### In Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URI:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
7. Copy the Client ID and Client Secret

#### In Supabase Dashboard:

1. Go to Authentication → Providers
2. Enable Google provider
3. Enter your Google Client ID and Client Secret
4. Save

### 5. Start the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on your phone

## 📋 Requirements

- Node.js 18+
- Expo CLI
- Supabase account
- Google Cloud Console account (for OAuth)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React Native with Expo Router
- **Styling**: Tailwind CSS (NativeWind)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Storage**: AsyncStorage (local) + Supabase (cloud)
- **Authentication**: Supabase Auth with Google OAuth

### Key Features Implementation

#### Offline-First Strategy
- All notes stored locally using AsyncStorage
- Guest users: Local storage only (no sync)
- Authenticated users: Local + Cloud sync

#### Sync Strategy
- **On App Open**: Pull latest notes from Supabase
- **On Create/Update**: Immediately sync to Supabase
- **Conflict Resolution**: Last write wins with content append (never deletes existing content)

#### Search Implementation
- **Offline**: Local full-text search
- **Online**: Supabase full-text search with ranking
- **Real-time**: Search results update as you type

## 📁 Project Structure

```
note_app/
├── app/                    # Expo Router pages
│   ├── index.tsx           # Main notes list screen
│   ├── note/
│   │   └── [id].tsx        # Note editor
│   ├── auth.tsx            # Auth screen
│   └── auth/
│       └── callback.tsx    # OAuth callback
├── lib/
│   ├── supabase/           # Supabase client & auth
│   ├── storage/            # Local storage helpers
│   ├── services/           # Business logic
│   └── types/              # TypeScript types
├── hooks/                  # Custom React hooks
├── components/             # Reusable components
├── supabase.sql           # Database schema
└── scripts/
    └── generate-assets.js  # Asset generation script
```

## 🔐 Authentication Flow

1. **Guest Mode** (default):
   - No authentication required
   - Notes stored locally only
   - Full app functionality available

2. **Authenticated Mode**:
   - Sign in with Google OAuth
   - Notes sync to Supabase
   - Available across all devices
   - Real-time updates

## 📊 Database Schema

The app uses a single `notes` table with:
- `id`: Unique note identifier
- `user_id`: Owner (null for guests)
- `guest_id`: Guest identifier (for local-only notes)
- `title`: Note title
- `content`: Note content
- `created_at`, `updated_at`, `synced_at`: Timestamps

**Row Level Security (RLS)** ensures users can only access their own notes.

## 🎯 Usage

### Creating Notes
- Tap the **+** button on the notes screen
- Enter title and content
- Tap **✓** to save

### Editing Notes
- Tap any note to edit
- Make changes
- Tap **✓** to save
- Unsaved changes warning appears if you try to leave

### Searching Notes
- Use the search bar at the top
- Search works in real-time
- Searches both title and content
- Works offline and online

### Syncing
- Sign in with Google to enable sync
- Notes automatically sync when created/updated
- Pull-to-refresh to manually sync
- Sync status indicator shows current state

## 🚀 Building for Production (EAS Build)

### Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```
3. **Supabase Account**: Your Supabase project should be set up
4. **Google OAuth**: Google OAuth credentials configured in Supabase

### Step 1: Login to Expo

```bash
eas login
```

Enter your Expo account credentials.

### Step 2: Configure Your Project

The following files are already configured:
- ✅ `eas.json` - EAS build configuration
- ✅ `app.config.js` - Updated with Android package name (`github.sidmaz666.noteapp`)
- ✅ `package.json` - Added EAS build scripts

**Current Configuration:**
- App name: "Note App"
- Android package: `github.sidmaz666.noteapp`
- iOS bundle identifier: `github.sidmaz666.noteapp`
- Version: `1.0.0`
- Version code: `1`
- Icons: Using `./assets/images/icon.png` (Note icon)
- Splash screen: Using `./assets/images/splash-icon.png`
- Favicon: Using `./assets/images/favicon.png`

### Step 3: Generate Assets (If Needed)

If you need to regenerate icons and splash screens:

```bash
npm run generate-assets
```

This will generate all required assets from `assets/images/icon.svg`:
- `icon.png` (1024x1024)
- `android-icon-foreground.png` (1024x1024)
- `android-icon-background.png` (1024x1024)
- `android-icon-monochrome.png` (1024x1024)
- `splash-icon.png` (512x512)
- `favicon.png` (256x256)

### Step 4: Set Environment Variables in EAS

Set your Supabase credentials as secrets in EAS (these will be used during build):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_SUPABASE_URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_SUPABASE_ANON_KEY
```

**To find your Supabase credentials:**
1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **API**
3. Copy:
   - **Project URL** → Use for `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 5: Configure Supabase URL Settings (CRITICAL)

**⚠️ IMPORTANT: You MUST configure these in Supabase for OAuth to work in production!**

#### In Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**

2. **Site URL** (Required):
   - This is the base URL for your app
   - For mobile apps, you can use: `noteapp://`
   - **OR** leave it as your Supabase project URL: `https://[your-project-ref].supabase.co`
   - **Recommended**: Set to `noteapp://` for mobile-first apps

3. **Redirect URLs** (Required - Add ALL of these):
   
   Add each URL on a new line:
   ```
   noteapp://auth/callback
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
   
   **Explanation:**
   - `noteapp://auth/callback` - For your production APK (deep link)
   - `https://[your-project-ref].supabase.co/auth/v1/callback` - For Supabase's OAuth flow
   
   **Where to find your project ref:**
   - Look at your Supabase project URL: `https://[project-ref].supabase.co`
   - Replace `[your-project-ref]` with your actual project reference

4. Click **Save** at the bottom of the page

**Visual Guide:**
```
Supabase Dashboard → Authentication → URL Configuration

Site URL:
┌─────────────────────────────────────┐
│ noteapp://                          │
└─────────────────────────────────────┘

Redirect URLs:
┌─────────────────────────────────────┐
│ noteapp://auth/callback             │
│ https://abc123xyz.supabase.co/      │
│   auth/v1/callback                  │
└─────────────────────────────────────┘
```

**Why both URLs?**
- The `noteapp://auth/callback` is for your mobile app to receive the OAuth callback
- The `https://...supabase.co/auth/v1/callback` is required by Supabase's OAuth system
- Both must be present for OAuth to work correctly

### Step 6: Build Preview APK (Optional - for testing)

Test your build configuration first:

```bash
npm run build:android:preview
```

Or directly:
```bash
eas build --platform android --profile preview
```

This creates an APK you can test before building production.

### Step 7: Build Production APK

**🚀 Ready to build? Run these commands in order:**

#### Option 1: Using npm script (Recommended)
```bash
npm run build:android
```

#### Option 2: Using EAS CLI directly
```bash
eas build --platform android --profile production
```

**What happens during build:**
1. EAS CLI will check your configuration
2. Upload your project to Expo's servers
3. Build the APK in the cloud (takes 10-20 minutes)
4. You'll receive a download link when complete
5. You can also check build status at: https://expo.dev/accounts/[your-account]/projects/note_app/builds

**Build Commands Summary:**
```bash
# Production APK (for release)
npm run build:android

# Preview APK (for testing)
npm run build:android:preview

# Development build (with dev tools)
npm run build:android:dev
```

**After build completes:**
- You'll see a URL in the terminal
- Click the URL or visit your Expo dashboard
- Download the APK file
- Transfer to your Android device and install

### Step 8: Download Your APK

1. After the build completes, you'll see a URL in the terminal
2. Visit the URL or check your [Expo dashboard](https://expo.dev/accounts/[your-account]/projects/note_app/builds)
3. Download the APK file

### Step 9: Install APK on Android Device

1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Tap the APK file to install
4. Open the app and test!

## 🔧 Build Profiles Explained

### Development
- For development builds with Expo Go
- Includes development tools
- Command: `npm run build:android:dev`

### Preview
- For testing before production
- Creates APK for internal distribution
- Command: `npm run build:android:preview`

### Production
- For final release
- Optimized and signed
- Command: `npm run build:android`

## 🎯 Building for Google Play Store

If you want to publish to Google Play Store, you'll need an AAB (Android App Bundle) instead of APK:

1. Update `eas.json` production profile:
   ```json
   "production": {
     "android": {
       "buildType": "app-bundle"
     }
   }
   ```

2. Build AAB:
   ```bash
   eas build --platform android --profile production
   ```

3. Submit to Play Store:
   ```bash
   eas submit --platform android
   ```

## 🐛 Troubleshooting

### OAuth Not Working
- Check redirect URI in Google Cloud Console matches Supabase callback URL
- Verify Google OAuth is enabled in Supabase
- Check that Client ID and Secret are correct
- Verify redirect URL `noteapp://auth/callback` is in Supabase
- Ensure app scheme matches: `noteapp`

### Notes Not Syncing
- Verify you're logged in (check auth screen)
- Check Supabase RLS policies are set correctly
- Verify environment variables are loaded
- Check build logs in Expo dashboard

### Search Not Working
- For logged-in users: Check if `search_notes` function exists in Supabase
- For guests: Local search should always work
- Try refreshing the app

### Build Fails
- Check that all assets exist in `assets/images/`
- Verify environment variables are set in EAS
- Check build logs in Expo dashboard
- Run `eas secret:list` to verify secrets

### Icons Not Showing
- Verify icon files are 1024x1024px
- Check file paths in `app.config.js`
- Ensure icons are PNG format
- Regenerate assets: `npm run generate-assets`

### Environment Variables Missing
- Run `eas secret:list` to verify secrets
- Re-create secrets if needed
- Check `app.config.js` extra section

## 📝 Next Steps After Building

1. **Test thoroughly** on multiple Android devices
2. **Increment version** in `app.config.js` for updates:
   - Update `version` (e.g., "1.0.1")
   - Increment `android.versionCode` (e.g., 2)
3. **Distribute** via:
   - Direct APK sharing
   - Google Play Store (requires AAB format)
4. **Monitor** app performance and user feedback

## ✅ Complete Pre-Build Checklist

**Before running `npm run build:android`, verify ALL of these:**

### EAS Setup
- [ ] EAS CLI installed globally: `npm install -g eas-cli`
- [ ] Logged into Expo: `eas login`
- [ ] Environment variables set in EAS secrets:
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Configuration (CRITICAL)
- [ ] **Site URL** configured in Supabase Dashboard → Authentication → URL Configuration
  - [ ] Set to: `noteapp://` (or your Supabase project URL)
- [ ] **Redirect URLs** configured (add BOTH):
  - [ ] `noteapp://auth/callback`
  - [ ] `https://[your-project-ref].supabase.co/auth/v1/callback`
- [ ] Google OAuth provider enabled in Supabase
- [ ] Google OAuth credentials (Client ID & Secret) added to Supabase
- [ ] Database schema applied (`supabase.sql` executed)

### Project Configuration
- [ ] All icon files exist in `assets/images/`:
  - [ ] `icon.png` (1024x1024)
  - [ ] `android-icon-foreground.png` (1024x1024)
  - [ ] `android-icon-background.png` (1024x1024)
  - [ ] `android-icon-monochrome.png` (1024x1024)
  - [ ] `splash-icon.png` (512x512)
  - [ ] `favicon.png` (256x256)
- [ ] Splash screen configured in `app.config.js`
- [ ] App name verified: "Note App"
- [ ] Package name verified: `github.sidmaz666.noteapp`
- [ ] Version numbers set correctly: `1.0.0` (version), `1` (versionCode)

### Testing
- [ ] App runs locally: `npm start`
- [ ] Tested on device/emulator
- [ ] OAuth flow tested (if possible in dev mode)

### Git (Before Pushing)
- [ ] `.env` file is in `.gitignore` ✅ (Already configured)
- [ ] No sensitive data committed
- [ ] All assets committed

## 📝 License

Private project

## 🙏 Acknowledgments

Built with:
- [Expo](https://expo.dev)
- [Supabase](https://supabase.com)
- [NativeWind](https://www.nativewind.dev)
- [React Native](https://reactnative.dev)

## 🚀 Quick Build Commands

**Ready to build your APK? Here are the commands:**

```bash
# 1. Login to Expo (first time only)
eas login

# 2. Set environment variables (first time only)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_SUPABASE_URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_SUPABASE_ANON_KEY

# 3. Build production APK
npm run build:android
```

**That's it!** The build will take 10-20 minutes. You'll get a download link when it's done.

## 📝 Important Notes

### Git Configuration
- ✅ `.env` file is properly ignored (won't be committed)
- ✅ All sensitive files are in `.gitignore`
- ✅ Safe to push to Git repository

### Supabase Configuration Reminder
**Before building, ensure in Supabase Dashboard → Authentication → URL Configuration:**

1. **Site URL**: `noteapp://`
2. **Redirect URLs** (add both):
   - `noteapp://auth/callback`
   - `https://[your-project-ref].supabase.co/auth/v1/callback`

**Without these, OAuth will NOT work in production!**

---
