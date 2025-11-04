# Firestore Setup Guide

This guide will help you set up Firestore for the tournament feature.

## Prerequisites

1. A Firebase project (you already have `koldgeneration-website`)
2. Firebase Authentication enabled (you already have this)

## Setup Steps

### 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`koldgeneration-website`)
3. In the left sidebar, click on **Firestore Database**
4. Click **Create database**
5. Choose your location:
   - **Select a location** (choose the closest region to your users, e.g., `us-central` or `europe-west`)
   - Click **Enable**

### 2. Configure Firestore Security Rules

**IMPORTANT**: You need to set up security rules to protect your data!

1. In Firestore Database, click on the **Rules** tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tournaments collection
    match /tournaments/{tournamentId} {
      // Anyone can read tournaments (to view tournament details)
      allow read: if true;
      
      // Only authenticated users can create tournaments
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.code is string
        && request.resource.data.name is string
        && request.resource.data.maxPlayers is int
        && request.resource.data.status == 'pending';
      
      // Only the tournament owner can update their tournament
      allow update: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
      
      // Only the tournament owner can delete their tournament
      allow delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

### 3. Create Indexes (Optional)

If you plan to use more complex queries in the future, you may need to create composite indexes. For now, the basic queries in the tournament service should work without additional indexes.

### 4. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Sign in to your app
3. Navigate to `/tournaments/create`
4. Try creating a tournament
5. Check the Firestore Console to see if the `tournaments` collection was created automatically

## How It Works

- **Collections**: Firestore uses "collections" instead of tables
- **Auto-creation**: The `tournaments` collection will be created automatically when you create your first tournament
- **Documents**: Each tournament is stored as a document in the `tournaments` collection
- **No schema**: Unlike SQL databases, you don't need to define a schema beforehand

## Security Rules Explanation

The rules above allow:
- ✅ **Anyone** to read tournaments (so users can view tournament details by code)
- ✅ **Authenticated users** to create tournaments (only if they're the owner)
- ✅ **Tournament owners** to update/delete their tournaments
- ❌ **Prevents** users from modifying other users' tournaments

## Troubleshooting

**Issue**: "Missing or insufficient permissions"
- **Solution**: Make sure you've published the Firestore security rules

**Issue**: "Collection not found"
- **Solution**: This is normal - the collection will be created when you write the first document

**Issue**: Tournament creation works but doesn't appear in Firestore
- **Solution**: Check your browser console for errors, and verify your Firestore rules are published

## Next Steps

Once Firestore is enabled and rules are set up, you're ready to:
- ✅ Create tournaments
- ✅ View tournaments by code
- ✅ Register/unregister players
- ✅ Manage tournament status (as owner)
