export const PaymentMethodType = {
  CASH: 'cash',
  QRIS: 'qris',
  TRANSFER: 'transfer',
} as const;

export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  cash: 'Tunai di Kasir',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
};
