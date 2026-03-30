import { NextRequest, NextResponse } from 'next/server';
import { generateTelemetry } from '@/data/telemetry';
import { SensorType } from '@/types';
import { findSensorTypeById } from '@/lib/dbQueries';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sensorId = params.get('sensorId');
  const from = params.get('from');
  const to = params.get('to');
  const interval = parseInt(params.get('interval') || '15', 10);

  if (!sensorId || !from || !to) {
    return NextResponse.json(
      { error: 'Missing required params: sensorId, from, to' },
      { status: 400 },
    );
  }

  const sensorType = await findSensorTypeById(sensorId);
  if (!sensorType) {
    return NextResponse.json({ error: 'Sensor not found' }, { status: 404 });
  }

  // Try real data first
  try {
    const realData = await fetchRealTelemetry(sensorId, from, to);
    if (realData.length > 0) {
      return NextResponse.json(realData);
    }
  } catch {
    // Fall through to fake data if hypertable doesn't exist yet or query fails
  }

  // Fallback to PRNG-generated telemetry
  const data = generateTelemetry(sensorId, sensorType as SensorType, from, to, interval);
  return NextResponse.json(data);
}

async function fetchRealTelemetry(
  sensorId: string,
  from: string,
  to: string,
): Promise<Array<{ timestamp: string; value: number; unit: string }>> {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const rangeMs = toDate.getTime() - fromDate.getTime();
  const rangeHours = rangeMs / (1000 * 60 * 60);

  if (rangeHours <= 24) {
    // Raw readings
    const rows = await sql`
      SELECT time AS timestamp, value, unit
      FROM sensor_readings
      WHERE sensor_id = ${sensorId}
        AND time >= ${from}::timestamptz
        AND time <= ${to}::timestamptz
      ORDER BY time ASC
    `;
    return rows.map((r) => ({
      timestamp: (r.timestamp as Date).toISOString(),
      value: r.value as number,
      unit: r.unit as string,
    }));
  }

  // Determine bucket size
  let bucketInterval: string;
  if (rangeHours <= 7 * 24) {
    bucketInterval = '15 minutes';
  } else if (rangeHours <= 30 * 24) {
    bucketInterval = '1 hour';
  } else {
    bucketInterval = '1 day';
  }

  const rows = await sql`
    SELECT
      time_bucket(${bucketInterval}::interval, time) AS timestamp,
      AVG(value) AS value,
      (array_agg(unit))[1] AS unit
    FROM sensor_readings
    WHERE sensor_id = ${sensorId}
      AND time >= ${from}::timestamptz
      AND time <= ${to}::timestamptz
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  return rows.map((r) => ({
    timestamp: (r.timestamp as Date).toISOString(),
    value: r.value as number,
    unit: r.unit as string,
  }));
}
