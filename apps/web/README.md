# Sultan Kebab POS & Self Order System

Frontend aplikasi Restaurant POS modern untuk restoran, cafe, franchise kuliner, dan bisnis F&B yang membutuhkan operasional kasir, self-order meja, stok resep, pembayaran manual, voucher diskon, laporan bisnis, landing page, dan PWA dalam satu sistem.

Project ini saya bangun sebagai contoh kemampuan membuat aplikasi bisnis end-to-end yang siap dikembangkan sesuai kebutuhan client: dari UI/UX, frontend interaktif, integrasi backend API, Supabase, upload asset, dashboard operasional, sampai pengalaman pelanggan melalui QR meja.

## Ringkasan Produk

Sultan Kebab POS bukan hanya aplikasi kasir. Sistem ini menghubungkan tiga sisi pengguna:

- Pelanggan dapat memilih cabang, memilih meja, memesan menu, memilih metode pembayaran, upload bukti bayar, memantau status pesanan, dan memberi review.
- Kasir dapat memproses transaksi POS, menerima pesanan meja, memvalidasi bukti pembayaran, mengelola stok siap jual, dan mencetak struk.
- Admin dapat mengatur produk, resep bahan baku, stok gudang, pengajuan stok, voucher diskon, metode pembayaran, laporan, jadwal kasir, landing page, login page, branding, dan tutorial penggunaan.

## Preview Aplikasi

### Landing Page Publik

Landing page dibuat sebagai etalase restoran yang bisa dikelola dari admin panel. Section seperti hero, best seller, menu lengkap, campaign voucher, experience, testimonial, lokasi, dan CTA dibuat dinamis agar brand restoran terlihat profesional.

![Hero Section](<public/images/tampilan-aplikasi/hero section.png>)

![Best Seller Section](<public/images/tampilan-aplikasi/bestseller section.png>)

![Menu Section](<public/images/tampilan-aplikasi/menu section 1.png>)

![Campaign Voucher Section](<public/images/tampilan-aplikasi/campain vocher & diskon section.png>)

![Experience Section](<public/images/tampilan-aplikasi/experience section.png>)

![Testimonial Section](<public/images/tampilan-aplikasi/testimonial section.png>)

![CTA Section](<public/images/tampilan-aplikasi/CTA section.png>)

### Login dan Admin Panel

Halaman login, sidebar admin, floating AI assistant, dan tutorial assistant dibuat untuk membantu operasional harian terasa mudah dipahami oleh tim restoran.

![Halaman Login](<public/images/tampilan-aplikasi/halaman login.png>)

![Admin Dashboard](<public/images/tampilan-aplikasi/admin menu dashboard.png>)

![AI Assistant](<public/images/tampilan-aplikasi/admin float button AI Assistant.png>)

![Tutorial Assistant](<public/images/tampilan-aplikasi/admin float button tutor (example tutor menu kasir).png>)

### Self Order Pelanggan

Pelanggan dapat memilih cabang dan meja, memesan langsung dari HP, klaim voucher, memilih metode pembayaran QRIS atau transfer, upload bukti, lalu memantau status pesanan sampai selesai.

![Pilih Cabang dan Meja](<public/images/tampilan-aplikasi/halaman order (pilih cabang dan meja).png>)

![Pilih Menu dan Metode Pembayaran](<public/images/tampilan-aplikasi/halaman order (pilih menu pesanan dan pilih metode pembayaran).png>)

![Pembayaran QRIS](<public/images/tampilan-aplikasi/halaman order (pembayaran qrs).png>)

![Review Voucher](<public/images/tampilan-aplikasi/halaman order (review untuk klaim vocher & diskon).png>)

### Kasir dan Transaksi POS

Menu kasir mendukung transaksi langsung, diskon, voucher, metode bayar tunai/QRIS/transfer, pecahan uang, modal pembayaran responsive, dan ringkasan pesanan.

![Menu Kasir](<public/images/tampilan-aplikasi/admin menu kasir.png>)

![Modal Pembayaran Kasir](<public/images/tampilan-aplikasi/admin menu kasir (tampilan modal pembayaran).png>)

![Riwayat POS](<public/images/tampilan-aplikasi/admin menu riwayat POS.png>)

### Pesanan Meja

Admin dan kasir dapat melihat pesanan meja, validasi bukti pembayaran, ubah status pesanan, batalkan pesanan, dan memantau alur dari menunggu sampai selesai.

![Pesanan Meja - Validasi Bukti Pembayaran](<public/images/tampilan-aplikasi/admin menu pesanan meja (status terima dan validasi bukti pembayaran).png>)

![Pesanan Meja - Disiapkan](<public/images/tampilan-aplikasi/admin menu pesanan meja (status pesanan sedang disiapkan).png>)

![Pesanan Meja - Siap Diantar](<public/images/tampilan-aplikasi/admin menu pesanan meja (status pesanan siap diantar).png>)

![Pesanan Meja - Selesai](<public/images/tampilan-aplikasi/admin menu pesanan meja (status pesanan selesai).png>)

### Produk, Resep, dan HPP

Produk tidak hanya berisi nama dan harga. Setiap menu dapat memiliki resep bahan baku, estimasi HPP, margin, gambar produk, kategori, stok siap jual per kasir, dan validasi stok berdasarkan bahan yang tersedia.

![Menu Produk](<public/images/tampilan-aplikasi/admin menu produk.png>)

![Form Tambah Produk](<public/images/tampilan-aplikasi/admin menu produk (form tambah produk).png>)

### Stok Gudang dan Pengajuan Kasir

Sistem stok mendukung master bahan baku, saldo gudang, pemasukan, pengeluaran, pengajuan kasir, approval admin, dan kalkulasi otomatis kebutuhan bahan dari resep produk.

![Stok - Bahan Baku](<public/images/tampilan-aplikasi/admin menu stok (tab bahan baku).png>)

![Stok Gudang - Saldo](<public/images/tampilan-aplikasi/admin menu stok (tab stok gudang - saldo stok).png>)

![Stok Gudang - Pemasukan](<public/images/tampilan-aplikasi/admin menu stok (tab stok gudang - pemasukan).png>)

![Form Catat Pembelian](<public/images/tampilan-aplikasi/admin menu stok (tab stok gudang - pemasukan - form input catat pembelian).png>)

![Stok Gudang - Pengeluaran](<public/images/tampilan-aplikasi/admin menu stok (tab stok gudang - pengeluaran).png>)

![Form Catat Pengeluaran](<public/images/tampilan-aplikasi/admin menu stok (tab stok gudang - pengeluaran - form input catat pengeluaran).png>)

![Pengajuan Kasir](<public/images/tampilan-aplikasi/admin menu stok (tab pengajuan kasir).png>)

![Approval Pengajuan Kasir](<public/images/tampilan-aplikasi/admin menu stok (tab pengajuan kasir - form proses approval or cancle).png>)

### Voucher, Payment, Laporan, dan Tim

Admin dapat mengatur voucher review, kode voucher, paket bundle, metode pembayaran manual, laporan bisnis, dan jadwal kasir per cabang.

![Voucher dan Diskon](<public/images/tampilan-aplikasi/admin menu vocher & diskon.png>)

![Metode Pembayaran](<public/images/tampilan-aplikasi/admin menu payment.png>)

![Laporan Bisnis](<public/images/tampilan-aplikasi/admin menu laporan.png>)

![Tim Kasir](<public/images/tampilan-aplikasi/admin menu tim kasir.png>)

![Form Tambah Kasir](<public/images/tampilan-aplikasi/admin menu tim kasir (form input tambah kasir).png>)

![Form Tambah Jadwal](<public/images/tampilan-aplikasi/admin menu tim kasir (form input tambah jadwal).png>)

### CMS Landing, Login, dan Pengaturan

Admin dapat mengelola konten landing page, tampilan login, logo, favicon, nama toko, asset gambar, warna, dan pengaturan website tanpa perlu mengubah kode.

![Landing Page Settings](<public/images/tampilan-aplikasi/admin menu landing page.png>)

![Login Page Settings](<public/images/tampilan-aplikasi/admin menu login page.png>)

![Pengaturan Website](<public/images/tampilan-aplikasi/admin menu pengaturan.png>)

## Fitur Utama

### 1. Landing Page Dinamis

- Hero, about, best seller, menu tabs, campaign voucher, experience, gallery, testimonial, lokasi, CTA, floating button, marquee, dan footer.
- Konten dapat diatur dari admin panel.
- Gambar dapat memakai upload file atau URL asset online.
- Section dapat diaktifkan atau dinonaktifkan.
- Campaign voucher tampil interaktif dengan countdown, kuota, rule klaim, dan arahan redeem.

### 2. Self Order QR Meja

- Pelanggan memilih cabang dan meja.
- Sistem token meja menjaga supaya satu meja tidak dipakai device lain saat sedang aktif.
- Draft cart dapat dibuka kembali oleh pelanggan yang sama.
- Pesanan dapat memakai kode voucher, voucher review QR, dan paket bundle.
- Pelanggan bisa memilih QRIS atau transfer manual.
- Setelah pembayaran, pelanggan upload bukti dan menunggu verifikasi kasir/admin.
- Status pesanan dapat dipantau sampai selesai.

### 3. POS Kasir

- Transaksi kasir dengan cart, stok siap jual, diskon, voucher, dan pembayaran.
- Modal pembayaran responsive untuk desktop dan mobile.
- Pecahan uang tunai dengan kalkulasi kembalian.
- Struk POS dan riwayat transaksi.
- Meja yang sedang aktif oleh pelanggan tidak dapat dipilih sembarangan dari POS.

### 4. Pesanan Meja

- Monitoring pesanan pelanggan dari QR meja.
- Validasi bukti pembayaran dalam modal.
- Update status pesanan: diterima, disiapkan, siap diantar, selesai, batal.
- Bulk action untuk beberapa pesanan sekaligus.
- Search dan filter tanggal range.
- Default load data hari ini agar performa tetap cepat.

### 5. Voucher dan Diskon

- Reward review pelanggan.
- Kode voucher untuk promosi sosial media.
- Paket bundle berdasarkan menu dan quantity tertentu.
- Kuota total dan limit klaim per nomor HP.
- Masa berlaku terjadwal atau tanpa expired sampai kuota habis.
- Diskon dipisahkan antara bundle, kode voucher, dan reward review agar perhitungan jelas.

### 6. Payment Manual

- QRIS manual dengan QR toko, countdown, instruksi bayar, upload bukti, dan tombol download QR.
- Transfer bank manual dengan nomor rekening, copy rekening, copy nominal, upload struk.
- Admin dapat mengatur metode pembayaran dari menu Payment.
- Pesanan dapat otomatis dibatalkan jika batas pembayaran habis.

### 7. Produk dan Resep

- CRUD produk dan kategori.
- Upload gambar produk dengan validasi tipe file.
- Resep bahan baku per produk.
- Estimasi HPP dan margin keuntungan.
- Validasi stok berdasarkan bahan yang tersedia.
- Produk dapat ditampilkan di landing page dan halaman order.

### 8. Stok Gudang

- Master bahan baku.
- Saldo stok gudang.
- Catat pembelian dan pengeluaran.
- Pengajuan stok kasir berdasarkan menu dan qty porsi.
- Ringkasan bahan otomatis dari resep produk.
- Approval, penolakan, histori, search, range tanggal, expand/hide, dan pagination.

### 9. Dashboard, Riwayat POS, dan Laporan

- Ringkasan omzet, margin, transaksi, stok menipis, dan distribusi diskon.
- Filter tanggal range seperti booking hotel.
- Riwayat POS dengan pencarian invoice, kasir, dan admin.
- Laporan bisnis untuk omzet, profit, stok, payment mix, performa karyawan, dan export PDF.

### 10. Tim Kasir dan Jadwal

- Manajemen akun admin/kasir.
- Jadwal kasir per cabang.
- Filter range tanggal.
- Validasi agar kasir tidak dijadwalkan di beberapa cabang pada hari yang sama.
- Tampilan calendar event untuk memudahkan operasional shift.

### 11. Tutorial Assistant dan AI Assistant

- Floating tutorial assistant untuk memandu penggunaan menu.
- Tutorial tersedia untuk role admin dan role kasir sesuai akses menu.
- Demo tutorial memakai data dummy agar aman untuk latihan.
- AI assistant membantu membaca data bisnis seperti omzet, stok, transaksi, dan rekomendasi operasional.

### 12. PWA dan Branding

- Aplikasi dapat di-install di HP.
- Nama aplikasi mengikuti pengaturan toko.
- Icon dan favicon dapat diatur dari admin.
- Runtime theme membuat logo, favicon, warna, dan metadata mengikuti data database.

## Kenapa Project Ini Menarik untuk Client

- Cocok untuk restoran, cafe, food court, franchise, booth makanan, dan bisnis F&B multi-cabang.
- Alur pelanggan, kasir, dan admin sudah saling terhubung.
- Bukan sekadar tampilan, tetapi sudah memikirkan stok, resep, HPP, payment manual, diskon, review, laporan, dan operasional harian.
- Bisa dikembangkan menjadi produk SaaS, aplikasi internal restoran, sistem franchise, atau aplikasi custom untuk brand tertentu.
- Desain UI dibuat premium, interaktif, dan responsive untuk desktop maupun mobile.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Zustand untuk state management dan persist auth/cart/settings
- Axios untuk HTTP client dan auth interceptor
- Framer Motion untuk animasi UI
- Supabase Storage untuk asset gambar
- REST API backend
- PWA manifest dan service worker
- Vercel deployment

## Struktur Folder Penting

```text
app/                              Halaman Next.js App Router
app/login/                        Login page
app/order/                        Self order pelanggan
app/pos/                          POS kasir dan riwayat transaksi
app/reports/                      Laporan bisnis
components/admin/                 Komponen admin panel dan settings
components/landing/               Section landing page publik
components/pos/                   Komponen POS, cart, payment, receipt
components/ui/                    UI reusable, PWA, runtime theme, assistant
lib/                              Axios, API wrapper, asset helper
store/                            Zustand stores
public/images/tampilan-aplikasi/  Screenshot aplikasi untuk README
```

## Environment

Buat file `.env.local` di root frontend.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Untuk production:

```env
NEXT_PUBLIC_API_URL=https://domain-backend-anda.com/api
```

## Menjalankan Project

Pastikan backend sudah berjalan dan database aktif.

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

Build production:

```bash
npm run build
npm run start
```

Lint:

```bash
npm run lint
```

## Workflow Sistem

1. Pelanggan membuka landing page.
2. Pelanggan memilih cabang dan meja dari halaman order.
3. Pelanggan memilih menu, klaim voucher jika ada, memilih metode pembayaran, lalu mengirim pesanan.
4. Kasir/admin memvalidasi bukti pembayaran.
5. Status pesanan diproses sampai selesai.
6. Pelanggan memberi review dan bisa mendapatkan voucher QR untuk transaksi berikutnya.
7. Stok menu dan bahan baku dikelola dari POS, stok gudang, dan pengajuan kasir.
8. Admin memantau dashboard, riwayat POS, laporan, diskon, payment, tim kasir, dan konten landing page.

## Integrasi Backend

Frontend memakai API backend melalui helper Axios dan wrapper endpoint.

Endpoint utama:

- `/auth`
- `/products`
- `/categories`
- `/transactions`
- `/customer`
- `/discounts`
- `/payment-methods`
- `/stock-items`
- `/main-stock`
- `/stock-requests`
- `/reports`
- `/attendance`
- `/settings`
- `/ai-chat`

## Role dan Akses

- Admin: akses penuh ke POS, pesanan meja, riwayat POS, dashboard, voucher, payment, produk, stok, laporan, tim kasir, landing page, login page, pengaturan, tutorial, dan AI assistant.
- Kasir: akses operasional kasir, pesanan meja, stok yang relevan, transaksi, pengajuan stok, dan tutorial sesuai role.
- Pelanggan: akses landing page, self-order meja, pembayaran, riwayat pesanan, review, dan klaim voucher.

## Catatan Development

- Jangan commit `.env.local` atau secret API.
- Jalankan backend sebelum mengetes halaman admin.
- Pastikan Supabase dan storage bucket aktif untuk upload gambar.
- Untuk perubahan UI besar, jalankan build sebelum push.
- Gambar README berada di `public/images/tampilan-aplikasi`.

## Jasa Pembuatan Aplikasi

Project ini dapat menjadi referensi kemampuan saya dalam membangun aplikasi bisnis custom:

- POS restoran dan cafe
- QR self-order meja
- Inventory dan stok resep
- Dashboard dan laporan bisnis
- Landing page dinamis
- Sistem voucher dan loyalty
- Payment manual QRIS/transfer
- PWA yang bisa di-install di HP
- Admin panel custom sesuai proses bisnis client

Jika Anda membutuhkan aplikasi sejenis untuk bisnis kuliner, retail, reservasi, franchise, atau sistem internal perusahaan, arsitektur project ini bisa dikembangkan ulang dengan branding, flow, fitur, dan integrasi yang sesuai kebutuhan.

## Commit Format

Project ini menggunakan format commit historis:

```text
V.1.1.10 solve menu POS menu riwayat POS and chart analiys
```

Contoh commit berikutnya:

```text
V.1.1.174 update frontend project README
```
