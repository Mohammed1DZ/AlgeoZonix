'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  try {
    const auth = getAuth(firebaseApp);
    
    // Wrap the auth instance to handle authorizedDomains errors
    const wrappedAuth = wrapAuthWithErrorHandling(auth);
    
    return {
      firebaseApp,
      auth: wrappedAuth,
      firestore: getFirestore(firebaseApp)
    };
  } catch (error) {
    console.error('Failed to initialize Firebase SDKs:', error);
    throw error;
  }
}

/**
 * Wraps the auth instance to handle authorizedDomains validation errors
 */
function wrapAuthWithErrorHandling(auth: any) {
  // Store original methods
  const originalSignInWithPopup = auth.signInWithPopup;
  const originalSignInWithRedirect = auth.signInWithRedirect;

  // Override signInWithPopup to catch authorizedDomains errors
  auth.signInWithPopup = async function(...args: any[]) {
    try {
      return await originalSignInWithPopup.apply(this, args);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed' || (error.message && error.message.includes('authorized domain'))) {
        console.error('Firebase Auth Error: This domain is not authorized for OAuth operations.');
        throw new Error(
          'Authentication failed. Please add this domain to your Firebase project\'s authorized domains in the Firebase Console (Authentication > Settings > Authorized domains). Domain: ' +
          window.location.hostname
        );
      }
      throw error;
    }
  };

  // Override signInWithRedirect similarly
  auth.signInWithRedirect = async function(...args: any[]) {
    try {
      return await originalSignInWithRedirect.apply(this, args);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed' || (error.message && error.message.includes('authorized domain'))) {
        console.error('Firebase Auth Error: This domain is not authorized for OAuth operations.');
        throw new Error(
          'Authentication failed. Please add this domain to your Firebase project\'s authorized domains in the Firebase Console (Authentication > Settings > Authorized domains). Domain: ' +
          window.location.hostname
        );
      }
      throw error;
    }
  };

  return auth;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';