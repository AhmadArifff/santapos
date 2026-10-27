export const StockMovementType = {
  IN: 'IN',
  OUT: 'OUT',
} as const;

export type StockMovementType = (typeof StockMovementType)[keyof typeof StockMovementType];

export const MainStockSource = {
  PURCHASE: 'purchase',
  REQUEST: 'request',
  ADJUSTMENT: 'adjustment',
  TRANSACTION: 'transaction',
} as const;

export type MainStockSource = (typeof MainStockSource)[keyof typeof MainStockSource];

export const StockRequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type StockRequestStatus = (typeof StockRequestStatus)[keyof typeof StockRequestStatus];

export const StockIssueReason = {
  EXPIRED: 'expired',
  DAMAGED: 'damaged',
  LOST: 'lost',
  OTHER: 'other',
} as const;

export type StockIssueReason = (typeof StockIssueReason)[keyof typeof StockIssueReason];

export const StockIssueStatus = {
  REPORTED: 'reported',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
} as const;

export type StockIssueStatus = (typeof StockIssueStatus)[keyof typeof StockIssueStatus];
