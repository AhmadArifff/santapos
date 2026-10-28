'use client';

import { useState, useEffect } from 'react';
import {
  getDatabaseConfig,
  testDatabaseConnection,
  updateDatabaseConfig,
  pingDatabaseKeepAlive,
} from '@/lib/api';

export default function DatabaseSettingsPanel() {
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState('supabase');
  const [connectionString, setConnectionString] = useState('');
  const [storageBucket, setStorageBucket] = useState('restaurant-pos-assets');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getDatabaseConfig();
      const data = res.data?.data;
      if (data) {
        setConfigData(data);
        setSelectedProvider(data.active_provider || 'supabase');
        setStorageBucket(data.storage?.bucket || 'restaurant-pos-assets');
        setSupabaseUrl(data.storage?.url || '');
      }
    } catch (err) {
      console.error('[fetchConfig error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSelectPreset = (provider) => {
    setSelectedProvider(provider.id);
    setTestResult(null);
    if (provider.format_hint) {
      setConnectionString(provider.format_hint);
    }
  };

  const handleTestConnection = async () => {
    if (!connectionString.trim()) {
      setFeedback({ type: 'error', text: 'Masukkan connection string terlebih dahulu' });
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    setFeedback(null);

    try {
      const res = await testDatabaseConnection({ connection_string: connectionString });
      setTestResult({
        success: true,
        message: res.data?.message || 'Koneksi database berhasil diverifikasi!',
        details: res.data?.data,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Gagal terhubung ke database',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!connectionString.trim()) {
      setFeedback({ type: 'error', text: 'Connection string wajib diisi' });
      return;
    }
    setSaveLoading(true);
    setFeedback(null);

    try {
      await updateDatabaseConfig({
        connection_string: connectionString,
        storage_bucket: storageBucket,
        supabase_url: supabaseUrl,
        supabase_service_role_key: serviceRoleKey,
      });
      setFeedback({ type: 'success', text: 'Konfigurasi database cloud berhasil disimpan dan aktif!' });
      fetchConfig();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message || 'Gagal menyimpan konfigurasi' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleHeartbeatPing = async () => {
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await pingDatabaseKeepAlive();
      setPingResult({
        success: true,
        message: res.data?.message || 'Heartbeat keep-alive berhasil dikirim!',
        data: res.data?.data,
      });
    } catch (err) {
      setPingResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Gagal mengirim heartbeat ping',
      });
    } finally {
      setPingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        <span className="inline-block animate-spin mr-2">⏳</span>
        Memuat status koneksi database cloud...
      </div>
    );
  }

  const conn = configData?.connection || {};
  const storage = configData?.storage || {};
  const providers = configData?.supported_providers || [];

  return (
    <div className="space-y-6">
      {/* Active Database Health Card */}
      <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-extrabold text-white text-lg">Database Cloud Aktif</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                {configData?.active_provider?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Engine: <span className="text-slate-200 font-mono">{configData?.version?.split(' on ')[0] || 'PostgreSQL'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span className="text-slate-400">Latency: </span>
              <span className="font-mono font-bold text-emerald-400">{configData?.latency_ms} ms</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span className="text-slate-400">Tabel: </span>
              <span className="font-mono font-bold text-amber-300">{configData?.total_tables} tabel</span>
            </div>
          </div>
        </div>

        {/* Connection Parameters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Host Pooler</span>
            <span className="font-mono text-slate-200 truncate block" title={conn.host}>{conn.host || '-'}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Port</span>
            <span className="font-mono text-amber-300 font-bold">{conn.port || 6543}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Database</span>
            <span className="font-mono text-slate-200">{conn.database || 'postgres'}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Storage Bucket</span>
            <span className="font-mono text-emerald-400 font-semibold truncate block">{storage.bucket || 'restaurant-pos-assets'}</span>
          </div>
        </div>
      </div>

      {/* 2 Curated Cloud Database Providers (Supabase vs Neon) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-base">⚡</span>
            <h4 className="font-bold text-white text-base">2 Database Cloud Resmi Santapos (Free Selamanya)</h4>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Santapos telah dikurasi khusus untuk mendukung 2 opsi cloud database terbaik: Supabase (All-in-One + S3 Storage) dan Neon (Serverless Murni Auto Wake-up).
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {providers.map((p) => {
            const isSelected = selectedProvider === p.id;
            const isSupabase = p.id === 'supabase';

            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`cursor-pointer p-5 rounded-2xl border transition-all relative ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/50 shadow-lg'
                    : 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isSupabase ? '⚡' : '🚀'}</span>
                    <h5 className="font-extrabold text-white text-sm">{p.name}</h5>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isSupabase
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {p.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2 font-medium">{p.free_tier}</p>

                {/* Keunggulan List */}
                <div className="mt-3.5 space-y-1.5 border-t border-slate-700/60 pt-3">
                  {p.advantages?.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span>✓</span> 100% Siap Pakai
                  </span>
                  <a
                    href={p.docs_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-amber-400 hover:text-amber-300 font-semibold transition"
                  >
                    Buka Website Resmi →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supabase Keep-Alive / Anti-Pause Toolkit */}
      {configData?.active_provider === 'supabase' && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm font-bold">🛡️ Fitur Anti-Pause Supabase</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Heartbeat Keep-Alive</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Supabase mem-pause database free tier jika 7 hari tanpa query. Kirim query heartbeat secara berkala agar database tetap aktif selamanya tanpa pernah di-hold!
              </p>
            </div>

            <button
              type="button"
              onClick={handleHeartbeatPing}
              disabled={pingLoading}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-2 whitespace-nowrap"
            >
              {pingLoading ? '⏳ Mengirim Ping...' : '💓 Kirim Heartbeat Ping'}
            </button>
          </div>

          {pingResult && (
            <div className={`mt-3 p-3 rounded-xl border text-xs ${
              pingResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <span className="font-bold mr-2">{pingResult.success ? '✅' : '❌'}</span>
              <span>{pingResult.message}</span>
              {pingResult.data && (
                <span className="font-mono text-[11px] opacity-80 ml-2">
                  (Latency: {pingResult.data.latency_ms} ms | Waktu: {new Date(pingResult.data.ping_time).toLocaleTimeString()})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Connection Editor & Tester */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div>
          <h4 className="font-bold text-white text-base">Ganti / Sambungkan Database Cloud</h4>
          <p className="text-slate-400 text-xs mt-1">
            Masukkan connection string dari <strong className="text-amber-300">Supabase</strong> atau <strong className="text-cyan-300">Neon</strong>, lalu klik Uji Koneksi sebelum disimpan.
          </p>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl text-sm font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {feedback.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              PostgreSQL Connection String (URI) *
            </label>
            <input
              type="text"
              placeholder="postgresql://user:password@host:port/database?sslmode=require"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-400 text-amber-200 font-mono text-xs outline-none transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {selectedProvider === 'supabase'
                ? 'Format Supabase: postgresql://postgres.[REF]:[PASS]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require'
                : 'Format Neon: postgresql://[USER]:[PASS]@[ENDPOINT].neon.tech/neondb?sslmode=require'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Supabase Project URL (Jika pakai Supabase Storage)
              </label>
              <input
                type="text"
                placeholder="https://[PROJECT-REF].supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-400 text-white text-xs outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Storage Bucket Name
              </label>
              <input
                type="text"
                placeholder="restaurant-pos-assets"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-400 text-white text-xs outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>{testResult.success ? '✅' : '❌'}</span>
              <span>{testResult.message}</span>
            </div>
            {testResult.details && (
              <div className="font-mono text-[11px] opacity-90 space-y-1 pt-1 border-t border-emerald-500/20">
                <div>Provider Terdeteksi: <strong className="text-white">{testResult.details.provider?.toUpperCase()}</strong></div>
                <div>Latensi Ping: <strong className="text-emerald-400">{testResult.details.latency_ms} ms</strong></div>
                <div>Server Database: {testResult.details.version?.split(' on ')[0]}</div>
                <div>Nama Database: {testResult.details.database}</div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testLoading}
            className="px-5 py-2.5 rounded-xl border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 text-xs font-bold transition flex items-center gap-2"
          >
            {testLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Menguji Koneksi...</span>
              </>
            ) : (
              <>
                <span>⚡ Test Koneksi Database</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={saveLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            {saveLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <span>💾 Simpan & Aktifkan Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
