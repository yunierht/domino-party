// ---------------------------------------------------------------------------
// Firebase configuration.
//
// Paste the values from your Firebase project here. Get them from:
//   Firebase Console → Project settings (gear icon) → "Your apps" →
//   register a Web app (</>) → copy the firebaseConfig object.
//
// Until these are filled in, the app runs fully offline (local-only) and the
// "Share" / "Watch" live features are disabled gracefully.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: 'AIzaSyCJOUeVDjD-Kr77JZUGoC3ZNPkxpaKHphU',
  authDomain: 'domino-book.firebaseapp.com',
  projectId: 'domino-book',
  storageBucket: 'domino-book.firebasestorage.app',
  messagingSenderId: '345147627217',
  appId: '1:345147627217:web:490213fcbfa042dfba57f0',
  measurementId: 'G-57JTEF8PHE',
};

/** True once the essential config fields have been provided. */
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId;
