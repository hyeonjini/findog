import { z } from 'zod';

export const updateProductSchema = z.object({
  source_title: z.string().min(1, 'Title cannot be empty').optional(),
  restock_alert_enabled: z.boolean().optional(),
  lowest_price_tracking_enabled: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
