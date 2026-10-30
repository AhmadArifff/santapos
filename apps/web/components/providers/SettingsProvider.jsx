'use client';

import { useEffect } from 'react';
import { useWebsiteSettings } from '@/store/settingsStore';
import PresenceHeartbeat from './PresenceHeartbeat';

export default function SettingsProvider({ children }) {
  const loadSettings = useWebsiteSettings((state) => state.loadSettings);

  useEffect(() => {
    loadSettings().catch(() => {});
  }, [loadSettings]);

  return (
    <>
      <PresenceHeartbeat />
      {children}
    </>
  );
}
