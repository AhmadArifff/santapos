'use client';

import { useEffect, useRef, useState } from 'react';
import SuccessModal from '@/components/stock/SuccessModal';

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
  return 'Berhasil';
}

export default function GlobalFeedbackDialog() {
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
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

  const openDialog = (payload) => {
    const message = String(payload.message || '');
    const now = Date.now();
    const last = lastFeedbackRef.current;
    if (message && last.message === message && now - last.time < 1200) return;

    lastFeedbackRef.current = { message, time: now };
    setDialog({
      isOpen: true,
      type: payload.type,
      title: payload.title,
      message,
    });
  };

  useEffect(() => {
    const nativeAlert = window.alert;
    const nativeAppConfirm = window.appConfirm;
    const nativeAppPrompt = window.appPrompt;

    window.alert = (message) => {
      const type = classifyMessage(message);
      openDialog({
        type,
        title: titleFromType(type),
        message: String(message || ''),
      });
    };

    window.appConfirm = (message, options = {}) => new Promise((resolve) => {
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

    window.appPrompt = (message, options = {}) => new Promise((resolve) => {
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
      openDialog({
        type,
        title: detail.title || titleFromType(type),
        message: detail.message || '',
      });
    };

    window.addEventListener('app:feedback', handleFeedback);

    return () => {
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

  return (
    <>
      <SuccessModal
        isOpen={dialog.isOpen}
        requestType={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />

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
