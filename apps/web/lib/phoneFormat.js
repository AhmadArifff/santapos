const COUNTRY_CODE = '+62';

export const formatIndonesianPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  let local = digits;

  if (local.startsWith('62')) local = local.slice(2);
  if (local.startsWith('0')) local = local.replace(/^0+/, '');
  local = local.slice(0, 13);

  if (!local) return COUNTRY_CODE;

  const groups = [local.slice(0, 3), local.slice(3, 7), local.slice(7)].filter(Boolean);
  return `${COUNTRY_CODE}${groups.join('-')}`;
};

export const normalizeIndonesianPhoneForSubmit = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  let local = digits;

  if (local.startsWith('62')) local = local.slice(2);
  if (local.startsWith('0')) local = local.replace(/^0+/, '');

  return local.length >= 5 ? `62${local}` : '';
};
