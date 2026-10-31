'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

function classifyMessage(message) {
  const text = String(message || '').toLowerCase();
  if (text.includes('gagal') || text.includes('error') || text.includes('tidak valid')) {
    return 'error';
  }
  if (
    text.includes('wajib') ||
    text.includes('melebihi') ||
    text.includes('tidak cukup') ||
    text.includes('batal')
  ) {
    return 'warning';
  }
  return 'success';
}

function titleFromType(type) {
  if (type === 'error') return 'Terjadi Kesalahan';
  if (type === 'warning') return 'Perlu Diperiksa';
  return 'Perubahan Disimpan';
}

export default function GlobalFeedbackDialog() {
  const pathname = usePathname();
  const [toast, setToast] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    key: 0,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, lanjutkan',
    cancelText: 'Batal',
    tone: 'danger',
    resolve: null,
  });
  const [promptDialog, setPromptDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    placeholder: '',
    confirmText: 'Simpan',
    cancelText: 'Batal',
    resolve: null,
  });
  const [promptValue, setPromptValue] = useState('');
  const lastFeedbackRef = useRef({ message: '', time: 0 });
  const autoDismissTimerRef = useRef(null);

  const openToast = (payload) => {
    const message = String(payload.message || '');
    const now = Date.now();
    const last = lastFeedbackRef.current;
    if (message && last.message === message && now - last.time < 1200) return;

    lastFeedbackRef.current = { message, time: now };
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }

    setToast({
      isOpen: true,
      type: payload.type || 'success',
      title: payload.title || titleFromType(payload.type),
      message,
      key: now,
    });

    autoDismissTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }));
    }, 3800);
  };

  useEffect(() => {
    const nativeAlert = window.alert;
    const nativeAppConfirm = window.appConfirm;
    const nativeAppPrompt = window.appPrompt;

    window.alert = (message) => {
      const type = classifyMessage(message);
      openToast({
        type,
        title: titleFromType(type),
        message: String(message || ''),
      });
    };

    window.appConfirm = (message, options = {}) =>
      new Promise((resolve) => {
        setConfirmDialog({
          isOpen: true,
          title: options.title || 'Konfirmasi',
          message: String(message || ''),
          confirmText: options.confirmText || 'Ya, lanjutkan',
          cancelText: options.cancelText || 'Batal',
          tone: options.tone || 'danger',
          resolve,
        });
      });

    window.appPrompt = (message, options = {}) =>
      new Promise((resolve) => {
        setPromptValue(options.defaultValue || '');
        setPromptDialog({
          isOpen: true,
          title: options.title || 'Masukkan Alasan',
          message: String(message || ''),
          placeholder: options.placeholder || '',
          confirmText: options.confirmText || 'Simpan',
          cancelText: options.cancelText || 'Batal',
          resolve,
        });
      });

    const handleFeedback = (event) => {
      const detail = event.detail || {};
      const type = detail.type || classifyMessage(detail.message);
      openToast({
        type,
        title: detail.title || titleFromType(type),
        message: detail.message || '',
      });
    };

    window.addEventListener('app:feedback', handleFeedback);

    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      window.alert = nativeAlert;
      if (nativeAppConfirm) window.appConfirm = nativeAppConfirm;
      else delete window.appConfirm;
      if (nativeAppPrompt) window.appPrompt = nativeAppPrompt;
      else delete window.appPrompt;
      window.removeEventListener('app:feedback', handleFeedback);
    };
  }, []);

  const closeConfirm = (result) => {
    confirmDialog.resolve?.(result);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const closePrompt = (result) => {
    promptDialog.resolve?.(result ? promptValue : null);
    setPromptDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
    setPromptValue('');
  };

  // Detect whether current route uses light editorial theme (/superadmin) or dark operational theme
  const isSuperadminRoute = pathname?.startsWith('/superadmin');

  return (
    <>
      <style>{`
        @keyframes globalToastSlideIn {
          0% { opacity: 0; transform: translateY(16px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes globalToastProgress {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `}</style>

      {/* NON-BLOCKING THEME-AWARE FLOATING TOAST NOTIFICATION */}
      {toast.isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '22px',
            right: '24px',
            zIndex: 10080,
            pointerEvents: 'none',
            maxWidth: '410px',
            width: 'calc(100vw - 48px)',
          }}
        >
          <div
            key={toast.key}
            role="status"
            aria-live="polite"
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '18px',
              padding: '14px 16px 16px 16px',
              background: isSuperadminRoute ? '#FFFFFF' : '#161D2E',
              color: isSuperadminRoute ? '#14171D' : '#F8FAFC',
              border:
                toast.type === 'error'
                  ? '1px solid rgba(200, 75, 49, 0.45)'
                  : toast.type === 'warning'
                  ? '1px solid rgba(242, 178, 73, 0.45)'
                  : isSuperadminRoute
                  ? '1px solid rgba(14, 124, 91, 0.25)'
                  : '1px solid rgba(156, 226, 198, 0.22)',
              boxShadow: isSuperadminRoute
                ? '0 18px 40px -8px rgba(20, 23, 29, 0.16), 0 4px 12px rgba(20, 23, 29, 0.06)'
                : '0 20px 45px rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'globalToastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Status Icon Badge */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                fontSize: '15px',
                fontWeight: 800,
                background:
                  toast.type === 'error'
                    ? 'rgba(200, 75, 49, 0.14)'
                    : toast.type === 'warning'
                    ? 'rgba(242, 178, 73, 0.18)'
                    : isSuperadminRoute
                    ? '#E3F5EE'
                    : 'rgba(156, 226, 198, 0.16)',
                color:
                  toast.type === 'error'
                    ? '#C84B31'
                    : toast.type === 'warning'
                    ? '#D97706'
                    : isSuperadminRoute
                    ? '#0E7C5B'
                    : '#9CE2C6',
              }}
            >
              {toast.type === 'error' ? '✕' : toast.type === 'warning' ? '!' : '✓'}
            </div>

            {/* Text Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: isSuperadminRoute ? '#14171D' : '#F8FAFC',
                }}
              >
                {toast.title === 'Aksi Berhasil' ? 'Perubahan Disimpan' : toast.title}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  lineHeight: 1.4,
                  marginTop: '2px',
                  color: isSuperadminRoute ? '#5A6065' : '#94A3B8',
                }}
              >
                {toast.message}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, isOpen: false }))}
              style={{
                background: 'transparent',
                border: 'none',
                color: isSuperadminRoute ? '#8C9196' : '#64748B',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '2px 4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            {/* Auto-Dismiss Progress Bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '3px',
                background:
                  toast.type === 'error'
                    ? '#C84B31'
                    : toast.type === 'warning'
                    ? '#F2B249'
                    : '#0E7C5B',
                transformOrigin: 'left center',
                animation: 'globalToastProgress 3.8s linear forwards',
              }}
            />
          </div>
        </div>
      )}

      {confirmDialog.isOpen && (
        <DecisionModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          tone={confirmDialog.tone}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onCancel={() => closeConfirm(false)}
          onConfirm={() => closeConfirm(true)}
        />
      )}

      {promptDialog.isOpen && (
        <DecisionModal
          title={promptDialog.title}
          message={promptDialog.message}
          tone="warning"
          confirmText={promptDialog.confirmText}
          cancelText={promptDialog.cancelText}
          onCancel={() => closePrompt(false)}
          onConfirm={() => closePrompt(true)}
        >
          <textarea
            value={promptValue}
            onChange={(event) => setPromptValue(event.target.value)}
            placeholder={promptDialog.placeholder}
            className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-[#0D0A06] px-4 py-3 text-sm text-[#F5F3EF] outline-none transition focus:border-amber-400/60"
            autoFocus
          />
        </DecisionModal>
      )}
    </>
  );
}

function DecisionModal({
  title,
  message,
  tone = 'danger',
  confirmText,
  cancelText,
  onCancel,
  onConfirm,
  children,
}) {
  const isDanger = tone === 'danger';
  const accent = isDanger ? '#ef4444' : '#f59e0b';
  const softBg = isDanger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
  const softBorder = isDanger ? 'rgba(239,68,68,0.28)' : 'rgba(245,158,11,0.28)';

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-[#0D0A06]/85 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-[22px] border border-white/10 bg-[#17130D] shadow-2xl shadow-black/40">
        <div className="h-[3px]" style={{ backgroundColor: accent }} />
        <div className="p-6">
          <div
            className="mb-4 grid h-12 w-12 place-items-center rounded-full border text-xl font-black"
            style={{ backgroundColor: softBg, borderColor: softBorder, color: accent }}
          >
            !
          </div>
          <h2 className="text-lg font-black text-[#F5F3EF]">{title}</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/55">{message}</p>
          {children}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-2xl px-4 py-3 text-sm font-black text-white transition hover:brightness-110"
              style={{ backgroundColor: accent }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
