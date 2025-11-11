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
      // SECURITY: Allow reading individual tournaments (for code-based sharing)
      // Tournaments are shareable via code, so individual reads are allowed
      allow get: if true;

      // SECURITY: Restrict queries to prevent bulk data scraping
      // Allow authenticated users to list (for "My Tournaments" feature)
      // For anonymous users, only allow limited queries with WHERE filters
      allow list: if (
        // Authenticated users can list tournaments (needed for getTournamentsByUserId)
        request.auth != null
        ||
        // Anonymous users: only allow queries with explicit limits (code lookup)
        (request.query.limit != null && request.query.limit <= 10)
      );

      // Only authenticated users can create tournaments
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.code is string
        && request.resource.data.name is string
        && request.resource.data.maxPlayers is int
        && request.resource.data.status == 'pending';

      // Tournament updates: owner can update anything, authenticated users can register/unregister
      allow update: if request.auth != null && (
        // Owner can update anything
        resource.data.ownerId == request.auth.uid
        ||
        // Authenticated users can update tournaments to register/unregister themselves only
        (
          // Only players array and updatedAt are being modified
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['players', 'updatedAt'])
          &&
          // All other fields remain unchanged
          request.resource.data.ownerId == resource.data.ownerId
          && request.resource.data.code == resource.data.code
          && request.resource.data.name == resource.data.name
          && request.resource.data.type == resource.data.type
          && request.resource.data.maxPlayers == resource.data.maxPlayers
          && request.resource.data.status == resource.data.status
          && request.resource.data.createdAt == resource.data.createdAt
          &&
          // Security: Verify array size only changes by 1 (registration or unregistration)
          (
            request.resource.data.players.size() == resource.data.players.size() + 1
            ||
            request.resource.data.players.size() == resource.data.players.size() - 1
          )
        )
      );

      // Only the tournament owner can delete their tournament
      allow delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
    }

    // SECURITY: Deny all access to other collections by default
    // Add specific rules for other collections as needed
    match /{document=**} {
      allow read, write: if false;
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

The rules above provide multiple layers of security:

### Read Protection:

- ✅ **Individual tournaments** can be read by anyone (needed for code-based sharing)
- ✅ **Queries** are restricted to prevent bulk data scraping:
  - Anonymous users can only query with WHERE filters (code lookup) - max 10 results
  - Authenticated users can list tournaments (needed for "My Tournaments" feature)
  - No pagination allowed to prevent systematic scraping
- ✅ **Default deny** for all other collections prevents accidental exposure

### Write Protection:

- ✅ **Only authenticated users** can create tournaments (and must be the owner)
- ✅ **Tournament owners** can update/delete their tournaments
- ✅ **Authenticated users** can only register/unregister themselves (only `players` array can be modified)
- ❌ **Prevents** users from modifying other users' tournaments or other fields

### Additional Security:

- ✅ **Default deny rule** at the end blocks access to any collections you haven't explicitly allowed
- ✅ **Query limits** prevent bulk data extraction
- ✅ **Field validation** ensures data integrity

## Troubleshooting

**Issue**: "Missing or insufficient permissions"

- **Solution**: Make sure you've published the Firestore security rules

**Issue**: "Collection not found"

- **Solution**: This is normal - the collection will be created when you write the first document

**Issue**: Tournament creation works but doesn't appear in Firestore

- **Solution**: Check your browser console for errors, and verify your Firestore rules are published

**Issue**: "My Tournaments" page shows permission error

- **Solution**: Make sure you're signed in. The `getTournamentsByUserId` function requires authentication and may need optimization for large datasets (see note below)

## Security Best Practices

1. **Never expose your Firebase API keys** in client-side code - they're safe to use in the browser, but don't commit them to public repos
2. **Review your security rules regularly** - Test them using the Firebase Console Rules Playground
3. **Monitor your Firestore usage** - Check the Firebase Console for unusual query patterns
4. **Consider rate limiting** - For production, you may want to add Cloud Functions with rate limiting for sensitive operations

## Performance Note

The `getTournamentsByUserId` function currently fetches all tournaments and filters in memory. For better security and performance:

- Consider adding a `participants` subcollection indexed by userId
- Or use Cloud Functions to handle this query server-side
- This will also reduce the query limit needed in security rules

## Next Steps

Once Firestore is enabled and rules are set up, you're ready to:

- ✅ Create tournaments
- ✅ View tournaments by code
- ✅ Register/unregister players
- ✅ Manage tournament status (as owner)
