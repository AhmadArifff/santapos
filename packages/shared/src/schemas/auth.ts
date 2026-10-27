import { z } from 'zod';
import { UserRole } from '../enums/roles';

export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum([UserRole.SUPERADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR]).default(UserRole.KASIR),
  branch_id: z.number().nullable().optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
