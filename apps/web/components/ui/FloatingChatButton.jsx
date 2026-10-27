'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import AIChatBox from '../admin/AIChatBox';

function AssistantLogo({ isOpen }) {
  if (isOpen) {
    return (
      <svg className="ai-float-close" width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6.5 6.5L17.5 17.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
        <path d="M17.5 6.5L6.5 17.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="ai-float-logo" width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle className="ai-float-logo-orbit" cx="32" cy="32" r="20" />
      <circle className="ai-float-logo-core" cx="32" cy="32" r="11" />
      <path className="ai-float-logo-bolt" d="M34 11L23 35H33L29 53L42 27H32L34 11Z" />
      <path className="ai-float-logo-signal" d="M14 34C18 39 23 42 32 42C41 42 46 39 50 34" />
      <circle className="ai-float-logo-dot ai-float-logo-dot-one" cx="18" cy="18" r="2.7" />
      <circle className="ai-float-logo-dot ai-float-logo-dot-two" cx="48" cy="45" r="2.2" />
    </svg>
  );
}

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <div
          className="fixed z-40 ai-floating-panel"
          style={{
            bottom: '120px',
            right: '24px',
            width: 'min(450px, calc(100vw - 32px))',
            maxHeight: '600px',
          }}
        >
          <AIChatBox isModal={true} />
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 ai-floating-button-wrap">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className={`ai-floating-button ${isOpen ? 'ai-floating-button-open' : ''}`}
          title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
          aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
          aria-expanded={isOpen}
        >
          <span className="ai-floating-button-shine" aria-hidden="true" />
          <AssistantLogo isOpen={isOpen} />
        </button>
      </div>

      <style jsx global>{`
        .ai-floating-panel {
          filter: drop-shadow(0 26px 48px rgba(2, 6, 23, 0.5));
        }

        .ai-floating-button-wrap {
          width: 64px;
          height: 64px;
        }

        .ai-floating-button {
          position: relative;
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          overflow: hidden;
          color: #dffcff;
          background:
            radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.25), transparent 24%),
            radial-gradient(circle at 78% 82%, rgba(20, 184, 166, 0.36), transparent 30%),
            linear-gradient(145deg, #07131a 0%, #0d2530 48%, #071014 100%);
          border: 1px solid rgba(125, 249, 255, 0.28);
          border-radius: 999px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 14px 34px rgba(13, 148, 136, 0.26);
          cursor: pointer;
          transform: translateZ(0);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .ai-floating-button:hover {
          transform: translateY(-2px) scale(1.04);
          border-color: rgba(125, 249, 255, 0.56);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 18px 42px rgba(13, 148, 136, 0.34);
        }

        .ai-floating-button:active {
          transform: translateY(0) scale(0.96);
        }

        .ai-floating-button-open {
          color: #fffbeb;
          background:
            radial-gradient(circle at 26% 20%, rgba(254, 243, 199, 0.32), transparent 25%),
            linear-gradient(145deg, #241304 0%, #78350f 52%, #120904 100%);
          border-color: rgba(251, 191, 36, 0.42);
        }

        .ai-floating-button-shine {
          position: absolute;
          inset: -30%;
          background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.22) 48%, transparent 66%);
          transform: translateX(-70%) rotate(18deg);
          animation: aiFloatShine 4.8s ease-in-out infinite;
        }

        .ai-float-logo {
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 0 10px rgba(125, 249, 255, 0.55));
        }

        .ai-float-logo-orbit {
          fill: none;
          stroke: rgba(125, 249, 255, 0.48);
          stroke-width: 2;
          stroke-dasharray: 10 7;
          transform-origin: 32px 32px;
          animation: aiFloatOrbit 6s linear infinite;
        }

        .ai-float-logo-core {
          fill: rgba(125, 249, 255, 0.12);
          stroke: #7df9ff;
          stroke-width: 2;
          animation: aiFloatPulse 2.4s ease-in-out infinite;
        }

        .ai-float-logo-bolt {
          fill: #fef08a;
          stroke: #fff7ad;
          stroke-width: 1.3;
          stroke-linejoin: round;
        }

        .ai-float-logo-signal {
          fill: none;
          stroke: rgba(209, 250, 229, 0.78);
          stroke-width: 2.4;
          stroke-linecap: round;
        }

        .ai-float-logo-dot {
          fill: #99f6e4;
          animation: aiFloatDot 1.8s ease-in-out infinite;
        }

        .ai-float-logo-dot-two {
          animation-delay: 0.35s;
        }

        .ai-float-close {
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 0 10px rgba(254, 243, 199, 0.5));
        }

        @keyframes aiFloatShine {
          0%, 55%, 100% {
            transform: translateX(-72%) rotate(18deg);
          }
          72% {
            transform: translateX(72%) rotate(18deg);
          }
        }

        @keyframes aiFloatOrbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes aiFloatPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.82;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes aiFloatDot {
          0%, 100% {
            opacity: 0.42;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </>
  );
}
