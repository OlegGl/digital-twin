// Run: npx tsx scripts/migrate.ts
// Generates public/buildings/cascade-commons.json and public/buildings/index.json

import { defaultBuilding } from '../src/data/building';
import { getMEPSystems } from '../src/data/mepSystems';
import * as fs from 'fs';
import * as path from 'path';

const building = defaultBuilding;
const systems = getMEPSystems();

// Floor outlines: ground floor is podium 150x300, tower floors are 80x200
function floorOutline(floorNum: number): [number, number][] {
  if (floorNum === 1) {
    // Podium: 150 x 300
    return [[-75, -150], [75, -150], [75, 150], [-75, 150]];
  }
  // Tower: 80 x 200
  return [[-40, -100], [40, -100], [40, 100], [-40, 100]];
}

const config = {
  id: building.id,
  name: building.name,
  address: building.address,
  type: 'mixed-use' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  defaultView: {
    cameraPosition: [250, 150, 250] as [number, number, number],
    cameraTarget: [0, 40, 0] as [number, number, number],
  },
  floors: building.floors.map((f) => ({
    id: f.id,
    number: f.number,
    name: f.name,
    type: f.type,
    height: f.height,
    outline: floorOutline(f.number),
    sqft: f.sqft,
    sensors: f.sensors.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      position: s.position,
      unit: s.unit,
      min: s.min,
      max: s.max,
      status: s.status,
    })),
  })),
  systems: systems.map((sys) => ({
    type: sys.type,
    nodes: sys.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      systemType: n.systemType,
      nodeType: n.nodeType,
      position: n.position,
      floor: n.floor,
      description: n.description,
      specs: n.specs,
      status: n.status,
    })),
    pipes: sys.pipes.map((p) => ({
      id: p.id,
      systemType: p.systemType,
      fromNode: p.fromNode,
      toNode: p.toNode,
      waypoints: p.waypoints,
      diameter: p.diameter,
      ...(p.label ? { label: p.label } : {}),
    })),
  })),
};

const outDir = path.resolve(__dirname, '../public/buildings');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'cascade-commons.json'),
  JSON.stringify(config, null, 2),
);

fs.writeFileSync(
  path.join(outDir, 'index.json'),
  JSON.stringify([
    {
      id: config.id,
      name: config.name,
      address: config.address,
      type: config.type,
    },
  ], null, 2),
);

console.log('Migration complete!');
console.log(`  ${path.join(outDir, 'cascade-commons.json')}`);
console.log(`  ${path.join(outDir, 'index.json')}`);
