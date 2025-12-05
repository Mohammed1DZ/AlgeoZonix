'use server';
/**
 * @fileOverview A flow for securely deleting a user from the system.
 *
 * - deleteUser - Deletes a user from Firebase Authentication and Firestore using the Admin SDK.
 * - DeleteUserInput - The input type for the deleteUser function.
 */

import { initializeFirebase } from '@/firebase/server';
import { getFirestore } from 'firebase-admin/firestore';

export interface DeleteUserInput {
  userIdToDelete: string;
  adminUserId: string; // The UID of the user performing the deletion.
}

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean; message: string }> {
  const { userIdToDelete, adminUserId } = input;
  
  if (!userIdToDelete || !adminUserId) {
    throw new Error('Both User ID to delete and Admin User ID are required.');
  }

  if (userIdToDelete === adminUserId) {
    return { success: false, message: 'Administrators cannot delete their own account.' };
  }

  try {
    const { firestore, auth } = await initializeFirebase();

    // Verify the requesting user is an admin
    const adminDocRef = firestore.collection('users').doc(adminUserId);
    const adminDoc = await adminDocRef.get();
    
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
        return { success: false, message: 'Unauthorized: Only administrators can delete users.' };
    }

    // Delete from Firebase Authentication
    await auth.deleteUser(userIdToDelete);

    // Delete from Firestore
    const userDocRef = firestore.collection('users').doc(userIdToDelete);
    const batch = firestore.batch();
    batch.delete(userDocRef);

    // Optional: Clean up related data in other collections
    // For example, delete notifications for that user
    const notificationsRef = userDocRef.collection('notifications');
    const notificationsSnapshot = await notificationsRef.get();
    notificationsSnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    return { success: true, message: `User ${userIdToDelete} has been permanently deleted.` };

  } catch (error: any) {
    console.error(`Failed to delete user ${userIdToDelete}:`, error);

    // Handle case where user might already be deleted from auth but not firestore
    if (error.code === 'auth/user-not-found') {
        try {
            const userDocRef = getFirestore().collection('users').doc(userIdToDelete);
            await userDocRef.delete();
            return { success: true, message: 'User was already deleted from authentication, removed from database.' };
        } catch (dbError) {
             return { success: false, message: 'User not found in authentication. Failed to clean up database.' };
        }
    }

    return {
      success: false,
      message: error.message || 'An unknown error occurred during user deletion.',
    };
  }
}
