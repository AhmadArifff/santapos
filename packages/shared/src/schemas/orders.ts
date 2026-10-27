import { z } from 'zod';
import { CustomerOrderStatus } from '../enums/orders';

export const customerOrderItemSchema = z.object({
  product_id: z.number().int().positive('Product ID tidak valid'),
  product_name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  price: z.number().nonnegative('Harga tidak boleh negatif'),
  qty: z.number().int().positive('Jumlah minimal 1'),
  note: z.string().trim().max(255).optional().nullable(),
});

export const createCustomerOrderSchema = z.object({
  table_token: z.string().trim().min(1, 'Token meja tidak valid'),
  customer_name: z.string().trim().min(2, 'Nama pemesan minimal 2 karakter').max(100),
  customer_phone: z.string().trim().min(9, 'Nomor telepon minimal 9 digit').max(20),
  items: z.array(customerOrderItemSchema).min(1, 'Pesanan minimal berisi 1 item'),
  voucher_code: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export type CreateCustomerOrderInput = z.infer<typeof createCustomerOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    CustomerOrderStatus.PENDING,
    CustomerOrderStatus.ACCEPTED,
    CustomerOrderStatus.PREPARING,
    CustomerOrderStatus.READY,
    CustomerOrderStatus.COMPLETED,
    CustomerOrderStatus.CANCELLED,
  ]),
  cancel_reason: z.string().trim().max(500).optional().nullable(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
