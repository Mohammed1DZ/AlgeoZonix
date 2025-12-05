'use server';

import { initializeFirebase } from '@/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch, Firestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to delete a user from Firebase Authentication and Firestore
 * POST /api/admin/delete-user
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }

    console.log(`Attempting to delete user: ${userId}`);

    const { firebaseApp, firestore } = await initializeFirebase();
    const auth = getAuth(firebaseApp);

    // 1. Delete user from Firebase Authentication
    try {
      await auth.deleteUser(userId);
      console.log(`Successfully deleted user ${userId} from Firebase Auth.`);
    } catch (authError: any) {
      // User might already be deleted from auth, continue with Firestore cleanup
      console.warn(`Warning deleting from auth: ${authError.message}`);
    }

    // 2. Delete user document from Firestore
    const userDocRef = doc(firestore, 'users', userId);
    await deleteDoc(userDocRef);
    console.log(`Successfully deleted user document for ${userId} from Firestore.`);

    // 3. Clean up related data (orders, verifications, etc.)
    await deleteUserRelatedData(firestore, userId);

    return NextResponse.json(
      { success: true, message: `User ${userId} has been successfully deleted.` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unknown error occurred during user deletion.' },
      { status: 500 }
    );
  }
}

/**
 * Deletes all related data for a user across multiple collections
 */
async function deleteUserRelatedData(firestore: Firestore, userId: string): Promise<void> {
  const batch = writeBatch(firestore);
  const collectionsToClean = ['orders', 'verifications', 'documents', 'rides'];

  for (const collectionName of collectionsToClean) {
    try {
      const q = query(collection(firestore, collectionName), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      console.log(`Queued deletion of ${querySnapshot.size} ${collectionName} documents for user ${userId}`);
    } catch (error: any) {
      console.warn(`Failed to query ${collectionName}: ${error.message}`);
      // Continue with other collections
    }
  }

  // Commit all deletions in a single batch
  await batch.commit();
  console.log(`Successfully deleted all related data for user ${userId}`);
}
