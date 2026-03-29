/**
 * Seed script: creates Postgres tables and loads cascade-commons.json into Neon.
 * Run: npx tsx scripts/seed.ts
 */
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DDL = `
-- Buildings
CREATE TABLE IF NOT EXISTS buildings (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  address       TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'commercial',
  default_view  JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Floors
CREATE TABLE IF NOT EXISTS floors (
  id            TEXT PRIMARY KEY,
  building_id   TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  number        INT NOT NULL,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'commercial',
  height        REAL NOT NULL DEFAULT 12,
  outline       JSONB NOT NULL DEFAULT '[]',
  sqft          REAL NOT NULL DEFAULT 0,
  sort_order    INT NOT NULL DEFAULT 0
);

-- Sensors
CREATE TABLE IF NOT EXISTS sensors (
  id            TEXT PRIMARY KEY,
  floor_id      TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  building_id   TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  position      JSONB NOT NULL DEFAULT '{}',
  unit          TEXT NOT NULL DEFAULT '',
  min_val       REAL NOT NULL DEFAULT 0,
  max_val       REAL NOT NULL DEFAULT 100,
  status        TEXT NOT NULL DEFAULT 'normal'
);

-- System nodes (MEP)
CREATE TABLE IF NOT EXISTS system_nodes (
  id            TEXT PRIMARY KEY,
  building_id   TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  system_type   TEXT NOT NULL,
  node_type     TEXT NOT NULL,
  name          TEXT NOT NULL,
  position      JSONB NOT NULL DEFAULT '{}',
  floor         INT NOT NULL DEFAULT 1,
  description   TEXT NOT NULL DEFAULT '',
  specs         JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'normal'
);

-- System pipes (MEP)
CREATE TABLE IF NOT EXISTS system_pipes (
  id            TEXT PRIMARY KEY,
  building_id   TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  system_type   TEXT NOT NULL,
  from_node     TEXT NOT NULL,
  to_node       TEXT NOT NULL,
  waypoints     JSONB NOT NULL DEFAULT '[]',
  diameter      REAL NOT NULL DEFAULT 1,
  label         TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_sensors_building ON sensors(building_id);
CREATE INDEX IF NOT EXISTS idx_sensors_floor ON sensors(floor_id);
CREATE INDEX IF NOT EXISTS idx_system_nodes_building ON system_nodes(building_id);
CREATE INDEX IF NOT EXISTS idx_system_pipes_building ON system_pipes(building_id);
`;

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Creating tables...');
    await client.query(DDL);

    // Load JSON
    const filePath = join(process.cwd(), 'public', 'buildings', 'cascade-commons.json');
    const building = JSON.parse(readFileSync(filePath, 'utf-8'));
    console.log(`Loaded ${building.name} — ${building.floors.length} floors`);

    // Check if already seeded
    const exists = await client.query('SELECT id FROM buildings WHERE id = $1', [building.id]);
    if (exists.rows.length > 0) {
      console.log('Building already exists — deleting for re-seed...');
      await client.query('DELETE FROM buildings WHERE id = $1', [building.id]);
    }

    await client.query('BEGIN');

    // Insert building
    await client.query(
      `INSERT INTO buildings (id, name, address, type, default_view, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        building.id,
        building.name,
        building.address,
        building.type,
        JSON.stringify(building.defaultView),
        building.createdAt,
        building.updatedAt,
      ],
    );
    console.log('  ✓ Building inserted');

    // Insert floors + sensors
    let sensorCount = 0;
    for (let i = 0; i < building.floors.length; i++) {
      const floor = building.floors[i];
      await client.query(
        `INSERT INTO floors (id, building_id, number, name, type, height, outline, sqft, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [floor.id, building.id, floor.number, floor.name, floor.type, floor.height, JSON.stringify(floor.outline), floor.sqft, i],
      );

      for (const sensor of floor.sensors || []) {
        await client.query(
          `INSERT INTO sensors (id, floor_id, building_id, name, type, position, unit, min_val, max_val, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [sensor.id, floor.id, building.id, sensor.name, sensor.type, JSON.stringify(sensor.position), sensor.unit, sensor.min, sensor.max, sensor.status],
        );
        sensorCount++;
      }
    }
    console.log(`  ✓ ${building.floors.length} floors, ${sensorCount} sensors inserted`);

    // Insert systems (nodes + pipes)
    let nodeCount = 0;
    let pipeCount = 0;
    for (const system of building.systems || []) {
      for (const node of system.nodes || []) {
        await client.query(
          `INSERT INTO system_nodes (id, building_id, system_type, node_type, name, position, floor, description, specs, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [node.id, building.id, node.systemType, node.nodeType, node.name, JSON.stringify(node.position), node.floor, node.description, JSON.stringify(node.specs), node.status],
        );
        nodeCount++;
      }
      for (const pipe of system.pipes || []) {
        await client.query(
          `INSERT INTO system_pipes (id, building_id, system_type, from_node, to_node, waypoints, diameter, label)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [pipe.id, building.id, pipe.systemType, pipe.fromNode, pipe.toNode, JSON.stringify(pipe.waypoints), pipe.diameter, pipe.label || null],
        );
        pipeCount++;
      }
    }
    console.log(`  ✓ ${nodeCount} system nodes, ${pipeCount} system pipes inserted`);

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
