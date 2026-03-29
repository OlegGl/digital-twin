import { Pool, neon } from '@neondatabase/serverless';

// Pooled connection for transactional work
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Quick single-query helper (uses HTTP, no pool overhead)
const sql = neon(process.env.DATABASE_URL!);

export { pool, sql };
