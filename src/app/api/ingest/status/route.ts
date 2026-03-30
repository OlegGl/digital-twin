import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const stats = await sql`
      SELECT
        COUNT(*)::int AS total_readings,
        COUNT(DISTINCT sensor_id)::int AS sensors_with_data,
        MIN(time) AS oldest_reading,
        MAX(time) AS newest_reading,
        COUNT(*) FILTER (WHERE time > NOW() - INTERVAL '1 hour')::int AS readings_last_hour
      FROM sensor_readings
    `;

    const row = stats[0] || {
      total_readings: 0,
      sensors_with_data: 0,
      oldest_reading: null,
      newest_reading: null,
      readings_last_hour: 0,
    };

    return NextResponse.json(row);
  } catch (err) {
    console.error('Status endpoint error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
