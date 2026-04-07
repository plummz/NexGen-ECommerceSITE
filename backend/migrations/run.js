require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'nexgen_shop',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function run() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, '001_schema.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error('Migration failed:', err); process.exit(1); });
