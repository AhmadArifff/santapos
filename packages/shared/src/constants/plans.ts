import { PlanCode } from '../enums/plans';

export interface PlanCapabilities {
  max_outlets: number;
  max_cashiers: number;
  has_self_order_qr: boolean;
  has_manual_payment: boolean;
  has_vouchers_rewards: boolean;
  has_recipe_hpp: boolean;
  has_central_warehouse: boolean;
  has_cashier_schedule: boolean;
  has_ai_assistant: boolean;
  has_custom_domain: boolean;
  can_remove_powered_by: boolean;
  can_export_pdf_reports: boolean;
  has_headquarters_overview: boolean;
}

export const PLAN_CAPABILITIES: Record<PlanCode, PlanCapabilities> = {
  [PlanCode.STARTER]: {
    max_outlets: 1,
    max_cashiers: 2,
    has_self_order_qr: true,
    has_manual_payment: true,
    has_vouchers_rewards: false,
    has_recipe_hpp: false,
    has_central_warehouse: false,
    has_cashier_schedule: false,
    has_ai_assistant: false,
    has_custom_domain: false,
    can_remove_powered_by: false,
    can_export_pdf_reports: false,
    has_headquarters_overview: false,
  },
  [PlanCode.PRO]: {
    max_outlets: 3,
    max_cashiers: 10,
    has_self_order_qr: true,
    has_manual_payment: true,
    has_vouchers_rewards: true,
    has_recipe_hpp: true,
    has_central_warehouse: true,
    has_cashier_schedule: true,
    has_ai_assistant: true,
    has_custom_domain: false,
    can_remove_powered_by: false,
    can_export_pdf_reports: true,
    has_headquarters_overview: false,
  },
  [PlanCode.FRANCHISE]: {
    max_outlets: 9999,
    max_cashiers: 9999,
    has_self_order_qr: true,
    has_manual_payment: true,
    has_vouchers_rewards: true,
    has_recipe_hpp: true,
    has_central_warehouse: true,
    has_cashier_schedule: true,
    has_ai_assistant: true,
    has_custom_domain: true,
    can_remove_powered_by: true,
    can_export_pdf_reports: true,
    has_headquarters_overview: true,
  },
};

export type FeatureKey = keyof PlanCapabilities;
