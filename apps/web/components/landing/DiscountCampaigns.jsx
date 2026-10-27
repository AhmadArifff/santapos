'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getActiveDiscountPrograms } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assetUrl';

const PENDING_VOUCHER_KEY = 'landing-campaign-voucher-code';
const ROTATE_INTERVAL = 10000;
const BUNDLE_PREVIEW_LIMIT = 4;
const BUNDLE_ROTATE_INTERVAL = 3400;

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 90 : -90,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -90 : 90,
    opacity: 0,
    scale: 0.97,
  }),
};

const formatDiscount = (program) => {
  const value = Number(program?.discount_value || 0);
  if (program?.discount_type === 'fixed') return `Rp ${value.toLocaleString('id-ID')}`;
  return `${value.toLocaleString('id-ID')}%`;
};

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTypeMeta = (type) => {
  if (type === 'review_reward') {
    return {
      label: 'Review Voucher',
      accent: 'campaign-card-review',
      icon: '*',
      action: 'Review & Ambil Voucher',
      summary: 'Beri rating pelayanan dan menu setelah pesanan selesai, lalu dapatkan voucher QR untuk pesanan berikutnya.',
    };
  }
  if (type === 'bundle') {
    return {
      label: 'Paket Bundle',
      accent: 'campaign-card-bundle',
      icon: '[]',
      action: 'Lihat Menu Paket',
      summary: 'Masukkan semua menu syarat paket ke keranjang. Diskon otomatis dihitung dari menu paket saja.',
    };
  }
  return {
    label: 'Kode Voucher',
    accent: 'campaign-card-voucher',
    icon: '#',
    action: 'Copy & Rendem',
    summary: 'Copy kode voucher, pilih cabang dan meja, lalu kode otomatis masuk ke field voucher saat checkout.',
  };
};

const getValidityText = (program) => {
  const start = formatDate(program.start_at);
  const end = formatDate(program.end_at);
  if (start && end) return `Mulai ${start} - sampai ${end}`;
  if (end) return `Berlaku sampai ${end}`;
  if (start) return `Aktif mulai ${start}, tanpa expired sampai kuota habis atau dinonaktifkan.`;
  return 'Tidak expired, aktif sampai kuota habis atau dinonaktifkan.';
};

const getQuotaText = (program) => {
  if (program.total_usage_limit == null) return 'Kuota tanpa batas';
  return `${Number(program.remaining_quota || 0).toLocaleString('id-ID')} kuota tersisa dari ${Number(program.total_usage_limit || 0).toLocaleString('id-ID')}`;
};

const getCountdownState = (program, now) => {
  if (!program?.end_at) {
    return {
      headline: 'Tanpa expired',
      note: 'Aktif sampai kuota habis atau admin menonaktifkan campaign.',
      parts: null,
      expired: false,
    };
  }

  const endTime = new Date(program.end_at).getTime();
  const diff = Math.max(0, endTime - now);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (diff <= 0) {
    return {
      headline: 'Waktu habis',
      note: 'Campaign ini sedang menunggu sinkronisasi status terbaru.',
      parts: [
        { label: 'Hari', value: '00' },
        { label: 'Jam', value: '00' },
        { label: 'Menit', value: '00' },
        { label: 'Detik', value: '00' },
      ],
      expired: true,
    };
  }

  return {
    headline: 'Berakhir dalam',
    note: `Sampai ${formatDate(program.end_at)}`,
    parts: [
      { label: 'Hari', value: String(days).padStart(2, '0') },
      { label: 'Jam', value: String(hours).padStart(2, '0') },
      { label: 'Menit', value: String(minutes).padStart(2, '0') },
      { label: 'Detik', value: String(seconds).padStart(2, '0') },
    ],
    expired: false,
  };
};

const buildRules = (program) => {
  if (program.type === 'review_reward') {
    return [
      `Rating layanan minimal ${program.min_service_rating || 1}/5.`,
      `Rating menu minimal ${program.min_menu_rating || 1}/5.`,
      'Voucher QR dipakai untuk pesanan berikutnya dengan upload gambar voucher di keranjang.',
      Number(program.usage_limit_per_phone || 0) > 0
        ? `Maksimal ${program.usage_limit_per_phone} klaim per nomor HP.`
        : 'Bisa diklaim tanpa batas per nomor HP selama kuota tersedia.',
    ];
  }

  if (program.type === 'bundle') {
    const bundleText = (program.bundle_items || [])
      .map((item) => `${item.name || `Menu #${item.product_id}`} x${Math.max(1, Number(item.qty || 1))}`)
      .join(', ');
    return [
      bundleText ? `Wajib pesan: ${bundleText}.` : 'Wajib memenuhi menu paket yang diatur admin.',
      'Potongan hanya dihitung dari menu yang termasuk paket bundle.',
      'Isi nomor HP agar sistem bisa menghitung batas klaim.',
      Number(program.usage_limit_per_phone || 0) > 0
        ? `Maksimal ${program.usage_limit_per_phone} klaim per nomor HP.`
        : 'Bisa diklaim tanpa batas per nomor HP selama kuota tersedia.',
    ];
  }

  return [
    program.code ? `Kode: ${program.code}` : 'Kode voucher tersedia di kasir atau campaign.',
    'Paste kode voucher di keranjang self order atau minta kasir memasukkan kode saat pembayaran.',
    'Kode voucher memotong menu di luar paket bundle jika bundle juga digunakan.',
    Number(program.usage_limit_per_phone || 0) > 0
      ? `Maksimal ${program.usage_limit_per_phone} klaim per nomor HP.`
      : 'Bisa diklaim tanpa batas per nomor HP selama kuota tersedia.',
  ];
};

export default function DiscountCampaigns() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [cycleStart, setCycleStart] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [expandedBundles, setExpandedBundles] = useState({});
  const [bundleCycle, setBundleCycle] = useState(0);

  useEffect(() => {
    let mounted = true;
    getActiveDiscountPrograms()
      .then((res) => {
        if (!mounted) return;
        setPrograms(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => mounted && setPrograms([]))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activePrograms = useMemo(() => (
    programs
      .filter((program) => program?.status === 'active')
      .filter((program) => program.total_usage_limit == null || Number(program.remaining_quota || 0) > 0)
  ), [programs]);

  const activeProgram = activePrograms[activeIndex] || activePrograms[0];
  const meta = activeProgram ? getTypeMeta(activeProgram.type) : null;
  const rules = activeProgram ? buildRules(activeProgram) : [];
  const countdown = activeProgram ? getCountdownState(activeProgram, now) : null;
  const bundleItems = activeProgram?.type === 'bundle' ? (activeProgram.bundle_items || []) : [];
  const isBundleExpanded = Boolean(expandedBundles[activeProgram?.id]);

  useEffect(() => {
    setBundleCycle(0);
  }, [activeProgram?.id]);

  useEffect(() => {
    if (activeProgram?.type !== 'bundle') return undefined;
    if (isBundleExpanded || bundleItems.length <= BUNDLE_PREVIEW_LIMIT) return undefined;
    const timer = window.setInterval(() => {
      setBundleCycle((current) => current + 1);
    }, BUNDLE_ROTATE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [activeProgram?.id, activeProgram?.type, bundleItems.length, isBundleExpanded]);

  const orderedBundleItems = useMemo(() => {
    if (isBundleExpanded || bundleItems.length <= BUNDLE_PREVIEW_LIMIT) return bundleItems;
    const offset = bundleCycle % bundleItems.length;
    return [...bundleItems.slice(offset), ...bundleItems.slice(0, offset)];
  }, [bundleItems, bundleCycle, isBundleExpanded]);

  const visibleBundleItems = isBundleExpanded
    ? orderedBundleItems
    : orderedBundleItems.slice(0, BUNDLE_PREVIEW_LIMIT);

  useEffect(() => {
    if (activeIndex >= activePrograms.length) {
      setActiveIndex(0);
      setCycleStart(Date.now());
    }
  }, [activeIndex, activePrograms.length]);

  useEffect(() => {
    if (activePrograms.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((current) => (current + 1) % activePrograms.length);
      setCycleStart(Date.now());
    }, ROTATE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [activePrograms.length]);

  const goToSlide = (index) => {
    if (index === activeIndex) return;
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
    setCycleStart(Date.now());
  };

  const goNext = () => {
    if (activePrograms.length <= 1) return;
    setDirection(1);
    setActiveIndex((current) => (current + 1) % activePrograms.length);
    setCycleStart(Date.now());
  };

  const goPrev = () => {
    if (activePrograms.length <= 1) return;
    setDirection(-1);
    setActiveIndex((current) => (current - 1 + activePrograms.length) % activePrograms.length);
    setCycleStart(Date.now());
  };

  const redeemProgram = async (program) => {
    if (program?.type === 'voucher' && program.code) {
      try {
        await navigator.clipboard?.writeText(program.code);
      } catch {
        // Some browsers block clipboard without HTTPS/user permission; localStorage still carries the code.
      }
      try {
        window.localStorage.setItem(PENDING_VOUCHER_KEY, program.code);
      } catch {
        // Ignore private mode storage failures.
      }
      setCopiedCode(program.code);
    }
    window.location.href = program?.type === 'voucher' && program.code
      ? `/order?voucher=${encodeURIComponent(program.code)}`
      : '/order';
  };

  if (!loading && activePrograms.length === 0) return null;

  const progress = activePrograms.length > 1
    ? Math.min(100, Math.max(0, ((now - cycleStart) / ROTATE_INTERVAL) * 100))
    : 100;

  return (
    <section id="campaigns" className="campaign-section">
      <div className="campaign-header">
        <div className="section-label">Campaign Aktif</div>
        <h2 className="section-title">
          Klaim <span className="italic gold">Voucher & Diskon</span>
          <br />
          Sebelum Kuota Habis
        </h2>
        <p className="section-desc">
          Pilih promo yang sedang aktif, baca rule klaimnya, lalu lanjut ke cabang dan meja untuk redeem saat self order atau pembayaran kasir.
        </p>
      </div>

      {loading ? (
        <div className="campaign-loading-grid">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="campaign-card campaign-card-loading">
              <div />
              <span />
              <p />
            </div>
          ))}
        </div>
      ) : (
        <div className="campaign-grid campaign-carousel">
          <div className="campaign-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="campaign-viewport">
            <AnimatePresence custom={direction} mode="wait">
              <motion.article
                key={`${activeProgram.type}-${activeProgram.id}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) goNext();
                  if (info.offset.x > 80) goPrev();
                }}
                className={`campaign-card campaign-slide ${meta.accent}`}
              >
                <div className="campaign-card-main">
                  <div className="campaign-card-top">
                    <span className="campaign-icon">{meta.icon}</span>
                    <div>
                      <span className="campaign-type">{meta.label}</span>
                      <h3>{activeProgram.type === 'voucher' && activeProgram.code ? activeProgram.code : activeProgram.name}</h3>
                      {activeProgram.type === 'voucher' && activeProgram.name && (
                        <p className="campaign-name-note">{activeProgram.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="campaign-discount">
                    <strong>{formatDiscount(activeProgram)}</strong>
                    <span>{activeProgram.discount_type === 'fixed' ? 'potongan nominal' : 'diskon aktif'}</span>
                  </div>

                  <p className="campaign-summary">{meta.summary}</p>

                  <button type="button" className="campaign-btn" onClick={() => redeemProgram(activeProgram)}>
                    {meta.action}
                  </button>
                  {copiedCode && copiedCode === activeProgram.code && (
                    <p className="campaign-copy-note">
                      Kode tersalin. Setelah pilih meja, field voucher akan otomatis terisi. Jika belum, tekan tombol Paste.
                    </p>
                  )}
                </div>

                <div className="campaign-card-panel">
                  <div className={`campaign-countdown ${countdown.expired ? 'is-expired' : ''}`}>
                    <span className="campaign-countdown-label">{countdown.headline}</span>
                    {countdown.parts ? (
                      <div className="campaign-countdown-grid">
                        {countdown.parts.map((part) => (
                          <div key={part.label} className="campaign-countdown-item">
                            <strong>{part.value}</strong>
                            <span>{part.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="campaign-countdown-open">
                        <strong>OPEN</strong>
                        <span>Sampai kuota habis</span>
                      </div>
                    )}
                    <p>{countdown.note}</p>
                  </div>

                  <div className="campaign-info">
                    <span>{getQuotaText(activeProgram)}</span>
                    {Number(activeProgram.min_order_amount || 0) > 0 && (
                      <span>Minimal order Rp {Number(activeProgram.min_order_amount || 0).toLocaleString('id-ID')}</span>
                    )}
                    <span>{getValidityText(activeProgram)}</span>
                  </div>

                  <ul className="campaign-rules">
                    {rules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>

                  {activeProgram.type === 'bundle' && bundleItems.length > 0 && (
                    <div className="campaign-bundle-list">
                      <div className="campaign-bundle-heading">
                        <span>Menu wajib dipesan</span>
                        <strong>{bundleItems.length} menu</strong>
                      </div>
                      <div className="campaign-bundle-items">
                        {visibleBundleItems.map((item) => (
                          <motion.div
                            key={`${activeProgram.id}-${item.product_id}`}
                            layout
                            initial={{ opacity: 0, y: 24, scale: 0.92, rotateY: -10 }}
                            animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                            exit={{ opacity: 0, y: -18, scale: 0.92, rotateY: 10 }}
                            transition={{ type: 'spring', stiffness: 150, damping: 22 }}
                            whileHover={{ y: -8, rotateX: 1.2, scale: 1.015 }}
                            className="campaign-bundle-item"
                          >
                            <img
                              src={resolveAssetUrl(item.image_url, '/images/assets/logo.png')}
                              alt={item.name || `Menu #${item.product_id}`}
                              loading="lazy"
                            />
                            <div>
                              <strong>{item.name || `Menu #${item.product_id}`}</strong>
                              <span>{Math.max(1, Number(item.qty || 1))} pcs wajib dipesan</span>
                              {item.price != null && <em>{formatCurrency(item.price)}</em>}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {bundleItems.length > BUNDLE_PREVIEW_LIMIT && (
                        <button
                          type="button"
                          className="campaign-bundle-toggle"
                          onClick={() => setExpandedBundles((current) => ({
                            ...current,
                            [activeProgram.id]: !current[activeProgram.id],
                          }))}
                        >
                          {isBundleExpanded
                            ? 'Sembunyikan menu paket'
                            : `Lihat ${bundleItems.length - BUNDLE_PREVIEW_LIMIT} menu lainnya`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          {activePrograms.length > 1 && (
            <div className="campaign-carousel-controls">
              <button type="button" className="campaign-nav" onClick={goPrev} aria-label="Campaign sebelumnya">
                Prev
              </button>
              <div className="campaign-dots" aria-label="Pagination campaign">
                {activePrograms.map((program, index) => (
                  <button
                    key={`${program.type}-${program.id}-dot`}
                    type="button"
                    className={`campaign-dot ${index === activeIndex ? 'is-active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Tampilkan campaign ${index + 1}`}
                    aria-current={index === activeIndex ? 'true' : undefined}
                  />
                ))}
              </div>
              <button type="button" className="campaign-nav" onClick={goNext} aria-label="Campaign berikutnya">
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
