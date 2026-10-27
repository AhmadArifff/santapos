export const DiscountProgramType = {
  REVIEW_REWARD: 'review_reward',
  VOUCHER: 'voucher',
  BUNDLE: 'bundle',
} as const;

export type DiscountProgramType = (typeof DiscountProgramType)[keyof typeof DiscountProgramType];

export const DiscountValueType = {
  PERCENT: 'percent',
  FIXED: 'fixed',
} as const;

export type DiscountValueType = (typeof DiscountValueType)[keyof typeof DiscountValueType];
