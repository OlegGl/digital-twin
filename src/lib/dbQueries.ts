/**
 * DB query helpers — reconstruct BuildingConfig JSON from normalized tables.
 */
import { sql } from './db';
import type { BuildingConfig, BuildingIndexEntry } from './buildingSchema';

// ─── List all buildings (index) ──────────────────────────────────────────────
export async function listBuildings(): Promise<BuildingIndexEntry[]> {
  const rows = await sql`SELECT id, name, address, type FROM buildings ORDER BY name`;
  return rows as BuildingIndexEntry[];
}

// ─── Get full building config by ID ──────────────────────────────────────────
export async function getBuildingById(id: string): Promise<BuildingConfig | null> {
  const buildings = await sql`SELECT * FROM buildings WHERE id = ${id}`;
  if (buildings.length === 0) return null;
  const b = buildings[0];

  const floors = await sql`SELECT * FROM floors WHERE building_id = ${id} ORDER BY sort_order`;
  const sensors = await sql`SELECT * FROM sensors WHERE building_id = ${id}`;
  const nodes = await sql`SELECT * FROM system_nodes WHERE building_id = ${id}`;
  const pipes = await sql`SELECT * FROM system_pipes WHERE building_id = ${id}`;

  // Group sensors by floor
  const sensorsByFloor = new Map<string, typeof sensors>();
  for (const s of sensors) {
    if (!sensorsByFloor.has(s.floor_id)) sensorsByFloor.set(s.floor_id, []);
    sensorsByFloor.get(s.floor_id)!.push(s);
  }

  // Group nodes and pipes by system_type
  const systemTypes = new Set<string>();
  for (const n of nodes) systemTypes.add(n.system_type);
  for (const p of pipes) systemTypes.add(p.system_type);

  const systems = Array.from(systemTypes).map((st) => ({
    type: st,
    nodes: nodes
      .filter((n: Record<string, unknown>) => n.system_type === st)
      .map((n: Record<string, unknown>) => ({
        id: n.id,
        name: n.name,
        systemType: n.system_type,
        nodeType: n.node_type,
        position: n.position,
        floor: n.floor,
        description: n.description,
        specs: n.specs,
        status: n.status,
      })),
    pipes: pipes
      .filter((p: Record<string, unknown>) => p.system_type === st)
      .map((p: Record<string, unknown>) => ({
        id: p.id,
        systemType: p.system_type,
        fromNode: p.from_node,
        toNode: p.to_node,
        waypoints: p.waypoints,
        diameter: p.diameter,
        ...(p.label ? { label: p.label } : {}),
      })),
  }));

  return {
    id: b.id,
    name: b.name,
    address: b.address,
    type: b.type,
    createdAt: b.created_at instanceof Date ? b.created_at.toISOString() : String(b.created_at),
    updatedAt: b.updated_at instanceof Date ? b.updated_at.toISOString() : String(b.updated_at),
    defaultView: b.default_view as BuildingConfig['defaultView'],
    floors: floors.map((f: Record<string, unknown>) => ({
      id: f.id,
      number: f.number,
      name: f.name,
      type: f.type,
      height: f.height,
      outline: f.outline,
      sqft: f.sqft,
      sensors: (sensorsByFloor.get(f.id as string) || []).map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        position: s.position,
        unit: s.unit,
        min: s.min_val,
        max: s.max_val,
        status: s.status,
      })),
    })),
    systems,
  } as BuildingConfig;
}

// ─── Save full building config (upsert — delete children, re-insert) ─────────
export async function saveBuildingConfig(config: BuildingConfig): Promise<void> {
  // Use the sql tagged template for each query in sequence
  // Neon HTTP driver doesn't support traditional transactions, so we delete+insert
  await sql`DELETE FROM buildings WHERE id = ${config.id}`;

  await sql`
    INSERT INTO buildings (id, name, address, type, default_view, created_at, updated_at)
    VALUES (${config.id}, ${config.name}, ${config.address}, ${config.type},
            ${JSON.stringify(config.defaultView)}, ${config.createdAt}, ${config.updatedAt})
  `;

  for (let i = 0; i < config.floors.length; i++) {
    const f = config.floors[i];
    await sql`
      INSERT INTO floors (id, building_id, number, name, type, height, outline, sqft, sort_order)
      VALUES (${f.id}, ${config.id}, ${f.number}, ${f.name}, ${f.type}, ${f.height},
              ${JSON.stringify(f.outline)}, ${f.sqft}, ${i})
    `;
    for (const s of f.sensors) {
      await sql`
        INSERT INTO sensors (id, floor_id, building_id, name, type, position, unit, min_val, max_val, status)
        VALUES (${s.id}, ${f.id}, ${config.id}, ${s.name}, ${s.type},
                ${JSON.stringify(s.position)}, ${s.unit}, ${s.min}, ${s.max}, ${s.status})
      `;
    }
  }

  for (const sys of config.systems || []) {
    for (const n of sys.nodes) {
      await sql`
        INSERT INTO system_nodes (id, building_id, system_type, node_type, name, position, floor, description, specs, status)
        VALUES (${n.id}, ${config.id}, ${n.systemType}, ${n.nodeType}, ${n.name},
                ${JSON.stringify(n.position)}, ${n.floor}, ${n.description}, ${JSON.stringify(n.specs)}, ${n.status})
      `;
    }
    for (const p of sys.pipes) {
      await sql`
        INSERT INTO system_pipes (id, building_id, system_type, from_node, to_node, waypoints, diameter, label)
        VALUES (${p.id}, ${config.id}, ${p.systemType}, ${p.fromNode}, ${p.toNode},
                ${JSON.stringify(p.waypoints)}, ${p.diameter}, ${p.label || null})
      `;
    }
  }
}

// ─── Delete building ─────────────────────────────────────────────────────────
export async function deleteBuilding(id: string): Promise<void> {
  await sql`DELETE FROM buildings WHERE id = ${id}`;
}

// ─── Find sensor type by ID ──────────────────────────────────────────────────
export async function findSensorTypeById(sensorId: string): Promise<string | null> {
  const rows = await sql`SELECT type FROM sensors WHERE id = ${sensorId} LIMIT 1`;
  return rows.length > 0 ? (rows[0].type as string) : null;
}
