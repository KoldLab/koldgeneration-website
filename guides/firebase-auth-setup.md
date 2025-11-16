# Firebase Authentication Setup Guide

This guide will help you set up Google Sign-In using Firebase Authentication.

## Prerequisites

1. A Firebase project (you already have `koldgeneration-website`)
2. Node.js and npm installed

## Setup Steps

### 1. Enable Google Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`koldgeneration-website`)
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable** to ON
6. Set a **Project support email** (use your email)
7. Click **Save**

### 2. Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. If you don't have a web app yet, click **Add app** → **Web** (</> icon)
4. Register your app (you can use any nickname like "Web App")
5. Copy the Firebase configuration values

### 3. Create Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your Firebase config values:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=koldgeneration-website.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=koldgeneration-website
   VITE_FIREBASE_STORAGE_BUCKET=koldgeneration-website.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### 4. Configure Authorized Domains

1. In Firebase Console, go to **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Add your custom domain (`www.koldgeneration.com`) if you want users to sign in from your custom domain
4. Firebase automatically includes:
   - Your Firebase hosting domain
   - `localhost` for development

### 5. Test the Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Click "Sign in with Google" in the navigation bar
3. You should see the Google Sign-In popup
4. After signing in, you'll see your profile picture/name in the navbar

## How It Works

- **AuthContext**: Provides authentication state and methods throughout the app
- **LoginButton**: Shows when user is not signed in
- **UserMenu**: Shows user profile with sign out option when signed in
- **Firebase Auth**: Handles all authentication logic securely

## Features

✅ **Google Sign-In** - One-click authentication  
✅ **Persistent Sessions** - Users stay signed in across page refreshes  
✅ **User Profile** - Shows name, email, and profile picture  
✅ **Secure** - All authentication handled by Firebase  

## Troubleshooting

**Issue**: "Firebase: Error (auth/unauthorized-domain)"  
**Solution**: Make sure your domain is added to Authorized domains in Firebase Console

**Issue**: Environment variables not loading  
**Solution**: 
- Make sure `.env` file exists in the root directory
- Restart your dev server after creating/modifying `.env`
- Variables must start with `VITE_` to be accessible in Vite

**Issue**: "Firebase: Error (auth/popup-closed-by-user)"  
**Solution**: User closed the popup - this is normal behavior

## Next Steps

You can now:
- Protect routes that require authentication
- Store user-specific data in Firestore
- Add more authentication providers (Email/Password, GitHub, etc.)

