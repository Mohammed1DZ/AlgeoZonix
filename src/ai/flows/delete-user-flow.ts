'use client';
/**
 * @fileOverview A flow for securely deleting a user from the system.
 *
 * - deleteUser - Calls the API endpoint to delete a user from Firebase Authentication and Firestore.
 * - DeleteUserInput - The input type for the deleteUser function.
 */

import { z } from 'zod';

const DeleteUserInputSchema = z.object({
  userId: z.string().describe('The UID of the user to be deleted.'),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean; message: string }> {
  const { userId } = input;
  
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete user');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`Failed to delete user ${userId}:`, error);
    return {
      success: false,
      message: error.message || 'An unknown error occurred during user deletion.',
    };
  }
}

