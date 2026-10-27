import axios from 'axios';

const getApiBaseUrl = () => {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'];

const emitFeedback = (payload) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app:feedback', { detail: payload }));
};

const isFeedbackDisabled = (config = {}) => {
  const headerValue = config.headers?.['X-Silent-Feedback'] || config.headers?.['x-silent-feedback'];
  return config.feedback === false || headerValue === 'true';
};

const isFeedbackEnabled = (config = {}) => {
  if (isFeedbackDisabled(config)) return false;
  const method = String(config.method || 'get').toLowerCase();
  return MUTATION_METHODS.includes(method) || config.feedback === true;
};

const getSuccessMessage = (config = {}, data = {}) => {
  if (config.successMessage) return config.successMessage;
  if (data?.message) return data.message;

  const method = String(config.method || 'get').toLowerCase();
  const url = String(config.url || '');

  if (url.includes('/settings')) return 'Pengaturan berhasil disimpan.';
  if (url.includes('/products')) return method === 'delete' ? 'Produk berhasil dihapus.' : 'Produk berhasil disimpan.';
  if (url.includes('/auth/register')) return 'Data tim kasir berhasil disimpan.';
  if (url.includes('/customer/tables')) return method === 'delete' ? 'Data meja berhasil dinonaktifkan.' : 'Data meja berhasil disimpan.';
  if (url.includes('/customer/orders') && url.includes('/status')) return 'Status pesanan meja berhasil diperbarui.';
  if (url.includes('/stock-items')) return method === 'delete' ? 'Bahan baku berhasil dihapus.' : 'Bahan baku berhasil disimpan.';
  if (url.includes('/main-stock')) return method === 'delete' ? 'Data stok berhasil dihapus.' : 'Data stok berhasil disimpan.';
  if (url.includes('/stock-requests')) return 'Pengajuan stok berhasil diproses.';
  if (url.includes('/reports') && config.responseType === 'blob') return 'Laporan PDF berhasil dibuat.';

  if (method === 'delete') return 'Data berhasil dihapus.';
  if (method === 'post') return 'Data berhasil ditambahkan.';
  return 'Data berhasil disimpan.';
};

const getErrorMessage = (err) => {
  if (err?.response?.data?.message && err.response.status < 500) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK') return 'Tidak bisa terhubung ke server. Periksa koneksi atau status backend.';
  return 'Aksi gagal diproses. Silakan coba lagi.';
};

api.interceptors.request.use((config) => {
  try {
    // Baca dari zustand persist (key: auth-store)
    const stored = localStorage.getItem('auth-store');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
      const branchId = state?.selectedBranchId || state?.user?.default_branch_id || state?.user?.branch_id;
      if (branchId) {
        config.headers['X-Branch-Id'] = String(branchId);
      }
    } else {
      // Fallback ke token langsung (backward compat)
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// Auto logout jika 401 - tapi hanya redirect jika sudah ada token sebelumnya
api.interceptors.response.use(
  res => {
    if (isFeedbackEnabled(res.config)) {
      emitFeedback({
        type: 'success',
        title: 'Aksi Berhasil',
        message: getSuccessMessage(res.config, res.data),
      });
    }
    return res;
  },
  err => {
    if (err.response?.status === 401) {
      // Check apakah user sudah punya token (berarti sudah login sebelumnya)
      const stored = localStorage.getItem('auth-store');
      const hasToken = localStorage.getItem('token');
      
      if (stored || hasToken) {
        // Jika ada token sebelumnya, berarti user logout, hapus dan redirect
        localStorage.removeItem('auth-store');
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.location.replace('/login');
        }
      }
      // Jika tidak ada token sebelumnya (public request), jangan redirect
    }
    if (err.response?.status !== 401 && isFeedbackEnabled(err.config)) {
      emitFeedback({
        type: 'error',
        title: 'Aksi Gagal',
        message: getErrorMessage(err),
      });
    }
    return Promise.reject(err);
  }
);

export default api;
