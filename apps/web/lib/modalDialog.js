'use client';

export const showConfirm = async (message, options = {}) => {
  if (typeof window === 'undefined') return false;
  if (typeof window.appConfirm === 'function') {
    return window.appConfirm(message, options);
  }
  return window.confirm(String(message || ''));
};

export const showPrompt = async (message, options = {}) => {
  if (typeof window === 'undefined') return null;
  if (typeof window.appPrompt === 'function') {
    return window.appPrompt(message, options);
  }
  return window.prompt(String(message || ''), options.defaultValue || '');
};
