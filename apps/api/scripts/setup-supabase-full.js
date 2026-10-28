require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL tidak ditemukan di .env');
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
  console.log('🚀 Menghubungkan ke Supabase PostgreSQL...');
  const client = new Client({
    connectionString: getCleanConnectionString(connectionString),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('✅ Terhubung ke database Supabase!');

  try {
    // 1. Terapkan schema dasar
    console.log('⏳ Menerapkan schema.sql (tabel dasar)...');
    const schemaPath = path.join(__dirname, '../supabase/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\uFEFF/g, '');
      await client.query(schemaSql);
      console.log('✅ Base schema.sql berhasil diterapkan.');
    }

    // 2. Terapkan multi-tenant SaaS migration
    console.log('⏳ Menerapkan 001_multi_tenant_saas.sql (multi-tenant engine)...');
    const saasPath = path.join(__dirname, '../supabase/migrations/001_multi_tenant_saas.sql');
    if (fs.existsSync(saasPath)) {
      const saasSql = fs.readFileSync(saasPath, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\uFEFF/g, '');
      await client.query(saasSql);
      console.log('✅ Multi-tenant SaaS migration berhasil diterapkan.');
    }

    // 3. Pastikan Akun Super Admin & Demo Admin tersedia
    console.log('⏳ Memeriksa enum role dan akun Super Admin...');
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin'");
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kitchen'");

    const superEmail = 'superadmin@santapos.id';
    const { rows: superRows } = await client.query('SELECT id FROM users WHERE email = $1', [superEmail]);

    if (superRows.length === 0) {
      const hash = await bcrypt.hash('santapos123', 10);
      await client.query(`
        INSERT INTO users (name, email, password, role, tenant_id)
        VALUES ('Super Admin Santapos', $1, $2, 'superadmin', 1)
      `, [superEmail, hash]);
      console.log('✅ Akun Super Admin dibuat: superadmin@santapos.id / santapos123');
    } else {
      console.log('ℹ️ Akun Super Admin sudah ada.');
    }

    // 4. Periksa default admin demo
    const adminEmail = 'admin@santapos.id';
    const { rows: adminRows } = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (adminRows.length === 0) {
      const hash = await bcrypt.hash('santapos123', 10);
      await client.query(`
        INSERT INTO users (name, email, password, role, tenant_id)
        VALUES ('Admin Demo', $1, $2, 'admin', 1)
      `, [adminEmail, hash]);
      console.log('✅ Akun Admin Demo dibuat: admin@santapos.id / santapos123');
    }

    // 5. Cetak daftar tabel
    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\n📊 Total tabel di database Supabase:', tables.length);
    console.log('Daftar tabel:', tables.map(t => t.table_name).join(', '));

    console.log('\n🎉 SETUP SUPABASE BERHASIL 100%!');
  } catch (err) {
    console.error('❌ Gagal menerapkan schema:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
