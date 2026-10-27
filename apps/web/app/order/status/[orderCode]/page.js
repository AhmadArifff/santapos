'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCustomerOrder } from '@/lib/api';
import { useReactToPrint } from 'react-to-print';
import Receipt from '@/components/pos/Receipt';
import CustomerPaymentPanel from '@/components/customer/CustomerPaymentPanel';

const statusSteps = [
  { key: 'pending', label: 'Menunggu', desc: 'Pesanan menunggu konfirmasi kasir/admin.' },
  { key: 'accepted', label: 'Diterima', desc: 'Pesanan sudah diterima oleh kasir/admin.' },
  { key: 'preparing', label: 'Disiapkan', desc: 'Menu sedang dibuat oleh tim.' },
  { key: 'ready', label: 'Siap Diantarkan Ke Meja', desc: 'Pesanan siap diantar ke meja Anda.' },
  { key: 'completed', label: 'Selesai', desc: 'Pesanan sudah selesai.' },
];

const statusLabels = {
  pending: 'Menunggu',
  accepted: 'Diterima',
  preparing: 'Disiapkan',
  ready: 'Siap Diantarkan Ke Meja',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const formatRp = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export default function OrderStatusPage() {
  const { orderCode } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef(null);
  const printReceipt = useReactToPrint({ contentRef: receiptRef });

  useEffect(() => {
    let mounted = true;
    if (!orderCode) return undefined;
    getCustomerOrder(orderCode)
      .then((res) => {
        if (!mounted) return;
        setOrder(res.data);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [orderCode]);

  useEffect(() => {
    if (!orderCode || ['completed', 'cancelled'].includes(order?.status)) return;
    const timer = window.setInterval(() => {
      getCustomerOrder(orderCode)
        .then((res) => setOrder(res.data))
        .catch(() => {});
    }, 5000);
    return () => window.clearInterval(timer);
  }, [orderCode, order?.status]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0D0A06] text-[#C9A84C]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#C9A84C]/20 border-t-[#C9A84C]" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0D0A06] p-6 text-center text-[#F5EDD8]">
        <div>
          <h1 className="font-serif text-4xl font-black">Pesanan tidak ditemukan</h1>
          <p className="mt-3 text-[#EDE0C4]/70">Kode pesanan tidak valid atau sudah tidak tersedia.</p>
          <Link href="/order" className="mt-6 inline-flex rounded-2xl bg-[#C9A84C] px-5 py-3 font-bold text-[#0D0A06]">Pilih Meja</Link>
        </div>
      </main>
    );
  }

  const currentIndex = statusSteps.findIndex((item) => item.key === order.status);
  const isCancelled = order.status === 'cancelled';
  const orderTotal = Number(order.final_total || order.subtotal || 0);
  const receiptStatusUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/order/status/${order.order_code}`
    : '';
  const receiptTransaction = {
    invoice_number: order.order_code,
    total: orderTotal,
    total_price: orderTotal,
    tunai: orderTotal,
    kembalian: 0,
    payment_method: order.payment_method_key || order.payment_method?.type || 'cash',
    kasir_name: order.accepted_by_name || 'Kasir',
    created_by_type: 'customer',
    table_number: order.table_number,
    receipt_status_url: receiptStatusUrl,
    items: (order.items || []).map((item) => ({
      ...item,
      name: item.product_name,
      price: Number(item.price || 0),
      qty: Number(item.qty || 0),
    })),
  };

  return (
    <main className="min-h-screen bg-[#0D0A06] px-4 py-8 text-[#F5EDD8]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_12%,rgba(201,168,76,0.22),transparent_34%),radial-gradient(circle_at_90%_90%,rgba(139,26,26,0.22),transparent_32%)]" />
      <section className="relative z-10 mx-auto max-w-4xl">
        <Link href="/order" className="mb-6 inline-flex rounded-full border border-[#C9A84C]/35 px-4 py-2 text-sm text-[#C9A84C]">
          Kembali ke Pilih Meja
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-[#C9A84C]/20 bg-[#1A1409]/92 p-5 shadow-2xl shadow-black/30 md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A84C]">Status Pesanan</p>
              <h1 className="mt-3 font-serif text-4xl font-black">{order.order_code}</h1>
              <p className="mt-2 text-[#EDE0C4]/70">Meja {order.table_number} · {order.customer_name || 'Pelanggan'}</p>
            </div>
            <div className="rounded-2xl bg-[#C9A84C]/15 px-4 py-3 text-left md:text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[#C9A84C]">Status Saat Ini</p>
              <strong className="mt-1 block text-xl text-[#F5EDD8]">{statusLabels[order.status] || order.status}</strong>
            </div>
          </div>

          {isCancelled ? (
            <div className="mt-6 rounded-3xl border border-red-400/25 bg-red-500/10 p-4 text-red-100">
              <strong>Pesanan dibatalkan.</strong>
              <p className="mt-1 text-sm opacity-80">{order.cancel_reason || 'Silakan hubungi kasir untuk informasi lebih lanjut.'}</p>
            </div>
          ) : (
            <div className="mt-7 grid gap-3">
              {statusSteps.map((step, index) => {
                const active = index <= currentIndex;
                return (
                  <div key={step.key} className={`rounded-3xl border p-4 transition ${
                    active ? 'border-[#C9A84C]/55 bg-[#C9A84C]/12' : 'border-[#C9A84C]/12 bg-[#0D0A06]/45'
                  }`}>
                    <div className="flex gap-3">
                      <span className={`mt-1 h-5 w-5 rounded-full border ${active ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-[#C9A84C]/30'}`} />
                      <div>
                        <p className="font-black">{step.label}</p>
                        <p className="mt-1 text-sm text-[#EDE0C4]/62">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-7 rounded-3xl bg-[#241C0E] p-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 border-b border-[#C9A84C]/10 py-2 last:border-0">
                <span>{item.product_name} x{item.qty}</span>
                <strong className="text-[#C9A84C]">{formatRp(item.subtotal)}</strong>
              </div>
            ))}
            <div className="mt-4 flex justify-between text-lg font-black">
              <span>Total</span>
              <span>{formatRp(order.final_total || order.subtotal)}</span>
            </div>
          </div>

          <CustomerPaymentPanel order={order} onOrderUpdate={setOrder} />

          <button
            type="button"
            onClick={printReceipt}
            className="mt-6 w-full rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#0D0A06] transition hover:bg-[#E8C96A]"
          >
            Download / Cetak Struk Digital
          </button>
        </motion.div>

        <div className="hidden">
          <Receipt ref={receiptRef} transaction={receiptTransaction} />
        </div>
      </section>
    </main>
  );
}
