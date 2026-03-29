import { NextResponse } from 'next/server';
import { BuildingConfigSchema } from '@/lib/buildingSchema';
import { listBuildings, saveBuildingConfig } from '@/lib/dbQueries';

// GET /api/buildings — list all buildings
export async function GET() {
  try {
    const buildings = await listBuildings();
    return NextResponse.json(buildings);
  } catch (err) {
    console.error('GET /api/buildings error:', err);
    return NextResponse.json({ error: 'Failed to list buildings' }, { status: 500 });
  }
}

// POST /api/buildings — create a new building
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = BuildingConfigSchema.parse(body);
    await saveBuildingConfig(config);
    return NextResponse.json(config, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid data';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
