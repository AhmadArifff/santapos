import { z } from 'zod';
import { DiningTableStatus } from '../enums/tables';

export const createDiningTableSchema = z.object({
  table_number: z.string().trim().min(1, 'Nomor meja wajib diisi').max(30),
  table_name: z.string().trim().max(100).optional().nullable(),
  capacity: z.number().int().min(1, 'Kapasitas minimal 1 orang').default(2),
  branch_id: z.number().int().positive().optional().nullable(),
  note: z.string().trim().max(255).optional().nullable(),
});

export const updateDiningTableSchema = createDiningTableSchema.extend({
  status: z.enum([DiningTableStatus.ACTIVE, DiningTableStatus.MAINTENANCE, DiningTableStatus.INACTIVE]).optional(),
});

export type CreateDiningTableInput = z.infer<typeof createDiningTableSchema>;
export type UpdateDiningTableInput = z.infer<typeof updateDiningTableSchema>;
