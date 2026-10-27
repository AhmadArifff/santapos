export const UserRole = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  ADMIN: 'admin',
  KASIR: 'kasir',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Admin Santapos',
  owner: 'Pemilik Restoran',
  admin: 'Manajer / Admin Cabang',
  kasir: 'Kasir',
};
