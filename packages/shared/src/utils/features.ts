import { PlanCode } from '../enums/plans';
import { FeatureKey, PLAN_CAPABILITIES, PlanCapabilities } from '../constants/plans';

export interface TenantPlanContext {
  plan_code?: PlanCode | string;
  feature_overrides?: Partial<PlanCapabilities> | Record<string, boolean | number> | null;
}

export const canAccessFeature = (
  tenant: TenantPlanContext | null | undefined,
  feature: FeatureKey
): boolean => {
  if (!tenant) return false;

  // Check manual overrides first if configured
  if (tenant.feature_overrides && tenant.feature_overrides[feature] !== undefined) {
    return Boolean(tenant.feature_overrides[feature]);
  }

  const planCode = (tenant.plan_code as PlanCode) || PlanCode.STARTER;
  const capabilities = PLAN_CAPABILITIES[planCode] || PLAN_CAPABILITIES[PlanCode.STARTER];
  return Boolean(capabilities[feature]);
};
