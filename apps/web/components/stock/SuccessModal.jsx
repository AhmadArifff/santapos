'use client';
import { useEffect, useState, useRef } from 'react';

export default function SuccessModal({
  isOpen,
  onClose,
  title = 'Berhasil',
  message = 'Operasi berhasil dilakukan',
  requestType = 'success',
  type,
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const modalType = type || requestType || 'success';
  const tone = getTone(modalType);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setVisible(true), 10);
      timerRef.current = setTimeout(() => handleClose(), 5800);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleClose() {
    clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(() => onClose?.(), 300);
  }

  if (!isOpen && !visible) return null;

  return (
    <>
      {/* Backdrop — tema #0D0A06 */}
      <div
        className={`
          fixed inset-0 flex items-center justify-center px-4
          transition-opacity duration-300
          ${visible ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ zIndex: 9998, backgroundColor: 'rgba(13,10,6,0.85)' }}
        onClick={handleClose}
      />

      {/* Modal — center */}
      <div
        className="fixed inset-0 flex items-center justify-center px-4 pointer-events-none"
        style={{ zIndex: 9999 }}
      >
        <div
          className={`
            pointer-events-auto w-full max-w-[300px]
            transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-6 scale-95'}
          `}
        >
          {/* Card */}
          <div
            className="rounded-[20px] overflow-hidden border"
            style={{
              backgroundColor: '#17130D',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            {/* Top accent */}
            <div className="h-[2px]" style={{ backgroundColor: tone.color }} />

            {/* Body */}
            <div className="flex flex-col items-center gap-2.5 px-5 py-6">

              {/* Animated icon */}
              <div className="relative w-[60px] h-[60px] flex items-center justify-center mb-1">
                {[0, 0.65, 1.3].map((d, i) => (
                  <span
                    key={i}
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: `1px solid ${tone.ring}`,
                      animation: `ripple 2s ease-out ${d}s infinite`,
                    }}
                  />
                ))}
                <div
                  className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: tone.bg,
                    border: `0.5px solid ${tone.border}`,
                  }}
                >
                  {tone.symbol === 'check' && (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle
                        cx="16" cy="16" r="13"
                        stroke={tone.color} strokeWidth="1.6" strokeLinecap="round"
                        style={{
                          strokeDasharray: 82,
                          strokeDashoffset: visible ? 0 : 82,
                          transition: 'stroke-dashoffset 0.5s ease-out 0.1s',
                        }}
                      />
                      <polyline
                        points="10,17 14,21 22,12"
                        stroke={tone.color} strokeWidth="2.2"
                        strokeLinecap="round" strokeLinejoin="round"
                        style={{
                          strokeDasharray: 50,
                          strokeDashoffset: visible ? 0 : 50,
                          transition: 'stroke-dashoffset 0.4s ease-out 0.52s',
                        }}
                      />
                    </svg>
                  )}
                  {tone.symbol === 'x' && (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="13" stroke={tone.color} strokeWidth="1.6" />
                      <path d="M11 11l10 10M21 11L11 21" stroke={tone.color} strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  )}
                  {tone.symbol === 'warn' && (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="13" stroke={tone.color} strokeWidth="1.6" />
                      <path d="M16 9v9" stroke={tone.color} strokeWidth="2.3" strokeLinecap="round" />
                      <circle cx="16" cy="23" r="1.4" fill={tone.color} />
                    </svg>
                  )}
                </div>
              </div>

              {/* Title */}
              <p
                className="text-[15px] font-medium text-center m-0"
                style={{
                  color: '#F5F3EF',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all 0.4s ease-out 0.55s',
                }}
              >
                {title}
              </p>

              {/* Message */}
              <p
                className="text-[12px] text-center leading-relaxed m-0"
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all 0.4s ease-out 0.68s',
                }}
              >
                {message}
              </p>

              {/* Close */}
              <button
                onClick={handleClose}
                className="mt-1.5 px-5 py-[7px] text-[11px] font-medium tracking-wide rounded-full
                  transition-all duration-150 active:scale-95"
                style={{
                  color: tone.color,
                  background: tone.bg,
                  border: `0.5px solid ${tone.border}`,
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 0.4s ease-out 0.8s, background 0.15s, border-color 0.15s',
                }}
              >
                Tutup
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div
                className="h-full origin-left"
                style={{
                  backgroundColor: tone.color,
                  animation: visible ? 'shrinkBar 5s linear 0.9s forwards' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ripple {
          0%   { transform: scale(0.75); opacity: 0.5; }
          100% { transform: scale(2);    opacity: 0;   }
        }
        @keyframes shrinkBar {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </>
  );
}

function getTone(type) {
  const normalized = String(type || '').toLowerCase();
  if (['error', 'failed', 'fail', 'danger', 'gagal'].includes(normalized)) {
    return {
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.25)',
      ring: 'rgba(239,68,68,0.35)',
      symbol: 'x',
    };
  }

  if (['warning', 'warn', 'cancel', 'cancelled', 'batal'].includes(normalized)) {
    return {
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.28)',
      ring: 'rgba(245,158,11,0.35)',
      symbol: 'warn',
    };
  }

  return {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    ring: 'rgba(34,197,94,0.35)',
    symbol: 'check',
  };
}
