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
import { doc, deleteDoc } from 'firebase/firestore';


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
      await auth.deleteUser(userId);
      console.log(`Successfully deleted user ${userId} from Firebase Auth.`);

      // 2. Delete user document from Firestore
      const userDocRef = doc(firestore, 'users', userId);
      await deleteDoc(userDocRef);
      console.log(`Successfully deleted user document for ${userId} from Firestore.`);
      
      return {
        success: true,
        message: `User ${userId} has been successfully deleted.`,
      };
    } catch (error: any) {
      console.error(`Failed to delete user ${userId}:`, error);
      // Log the error but return a structured response
      return {
        success: false,
        message: error.message || 'An unknown error occurred during user deletion.',
      };
    }
  }
);
