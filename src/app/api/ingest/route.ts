import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface Reading {
  sensor_id: string;
  timestamp: string;
  value: number;
  unit?: string;
  quality?: 'good' | 'uncertain' | 'bad';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key, readings } = body as { api_key: string; readings: Reading[] };

    // Auth
    if (!api_key || api_key !== process.env.INGEST_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate readings array
    if (!Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json(
        { error: 'readings must be a non-empty array' },
        { status: 400 },
      );
    }

    // Validate each reading
    for (let i = 0; i < readings.length; i++) {
      const r = readings[i];
      if (!r.sensor_id || !r.timestamp || typeof r.value !== 'number') {
        return NextResponse.json(
          { error: `Reading at index ${i} missing required fields (sensor_id, timestamp, value)` },
          { status: 400 },
        );
      }
      if (r.quality && !['good', 'uncertain', 'bad'].includes(r.quality)) {
        return NextResponse.json(
          { error: `Reading at index ${i} has invalid quality: ${r.quality}` },
          { status: 400 },
        );
      }
    }

    // Batch insert with parameterized query
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const r of readings) {
      placeholders.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`,
      );
      values.push(
        r.timestamp,
        r.sensor_id,
        r.value,
        r.unit || 'unknown',
        r.quality || 'good',
      );
    }

    const query = `
      INSERT INTO sensor_readings (time, sensor_id, value, unit, quality)
      VALUES ${placeholders.join(', ')}
    `;

    await pool.query(query, values);

    return NextResponse.json({ success: true, inserted: readings.length });
  } catch (err) {
    console.error('Ingest error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
