'use server';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This file is intended for server-side use only (e.g., in Genkit flows).

/**
 * Initializes and returns Firebase services for server-side operations.
 * It ensures that Firebase is initialized only once (is idempotent).
 */
export async function initializeFirebase() {
  if (getApps().length === 0) {
    // When running in a Google Cloud environment (like App Hosting),
    // applicationDefault() automatically finds the service account credentials.
    // We must also provide the projectId.
    initializeApp({ 
      credential: applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
  }
  
  // Get the initialized app
  const firebaseApp = getApp();
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}
