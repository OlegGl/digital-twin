import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BuildingConfigSchema, type BuildingIndexEntry } from '@/lib/buildingSchema';

const BUILDINGS_DIR = path.join(process.cwd(), 'public', 'buildings');
const INDEX_PATH = path.join(BUILDINGS_DIR, 'index.json');

function readIndex(): BuildingIndexEntry[] {
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeIndex(index: BuildingIndexEntry[]) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

// GET /api/buildings/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const filePath = path.join(BUILDINGS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return NextResponse.json(data);
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

    const filePath = path.join(BUILDINGS_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));

    // Update index entry
    const index = readIndex();
    const idx = index.findIndex((b) => b.id === id);
    const entry = { id: config.id, name: config.name, address: config.address, type: config.type };
    if (idx >= 0) {
      index[idx] = entry;
    } else {
      index.push(entry);
    }
    writeIndex(index);

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
  const filePath = path.join(BUILDINGS_DIR, `${id}.json`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const index = readIndex().filter((b) => b.id !== id);
  writeIndex(index);

  return NextResponse.json({ ok: true });
}
