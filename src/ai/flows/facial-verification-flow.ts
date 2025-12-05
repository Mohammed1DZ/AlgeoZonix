'use server';
/**
 * @fileOverview A flow for performing facial verification.
 *
 * - facialVerification - Simulates liveness checks and face matching.
 * - FacialVerificationInput - The input type for the facialVerification function.
 * - FacialVerificationOutput - The return type for the facialVerification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FacialVerificationInputSchema = z.object({
  selfieDataUri: z
    .string()
    .describe(
      "A selfie photo/video frame as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentPortraitDataUri: z
    .string()
    .describe(
      "The portrait image from the ID document, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FacialVerificationInput = z.infer<typeof FacialVerificationInputSchema>;

const FacialVerificationOutputSchema = z.object({
  livenessScore: z.number().describe('A score from 0 to 1 indicating the likelihood the user is a real, live person.'),
  faceMatchScore: z.number().describe('A score from 0 to 1 indicating the similarity between the selfie and the document portrait.'),
  isMatch: z.boolean().describe('Whether the face is considered a match based on internal thresholds.'),
  spoofFlags: z.array(z.string()).describe('Flags for any detected spoofing attempts.'),
});
export type FacialVerificationOutput = z.infer<typeof FacialVerificationOutputSchema>;


export async function facialVerification(input: FacialVerificationInput): Promise<FacialVerificationOutput> {
  const facialVerificationFlow = ai.defineFlow(
    {
      name: 'facialVerificationFlow',
      inputSchema: FacialVerificationInputSchema,
      outputSchema: FacialVerificationOutputSchema,
    },
    async (input) => {
      const prompt = ai.definePrompt({
        name: 'facialVerificationPrompt',
        input: { schema: FacialVerificationInputSchema },
        output: { schema: FacialVerificationOutputSchema },
        prompt: `You are a facial recognition and liveness detection expert. 
        Your task is to compare a selfie photo with a portrait from an ID document.
        
        1.  **Liveness Check**: Analyze the selfie for signs of being a real person (e.g., not a photo of a photo, not a screen). Provide a 'livenessScore' between 0 and 1. A score below 0.9 should be considered suspicious.
        2.  **Face Match**: Compare the face in the selfie with the face in the document portrait. Provide a 'faceMatchScore' between 0 and 1.
        3.  **Decision**: Set 'isMatch' to true only if the liveness score is 0.9 or higher AND the face match score is 0.85 or higher.
        4.  **Flags**: If you detect any potential spoofing attempts (e.g., screen glare, poor quality, digital manipulation), add a descriptive flag to the 'spoofFlags' array.

        Selfie Image:
        {{media url=selfieDataUri}}
        
        ID Document Portrait:
        {{media url=documentPortraitDataUri}}
        `,
      });

      const { output } = await prompt(input);
      return output!;
    }
  );

  return await facialVerificationFlow(input);
}
