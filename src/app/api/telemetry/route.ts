import { NextRequest, NextResponse } from 'next/server';
import { generateTelemetry } from '@/data/telemetry';
import { SensorType } from '@/types';
import { defaultBuilding } from '@/data/building';

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

  // Find sensor type from building data
  let sensorType: SensorType | null = null;
  for (const floor of defaultBuilding.floors) {
    const sensor = floor.sensors.find((s) => s.id === sensorId);
    if (sensor) {
      sensorType = sensor.type;
      break;
    }
  }

  if (!sensorType) {
    return NextResponse.json({ error: 'Sensor not found' }, { status: 404 });
  }

  const data = generateTelemetry(sensorId, sensorType, from, to, interval);
  return NextResponse.json(data);
}
