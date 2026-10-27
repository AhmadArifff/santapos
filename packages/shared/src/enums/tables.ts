export const DiningTableStatus = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
} as const;

export type DiningTableStatus = (typeof DiningTableStatus)[keyof typeof DiningTableStatus];

export const TableSessionStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  RELEASED: 'released',
} as const;

export type TableSessionStatus = (typeof TableSessionStatus)[keyof typeof TableSessionStatus];
