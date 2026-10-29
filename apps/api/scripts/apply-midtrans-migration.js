require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connStr = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!connStr) {
  console.error('DATABASE_URL not found');
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

async function run() {
  const client = new Client({
    connectionString: getCleanConnectionString(connStr),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('Connected to Supabase DB. Applying 002_midtrans_payment_gateway.sql...');

  const sqlPath = path.join(__dirname, '../supabase/migrations/002_midtrans_payment_gateway.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8').replace(/^\uFEFF/, '');

  await client.query(sql);
  console.log('✅ Migration 002 applied successfully!');

  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
  `);
  console.log('Total tables in public schema:', rows.length);
  await client.end();
}

run().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});

