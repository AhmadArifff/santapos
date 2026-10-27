export const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(num);
};

export const parseCurrency = (formatted: string | null | undefined): number => {
  if (!formatted) return 0;
  const cleaned = String(formatted).replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
};
