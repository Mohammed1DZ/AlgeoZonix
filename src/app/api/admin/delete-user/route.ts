'use server';

import { initializeFirebase } from '@/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch, Firestore, getDoc } from 'firebase-admin/firestore';

/**
 * API Route to delete a user from Firebase Authentication and Firestore
 * POST /api/admin/delete-user
 * Body: { userId: string, authToken: string }
 * 
 * Requires:
 * - Admin user authentication token
 * - Admin role in Firestore user document
 */
export async function POST(request: Request) {
  try {
    const { userId, authToken } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: 'User ID is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!authToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication token is required.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to delete user: ${userId}`);

    const { firebaseApp, firestore } = await initializeFirebase();
    const auth = getAuth(firebaseApp);

    // 1. Verify the requester is authenticated and is an admin
    let adminUid: string;
    try {
      const decodedToken = await auth.verifyIdToken(authToken);
      adminUid = decodedToken.uid;
      console.log(`Token verified for user: ${adminUid}`);
    } catch (tokenError: any) {
      console.warn(`Token verification failed: ${tokenError.message}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid or expired authentication token.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if the requester is an admin
    const adminDocRef = doc(firestore, 'users', adminUid);
    const adminDocSnap = await getDoc(adminDocRef);
    
    if (!adminDocSnap.exists()) {
      console.warn(`Admin user document not found: ${adminUid}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Admin user not found.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const adminData = adminDocSnap.data() as any;
    if (adminData.role !== 'admin') {
      console.warn(`User ${adminUid} attempted to delete user but is not an admin. Role: ${adminData.role}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized. Only administrators can delete users.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Prevent admin from deleting themselves
    if (adminUid === userId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Cannot delete your own admin account.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${adminUid} authorized to delete user ${userId}`);

    // 4. Delete user from Firebase Authentication
    try {
      await auth.deleteUser(userId);
      console.log(`Successfully deleted user ${userId} from Firebase Auth.`);
    } catch (authError: any) {
      // User might already be deleted from auth, continue with Firestore cleanup
      console.warn(`Warning deleting from auth: ${authError.message}`);
    }

    // 5. Delete user document from Firestore
    const userDocRef = doc(firestore, 'users', userId);
    await deleteDoc(userDocRef);
    console.log(`Successfully deleted user document for ${userId} from Firestore.`);

    // 6. Clean up related data (orders, verifications, etc.)
    await deleteUserRelatedData(firestore, userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userId} has been successfully deleted.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An unknown error occurred during user deletion.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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

      querySnapshot.docs.forEach((docSnapshot: any) => {
        batch.delete(docSnapshot.ref);
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
