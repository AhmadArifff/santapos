'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeCard({ value, title = 'Scan QR Meja', size = 220 }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#0D0A06',
        light: '#F5EDD8',
      },
    }).then((url) => {
      if (mounted) setSrc(url);
    });

    return () => {
      mounted = false;
    };
  }, [value, size]);

  return (
    <div className="rounded-3xl border border-[rgba(201,168,76,0.28)] bg-[#F5EDD8] p-4 text-center shadow-2xl shadow-black/30">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-[#8B1A1A]">{title}</p>
      {src ? (
        <img src={src} alt={title} className="mx-auto rounded-2xl" width={size} height={size} />
      ) : (
        <div className="mx-auto grid place-items-center rounded-2xl bg-[#EDE0C4]" style={{ width: size, height: size }}>
          <span className="text-sm font-bold text-[#0D0A06]/60">Memuat QR...</span>
        </div>
      )}
    </div>
  );
}
