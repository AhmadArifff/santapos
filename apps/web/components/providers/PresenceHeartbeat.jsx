'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { sendPresenceHeartbeat } from '@/lib/api';

export default function PresenceHeartbeat() {
  const token = useAuthStore((state) => state.token);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const ping = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
        sendPresenceHeartbeat().catch(() => {});
      }
    };

    // Kirim heartbeat saat tab dibuka / pertama kali aktif
    ping();

    // Kirim heartbeat berkala setiap 45 detik selama tab aktif
    timerRef.current = setInterval(ping, 45000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };

    const onBeforeUnload = () => {
      try {
        const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const baseUrl = rawBaseUrl.replace(/\/+$/, '').endsWith('/api')
          ? rawBaseUrl.replace(/\/+$/, '')
          : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

        navigator.sendBeacon(`${baseUrl}/auth/leave?token=${encodeURIComponent(token)}`);
      } catch (_) {}
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [token]);

  return null;
}

