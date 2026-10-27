'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import AuthGuard from '@/components/ui/AuthGuard';
import AIChatBox from '@/components/admin/AIChatBox';
import { useEffect } from 'react';
import { checkAIChatHealth } from '@/lib/api';

/**
 * AI Chat Admin Page
 * Admin-only page untuk chat dengan AI tentang business data
 */
export default function AIChatPage() {
  useEffect(() => {
    // Optional: Check AI service health
    checkAIChatHealth()
      .then(() => console.log('✅ AI Chat service is ready'))
      .catch(() => console.log('⚠️ AI Chat service might be unavailable'));
  }, []);

  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🤖 AI Assistant</h1>
            <p className="text-gray-600 mt-1">
              Tanya AI tentang penjualan, stok, profit, dan analisis bisnis Anda
            </p>
          </div>

          {/* Main Chat Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Box - Main */}
            <div className="lg:col-span-2 h-[600px]">
              <AIChatBox />
            </div>

            {/* Info Sidebar */}
            <div className="space-y-4">
              {/* Features Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">📊 Fitur AI Chat</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>✅ Analisis penjualan real-time</li>
                  <li>✅ Perhitungan profit & HPP</li>
                  <li>✅ Status stok & reorder</li>
                  <li>✅ Performa produk terlaris</li>
                  <li>✅ Laporan by periode</li>
                  <li>✅ Insight staff performance</li>
                </ul>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-3">💡 Tips Bertanya</h3>
                <ul className="text-xs text-amber-800 space-y-2">
                  <li>
                    <strong>Spesifik:</strong> "Revenue bulan Januari" lebih baik dari "berapa revenue"
                  </li>
                  <li>
                    <strong>Range waktu:</strong> "Penjualan 7 hari terakhir"
                  </li>
                  <li>
                    <strong>Analisis:</strong> "Dibanding bulan lalu, apakah naik?"
                  </li>
                  <li>
                    <strong>Aksi:</strong> "Produk apa yang perlu promosi?"
                  </li>
                </ul>
              </div>

              {/* Data Available */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">📈 Data Tersedia</h3>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>• Transactions</li>
                  <li>• Products & Categories</li>
                  <li>• Stock & Inventory</li>
                  <li>• Ingredients & Recipes</li>
                  <li>• Financial Metrics</li>
                  <li>• Staff Attendance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Developer Info - Only in dev mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600 border border-gray-300">
              <p className="font-mono">
                🔧 Backend: <code>POST /api/ai-chat/query</code> | Powered by OpenRouter (multi-model)
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
