'use client';
/**
 * @fileOverview A flow for securely deleting a user from the system.
 *
 * - deleteUser - Calls the server action to delete a user from Firebase Authentication and Firestore.
 * - DeleteUserInput - The input type for the deleteUser function.
 */

import { getAuth } from 'firebase/auth';

export interface DeleteUserInput {
  userId: string;
}

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean; message: string }> {
  const { userId } = input;
  
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    // Get the current user's authentication token
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('Not authenticated. Please log in.');
    }

    const authToken = await currentUser.getIdToken();

    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, authToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete user: ${response.statusText}`);
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

