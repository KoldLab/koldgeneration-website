# Google OAuth Setup & Policy Compliance Guide

If users are seeing "Access blocked: This app's request is invalid" or "This app isn't verified" errors, follow these steps to fix the Google OAuth configuration.

## In-App Browser Support

**Note**: The app automatically detects in-app browsers (like those in Messenger, WhatsApp, Instagram, etc.) and uses redirect-based authentication instead of popups. This ensures OAuth works correctly when users open links from messaging apps.

- **Regular browsers** (Chrome, Safari, Firefox): Uses popup authentication (better UX)
- **In-app browsers** (Messenger, WhatsApp, etc.): Automatically uses redirect authentication (works reliably)

## Common Error Messages

- "Access blocked: This app's request is invalid"
- "This app isn't verified"
- "Error 400: redirect_uri_mismatch"
- "Access blocked: This app's request does not comply with Google's policies"

## Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** > **OAuth consent screen**

### For Testing/Development:

1. **User Type**: Select **External** (unless you're using Google Workspace)
2. **App Information**:
   - App name: Your app name
   - User support email: Your email
   - Developer contact information: Your email
3. **Scopes**:
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `email`
     - `profile`
     - `openid`
4. **Test Users** (if app is in Testing mode):
   - Add test users who can access the app
   - Add your friend's email address here
5. **Save and Continue** through all steps

### For Production:

1. Complete all required fields:
   - **App name**: Your app name
   - **User support email**: Your email
   - **App logo**: Upload a logo (optional but recommended)
   - **Application home page**: Your website URL
   - **Privacy policy link**: **REQUIRED** - Must be a publicly accessible URL
   - **Terms of service link**: **REQUIRED** - Must be a publicly accessible URL
   - **Authorized domains**: Add your domain (e.g., `yourdomain.com`)
2. **Scopes**: Same as above
3. **Save and Continue**

## Step 2: Configure Authorized Domains

1. In **OAuth consent screen**, scroll to **Authorized domains**
2. Add your domains:
   - Your production domain (e.g., `yourdomain.com`)
   - For Firebase Hosting: `yourproject.web.app` and `yourproject.firebaseapp.com`
   - For local development: `localhost` (automatically included)
3. **Do NOT** add domains like `google.com` or other third-party domains

## Step 3: Configure OAuth Client IDs

1. Go to **APIs & Services** > **Credentials**
2. Find your **OAuth 2.0 Client IDs**
3. For **Web application** type:
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (or your dev port)
     - `https://yourdomain.com`
     - `https://yourproject.web.app`
     - `https://yourproject.firebaseapp.com`
   - **Authorized redirect URIs**:
     - `http://localhost:5173` (or your dev port)
     - `https://yourdomain.com`
     - `https://yourproject.web.app/__/auth/handler`
     - `https://yourproject.firebaseapp.com/__/auth/handler`

## Step 4: Firebase Authentication Settings

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Add your domains:
   - Your production domain
   - `localhost` (for development)
   - Firebase domains are added automatically

## Step 5: App Verification (For Production)

If your app is in **Production** mode and you're requesting sensitive scopes:

1. **Submit for verification**:
   - Go to **OAuth consent screen**
   - Click **PUBLISH APP** or **Submit for verification**
   - Complete the verification form
   - This process can take several days

2. **For faster testing**:
   - Keep app in **Testing** mode
   - Add test users (up to 100)
   - Test users can access without verification

## Step 6: Privacy Policy & Terms of Service

**REQUIRED for production apps**. Create these pages:

1. **Privacy Policy**:
   - Must explain what data you collect
   - How you use Google OAuth data
   - Data storage and security
   - Must be publicly accessible

2. **Terms of Service**:
   - Usage terms
   - User responsibilities
   - Must be publicly accessible

### Quick Privacy Policy Template

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Privacy Policy</title>
  </head>
  <body>
    <h1>Privacy Policy</h1>
    <p>Last updated: [Date]</p>

    <h2>Data Collection</h2>
    <p>We use Google OAuth to authenticate users. We collect:</p>
    <ul>
      <li>Email address</li>
      <li>Name</li>
      <li>Profile picture</li>
    </ul>

    <h2>Data Usage</h2>
    <p>This data is used solely for authentication and user identification.</p>

    <h2>Data Storage</h2>
    <p>User data is stored securely in Firebase.</p>

    <h2>Contact</h2>
    <p>For questions, contact: [Your Email]</p>
  </body>
</html>
```

## Step 7: Check Firebase Authentication Providers

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Ensure **Google** is enabled
3. Check **Project support email** is set
4. Verify **Authorized domains** match your OAuth consent screen

## Troubleshooting

### Error: "redirect_uri_mismatch"

- Check **Authorized redirect URIs** in OAuth Client ID settings
- Ensure Firebase auth handler URLs are included

### Error: "Access blocked: This app isn't verified"

- App is in Production mode but not verified
- Either submit for verification OR switch to Testing mode and add test users

### Error: "Invalid client"

- Check OAuth Client ID configuration
- Verify Firebase project settings match Google Cloud project

### Users can't sign in

- Check if user is added as a test user (if app is in Testing mode)
- Verify authorized domains include the domain they're accessing from
- Check browser console for specific error messages

## Testing Checklist

- [ ] OAuth consent screen configured
- [ ] User type set to External (or Internal if using Workspace)
- [ ] Required scopes added (email, profile, openid)
- [ ] Authorized domains configured
- [ ] OAuth Client ID redirect URIs configured
- [ ] Firebase authorized domains configured
- [ ] Privacy policy URL added (for production)
- [ ] Terms of service URL added (for production)
- [ ] Test users added (if in Testing mode)
- [ ] App submitted for verification (if in Production mode)

## Quick Fix for Development

If you just need to test quickly:

1. Set OAuth consent screen to **Testing** mode
2. Add your friend's email as a **Test user**
3. They should be able to sign in immediately

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Authentication Setup](https://firebase.google.com/docs/auth)
- [OAuth Consent Screen Guide](https://support.google.com/cloud/answer/10311615)
