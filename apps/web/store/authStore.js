import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      selectedBranchId: null,

      setAuth: (user, token) => {
        // Simpan juga di key 'token' untuk kompatibilitas axios interceptor lama
        localStorage.setItem('token', token);
        set({
          user,
          token,
          selectedBranchId: user?.default_branch_id || user?.branch_id || get().selectedBranchId || null,
        });
      },

      setBranch: (branchId, branch = null) => set((state) => ({
        selectedBranchId: branchId ? Number(branchId) : null,
        user: state.user
          ? {
              ...state.user,
              default_branch_id: branchId ? Number(branchId) : null,
              branch_name: branch?.name || state.user.branch_name,
              branch_key: branch?.branch_key || state.user.branch_key,
            }
          : state.user,
      })),

      logout: async () => {
        try {
          const token = get().token;
          if (token) {
            const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const baseUrl = rawBaseUrl.replace(/\/+$/, '').endsWith('/api')
                ? rawBaseUrl.replace(/\/+$/, '')
                : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

            await fetch(`${baseUrl}/auth/logout`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } catch (_) {}
        localStorage.removeItem('token');
        set({ user: null, token: null, selectedBranchId: null });
      },
    }),
    {
      name: 'auth-store',
      // Untuk PWA — pastikan storage tersedia
      storage: {
        getItem: (name) => {
          try {
            return JSON.parse(localStorage.getItem(name));
          } catch { return null; }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (_) {}
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (_) {}
        },
      },
    }
  )
);
