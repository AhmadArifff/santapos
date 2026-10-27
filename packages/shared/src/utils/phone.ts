export const normalizePhoneNumber = (raw: string | null | undefined): string => {
  if (!raw) return '';
  let cleaned = String(raw).replace(/\D+/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '628' + cleaned.slice(1);
  }
  return cleaned;
};

export const formatPhoneNumber = (raw: string | null | undefined): string => {
  const normalized = normalizePhoneNumber(raw);
  if (!normalized) return '';
  if (normalized.startsWith('62') && normalized.length >= 10) {
    const p1 = normalized.slice(0, 2);
    const p2 = normalized.slice(2, 5);
    const p3 = normalized.slice(5, 9);
    const p4 = normalized.slice(9);
    return `+${p1} ${p2}-${p3}-${p4}`;
  }
  return normalized;
};
