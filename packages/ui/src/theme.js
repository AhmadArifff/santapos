export const getThemeCssVariables = (settings = {}) => {
  const primary = settings.primary || settings.gold || '#C9A84C';
  const primaryLight = settings.primary_light || settings.gold_light || '#E8C96A';
  const dark = settings.dark || '#0D0A06';
  const dark2 = settings.dark2 || '#1A1409';
  const dark3 = settings.dark3 || '#241C0E';
  const cream = settings.cream || '#F5EDD8';
  const cream2 = settings.cream2 || '#EDE0C4';
  const accent = settings.accent || settings.red || '#8B1A1A';
  const text = settings.text || '#F5EDD8';
  const textMuted = settings.text_muted || '#9E8E6E';

  return {
    '--color-primary': primary,
    '--color-primary-light': primaryLight,
    '--color-dark': dark,
    '--color-dark2': dark2,
    '--color-dark3': dark3,
    '--color-cream': cream,
    '--color-cream2': cream2,
    '--color-accent': accent,
    '--color-text': text,
    '--color-text-muted': textMuted,
    // Backward compatibility for existing themes and styles
    '--gold': primary,
    '--gold-light': primaryLight,
    '--dark': dark,
    '--dark2': dark2,
    '--dark3': dark3,
    '--cream': cream,
    '--cream2': cream2,
    '--red': accent,
    '--text': text,
    '--text-muted': textMuted,
  };
};
