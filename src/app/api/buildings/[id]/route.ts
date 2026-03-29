import { NextResponse } from 'next/server';
import { BuildingConfigSchema } from '@/lib/buildingSchema';
import { getBuildingById, saveBuildingConfig, deleteBuilding } from '@/lib/dbQueries';

// GET /api/buildings/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const config = await getBuildingById(id);
    if (!config) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (err) {
    console.error(`GET /api/buildings/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to load building' }, { status: 500 });
  }
}

// PUT /api/buildings/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const config = BuildingConfigSchema.parse({ ...body, id, updatedAt: new Date().toISOString() });
    await saveBuildingConfig(config);
    return NextResponse.json(config);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid data';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/buildings/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await deleteBuilding(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/buildings/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
