import { NextRequest, NextResponse } from 'next/server';
import { generateTelemetry } from '@/data/telemetry';
import { SensorType } from '@/types';
import { findSensorTypeById } from '@/lib/dbQueries';

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

  const data = generateTelemetry(sensorId, sensorType as SensorType, from, to, interval);
  return NextResponse.json(data);
}
