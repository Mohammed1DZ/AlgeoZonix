'use server';
/**
 * @fileOverview Main KYC decision engine flow.
 *
 * - kycDecision - Orchestrates the entire driver verification process.
 * - KycDecisionInput - The input type for the kycDecision function.
 * - KycDecisionOutput - The return type for the kycDecision function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { processDocument, ProcessDocumentOutput } from './process-document-flow';
import { facialVerification, FacialVerificationOutput } from './facial-verification-flow';
import { initializeFirebase } from '@/firebase/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


// We can extract parts of the schema for re-use
const documentImagesSchema = z.object({
  licenseFront: z.string().describe("Data URI for the front of the driver's license."),
  licenseBack: z.string().describe("Data URI for the back of the driver's license."),
  registrationFront: z.string().describe("Data URI for the front of the vehicle registration."),
  registrationBack: z.string().describe("Data URI for the back of the vehicle registration."),
  vehiclePhoto: z.string().describe("Data URI for the vehicle's photo."),
  facePhoto: z.string().describe("Data URI for the user's selfie photo."),
});

const KycDecisionInputSchema = z.object({
  userId: z.string(),
  personalInfo: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    vehicleType: z.string(),
  }),
  documentImages: documentImagesSchema,
});
type KycDecisionInput = z.infer<typeof KycDecisionInputSchema>;

const KycDecisionOutputSchema = z.object({
  status: z.enum(['rejected', 'under_review']),
  decision: z.string().describe('The reason for the final decision.'),
  ocrResults: z.record(z.custom<ProcessDocumentOutput>()).optional(),
  facialVerificationResult: z.custom<FacialVerificationOutput>().optional(),
  facePhoto: z.string().describe("The user's selfie photo as a Data URI.").optional(),
});
type KycDecisionOutput = z.infer<typeof KycDecisionOutputSchema>;


export async function kycDecision(input: KycDecisionInput): Promise<KycDecisionOutput> {
  const kycDecisionFlow = ai.defineFlow(
    {
      name: 'kycDecisionFlow',
      inputSchema: KycDecisionInputSchema,
      outputSchema: KycDecisionOutputSchema,
    },
    async (input) => {
      console.log(`Starting KYC process for user: ${input.userId}`);
      
      const { firestore } = await initializeFirebase();

      // In a real app, these would run in parallel
      const licenseFrontResult = await processDocument({ documentDataUri: input.documentImages.licenseFront, documentType: 'license_front' });
      const licenseBackResult = await processDocument({ documentDataUri: input.documentImages.licenseBack, documentType: 'license_back' });
      // etc. for other documents...
  
      // For facial verification, we need a portrait from the license.
      // The processDocument flow for the license should ideally return a cropped portrait image URI.
      // For now, we'll just re-use the license front as a placeholder.
      const facialResult = await facialVerification({
          selfieDataUri: input.documentImages.facePhoto,
          documentPortraitDataUri: input.documentImages.licenseFront, // Placeholder
      });
      
      let finalDecision: KycDecisionOutput;

      // --- Decision Logic ---
      // This is a simplified decision tree. A real one would be more complex.
      if (!licenseFrontResult.isValid || !facialResult.isMatch) {
        finalDecision = {
          status: 'rejected',
          decision: 'Failed initial document or facial verification.',
          ocrResults: { licenseFront: licenseFrontResult, licenseBack: licenseBackResult },
          facialVerificationResult: facialResult,
        };
      }
  
      else if (facialResult.livenessScore < 0.9 || facialResult.faceMatchScore < 0.85) {
          finalDecision = {
              status: 'under_review',
              decision: 'Facial verification scores are borderline. Requires manual review.',
              ocrResults: { licenseFront: licenseFrontResult, licenseBack: licenseBackResult },
              facialVerificationResult: facialResult,
          };
      }
  
      else {
        finalDecision = {
          status: 'under_review',
          decision: 'All checks passed. Application submitted for manual review.',
          ocrResults: { licenseFront: licenseFrontResult, licenseBack: licenseBackResult },
          facialVerificationResult: facialResult,
          facePhoto: input.documentImages.facePhoto,
        };
      }
      
      // Send notification
      const notificationsRef = collection(firestore, 'users', input.userId, 'notifications');
      await addDoc(notificationsRef, {
          userId: input.userId,
          message: `Your verification status is now: ${finalDecision.status}. Reason: ${finalDecision.decision}`,
          isRead: false,
          createdAt: serverTimestamp(),
          link: '/rider/dashboard'
      });

      return finalDecision;
    }
  );
  return await kycDecisionFlow(input);
}
