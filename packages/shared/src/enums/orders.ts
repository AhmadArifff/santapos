export const CustomerOrderStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type CustomerOrderStatus = (typeof CustomerOrderStatus)[keyof typeof CustomerOrderStatus];

export const CustomerPaymentStatus = {
  UNPAID: 'unpaid',
  PAID: 'paid',
} as const;

export type CustomerPaymentStatus = (typeof CustomerPaymentStatus)[keyof typeof CustomerPaymentStatus];

export const ORDER_STATUS_LABELS: Record<CustomerOrderStatus, string> = {
  pending: 'Menunggu Konfirmasi',
  accepted: 'Diterima Dapur',
  preparing: 'Sedang Disiapkan',
  ready: 'Siap Diantar',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const ACTIVE_ORDER_STATUSES: CustomerOrderStatus[] = [
  CustomerOrderStatus.PENDING,
  CustomerOrderStatus.ACCEPTED,
  CustomerOrderStatus.PREPARING,
  CustomerOrderStatus.READY,
];

export const ORDER_STATUS_TRANSITIONS: Record<CustomerOrderStatus, CustomerOrderStatus | null> = {
  pending: CustomerOrderStatus.ACCEPTED,
  accepted: CustomerOrderStatus.PREPARING,
  preparing: CustomerOrderStatus.READY,
  ready: CustomerOrderStatus.COMPLETED,
  completed: null,
  cancelled: null,
};
