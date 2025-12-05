'use server';
/**
 * @fileOverview A flow for processing a document image with OCR.
 *
 * - processDocument - A function that simulates OCR processing on a document image.
 * - ProcessDocumentInput - The input type for the processDocument function.
 * - ProcessDocumentOutput - The return type for the processDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A photo of a document (e.g., driver's license), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z.enum(['license_front', 'license_back', 'registration_card']),
});
export type ProcessDocumentInput = z.infer<typeof ProcessDocumentInputSchema>;

const ProcessDocumentOutputSchema = z.object({
  ocrData: z.record(z.string()).describe('Extracted key-value pairs from the document.'),
  isValid: z.boolean().describe('Whether the document is considered valid.'),
  validationErrors: z.array(z.string()).describe('A list of reasons why the document is not valid.'),
});
export type ProcessDocumentOutput = z.infer<typeof ProcessDocumentOutputSchema>;

// Exported wrapper function to call the flow
export async function processDocument(input: ProcessDocumentInput): Promise<ProcessDocumentOutput> {
  const processDocumentFlow = ai.defineFlow(
    {
      name: 'processDocumentFlow',
      inputSchema: ProcessDocumentInputSchema,
      outputSchema: ProcessDocumentOutputSchema,
    },
    async (input) => {
      
      const prompt = ai.definePrompt({
        name: 'processDocumentPrompt',
        input: { schema: ProcessDocumentInputSchema },
        output: { schema: ProcessDocumentOutputSchema },
        prompt: `You are a document verification specialist. Your task is to analyze the provided image and determine if it is a valid document of the specified type.
        
        Document Type: {{{documentType}}}
        Document Image: {{media url=documentDataUri}}
        
        Follow these steps:
        1.  **Analyze Image**: Determine if the image provided is a clear, unobscured photo of a real '{{{documentType}}}'. It should not be a screenshot, a picture of a screen, a cartoon, or a clearly fake/nonsense image.
        2.  **Set Validity**: 
            - If the image is a legitimate photo of the specified document type, set 'isValid' to true.
            - If the image is blurry, cut off, or not a real document, set 'isValid' to false.
            - If 'isValid' is false, provide a clear reason in the 'validationErrors' array (e.g., "Image is blurry", "Image is not a driver's license", "Nonsense image provided").
        3.  **Extract Data (if valid)**: If the document is valid, attempt to extract relevant key-value pairs into 'ocrData'. If no data can be extracted, leave it as an empty object.
        `,
      });

      const { output } = await prompt(input);
      return output!;
    }
  );

  return await processDocumentFlow(input);
}
