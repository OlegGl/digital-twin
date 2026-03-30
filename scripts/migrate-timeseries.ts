/**
 * Migration: Create sensor_readings hypertable for real time-series data.
 * 
 * Neon supports TimescaleDB Apache-2 features (no compression).
 * Run: npx tsx scripts/migrate-timeseries.ts
 */
import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';

config({ path: '.env.local' });

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('🔌 Connected to Neon database');

    // 1. Enable TimescaleDB extension
    console.log('📦 Enabling TimescaleDB extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb');
    console.log('   ✅ TimescaleDB enabled');

    // 2. Create sensor_readings table
    console.log('📋 Creating sensor_readings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        time        TIMESTAMPTZ NOT NULL,
        sensor_id   TEXT NOT NULL,
        value       DOUBLE PRECISION NOT NULL,
        unit        TEXT NOT NULL,
        quality     TEXT DEFAULT 'good'
      );
    `);
    console.log('   ✅ Table created');

    // 3. Convert to hypertable
    console.log('⏱️  Converting to hypertable...');
    await client.query(`
      SELECT create_hypertable('sensor_readings', 'time', if_not_exists => TRUE);
    `);
    console.log('   ✅ Hypertable created');

    // 4. Create index
    console.log('🔍 Creating index on (sensor_id, time DESC)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_time
        ON sensor_readings (sensor_id, time DESC);
    `);
    console.log('   ✅ Index created');

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
