'use server';
/**
 * @fileOverview A flow for securely deleting a user from the system.
 *
 * - deleteUser - Deletes a user from Firebase Authentication and Firestore.
 * - DeleteUserInput - The input type for the deleteUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch, Firestore } from 'firebase-admin/firestore';


const DeleteUserInputSchema = z.object({
  userId: z.string().describe('The UID of the user to be deleted.'),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean; message: string }> {
  return deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
    }),
  },
  async (input) => {
    const { userId } = input;
    if (!userId) {
        throw new Error('User ID is required.');
    }

    console.log(`Attempting to delete user: ${userId}`);

    try {
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
      
      return {
        success: true,
        message: `User ${userId} has been successfully deleted.`,
      };
    } catch (error: any) {
      console.error(`Failed to delete user ${userId}:`, error);
      // Return error message with more details
      const errorMessage = error.message || 'An unknown error occurred during user deletion.';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
);

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

