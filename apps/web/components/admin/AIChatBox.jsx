'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAIChatModels, sendAIQuery } from '@/lib/api';
import { useAIChatStore } from '@/store/aiChatStore';
import AgentPlan from '@/components/ui/agent-plan';

const MAX_MESSAGE_LENGTH = 500;

const SUGGESTIONS = [
  'Berapa revenue kita hari ini?',
  'Produk apa yang paling laris minggu ini?',
  'Stok mana yang perlu segera dipesan?',
  'Analisis performa penjualan bulan ini',
];

function AIMark({ compact = false }) {
  return (
    <svg className={`ai-orb-mark ${compact ? 'ai-orb-mark-compact' : ''}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle className="ai-orb-ring" cx="32" cy="32" r="21" />
      <circle className="ai-orb-core" cx="32" cy="32" r="12" />
      <path className="ai-orb-bolt" d="M34 10L23 35H33L29 54L43 27H32L34 10Z" />
      <path className="ai-orb-wave" d="M15 35C20 42 26 45 32 45C38 45 44 42 49 35" />
      <circle className="ai-orb-dot ai-orb-dot-one" cx="17" cy="18" r="2.6" />
      <circle className="ai-orb-dot ai-orb-dot-two" cx="49" cy="45" r="2.2" />
    </svg>
  );
}

function formatCompactNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(2)}B`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return number.toLocaleString('id-ID');
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/((?:^\|.+\|\n?)+)/gm, (tableBlock) => {
    const rows = tableBlock
      .trim()
      .split('\n')
      .map((row) => row.trim())
      .filter((row) => row.startsWith('|') && row.endsWith('|'));

    if (rows.length < 2) return tableBlock;

    const header = rows[0].split('|').slice(1, -1).map((cell) => cell.trim());
    const separator = rows[1];
    if (!/^\|[\s:-]+\|/.test(separator)) return tableBlock;

    const body = rows.slice(2).map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim()));
    const headHtml = header.map((cell) => `<th>${cell}</th>`).join('');
    const bodyHtml = body
      .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
      .join('');

    return `<div class="ai-table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
  });
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^[-*] (.+)$/gm, '<div class="ai-list-item"><span></span><p>$1</p></div>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<div class="ai-list-item"><b>$1.</b><p>$2</p></div>');
  html = html.replace(/\n/g, '<br />');
  html = html.replace(/(<\/div>)<br \/>/g, '$1');
  return html;
}

function inferPromptTopic(prompt) {
  const text = String(prompt || '').toLowerCase();
  if (/(revenue|omzet|penjualan|transaksi|profit|margin|laba|untung)/.test(text)) return 'sales';
  if (/(stok|bahan|gudang|pengajuan|habis|persediaan)/.test(text)) return 'stock';
  if (/(produk|menu|laris|rating|review)/.test(text)) return 'product';
  if (/(kasir|karyawan|staff|absen|aktivitas|performa)/.test(text)) return 'staff';
  return 'business';
}

function statusForPhase(phase, index) {
  if (phase === 'error') {
    if (index === 0) return 'completed';
    if (index === 1) return 'failed';
    return 'need-help';
  }
  if (phase === 'thinking') {
    if (index === 0) return 'completed';
    if (index === 1) return 'in-progress';
    return 'pending';
  }
  return 'completed';
}

function buildAgentPlan(prompt, phase = 'thinking') {
  const topic = inferPromptTopic(prompt);
  const topicCopy = {
    sales: {
      context: 'Pertanyaan terdeteksi terkait omzet, transaksi, profit, atau margin.',
      data: 'Menggunakan data transaksi, laporan penjualan, HPP, dan margin cabang aktif.',
      insight: 'Menjawab dengan angka utama, margin, tren, dan rekomendasi tindakan penjualan.',
      tools: ['reports-api', 'transactions', 'margin-calculator'],
    },
    stock: {
      context: 'Pertanyaan terdeteksi terkait stok, bahan baku, gudang, atau pengajuan.',
      data: 'Menggunakan saldo stok cabang, pemasukan, pengeluaran, dan pengajuan kasir.',
      insight: 'Menjawab status stok kritis, kebutuhan pembelian, dan langkah operasional berikutnya.',
      tools: ['stock-api', 'branch-inventory', 'request-audit'],
    },
    product: {
      context: 'Pertanyaan terdeteksi terkait produk, menu, performa item, atau review.',
      data: 'Menggunakan data produk, penjualan per item, komposisi bahan, dan review pelanggan.',
      insight: 'Menjawab menu unggulan, menu perlu evaluasi, dan peluang optimasi harga atau promo.',
      tools: ['products-api', 'sales-by-product', 'customer-review'],
    },
    staff: {
      context: 'Pertanyaan terdeteksi terkait kasir, karyawan, absen, atau performa user.',
      data: 'Menggunakan data user, transaksi per kasir, dan aktivitas operasional yang tersedia.',
      insight: 'Menjawab performa kerja, kontribusi penjualan, dan catatan evaluasi tim.',
      tools: ['staff-performance', 'attendance-api', 'user-sales'],
    },
    business: {
      context: 'Pertanyaan dibaca sebagai analisis bisnis umum.',
      data: 'Menggunakan konteks POS yang relevan: transaksi, stok, produk, cabang, dan laporan.',
      insight: 'Menjawab dengan insight ringkas, risiko, peluang, dan rekomendasi eksekusi.',
      tools: ['business-context', 'reports-api', 'ai-analysis'],
    },
  }[topic];

  return [
    {
      id: '1',
      title: 'Pahami intent prompt',
      description: topicCopy.context,
      status: statusForPhase(phase, 0),
      priority: 'high',
      dependencies: [],
      subtasks: [
        {
          id: '1.1',
          title: 'Ekstrak kebutuhan user',
          description: `AI membaca prompt: "${String(prompt || '').slice(0, 120)}"`,
          status: statusForPhase(phase, 0),
          priority: 'high',
          tools: ['prompt-parser'],
        },
      ],
    },
    {
      id: '2',
      title: 'Siapkan konteks data',
      description: topicCopy.data,
      status: statusForPhase(phase, 1),
      priority: 'high',
      dependencies: ['1'],
      subtasks: [
        {
          id: '2.1',
          title: 'Cocokkan data POS',
          description: 'AI memakai ringkasan data yang backend kirimkan, bukan mengarang angka tanpa konteks.',
          status: statusForPhase(phase, 1),
          priority: 'high',
          tools: topicCopy.tools,
        },
      ],
    },
    {
      id: '3',
      title: 'Susun jawaban actionable',
      description: topicCopy.insight,
      status: statusForPhase(phase, 2),
      priority: 'medium',
      dependencies: ['1', '2'],
      subtasks: [
        {
          id: '3.1',
          title: 'Buat rekomendasi bisnis',
          description: 'Jawaban dibuat ringkas, mudah dipahami admin/owner, dan berisi tindakan berikutnya.',
          status: statusForPhase(phase, 2),
          priority: 'medium',
          tools: ['recommendation-engine'],
        },
      ],
    },
  ];
}

function EmptyState({ onSelect }) {
  return (
    <div className="ai-empty">
      <div className="ai-empty-mark">
        <AIMark />
      </div>
      <div>
        <h3>Mulai analisis bisnis</h3>
        <p>Tanyakan revenue, stok, produk terlaris, profit, atau performa transaksi.</p>
      </div>
      <div className="ai-suggestions">
        {SUGGESTIONS.map((text) => (
          <button key={text} type="button" onClick={() => onSelect(text)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator({ plan, prompt }) {
  return (
    <div className="ai-message-row ai-message-row-left">
      <div className="ai-avatar">
        <AIMark compact />
      </div>
      <div className="ai-message-stack">
        {plan && (
          <div className="ai-plan-wrap">
            <AgentPlan
              title="AI sedang menganalisis"
              description="Ini ringkasan proses terstruktur, bukan chain-of-thought internal model."
              prompt={prompt}
              tasks={plan}
              compact
            />
          </div>
        )}
        <div className="ai-bubble ai-bubble-assistant ai-typing" aria-label="AI sedang mengetik">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ type, title, message, onRetry }) {
  const isOffline = type === 'offline';

  return (
    <div className="ai-message-row ai-message-row-left">
      <div className="ai-avatar ai-avatar-warning">!</div>
      <div className={`ai-status-card ${isOffline ? 'ai-status-offline' : 'ai-status-error'}`}>
        <strong>{title}</strong>
        <p>{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry}>
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}

function Message({ message, onRetry }) {
  if (message.role === 'offline') {
    return (
      <StatusCard
        type="offline"
        title="Koneksi ke AI terputus"
        message="Server atau jaringan tidak dapat dijangkau. Periksa backend dan koneksi internet, lalu coba lagi."
        onRetry={onRetry}
      />
    );
  }

  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const hasPlan = !isUser && message.plan;
  const timestamp = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`ai-message-row ${isUser ? 'ai-message-row-right' : 'ai-message-row-left'}`}>
      <div className={`ai-avatar ${isUser ? 'ai-avatar-user' : isError ? 'ai-avatar-warning' : ''}`}>
        {isUser ? 'U' : isError ? '!' : <AIMark compact />}
      </div>
      <div className="ai-message-stack">
        {hasPlan && (
          <div className="ai-plan-wrap">
            <AgentPlan
              title={isError ? 'Rencana Analisis Gagal' : 'Rencana Analisis AI'}
              description={isError
                ? 'AI gagal menyelesaikan permintaan, berikut titik proses yang perlu dicek.'
                : 'Ringkasan langkah yang dipakai AI untuk menyusun jawaban ini.'}
              prompt={message.prompt || ''}
              tasks={message.plan}
              compact
            />
          </div>
        )}
        <div className={`ai-bubble ${isUser ? 'ai-bubble-user' : isError ? 'ai-bubble-error' : 'ai-bubble-assistant'}`}>
          {isUser || isError ? (
            <p>{message.content}</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
          )}
        </div>
        {timestamp && <time>{timestamp}</time>}
      </div>
    </div>
  );
}

export default function AIChatBox({ isModal = false }) {
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [recommendedModel, setRecommendedModel] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

  const {
    messages,
    isLoading,
    error,
    selectedModelId,
    addMessage,
    clearMessages,
    setError,
    setLoading,
    setSelectedModelId,
  } = useAIChatStore();

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) || null,
    [models, selectedModelId]
  );

  useEffect(() => {
    let mounted = true;

    async function loadModels() {
      try {
        setModelsLoading(true);
        const response = await getAIChatModels();
        const data = response?.data || response;
        const modelList = Array.isArray(data?.models) ? data.models : [];

        if (!mounted) return;

        setModels(modelList);
        setRecommendedModel(data?.recommendedModel || null);

        if (!selectedModelId) {
          const nextModel = data?.recommendedModel || modelList.find((model) => model.chatCapable)?.id || '';
          if (nextModel) setSelectedModelId(nextModel);
        }
      } catch (loadError) {
        if (!mounted) return;
        setError('Gagal memuat daftar model AI.');
        console.error('[AI Chat] gagal memuat model:', loadError);
      } finally {
        if (mounted) setModelsLoading(false);
      }
    }

    loadModels();

    return () => {
      mounted = false;
    };
  }, [selectedModelId, setError, setSelectedModelId]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 30);

    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const handleSend = useCallback(async (text) => {
    const userMessage = (text ?? inputValue).trim();
    if (!userMessage || isLoading || !selectedModelId) return;

    setInputValue('');
    setError(null);
    setLoading(true);
    setPendingPrompt(userMessage);
    setPendingPlan(buildAgentPlan(userMessage, 'thinking'));
    inputRef.current?.focus();

    addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    try {
      const compactHistory = messages.map(({ role, content, timestamp }) => ({ role, content, timestamp }));
      const response = await sendAIQuery(userMessage, compactHistory, sessionId, {
        modelId: selectedModelId,
      });
      const data = response?.data || response;

      if (!data?.success) {
        const errorMessage = data?.message || data?.error || 'AI tidak dapat memproses pertanyaan saat ini.';
        setError(errorMessage);
        addMessage({
          role: 'error',
          content: errorMessage,
          timestamp: new Date().toISOString(),
          prompt: userMessage,
          plan: buildAgentPlan(userMessage, 'error'),
        });
        return;
      }

      addMessage({
        role: 'assistant',
        content: data.response || 'AI tidak memberikan respons.',
        timestamp: new Date().toISOString(),
        prompt: userMessage,
        plan: buildAgentPlan(userMessage, 'completed'),
      });

      if (data.message) {
        setError(data.message);
      }
    } catch (sendError) {
      const hasNoResponse = !navigator.onLine || !sendError?.response;
      const errorMessage =
        sendError?.response?.data?.message ||
        sendError?.response?.data?.error ||
        sendError?.message ||
        'Terjadi kesalahan saat memproses pertanyaan.';

      setError(errorMessage);
      addMessage({
        role: hasNoResponse ? 'offline' : 'error',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        prompt: userMessage,
        plan: buildAgentPlan(userMessage, 'error'),
      });
    } finally {
      setLoading(false);
      setPendingPlan(null);
      setPendingPrompt('');
    }
  }, [
    addMessage,
    inputValue,
    isLoading,
    messages,
    selectedModelId,
    sessionId,
    setError,
    setLoading,
  ]);

  const retryLastQuestion = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    if (lastUserMessage?.content) handleSend(lastUserMessage.content);
  }, [handleSend, messages]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearMessages();
    setError(null);
  };

  const charsLeft = MAX_MESSAGE_LENGTH - inputValue.length;

  return (
    <section className={`ai-chat-shell ${isModal ? 'ai-chat-modal' : ''}`}>
      <header className="ai-chat-header">
        <div className="ai-title-group">
          <div className="ai-title-mark">
            <AIMark compact />
          </div>
          <div>
            <h2>AI Assistant</h2>
            <p>Jawaban ringkas, data bisnis, dan rekomendasi tindakan.</p>
          </div>
        </div>

        <div className="ai-header-actions">
          <select
            aria-label="Pilih model AI"
            value={selectedModelId || ''}
            onChange={(event) => setSelectedModelId(event.target.value)}
            disabled={isLoading || modelsLoading}
          >
            {modelsLoading && <option value="">Memuat model...</option>}
            {!modelsLoading &&
              models
                .filter((model) => model.chatCapable)
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}{model.id === recommendedModel ? ' (Recommended)' : ''}
                  </option>
                ))}
          </select>

          {messages.length > 0 && (
            <button type="button" className="ai-icon-button" onClick={handleClear} aria-label="Hapus riwayat chat">
              X
            </button>
          )}
        </div>
      </header>

      <div className="ai-model-strip">
        <span>{selectedModel?.name || 'Pilih model AI'}</span>
        <span>Context {formatCompactNumber(selectedModel?.contextLength)}</span>
        <span>Token tidak dibatasi dari riwayat chat</span>
      </div>

      <main ref={chatContainerRef} className="ai-message-list">
        {messages.length === 0 ? (
          <EmptyState
            onSelect={(text) => {
              setInputValue(text);
              inputRef.current?.focus();
            }}
          />
        ) : (
          messages.map((message, index) => (
            <Message key={`${message.timestamp || index}-${index}`} message={message} onRetry={retryLastQuestion} />
          ))
        )}
        {isLoading && <TypingIndicator plan={pendingPlan} prompt={pendingPrompt} />}
      </main>

      {error && <div className="ai-error-line">{error}</div>}

      <footer className="ai-composer">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          onInput={(event) => {
            event.currentTarget.style.height = 'auto';
            event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 108)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Tanya revenue, stok, profit, atau performa produk..."
          rows={1}
          disabled={isLoading || !selectedModelId}
        />
        <button type="button" onClick={() => handleSend()} disabled={isLoading || !inputValue.trim() || !selectedModelId}>
          {isLoading ? '...' : 'Kirim'}
        </button>
      </footer>

      {inputValue.length > 420 && (
        <div className={`ai-char-count ${charsLeft < 40 ? 'ai-char-danger' : ''}`}>
          {charsLeft} karakter tersisa
        </div>
      )}

      <style jsx global>{`
        .ai-chat-electric {
          height: 100%;
          min-height: 520px;
          width: 100%;
        }

        .ai-chat-electric-modal {
          height: min(90dvh, 720px);
        }

        .ai-chat-electric > .eb-content {
          height: 100%;
        }

        .ai-chat-shell {
          --ai-bg: #101216;
          --ai-panel: #171a20;
          --ai-panel-soft: #1e222a;
          --ai-line: #2f3540;
          --ai-text: #f4f6f8;
          --ai-muted: #9aa3af;
          --ai-subtle: #707a87;
          --ai-accent: #2dd4bf;
          --ai-accent-strong: #14b8a6;
          --ai-warn: #f59e0b;
          --ai-danger: #ef4444;
          --ai-user: #2563eb;
          background:
            linear-gradient(180deg, rgba(45, 212, 191, 0.06), rgba(16, 18, 22, 0) 180px),
            var(--ai-bg);
          border: 1px solid var(--ai-line);
          color: var(--ai-text);
          display: flex;
          flex-direction: column;
          font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
          height: 100%;
          min-height: 520px;
          overflow: hidden;
          border-radius: 14px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 24px 70px rgba(2, 6, 23, 0.32);
        }

        .ai-chat-modal {
          height: min(90dvh, 720px);
        }

        .ai-chat-header {
          align-items: flex-start;
          border-bottom: 1px solid var(--ai-line);
          display: flex;
          gap: 12px;
          justify-content: space-between;
          padding: 14px;
        }

        .ai-title-group {
          align-items: center;
          display: flex;
          gap: 10px;
          min-width: 0;
        }

        .ai-title-mark,
        .ai-avatar {
          align-items: center;
          background: var(--ai-panel-soft);
          border: 1px solid var(--ai-line);
          border-radius: 8px;
          color: var(--ai-accent);
          display: flex;
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 700;
          height: 34px;
          justify-content: center;
          width: 34px;
        }

        .ai-title-mark,
        .ai-empty-mark {
          background:
            radial-gradient(circle at 50% 30%, rgba(125, 249, 255, 0.22), transparent 42%),
            linear-gradient(145deg, rgba(12, 74, 110, 0.7), rgba(15, 23, 42, 0.92));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 0 26px rgba(45, 212, 191, 0.22);
        }

        .ai-avatar .ai-orb-mark {
          height: 24px;
          width: 24px;
        }

        .ai-orb-mark {
          display: block;
          height: 30px;
          overflow: visible;
          width: 30px;
          filter: drop-shadow(0 0 8px rgba(125, 249, 255, 0.45));
        }

        .ai-orb-mark-compact {
          height: 24px;
          width: 24px;
        }

        .ai-orb-ring {
          fill: none;
          stroke: rgba(125, 249, 255, 0.52);
          stroke-dasharray: 10 7;
          stroke-linecap: round;
          stroke-width: 2.2;
          transform-origin: 32px 32px;
          animation: aiOrbSpin 7s linear infinite;
        }

        .ai-orb-core {
          fill: rgba(125, 249, 255, 0.12);
          stroke: #7df9ff;
          stroke-width: 2;
          transform-origin: 32px 32px;
          animation: aiOrbPulse 2.8s ease-in-out infinite;
        }

        .ai-orb-bolt {
          fill: #fef08a;
          stroke: #fff7ad;
          stroke-linejoin: round;
          stroke-width: 1.2;
        }

        .ai-orb-wave {
          fill: none;
          stroke: rgba(209, 250, 229, 0.78);
          stroke-linecap: round;
          stroke-width: 2.4;
        }

        .ai-orb-dot {
          fill: #99f6e4;
          transform-origin: center;
          animation: aiOrbDot 2s ease-in-out infinite;
        }

        .ai-orb-dot-two {
          animation-delay: 0.35s;
        }

        .ai-title-group h2 {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1.2;
          margin: 0;
        }

        .ai-title-group p {
          color: var(--ai-muted);
          font-size: 12px;
          line-height: 1.35;
          margin: 2px 0 0;
        }

        .ai-header-actions {
          align-items: center;
          display: flex;
          gap: 8px;
          min-width: min(360px, 50%);
        }

        .ai-header-actions select {
          appearance: none;
          background: var(--ai-panel);
          border: 1px solid var(--ai-line);
          border-radius: 8px;
          color: var(--ai-text);
          flex: 1;
          font-size: 12px;
          height: 36px;
          min-width: 0;
          outline: none;
          padding: 0 10px;
        }

        .ai-header-actions select:focus,
        .ai-composer textarea:focus {
          border-color: var(--ai-accent);
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.12);
        }

        .ai-icon-button {
          background: transparent;
          border: 1px solid var(--ai-line);
          border-radius: 8px;
          color: var(--ai-muted);
          cursor: pointer;
          flex: 0 0 auto;
          font-size: 12px;
          font-weight: 700;
          height: 36px;
          width: 36px;
        }

        .ai-icon-button:hover {
          border-color: rgba(239, 68, 68, 0.5);
          color: #fecaca;
        }

        .ai-model-strip {
          align-items: center;
          border-bottom: 1px solid rgba(47, 53, 64, 0.75);
          color: var(--ai-muted);
          display: flex;
          flex-wrap: wrap;
          font-size: 11px;
          gap: 8px;
          padding: 8px 14px;
        }

        .ai-model-strip span:first-child {
          color: var(--ai-text);
          font-weight: 600;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ai-message-list {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 14px;
          min-height: 0;
          overflow-y: auto;
          padding: 16px 14px;
        }

        .ai-empty {
          align-items: center;
          display: flex;
          flex: 1;
          flex-direction: column;
          justify-content: center;
          margin: 0 auto;
          max-width: 460px;
          text-align: center;
          width: 100%;
        }

        .ai-empty-mark {
          align-items: center;
          border: 1px solid rgba(45, 212, 191, 0.28);
          border-radius: 8px;
          color: var(--ai-accent);
          display: flex;
          font-weight: 800;
          height: 48px;
          justify-content: center;
          margin-bottom: 12px;
          width: 48px;
        }

        .ai-empty-mark .ai-orb-mark {
          height: 40px;
          width: 40px;
        }

        .ai-empty h3 {
          font-size: 16px;
          margin: 0 0 4px;
        }

        .ai-empty p {
          color: var(--ai-muted);
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }

        .ai-suggestions {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 18px;
          width: 100%;
        }

        .ai-suggestions button {
          background: var(--ai-panel);
          border: 1px solid var(--ai-line);
          border-radius: 8px;
          color: var(--ai-text);
          cursor: pointer;
          font-size: 12px;
          line-height: 1.35;
          min-height: 44px;
          padding: 10px;
          text-align: left;
        }

        .ai-suggestions button:hover {
          border-color: rgba(45, 212, 191, 0.45);
          background: #1c252b;
        }

        .ai-message-row {
          align-items: flex-start;
          display: flex;
          gap: 9px;
          width: 100%;
        }

        .ai-message-row-right {
          flex-direction: row-reverse;
        }

        .ai-avatar-user {
          color: #bfdbfe;
        }

        .ai-avatar-warning {
          color: #fecaca;
        }

        .ai-message-stack {
          max-width: min(78%, 680px);
          min-width: 0;
        }

        .ai-plan-wrap {
          margin-bottom: 8px;
          max-width: min(100%, 680px);
        }

        .ai-plan-wrap .agent-plan {
          width: min(100%, 680px);
        }

        .ai-message-row-right .ai-message-stack {
          align-items: flex-end;
          display: flex;
          flex-direction: column;
        }

        .ai-bubble {
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.65;
          overflow-wrap: anywhere;
          padding: 10px 12px;
        }

        .ai-bubble p {
          margin: 0;
          white-space: pre-wrap;
        }

        .ai-bubble strong {
          color: #ffffff;
        }

        .ai-bubble code {
          background: rgba(45, 212, 191, 0.1);
          border: 1px solid rgba(45, 212, 191, 0.25);
          border-radius: 6px;
          color: #99f6e4;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 12px;
          padding: 1px 5px;
        }

        .ai-table-wrap {
          border: 1px solid var(--ai-line);
          border-radius: 8px;
          margin: 8px 0;
          max-width: 100%;
          overflow-x: auto;
        }

        .ai-table-wrap table {
          border-collapse: collapse;
          font-size: 12px;
          min-width: 360px;
          width: 100%;
        }

        .ai-table-wrap th,
        .ai-table-wrap td {
          border-bottom: 1px solid rgba(47, 53, 64, 0.8);
          padding: 8px 9px;
          text-align: left;
          vertical-align: top;
        }

        .ai-table-wrap th {
          background: rgba(45, 212, 191, 0.08);
          color: #ccfbf1;
          font-weight: 700;
        }

        .ai-table-wrap tr:last-child td {
          border-bottom: none;
        }

        .ai-bubble-user {
          background: var(--ai-user);
          color: #ffffff;
        }

        .ai-bubble-assistant {
          background: var(--ai-panel);
          border: 1px solid var(--ai-line);
          color: var(--ai-text);
        }

        .ai-bubble-error {
          background: rgba(239, 68, 68, 0.09);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fecaca;
        }

        .ai-list-item {
          display: flex;
          gap: 7px;
          margin: 3px 0;
        }

        .ai-list-item span {
          background: var(--ai-accent);
          border-radius: 99px;
          flex: 0 0 auto;
          height: 5px;
          margin-top: 9px;
          width: 5px;
        }

        .ai-list-item b {
          color: var(--ai-accent);
          flex: 0 0 auto;
        }

        .ai-list-item p {
          margin: 0;
        }

        .ai-message-stack time {
          color: var(--ai-subtle);
          display: block;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 10px;
          margin-top: 4px;
        }

        .ai-typing {
          align-items: center;
          display: flex;
          gap: 5px;
          min-height: 40px;
          width: 58px;
        }

        .ai-typing span {
          animation: aiTyping 1s ease-in-out infinite;
          background: var(--ai-accent);
          border-radius: 999px;
          height: 6px;
          opacity: 0.5;
          width: 6px;
        }

        .ai-typing span:nth-child(2) {
          animation-delay: 120ms;
        }

        .ai-typing span:nth-child(3) {
          animation-delay: 240ms;
        }

        @keyframes aiTyping {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @keyframes aiOrbSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes aiOrbPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.78;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes aiOrbDot {
          0%, 100% {
            opacity: 0.42;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .ai-status-card {
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          max-width: min(78%, 560px);
          padding: 11px 12px;
        }

        .ai-status-card strong {
          display: block;
          margin-bottom: 4px;
        }

        .ai-status-card p {
          margin: 0;
        }

        .ai-status-card button {
          background: transparent;
          border: 1px solid currentColor;
          border-radius: 8px;
          color: inherit;
          cursor: pointer;
          font-size: 12px;
          margin-top: 10px;
          padding: 6px 10px;
        }

        .ai-status-error {
          background: rgba(239, 68, 68, 0.09);
          border: 1px solid rgba(239, 68, 68, 0.28);
          color: #fecaca;
        }

        .ai-status-offline {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fde68a;
        }

        .ai-error-line {
          background: rgba(239, 68, 68, 0.08);
          border-top: 1px solid rgba(239, 68, 68, 0.22);
          color: #fecaca;
          flex: 0 0 auto;
          font-size: 12px;
          line-height: 1.4;
          padding: 8px 14px;
        }

        .ai-composer-electric {
          flex: 0 0 auto;
          margin: 12px 14px 14px;
        }

        .ai-composer-electric > .eb-content {
          height: auto;
        }

        .ai-composer {
          align-items: flex-end;
          background:
            radial-gradient(circle at 14% 0%, rgba(125, 249, 255, 0.12), transparent 34%),
            #0c0e12;
          border: 1px solid rgba(125, 249, 255, 0.18);
          border-radius: 12px;
          display: flex;
          flex: 0 0 auto;
          gap: 10px;
          padding: 9px;
        }

        .ai-composer textarea {
          background: var(--ai-panel);
          border: 1px solid var(--ai-line);
          border-radius: 8px;
          color: var(--ai-text);
          flex: 1;
          font-size: 13px;
          line-height: 1.5;
          max-height: 108px;
          min-height: 40px;
          outline: none;
          padding: 10px 11px;
          resize: none;
        }

        .ai-composer textarea::placeholder {
          color: var(--ai-subtle);
        }

        .ai-composer button {
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(135deg, #99f6e4 0%, #2dd4bf 42%, #0f766e 100%);
          border: none;
          border-radius: 8px;
          color: #042f2e;
          cursor: pointer;
          flex: 0 0 auto;
          font-size: 13px;
          font-weight: 800;
          height: 40px;
          min-width: 74px;
          padding: 0 14px;
          box-shadow: 0 10px 22px rgba(20, 184, 166, 0.22);
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }

        .ai-composer button:not(:disabled):hover {
          transform: translateY(-1px);
          filter: saturate(1.12);
          box-shadow: 0 14px 28px rgba(20, 184, 166, 0.3);
        }

        .ai-composer button:disabled,
        .ai-composer textarea:disabled,
        .ai-header-actions select:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .ai-char-count {
          background: #0c0e12;
          color: var(--ai-muted);
          flex: 0 0 auto;
          font-size: 11px;
          padding: 0 14px 10px;
          text-align: right;
        }

        .ai-char-danger {
          color: #fecaca;
        }

        @media (max-width: 760px) {
          .ai-chat-shell {
            min-height: 560px;
          }

          .ai-chat-electric {
            min-height: 560px;
          }

          .ai-chat-header {
            flex-direction: column;
          }

          .ai-header-actions {
            min-width: 0;
            width: 100%;
          }

          .ai-model-strip {
            align-items: flex-start;
            flex-direction: column;
            gap: 3px;
          }

          .ai-message-stack,
          .ai-status-card {
            max-width: calc(100% - 44px);
          }

          .ai-suggestions {
            grid-template-columns: 1fr;
          }

          .ai-composer {
            align-items: stretch;
            flex-direction: column;
          }

          .ai-composer button {
            width: 100%;
          }
        }
      `}</style>
      </section>
  );
}
