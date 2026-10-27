import { z } from 'zod';
import { PlanCode } from '../enums/plans';

export const createTenantSchema = z.object({
  name: z.string().trim().min(2, 'Nama restoran minimal 2 karakter').max(120),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug minimal 3 karakter')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip (-)'),
  plan_code: z.enum([PlanCode.STARTER, PlanCode.PRO, PlanCode.FRANCHISE]).default(PlanCode.STARTER),
  owner_name: z.string().trim().min(2, 'Nama pemilik minimal 2 karakter').max(100),
  owner_email: z.string().trim().email('Format email pemilik tidak valid'),
  owner_password: z.string().min(6, 'Password pemilik minimal 6 karakter'),
  custom_domain: z.string().trim().max(120).optional().nullable(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const onboardingTenantSchema = z.object({
  store_name: z.string().trim().min(2, 'Nama toko minimal 2 karakter').max(100),
  branch_name: z.string().trim().min(2, 'Nama cabang minimal 2 karakter').max(100),
  phone: z.string().trim().min(9, 'Nomor telepon tidak valid').max(20),
  initial_category: z.string().trim().min(2, 'Nama kategori minimal 2 karakter').max(50),
  initial_product_name: z.string().trim().min(2, 'Nama menu minimal 2 karakter').max(100),
  initial_product_price: z.number().positive('Harga menu harus lebih dari 0'),
});

export type OnboardingTenantInput = z.infer<typeof onboardingTenantSchema>;
