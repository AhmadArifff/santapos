'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthGuard({ children, adminOnly = false }) {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Beri waktu zustand selesai hydrate dari localStorage/IndexedDB
    const timer = setTimeout(() => setHydrated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) { router.replace('/login'); return; }
    if (adminOnly && user?.role !== 'admin') { router.replace('/pos'); return; }
  }, [hydrated, token, user, adminOnly, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D0A06]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent
            rounded-full animate-spin" />
          <p className="text-[#9E8E6E] text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;
  if (adminOnly && user?.role !== 'admin') return null;

  return children;
}
