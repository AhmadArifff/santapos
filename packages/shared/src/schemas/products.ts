import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Nama kategori minimal 2 karakter').max(100),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Nama produk minimal 2 karakter').max(150),
  price: z.number().positive('Harga produk harus lebih dari 0'),
  category_id: z.number().int().positive('Kategori harus dipilih'),
  image_url: z.string().optional().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
