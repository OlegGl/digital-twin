import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BuildingConfigSchema, BuildingIndexSchema, type BuildingIndexEntry } from '@/lib/buildingSchema';

const BUILDINGS_DIR = path.join(process.cwd(), 'public', 'buildings');
const INDEX_PATH = path.join(BUILDINGS_DIR, 'index.json');

function readIndex(): BuildingIndexEntry[] {
  try {
    const raw = fs.readFileSync(INDEX_PATH, 'utf-8');
    return BuildingIndexSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeIndex(index: BuildingIndexEntry[]) {
  fs.mkdirSync(BUILDINGS_DIR, { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

// GET /api/buildings — list all buildings
export async function GET() {
  return NextResponse.json(readIndex());
}

// POST /api/buildings — create a new building
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = BuildingConfigSchema.parse(body);

    const index = readIndex();
    if (index.some((b) => b.id === config.id)) {
      return NextResponse.json({ error: 'Building ID already exists' }, { status: 409 });
    }

    // Write per-building JSON
    const filePath = path.join(BUILDINGS_DIR, `${config.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));

    // Update index
    index.push({
      id: config.id,
      name: config.name,
      address: config.address,
      type: config.type,
    });
    writeIndex(index);

    return NextResponse.json(config, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid data';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
