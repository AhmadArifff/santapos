'use client';

import { useEffect } from 'react';
import { useWebsiteSettings } from '@/store/settingsStore';

export default function SettingsProvider({ children }) {
  const loadSettings = useWebsiteSettings((state) => state.loadSettings);

  useEffect(() => {
    loadSettings().catch(() => {});
  }, [loadSettings]);

  return <>{children}</>;
}
