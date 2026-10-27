export const PlanCode = {
  STARTER: 'starter',
  PRO: 'pro',
  FRANCHISE: 'franchise',
} as const;

export type PlanCode = (typeof PlanCode)[keyof typeof PlanCode];

export const PLAN_NAMES: Record<PlanCode, string> = {
  starter: 'Santapos Starter (UMKM)',
  pro: 'Santapos Pro',
  franchise: 'Santapos Franchise Multi-Cabang',
};
