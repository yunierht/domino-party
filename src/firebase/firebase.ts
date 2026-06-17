import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  // @ts-ignore - getReactNativePersistence is available at runtime in firebase v11
  getReactNativePersistence,
  initializeAuth,
  signInAnonymously,
} from 'firebase/auth';
import { Firestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isFirebaseConfigured } from './config';

interface FB {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cached: FB | null = null;

/** Lazily initialize Firebase. Returns null if config is not provided. */
export function getFirebase(): FB | null {
  if (!isFirebaseConfigured) return null;
  if (cached) return cached;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  let auth: Auth;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (e.g. fast refresh) — reuse it.
    auth = getAuth(app);
  }

  // Long-polling auto-detect makes Firestore reliable on React Native networks.
  const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });

  cached = { app, auth, db };
  return cached;
}

/** Ensure there is an anonymous user; returns the uid (or null if unconfigured). */
export async function ensureSignedIn(): Promise<string | null> {
  const fb = getFirebase();
  if (!fb) return null;
  if (fb.auth.currentUser) return fb.auth.currentUser.uid;
  const cred = await signInAnonymously(fb.auth);
  return cred.user.uid;
}
