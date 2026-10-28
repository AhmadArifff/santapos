# Panduan Deployment Santapos (Vercel & Supabase)

Dokumen ini adalah panduan lengkap (*step-by-step*) untuk melakukan deployment platform SaaS Multi-Tenant **Santapos** ke **Vercel** (Frontend Next.js) dan **Supabase** (Database PostgreSQL & Cloud Storage).

---

## 1. Arsitektur Deployment Monorepo

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DNS / Cloudflare                              │
│         *.santapos.id  ·  app.santapos.id  ·  santapos.id              │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌─────────────────────────┐      ┌─────────────────────────┐
       │   Frontend (Vercel)     │      │   Backend API (Vercel   │
       │   apps/web (Next.js 16) │ ───► │   / Railway / Render)   │
       │   Multi-tenant routing  │      │   apps/api (Node/Express│
       └─────────────────────────┘      └────────────┬────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────┐
                                        │        Supabase         │
                                        │  PostgreSQL (Port 6543) │
                                        │  Storage Bucket Assets  │
                                        └─────────────────────────┘
```

- **Frontend (`apps/web`)**: Next.js 16 App Router di-deploy ke Vercel dengan wildcard domain (`*.santapos.id`).
- **Backend API (`apps/api`)**: REST API Express.js dapat di-deploy ke Vercel (Serverless) atau Railway / Render (Dedicated Node.js Process yang sangat ideal untuk keep-alive cron & websockets).
- **Database & Storage**: Supabase Managed PostgreSQL + Supabase Storage Bucket.

---

## 2. Langkah 1: Setup Supabase (Database & Storage)

### A. Buat Project Supabase Baru
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Klik **New Project**.
3. Isi informasi project:
   - **Name**: `santapos-db` (atau sesuai preferensi Anda).
   - **Database Password**: Catat password ini baik-baik (gunakan password kuat).
   - **Region**: Pilih **Singapore (`ap-southeast-1`)** untuk latensi tercepat dari Indonesia.
4. Tunggu 1-2 menit hingga provisioning database selesai.

---

### B. Ambil Connection String (Database URL)
1. Buka menu **Project Settings** (ikon gear di sidebar kiri bawah) > **Database**.
2. Scroll ke bagian **Connection parameters** atau **Connection Pooling**.
3. Pilih mode **Transaction (Port 6543)** (sangat direkomendasikan untuk arsitektur serverless & multi-koneksi).
4. Salin URI koneksi yang disediakan. Formatnya seperti:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
   *(Ganti `[YOUR-PASSWORD]` dengan password database Anda).*

---

### C. Jalankan Migrasi Skema Multi-Tenant
1. Buka menu **SQL Editor** di dashboard Supabase.
2. Klik **New query**.
3. Buka file [`apps/api/supabase/migrations/001_multi_tenant_saas.sql`](../apps/api/supabase/migrations/001_multi_tenant_saas.sql) di text editor Anda.
4. Salin seluruh isi SQL tersebut, tempel ke dalam SQL Editor Supabase, lalu klik **Run** (Ctrl + Enter).
5. Migrasi ini akan secara otomatis:
   - Membuat tabel `plans` (paket Starter, Pro, Franchise).
   - Membuat tabel `tenants` (multi-tenant tenant registry).
   - Menambahkan kolom `tenant_id` dan composite indexes ke 19 tabel operasional restoran.
   - Mengaktifkan PostgreSQL Row-Level Security (RLS).
   - Mengisi data demo tenant 1 (*Sultan Kebab*).

---

### D. Setup Storage Bucket (Logo, Banner, Bukti Transfer)
1. Buka menu **Storage** di dashboard Supabase.
2. Klik **New bucket**.
3. Beri nama bucket: `restaurant-pos-assets`.
4. Centang opsi **Public bucket** agar logo toko, foto produk, dan bukti transfer dapat diakses browser pelanggan.
5. Klik **Save**.

---

### E. Ambil API Keys & Project URL
1. Buka **Project Settings** > **API**.
2. Salin nilai berikut:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon / public key**: Digunakan di frontend Next.js.
   - **service_role key (secret)**: Digunakan **hanya di backend API** (jangan pernah diekspos ke frontend!).

---

## 3. Langkah 2: Deployment Frontend di Vercel (`apps/web`)

### A. Hubungkan Repository
1. Masuk ke [Vercel Dashboard](https://vercel.com).
2. Klik **Add New...** > **Project**.
3. Pilih repository GitHub Anda: `AhmadArifff/santapos`.

---

### B. Konfigurasi Project Settings
1. **Project Name**: `santapos` (atau `santapos-web`).
2. **Framework Preset**: Pilih **Next.js**.
3. **Root Directory**: Klik **Edit** dan pilih:
   ```
   apps/web
   ```
4. **Build and Output Settings**:
   - Biarkan default (Turborepo akan mendeteksi otomatis `pnpm build`).

---

### C. Masukkan Environment Variables di Vercel
Pada bagian **Environment Variables**, tambahkan variabel berikut:

| Key | Value Contoh | Deskripsi |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.santapos.id/api` | Alamat publik backend API Anda |
| `NEXT_PUBLIC_APP_DOMAIN` | `santapos.id` | Domain root platform SaaS |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[REF].supabase.co` | Project URL Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Anon/Public Key Supabase |

5. Klik **Deploy** dan tunggu proses build selesai (~1 menit).

---

## 4. Langkah 3: Deployment Backend API (`apps/api`)

Anda memiliki 2 opsi untuk menjalankan backend:

### Opsi A: Deployment di Railway / Render (Direkomendasikan)
Karena Express.js memiliki fitur long-running process, background scheduler, dan keep-alive connection, platform seperti [Railway.app](https://railway.app) atau [Render.com](https://render.com) sangat ideal:
1. Hubungkan repo `AhmadArifff/santapos`.
2. Root Directory: `apps/api`.
3. Start Command: `node src/index.js` (atau `pnpm start`).
4. Masukkan Environment Variables:
   ```env
   NODE_ENV=production
   PORT=5000
   DB_CLIENT=postgres
   DB_SSL=true
   DB_POOL_MAX=5
   DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   SUPABASE_URL=https://[REF].supabase.co
   SUPABASE_STORAGE_BUCKET=restaurant-pos-assets
   STORAGE_DRIVER=supabase
   SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_ANDA]
   JWT_SECRET=buat_random_secret_panjang_minimal_32_karakter
   CRON_SECRET=buat_random_cron_secret_panjang
   FRONTEND_URL=https://santapos.id
   CORS_ORIGINS=https://santapos.id,https://app.santapos.id,https://www.santapos.id
   ```

### Opsi B: Deployment di Vercel sebagai Serverless API
1. Tambahkan New Project di Vercel dengan Root Directory `apps/api`.
2. Framework Preset: **Other**.
3. Masukkan Environment Variables yang sama seperti di atas.

---

## 5. Langkah 4: Setup Custom Domain & Wildcard Subdomain

Agar fitur multi-tenant SaaS berjalan otomatis (misal: `kebab.santapos.id`, `kopisenja.santapos.id`, dan `app.santapos.id` untuk Superadmin):

1. Masuk ke Project **Frontend (`santapos`)** di Vercel.
2. Buka **Settings** > **Domains**.
3. Tambahkan domain Anda:
   - `santapos.id` (Apex domain)
   - `www.santapos.id`
   - `app.santapos.id` (Akan otomatis dialihkan ke portal `/superadmin` oleh Edge Middleware)
   - `*.santapos.id` (**Wildcard domain**)
4. Buka provider DNS domain Anda (Cloudflare, Niagahoster, Domainesia, dsb):
   - Tambahkan CNAME: `*` mengarah ke `cname.vercel-dns.com`
   - Tambahkan CNAME: `app` mengarah ke `cname.vercel-dns.com`
   - Tambahkan A Record: `@` mengarah ke IP Vercel `76.76.21.21`

---

## 6. Checklist Pengujian Pasca-Deployment

Setelah deployment selesai, lakukan verifikasi berikut:
- [ ] **Halaman Utama**: Akses `https://santapos.id` -> Landing page SaaS terbuka.
- [ ] **Onboarding Mitra Restoran Baru**: Akses `https://santapos.id/onboarding` -> Daftarkan 1 restoran uji coba (misal: "Kopi Nusantara").
- [ ] **Self-Order QR Meja**: Akses `https://kopinusantara.santapos.id/order` -> Tampilan menu digital untuk pelanggan terbuka sesuai branding resto.
- [ ] **Superadmin Portal**: Akses `https://app.santapos.id` atau `https://santapos.id/superadmin` dengan akun superadmin -> Daftar seluruh tenant dan statistik platform tampil.
- [ ] **Franchise Multi-Cabang HQ**: Buka menu **Laporan** -> Tab **Kantor Pusat HQ** untuk melihat konsolidasi omzet lintas cabang.
