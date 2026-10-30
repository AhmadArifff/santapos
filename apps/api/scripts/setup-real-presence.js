require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const connectionString = (process.env.DATABASE_URL || '').replace(/sslmode=\w+/, '');
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL database');

  // 1. Add last_seen_at column to users table
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW()');
  console.log('✅ Added last_seen_at column to users table');

  // 2. Set logout_at for test accounts (user_id != 1) from previous test
  const result = await client.query(`
    UPDATE attendance
    SET logout_at = NOW()
    WHERE user_id != 1
      AND logout_at IS NULL
      AND date = CURRENT_DATE
  `);
  console.log('✅ Marked test accounts as logged out, affected rows:', result.rowCount);

  // 3. Keep Superadmin active
  await client.query('UPDATE users SET last_seen_at = NOW() WHERE id = 1');
  console.log('✅ Updated Super Admin last_seen_at = NOW()');

  // 4. Verify remaining active users
  const { rows } = await client.query(`
    SELECT u.id, u.name, u.role, a.login_at, a.logout_at, u.last_seen_at
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE a.date = CURRENT_DATE
      AND a.logout_at IS NULL
  `);
  console.log('Active users count:', rows.length);
  console.log('Active users:', rows);

  await client.end();
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

