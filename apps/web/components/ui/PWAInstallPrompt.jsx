'use client';
import { useEffect, useState } from 'react';

export function usePWAInstall() {
  return {
    show: () => {
      window.dispatchEvent(new CustomEvent('pwa-show-prompt'));
    }
  };
}

export default function PWAInstallPrompt({ autoShow = true, delayMs = 1500 }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [isIOS, setIsIOS]                   = useState(false);
  const [isInstalled, setIsInstalled]       = useState(false);
  const [installing, setInstalling]         = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // ✅ Fix: hapus "as any" — pakai optional chaining biasa
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    const dismissedUntil = localStorage.getItem('pwa-dismissed-until');
    const isDismissed = dismissedUntil && Date.now() < Number(dismissedUntil);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (autoShow && !isDismissed) {
        setTimeout(() => setShowModal(true), delayMs);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (ios && autoShow && !isDismissed) {
      setTimeout(() => setShowModal(true), delayMs);
    }

    const manualHandler = () => setShowModal(true);
    window.addEventListener('pwa-show-prompt', manualHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-show-prompt', manualHandler);
    };
  }, [autoShow, delayMs]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowModal(false);
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    const until = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa-dismissed-until', String(until));
  };

  if (isInstalled || !showModal) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={handleDismiss} />

      <div className="fixed bottom-0 left-0 right-0 z-[101] p-4
        sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:max-w-sm sm:w-full">
        <div className="bg-slate-800 rounded-2xl border border-slate-700
          shadow-2xl shadow-black/60 overflow-hidden"
          style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 relative">
            <button onClick={handleDismiss}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20
                hover:bg-black/40 text-white flex items-center justify-center
                text-sm transition-colors">✕</button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 overflow-hidden
                shadow-lg shrink-0 border-2 border-white/30">
                <img src="/images/assets/logo.png" alt="Logo"
                  className="w-full h-full object-contain p-1.5"
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <div>
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-0.5">
                  Install Aplikasi
                </p>
                <p className="text-white font-black text-xl leading-tight">Bang.Han POS</p>
                <p className="text-white/70 text-xs mt-1">Lumpia Beef · Point of Sale</p>
              </div>
            </div>
          </div>

          {/* Fitur */}
          <div className="p-4">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
              Keuntungan install
            </p>
            <div className="space-y-2">
              {[
                { icon: '⚡', title: 'Lebih cepat',    sub: 'Buka tanpa browser, langsung dari homescreen' },
                { icon: '📱', title: 'Fullscreen',     sub: 'Tampilan penuh tanpa address bar' },
                { icon: '🔒', title: 'Aman & offline', sub: 'Data tersimpan lokal saat koneksi putus' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-700/40
                  rounded-xl px-3 py-2.5 border border-slate-700/40">
                  <span className="text-xl mt-0.5">{f.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{f.title}</p>
                    <p className="text-slate-500 text-xs">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* iOS Instructions */}
          {isIOS && (
            <div className="mx-4 mb-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-400 text-xs font-bold mb-2">
                📋 Cara install di iPhone / iPad:
              </p>
              {[
                { n:'1', t:'Buka di Safari (wajib)',               sub:'Tidak bisa dari Chrome/Firefox' },
                { n:'2', t:'Ketuk tombol Share ↑',                 sub:'Di bagian bawah atau atas browser' },
                { n:'3', t:'Pilih "Tambahkan ke Layar Utama"',     sub:'Scroll ke bawah jika tidak terlihat' },
                { n:'4', t:'Ketuk "Tambahkan"',                    sub:'Di pojok kanan atas' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-2.5 mb-2 last:mb-0">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px]
                    font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.n}
                  </span>
                  <div>
                    <p className="text-slate-300 text-xs font-medium">{s.t}</p>
                    <p className="text-slate-600 text-xs">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2.5 p-4 pt-2">
            <button onClick={handleDismiss}
              className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600
                text-slate-300 text-sm font-semibold transition-colors">
              Nanti Saja
            </button>
            {isIOS ? (
              <button onClick={handleDismiss}
                className="flex-[2] py-3 rounded-xl bg-blue-500 hover:bg-blue-400
                  text-white text-sm font-bold transition-colors">
                Mengerti ✓
              </button>
            ) : (
              <button onClick={handleInstall} disabled={installing || !deferredPrompt}
                className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-400
                  disabled:opacity-50 text-white text-sm font-bold transition-colors
                  shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2">
                {installing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white
                      rounded-full animate-spin" />
                    Menginstall...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v13M7 11l5 5 5-5M3 19h18"/>
                    </svg>
                    Install Sekarang
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}