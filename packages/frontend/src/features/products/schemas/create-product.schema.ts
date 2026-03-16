import { z } from 'zod';

export const createProductSchema = z.object({
  source_url: z.string().url('Please enter a valid URL').min(1, 'URL is required'),
  source_title: z.string().min(1, 'Title is required'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
