import { z } from "zod";

export const clothingItemSchema = z.object({
  imageUrl: z.string().optional(),
  type: z.string().min(2, {
    message: "Le type est requis (ex: T-shirt, Pantalon).",
  }),
  color: z.string().optional(),
  style: z.string().optional(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  notes: z.string().optional(),
});
