require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL / SUPABASE_DATABASE_URL tidak ditemukan di apps/api/.env');
  process.exit(1);
}

const getCleanConnectionString = (val) => {
  const url = new URL(val);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('sslcert');
  url.searchParams.delete('sslkey');
  url.searchParams.delete('sslrootcert');
  return url.toString();
};

async function setup() {
  console.log('\n=====================================================================');
  console.log('       SANTAPOS - Setup Database, Migrasi, Seed & Supabase Storage');
  console.log('=====================================================================\n');

  console.log('🚀 Menghubungkan ke PostgreSQL (Supabase Pooler)...');
  const client = new Client({
    connectionString: getCleanConnectionString(connectionString),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('✅ Terhubung ke database PostgreSQL!\n');

  try {
    // 1. Terapkan schema dasar
    console.log('⏳ [1/5] Memeriksa & Menerapkan schema.sql (tabel dasar)...');
    const schemaPath = path.join(__dirname, '../supabase/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\uFEFF/g, '');
      await client.query(schemaSql);
      console.log('✅ Base schema.sql berhasil diterapkan.');
    }

    // 2. Terapkan multi-tenant SaaS migration (001)
    console.log('⏳ [2/5] Menerapkan 001_multi_tenant_saas.sql (multi-tenant engine)...');
    const saasPath = path.join(__dirname, '../supabase/migrations/001_multi_tenant_saas.sql');
    if (fs.existsSync(saasPath)) {
      const saasSql = fs.readFileSync(saasPath, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\uFEFF/g, '');
      await client.query(saasSql);
      console.log('✅ Multi-tenant SaaS migration (001) berhasil diterapkan.');
    }

    // 3. Terapkan Midtrans payment gateway migration (002)
    console.log('⏳ [3/5] Menerapkan 002_midtrans_payment_gateway.sql (Midtrans & Financial Audit)...');
    const midtransPath = path.join(__dirname, '../supabase/migrations/002_midtrans_payment_gateway.sql');
    if (fs.existsSync(midtransPath)) {
      const midtransSql = fs.readFileSync(midtransPath, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\uFEFF/g, '');
      await client.query(midtransSql);
      console.log('✅ Midtrans payment gateway migration (002) berhasil diterapkan.');
    }

    // 4. Pastikan ENUM user_role lengkap
    console.log('\n⏳ [4/5] Memeriksa Enum Roles, Tenant Default, Cabang & Akun Pengguna...');
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin'");
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin'");
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kasir'");
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kitchen'");

    // Pastikan Default Tenant ada
    await client.query(`
      INSERT INTO tenants (id, name, slug, plan_id, status)
      VALUES (
        1,
        'Santapos Resto Utama',
        'santapos-resto',
        COALESCE((SELECT id FROM plans WHERE code = 'franchise' LIMIT 1), 1),
        'active'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        status = 'active'
    `);

    // Pastikan Default Branch ada
    const { rows: existingBranch } = await client.query("SELECT id FROM branches WHERE tenant_id = 1 AND branch_key = 'default' LIMIT 1");
    let defaultBranchId = 1;
    if (existingBranch.length === 0) {
      const { rows: insertedBranch } = await client.query(`
        INSERT INTO branches (tenant_id, branch_key, name, area, status)
        VALUES (1, 'default', 'Cabang Utama', 'Pusat', 'active')
        RETURNING id
      `);
      defaultBranchId = insertedBranch[0]?.id || 1;
    } else {
      defaultBranchId = existingBranch[0].id;
      await client.query(`
        UPDATE branches
        SET name = 'Cabang Utama', status = 'active'
        WHERE id = $1
      `, [defaultBranchId]);
    }

    // Helper: Seed or Update User
    const defaultPassword = 'santapos123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const seedUsers = [
      {
        name: 'Super Admin Santapos',
        email: 'superadmin@santapos.id',
        role: 'superadmin',
        tenant_id: 1,
        branch_id: defaultBranchId,
        desc: 'Akses penuh Portal SaaS Superadmin & Database Manager (/superadmin)',
      },
      {
        name: 'Admin Restoran Demo',
        email: 'admin@santapos.id',
        role: 'admin',
        tenant_id: 1,
        branch_id: defaultBranchId,
        desc: 'Akses Manajemen Toko, Menu, Stok, Diskon, Karyawan, & Laporan (/dashboard)',
      },
      {
        name: 'Kasir Cabang Utama',
        email: 'kasir@santapos.id',
        role: 'kasir',
        tenant_id: 1,
        branch_id: defaultBranchId,
        desc: 'Akses Transaksi Kasir POS, Riwayat Transaksi & Struk Thermal (/pos)',
      },
      {
        name: 'Tim Dapur (Kitchen)',
        email: 'kitchen@santapos.id',
        role: 'kitchen',
        tenant_id: 1,
        branch_id: defaultBranchId,
        desc: 'Akses Kitchen Display System (KDS) & Timer Pesanan (/kitchen)',
      },
    ];

    console.log('Seeding akun pengguna untuk login:');
    for (const u of seedUsers) {
      const { rows } = await client.query('SELECT id, role FROM users WHERE email = $1', [u.email]);
      if (rows.length === 0) {
        await client.query(`
          INSERT INTO users (name, email, password, role, tenant_id, default_branch_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [u.name, u.email, passwordHash, u.role, u.tenant_id, u.branch_id]);
        console.log(`  + Akun dibuat: ${u.email} [Role: ${u.role}]`);
      } else {
        // Update password & role jika perlu di-reset
        await client.query(`
          UPDATE users
          SET password = $1, role = $2, tenant_id = $3, default_branch_id = $4
          WHERE email = $5
        `, [passwordHash, u.role, u.tenant_id, u.branch_id, u.email]);
        console.log(`  ✓ Akun siap: ${u.email} [Role: ${u.role}]`);
      }
    }

    // 5. Inisialisasi Supabase Storage Bucket
    console.log('\n⏳ [5/5] Memeriksa & Menginisialisasi Supabase Storage Bucket...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'restaurant-pos-assets';

    if (supabaseUrl && serviceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
          console.log(`  ⚠️ Gagal list bucket (${listError.message}), mencoba pembuatan langsung...`);
        }

        const bucketExists = buckets && buckets.some((b) => b.name === bucketName);

        if (!bucketExists) {
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'],
          });

          if (createError && !/already exists|duplicate/i.test(createError.message || '')) {
            console.log(`  ⚠️ Gagal membuat bucket otomatis: ${createError.message}`);
          } else {
            console.log(`  ✅ Supabase Storage Bucket [${bucketName}] berhasil dibuat (Public Access: ON)!`);
          }
        } else {
          console.log(`  ✅ Supabase Storage Bucket [${bucketName}] sudah tersedia dan aktif!`);
        }
      } catch (storageErr) {
        console.log(`  ⚠️ Peringatan Supabase Storage: ${storageErr.message}`);
      }
    } else {
      console.log('  ℹ️ SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi di .env. Melewati setup storage.');
    }

    // Cetak Total Tabel
    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n=====================================================================');
    console.log(`  MIGRASI & SEED SELESAI! (Total ${tables.length} Tabel di Database Supabase)`);
    console.log('=====================================================================');
    console.log('\nDAFTAR AKUN LOGIN DEFAULT (Password untuk semua: santapos123):');
    console.log('---------------------------------------------------------------------');
    console.log('1. Super Admin : superadmin@santapos.id | Pass: santapos123');
    console.log('   -> Halaman: http://localhost:3000/superadmin (Portal SaaS)');
    console.log('2. Admin Toko  : admin@santapos.id      | Pass: santapos123');
    console.log('   -> Halaman: http://localhost:3000/dashboard  (Backoffice Resto)');
    console.log('3. Kasir POS   : kasir@santapos.id      | Pass: santapos123');
    console.log('   -> Halaman: http://localhost:3000/pos        (Point of Sale)');
    console.log('4. Tim Kitchen : kitchen@santapos.id    | Pass: santapos123');
    console.log('   -> Halaman: http://localhost:3000/kitchen    (Kitchen Display)');
    console.log('=====================================================================\n');

  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi & seed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
