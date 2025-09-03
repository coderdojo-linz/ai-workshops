import { z } from 'zod/v4';

// Schema for individual exercise objects
const PromptSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().optional(), // ISO date string
});

// Schema for the entire exercises file
const PromptsFileSchema = z.object({
  prompts: z.record(z.string(), PromptSchema)
});

// Type inference from the schema
type Prompt = z.infer<typeof PromptSchema>;
type PromptsFile = z.infer<typeof PromptsFileSchema>;

// Function to validate the prompts file
export function validatePromptsFile(data: unknown): PromptsFile {
  return PromptsFileSchema.parse(data);
}

// Function for safe validation (returns result object instead of throwing)
export function safeValidatePromptsFile(data: unknown) {
  return PromptsFileSchema.safeParse(data);
}

// Export schemas and types
export { PromptSchema, PromptsFileSchema };
export type { Prompt, PromptsFile };

