import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// You'll need to get this from Firebase Console -> Project Settings -> Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that all required config values are present
const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  const errorMsg = `Missing Firebase config values: ${missingKeys.join(', ')}. Make sure your .env file is configured correctly.`;
  console.error(errorMsg);
  if (import.meta.env.PROD) {
    // In production, still try to initialize but it will likely fail
    console.warn('Firebase config incomplete - authentication may not work');
  }
}

// Initialize Firebase (only if not already initialized)
let app;
try {
  if (missingKeys.length === 0) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } else {
    throw new Error('Firebase configuration is incomplete');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create a dummy app to prevent crashes, but auth won't work
  if (getApps().length === 0) {
    console.warn('Creating fallback Firebase app - authentication disabled');
    app = initializeApp({
      apiKey: 'dummy',
      authDomain: 'dummy',
      projectId: 'dummy',
      storageBucket: 'dummy',
      messagingSenderId: 'dummy',
      appId: 'dummy',
    });
  } else {
    app = getApps()[0];
  }
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

