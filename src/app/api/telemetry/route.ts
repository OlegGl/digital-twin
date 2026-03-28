import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { generateTelemetry } from '@/data/telemetry';
import { SensorType } from '@/types';
import { defaultBuilding } from '@/data/building';

function findSensorType(sensorId: string): SensorType | null {
  // First try default building (fast path)
  for (const floor of defaultBuilding.floors) {
    const sensor = floor.sensors.find((s) => s.id === sensorId);
    if (sensor) return sensor.type;
  }

  // Search all building JSON files
  const dir = join(process.cwd(), 'public', 'buildings');
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json');
    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
        if (data.floors) {
          for (const floor of data.floors) {
            const sensor = floor.sensors?.find((s: { id: string; type: string }) => s.id === sensorId);
            if (sensor) return sensor.type as SensorType;
          }
        }
      } catch { /* skip malformed files */ }
    }
  } catch { /* dir doesn't exist yet */ }

  return null;
}

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

  const sensorType = findSensorType(sensorId);
  if (!sensorType) {
    return NextResponse.json({ error: 'Sensor not found' }, { status: 404 });
  }

  const data = generateTelemetry(sensorId, sensorType, from, to, interval);
  return NextResponse.json(data);
}
