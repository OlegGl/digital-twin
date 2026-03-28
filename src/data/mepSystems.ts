import {
  SensorType,
  SystemNode,
  SystemPipe,
  MEPSystem,
  MEPNodeType,
  Position,
} from '@/types';

/*
 * MEP Systems — Cascade Commons, Seattle WA
 *
 * Building reference (1 unit = 1 ft):
 *   Podium:    150 × 20 × 300  (x ±75, y 0-20, z ±150) — Safeway commercial
 *   Tower:      80 × 60 × 200  (x ±40, y 20-80, z ±100) — 6 residential floors
 *   Penthouse:  24 ×  5 ×  32  (x ±12, y 81.5-86.5, z ±16) — mechanical
 *
 * Code compliance basis: NEC 2023, IMC 2021, IPC 2021, IFGC 2021, ASHRAE 90.1
 *
 * Utility entry: west wall (x = -75), near southwest corner
 * Primary MEP chase: x = 35, z = -85 (tower NE corner, adjacent to stair/elevator)
 * HVAC chase: x = ±12, z = 0 (center of tower)
 * Ceiling plenum heights: F1 y=18, F2 y=28, … F7 y=78
 */

function node(
  id: string,
  name: string,
  systemType: SensorType,
  nodeType: MEPNodeType,
  x: number,
  y: number,
  z: number,
  floor: number,
  description: string,
  specs: Record<string, string | number>,
): SystemNode {
  return {
    id,
    name,
    systemType,
    nodeType,
    position: { x, y, z },
    floor,
    description,
    specs,
    status: 'normal',
  };
}

function pipe(
  id: string,
  systemType: SensorType,
  fromNode: string,
  toNode: string,
  waypoints: [number, number, number][],
  diameter: number,
  label?: string,
): SystemPipe {
  return { id, systemType, fromNode, toNode, waypoints, diameter, label };
}

const ceilingY = (floor: number) => (floor === 1 ? 18 : 20 + (floor - 2) * 10 + 8);
const floorMidY = (floor: number) => (floor === 1 ? 10 : 20 + (floor - 2) * 10 + 5);

// ─── ELECTRICAL SYSTEM (NEC 2023) ────────────────────────────────────────────
// Service: 480/277V 3-phase from utility, step-down to 208/120V for residential
// Ground floor: 400A commercial service, separate panels for refrigeration/bakery
// Residential: 200A per floor, distributed via bus duct riser

function electricalSystem(): MEPSystem {
  const E = SensorType.ELECTRICAL;
  const nodes: SystemNode[] = [
    node('elec-service', 'Utility Service Entry', E, 'source', -75, 3, -120, 1,
      'Seattle City Light 480/277V 3-phase service lateral, underground entry through west wall per NEC 230',
      { voltage: '480/277V', phase: '3-phase', amperage: 2000, type: 'Underground service' }),
    node('elec-xfmr', 'Step-Down Transformer', E, 'equipment', -65, 5, -125, 1,
      '2000 kVA dry-type transformer, 480V to 208/120V for building distribution per NEC 450',
      { kva: 2000, primaryV: '480V', secondaryV: '208/120V', cooling: 'Dry-type (AA)' }),
    node('elec-swgr', 'Main Switchgear', E, 'equipment', -60, 8, -118, 1,
      'Main distribution switchgear with utility metering, main breaker, and distribution section',
      { amperage: 2000, voltage: '208/120V', busRating: '65 kAIC', sections: 4 }),
    node('elec-ats', 'Automatic Transfer Switch', E, 'equipment', -55, 8, -118, 1,
      'Emergency/standby transfer switch for life safety and standby loads per NEC 700/701',
      { amperage: 400, type: 'Automatic', transferTime: '10 sec' }),
    node('elec-comm-dp', 'Commercial Distribution Panel', E, 'panel', -50, 15, -130, 1,
      'Safeway main distribution panel — feeds refrigeration, bakery, deli, and lighting sub-panels',
      { amperage: 400, voltage: '208/120V', circuits: 42, mounting: 'Surface' }),
    node('elec-refrig', 'Refrigeration Panel', E, 'panel', 55, 15, -50, 1,
      'Dedicated panel for walk-in coolers, freezers, and display cases per NEC 430',
      { amperage: 200, voltage: '208V', circuits: 30, load: '~150 kW' }),
    node('elec-bakery', 'Bakery / Deli Panel', E, 'panel', 50, 15, 90, 1,
      'Feeds ovens, proof boxes, fryers, and warming equipment',
      { amperage: 100, voltage: '208/120V', circuits: 20, load: '~60 kW' }),
    node('elec-light-gf', 'GF Lighting Panel', E, 'panel', 0, 15, 130, 1,
      'Ground floor lighting and signage panel with daylight harvesting controls',
      { amperage: 100, voltage: '120V', circuits: 24, load: '~30 kW' }),
    node('elec-riser-base', 'Bus Duct Riser Base', E, 'junction', 35, 18, -85, 1,
      'Base of electrical riser — bus duct from switchgear feeds all residential floors',
      { type: 'Bus duct', amperage: 800, voltage: '208/120V' }),
  ];

  const pipes: SystemPipe[] = [
    pipe('elec-p-svc-xfmr', E, 'elec-service', 'elec-xfmr',
      [[-75, 3, -120], [-65, 3, -120], [-65, 5, -125]], 1.0, '4" conduit (480V)'),
    pipe('elec-p-xfmr-swgr', E, 'elec-xfmr', 'elec-swgr',
      [[-65, 5, -125], [-60, 5, -125], [-60, 8, -118]], 1.0, 'Bus duct'),
    pipe('elec-p-swgr-ats', E, 'elec-swgr', 'elec-ats',
      [[-60, 8, -118], [-55, 8, -118]], 0.7, '2" conduit'),
    pipe('elec-p-swgr-comm', E, 'elec-swgr', 'elec-comm-dp',
      [[-60, 8, -118], [-60, 15, -118], [-60, 15, -130], [-50, 15, -130]], 0.9, '3" conduit'),
    pipe('elec-p-comm-refrig', E, 'elec-comm-dp', 'elec-refrig',
      [[-50, 15, -130], [-50, 18, -130], [-50, 18, -50], [55, 18, -50], [55, 15, -50]], 0.8, '2.5" conduit'),
    pipe('elec-p-comm-bakery', E, 'elec-comm-dp', 'elec-bakery',
      [[-50, 15, -130], [-50, 18, -130], [-50, 18, 90], [50, 18, 90], [50, 15, 90]], 0.7, '2" conduit'),
    pipe('elec-p-comm-light', E, 'elec-comm-dp', 'elec-light-gf',
      [[-50, 15, -130], [-50, 18, -130], [-50, 18, 130], [0, 18, 130], [0, 15, 130]], 0.6, '1.5" conduit'),
    pipe('elec-p-swgr-riser', E, 'elec-swgr', 'elec-riser-base',
      [[-60, 8, -118], [-60, 18, -118], [-60, 18, -85], [35, 18, -85]], 1.0, '800A bus duct'),
  ];

  // Riser — single vertical run with junction nodes at each floor
  for (let f = 2; f <= 7; f++) {
    const cy = ceilingY(f);
    const my = floorMidY(f);

    nodes.push(
      node(`elec-riser-f${f}`, `Electrical Riser F${f}`, E, 'riser', 35, cy, -85, f,
        `Bus duct riser tap at floor ${f} — feeds floor distribution panels`,
        { amperage: 200, voltage: '208/120V', tap: `Floor ${f}` }),
      node(`elec-panel-f${f}-a`, `Panel ${f}A (West)`, E, 'panel', -35, my, -60, f,
        `Residential distribution panel — west wing units, floor ${f}`,
        { amperage: 100, voltage: '208/120V', circuits: 20, units: '4 condos' }),
      node(`elec-panel-f${f}-b`, `Panel ${f}B (East)`, E, 'panel', 35, my, 60, f,
        `Residential distribution panel — east wing units, floor ${f}`,
        { amperage: 100, voltage: '208/120V', circuits: 20, units: '4 condos' }),
    );

    // Riser segment (connect from floor below or riser base)
    const prevNode = f === 2 ? 'elec-riser-base' : `elec-riser-f${f - 1}`;
    const prevY = f === 2 ? 18 : ceilingY(f - 1);
    pipes.push(
      pipe(`elec-p-riser-${f - 1}-${f}`, E, prevNode, `elec-riser-f${f}`,
        [[35, prevY, -85], [35, cy, -85]], 1.0, '800A bus duct'),
    );

    // Branch from riser to floor panels
    pipes.push(
      pipe(`elec-p-f${f}-a`, E, `elec-riser-f${f}`, `elec-panel-f${f}-a`,
        [[35, cy, -85], [-35, cy, -85], [-35, cy, -60], [-35, my, -60]], 0.6, '1.5" conduit'),
      pipe(`elec-p-f${f}-b`, E, `elec-riser-f${f}`, `elec-panel-f${f}-b`,
        [[35, cy, -85], [35, cy, 60], [35, my, 60]], 0.6, '1.5" conduit'),
    );
  }

  return { type: E, nodes, pipes };
}

// ─── HVAC SYSTEM (IMC 2021 / ASHRAE 90.1) ───────────────────────────────────
// Penthouse: two main AHUs (supply + return/exhaust) with energy recovery
// Tower: central supply/return duct risers, branches at each floor
// Commercial: separate dedicated rooftop unit on podium roof (higher CFM requirements)

function hvacSystem(): MEPSystem {
  const H = SensorType.HVAC;
  const nodes: SystemNode[] = [
    node('hvac-ahu-1', 'AHU-1 (Primary Supply)', H, 'equipment', -5, 84, -5, 8,
      'Variable-air-volume AHU with enthalpy wheel energy recovery, MERV-13 filtration per ASHRAE 62.1',
      { cfm: 15000, cooling: '40 tons', heating: '600 MBH', erv: 'Enthalpy wheel 75%' }),
    node('hvac-ahu-2', 'AHU-2 (Return / Exhaust)', H, 'equipment', 5, 84, 5, 8,
      'Return air handler with exhaust relief dampers and heat recovery',
      { cfm: 14000, filters: 'MERV-13', exhaust: '3000 CFM min' }),
    node('hvac-supply-top', 'Supply Duct Riser Top', H, 'junction', -12, 82, 0, 8,
      'Main supply duct connection from AHU-1 to vertical riser',
      { ductSize: '36×24"', cfm: 15000 }),
    node('hvac-return-top', 'Return Duct Riser Top', H, 'junction', 12, 82, 0, 8,
      'Main return duct connection to AHU-2 from vertical riser',
      { ductSize: '36×24"', cfm: 14000 }),
    node('hvac-rtu', 'Commercial RTU', H, 'equipment', -30, 21, 0, 1,
      'Packaged rooftop unit for Safeway — dedicated system per IMC requirements for commercial spaces',
      { cfm: 25000, cooling: '75 tons', heating: '1200 MBH', economizer: 'Integrated' }),
    node('hvac-comm-supply-a', 'Safeway Supply A (Produce)', H, 'terminal', -50, 18, -100, 1,
      'Supply air diffuser serving produce section — maintains 68-72°F year-round',
      { cfm: 6000, ductSize: '24×18"' }),
    node('hvac-comm-supply-b', 'Safeway Supply B (Aisles)', H, 'terminal', -30, 18, 50, 1,
      'Supply air diffuser serving main aisle sections',
      { cfm: 8000, ductSize: '24×18"' }),
    node('hvac-comm-supply-c', 'Safeway Supply C (Bakery)', H, 'terminal', 50, 18, 80, 1,
      'Supply air diffuser serving bakery/deli — higher exhaust makeup for cooking hoods',
      { cfm: 7000, ductSize: '24×18"' }),
    node('hvac-comm-return', 'Safeway Return Plenum', H, 'terminal', 0, 18, 0, 1,
      'Central return air plenum — ceiling plenum return per IMC 602',
      { cfm: 22000, type: 'Plenum return' }),
  ];

  const pipes: SystemPipe[] = [
    pipe('hvac-p-ahu1-supply', H, 'hvac-ahu-1', 'hvac-supply-top',
      [[-5, 84, -5], [-12, 84, -5], [-12, 82, 0]], 1.8, '36×24" supply duct'),
    pipe('hvac-p-ahu2-return', H, 'hvac-ahu-2', 'hvac-return-top',
      [[5, 84, 5], [12, 84, 5], [12, 82, 0]], 1.8, '36×24" return duct'),
    // Commercial RTU feeds
    pipe('hvac-p-rtu-a', H, 'hvac-rtu', 'hvac-comm-supply-a',
      [[-30, 21, 0], [-30, 18, 0], [-30, 18, -100], [-50, 18, -100]], 1.5, '24×18" duct'),
    pipe('hvac-p-rtu-b', H, 'hvac-rtu', 'hvac-comm-supply-b',
      [[-30, 21, 0], [-30, 18, 0], [-30, 18, 50]], 1.5, '24×18" duct'),
    pipe('hvac-p-rtu-c', H, 'hvac-rtu', 'hvac-comm-supply-c',
      [[-30, 21, 0], [-30, 18, 0], [-30, 18, 80], [50, 18, 80]], 1.5, '24×18" duct'),
    pipe('hvac-p-rtu-return', H, 'hvac-comm-return', 'hvac-rtu',
      [[0, 18, 0], [-30, 18, 0], [-30, 21, 0]], 1.5, 'Return plenum'),
  ];

  // Residential floor distribution
  for (let f = 2; f <= 7; f++) {
    const cy = ceilingY(f);
    const my = floorMidY(f);

    nodes.push(
      node(`hvac-supply-f${f}`, `Supply Junction F${f}`, H, 'junction', -12, cy, 0, f,
        `Supply duct tee at floor ${f} — VAV box with reheat`,
        { cfm: 2500, ductSize: '18×12"' }),
      node(`hvac-return-f${f}`, `Return Junction F${f}`, H, 'junction', 12, cy, 0, f,
        `Return air junction at floor ${f}`,
        { cfm: 2300, ductSize: '18×12"' }),
      node(`hvac-supply-f${f}-a`, `Supply F${f} West`, H, 'terminal', -30, my, -50, f,
        `VAV terminal unit serving west wing units, floor ${f}`,
        { cfm: 800, type: 'VAV w/ reheat' }),
      node(`hvac-supply-f${f}-b`, `Supply F${f} Center`, H, 'terminal', 0, my, 30, f,
        `VAV terminal unit serving center units, floor ${f}`,
        { cfm: 900, type: 'VAV w/ reheat' }),
      node(`hvac-supply-f${f}-c`, `Supply F${f} East`, H, 'terminal', 25, my, 70, f,
        `VAV terminal unit serving east wing units, floor ${f}`,
        { cfm: 800, type: 'VAV w/ reheat' }),
    );

    // Supply riser segments
    const prevSup = f === 2 ? 'hvac-supply-top' : `hvac-supply-f${f - 1}`;
    const prevRet = f === 2 ? 'hvac-return-top' : `hvac-return-f${f - 1}`;
    const prevCy = f === 2 ? 82 : ceilingY(f - 1);

    // Riser runs downward from penthouse (supply goes top-to-bottom)
    pipes.push(
      pipe(`hvac-p-supply-riser-${f}`, H, prevSup, `hvac-supply-f${f}`,
        [[-12, prevCy, 0], [-12, cy, 0]], 1.5, '24×18" supply riser'),
      pipe(`hvac-p-return-riser-${f}`, H, `hvac-return-f${f}`, prevRet,
        [[12, cy, 0], [12, prevCy, 0]], 1.5, '24×18" return riser'),
    );

    // Branch ducts from supply junction to terminals
    pipes.push(
      pipe(`hvac-p-f${f}-a`, H, `hvac-supply-f${f}`, `hvac-supply-f${f}-a`,
        [[-12, cy, 0], [-30, cy, 0], [-30, cy, -50], [-30, my, -50]], 0.8, '12×8" branch'),
      pipe(`hvac-p-f${f}-b`, H, `hvac-supply-f${f}`, `hvac-supply-f${f}-b`,
        [[-12, cy, 0], [0, cy, 0], [0, cy, 30], [0, my, 30]], 0.8, '12×8" branch'),
      pipe(`hvac-p-f${f}-c`, H, `hvac-supply-f${f}`, `hvac-supply-f${f}-c`,
        [[-12, cy, 0], [25, cy, 0], [25, cy, 70], [25, my, 70]], 0.8, '12×8" branch'),
    );
  }

  return { type: H, nodes, pipes };
}

// ─── WATER / PLUMBING SYSTEM (IPC 2021) ──────────────────────────────────────
// Water main from west wall, meter + backflow + PRV + booster pump
// Cold water riser and hot water riser in main chase
// Ground floor: separate commercial water heater for Safeway
// Residential: domestic hot water from central boiler in penthouse

function waterSystem(): MEPSystem {
  const W = SensorType.WATER;
  const nodes: SystemNode[] = [
    node('water-main', 'Water Main Entry', W, 'source', -75, 3, 0, 1,
      '4" ductile iron water service from city main on Pacific Ave, per IPC 603',
      { pipeSize: '4"', material: 'Ductile iron', pressure: '65 PSI' }),
    node('water-meter', 'Water Meter', W, 'meter', -68, 3, 0, 1,
      'Compound water meter with remote reading — required by Seattle Public Utilities',
      { size: '4"', type: 'Compound', reading: 'AMR' }),
    node('water-bfp', 'Backflow Preventer', W, 'valve', -62, 3, -5, 1,
      'Reduced pressure zone (RPZ) backflow assembly per IPC 608 — annual testing required',
      { size: '4"', type: 'RPZ', testFreq: 'Annual' }),
    node('water-prv', 'Pressure Reducing Valve', W, 'valve', -58, 3, -8, 1,
      'PRV station reducing city pressure to 55 PSI for building distribution per IPC 604.8',
      { inlet: '65 PSI', outlet: '55 PSI', size: '4"' }),
    node('water-pump', 'Booster Pump', W, 'equipment', -55, 4, -12, 1,
      'Duplex booster pump set for upper floors — variable speed drives, maintains 45 PSI at top floor',
      { hp: 15, type: 'Duplex VFD', flow: '120 GPM', head: '80 ft' }),
    node('water-cold-riser-base', 'Cold Water Riser Base', W, 'junction', 35, 18, -82, 1,
      'Base of cold water riser — 3" copper Type L',
      { size: '3"', material: 'Copper Type L' }),
    node('water-heater-comm', 'Commercial Water Heater', W, 'equipment', 60, 5, 110, 1,
      'Safeway commercial water heater — high-efficiency condensing gas, 200 gal storage',
      { type: 'Gas condensing', input: '199 MBH', storage: '200 gal', recovery: '186 GPH' }),
    node('water-comm-cw', 'Safeway Cold Water', W, 'terminal', -30, 5, -80, 1,
      'Cold water distribution to Safeway fixtures and equipment',
      { size: '2"', fixtures: 'Sinks, prep, restrooms' }),
    node('water-boiler', 'Central Boiler', W, 'equipment', 8, 84, 8, 8,
      'High-efficiency condensing boiler for domestic hot water — penthouse mechanical room',
      { type: 'Condensing gas', input: '500 MBH', efficiency: '96%', storage: '300 gal' }),
    node('water-hot-riser-top', 'Hot Water Riser Top', W, 'junction', 33, 82, -82, 8,
      'Top of hot water riser from central boiler — recirculation pump maintains 120°F',
      { size: '2.5"', material: 'Copper Type L', recircTemp: '120°F' }),
  ];

  const pipes: SystemPipe[] = [
    pipe('water-p-main-meter', W, 'water-main', 'water-meter',
      [[-75, 3, 0], [-68, 3, 0]], 0.8, '4" DI'),
    pipe('water-p-meter-bfp', W, 'water-meter', 'water-bfp',
      [[-68, 3, 0], [-62, 3, 0], [-62, 3, -5]], 0.8, '4"'),
    pipe('water-p-bfp-prv', W, 'water-bfp', 'water-prv',
      [[-62, 3, -5], [-58, 3, -5], [-58, 3, -8]], 0.8, '4"'),
    pipe('water-p-prv-pump', W, 'water-prv', 'water-pump',
      [[-58, 3, -8], [-55, 3, -8], [-55, 4, -12]], 0.8, '4"'),
    pipe('water-p-pump-riser', W, 'water-pump', 'water-cold-riser-base',
      [[-55, 4, -12], [-55, 18, -12], [-55, 18, -82], [35, 18, -82]], 0.7, '3" copper'),
    pipe('water-p-pump-comm', W, 'water-pump', 'water-comm-cw',
      [[-55, 4, -12], [-55, 5, -12], [-55, 5, -80], [-30, 5, -80]], 0.6, '2" copper'),
    pipe('water-p-pump-heater', W, 'water-pump', 'water-heater-comm',
      [[-55, 4, -12], [-55, 5, -12], [-55, 5, 110], [60, 5, 110]], 0.6, '2" copper'),
    // Boiler → hot water riser
    pipe('water-p-boiler-riser', W, 'water-boiler', 'water-hot-riser-top',
      [[8, 84, 8], [33, 84, 8], [33, 82, -82]], 0.6, '2.5" copper'),
  ];

  for (let f = 2; f <= 7; f++) {
    const cy = ceilingY(f);
    const my = floorMidY(f);

    nodes.push(
      node(`water-cold-f${f}`, `Cold Water F${f}`, W, 'junction', 35, cy, -82, f,
        `Cold water branch at floor ${f} — 1.5" to unit manifolds`,
        { size: '1.5"', pressure: '~50 PSI' }),
      node(`water-hot-f${f}`, `Hot Water F${f}`, W, 'junction', 33, cy, -82, f,
        `Hot water branch at floor ${f} — recirculating loop maintains temperature`,
        { size: '1.5"', temp: '120°F' }),
      node(`water-branch-f${f}`, `Plumbing Branch F${f}`, W, 'terminal', 0, my, -70, f,
        `Branch distribution to kitchens and bathrooms, floor ${f}`,
        { size: '3/4"', fixtures: 'Kitchen, bath×2, laundry' }),
    );

    // Cold water riser segments
    const prevCold = f === 2 ? 'water-cold-riser-base' : `water-cold-f${f - 1}`;
    const prevY = f === 2 ? 18 : ceilingY(f - 1);
    pipes.push(
      pipe(`water-p-cold-riser-${f}`, W, prevCold, `water-cold-f${f}`,
        [[35, prevY, -82], [35, cy, -82]], 0.7, '3" copper riser'),
    );

    // Hot water riser segments (runs top-down from boiler)
    const nextHot = f === 7 ? 'water-hot-riser-top' : `water-hot-f${f + 1}`;
    const nextY = f === 7 ? 82 : ceilingY(f + 1);
    pipes.push(
      pipe(`water-p-hot-riser-${f}`, W, nextHot, `water-hot-f${f}`,
        [[33, nextY, -82], [33, cy, -82]], 0.5, '2.5" copper riser'),
    );

    // Branch from risers to units
    pipes.push(
      pipe(`water-p-branch-f${f}`, W, `water-cold-f${f}`, `water-branch-f${f}`,
        [[35, cy, -82], [0, cy, -82], [0, cy, -70], [0, my, -70]], 0.4, '1.5" to 3/4"'),
    );
  }

  return { type: W, nodes, pipes };
}

// ─── GAS SYSTEM (IFGC 2021) ─────────────────────────────────────────────────
// Gas main from west wall, meter + regulator at building exterior
// Ground floor: commercial feeds to Safeway bakery and deli (cooking equipment)
// Vertical riser to penthouse: feeds central boiler for domestic hot water + heating
// No gas on residential floors (all-electric units) per Seattle energy code incentives

function gasSystem(): MEPSystem {
  const G = SensorType.GAS;
  const nodes: SystemNode[] = [
    node('gas-main', 'Gas Service Entry', G, 'source', -75, 3, 30, 1,
      '2" steel gas service from Puget Sound Energy main — low pressure entry per IFGC 401',
      { size: '2"', material: 'Steel Sch 40', pressure: '2 PSI', utility: 'PSE' }),
    node('gas-meter', 'Gas Meter Assembly', G, 'meter', -70, 3, 30, 1,
      'Exterior-accessible gas meter with earthquake shutoff valve per IFGC 409',
      { size: '2"', type: 'Rotary', eqShutoff: 'Seismic valve' }),
    node('gas-reg', 'Pressure Regulator', G, 'valve', -65, 3, 28, 1,
      'Service regulator reducing to 7" WC for building distribution per IFGC 402',
      { inlet: '2 PSI', outlet: '7" WC', size: '2"' }),
    node('gas-shutoff', 'Main Gas Shutoff', G, 'valve', -60, 3, 25, 1,
      'Manual main shutoff valve — labeled and accessible per IFGC 409.5',
      { size: '2"', type: 'Ball valve', location: 'Interior, marked' }),
    node('gas-comm-tee', 'Commercial Gas Tee', G, 'junction', -55, 5, 25, 1,
      'Branch tee — splits commercial feed from riser feed',
      { size: '2"' }),
    node('gas-bakery', 'Bakery Gas Connection', G, 'terminal', 50, 5, 90, 1,
      'Gas manifold for bakery ovens, proof box, and deck oven — per IFGC 623 for commercial cooking',
      { size: '1.5"', load: '400 MBH', equipment: 'Ovens, proof box' }),
    node('gas-deli', 'Deli Gas Connection', G, 'terminal', 50, 5, -110, 1,
      'Gas manifold for deli fryers, grill, and steam table',
      { size: '1"', load: '250 MBH', equipment: 'Fryers, grill, steam table' }),
    node('gas-riser-base', 'Gas Riser Base', G, 'junction', 30, 18, -82, 1,
      'Base of gas riser to penthouse — 1.5" steel in ventilated chase per IFGC 404',
      { size: '1.5"', material: 'Steel Sch 40' }),
    node('gas-riser-top', 'Gas Riser Top', G, 'junction', 30, 82, -82, 8,
      'Top of gas riser at penthouse level',
      { size: '1.5"' }),
    node('gas-boiler-conn', 'Boiler Gas Connection', G, 'terminal', 8, 84, 10, 8,
      'Gas connection to central condensing boiler — flex connector with shutoff per IFGC 411',
      { size: '1.5"', load: '500 MBH', connector: 'CSST flex' }),
  ];

  const pipes: SystemPipe[] = [
    pipe('gas-p-main-meter', G, 'gas-main', 'gas-meter',
      [[-75, 3, 30], [-70, 3, 30]], 0.6, '2" steel'),
    pipe('gas-p-meter-reg', G, 'gas-meter', 'gas-reg',
      [[-70, 3, 30], [-65, 3, 30], [-65, 3, 28]], 0.6, '2" steel'),
    pipe('gas-p-reg-shutoff', G, 'gas-reg', 'gas-shutoff',
      [[-65, 3, 28], [-60, 3, 28], [-60, 3, 25]], 0.6, '2" steel'),
    pipe('gas-p-shutoff-tee', G, 'gas-shutoff', 'gas-comm-tee',
      [[-60, 3, 25], [-55, 3, 25], [-55, 5, 25]], 0.6, '2" steel'),
    pipe('gas-p-tee-bakery', G, 'gas-comm-tee', 'gas-bakery',
      [[-55, 5, 25], [-55, 5, 90], [50, 5, 90]], 0.5, '1.5" steel'),
    pipe('gas-p-tee-deli', G, 'gas-comm-tee', 'gas-deli',
      [[-55, 5, 25], [-55, 5, -110], [50, 5, -110]], 0.4, '1" steel'),
    pipe('gas-p-tee-riser', G, 'gas-comm-tee', 'gas-riser-base',
      [[-55, 5, 25], [-55, 18, 25], [-55, 18, -82], [30, 18, -82]], 0.5, '1.5" steel'),
    pipe('gas-p-riser', G, 'gas-riser-base', 'gas-riser-top',
      [[30, 18, -82], [30, 28, -82], [30, 38, -82], [30, 48, -82],
       [30, 58, -82], [30, 68, -82], [30, 78, -82], [30, 82, -82]], 0.5, '1.5" steel riser'),
    pipe('gas-p-riser-boiler', G, 'gas-riser-top', 'gas-boiler-conn',
      [[30, 82, -82], [30, 84, -82], [30, 84, 10], [8, 84, 10]], 0.5, '1.5" CSST'),
  ];

  return { type: G, nodes, pipes };
}

// ─── EXPORT ALL SYSTEMS ─────────────────────────────────────────────────────

export function getMEPSystems(): MEPSystem[] {
  return [electricalSystem(), hvacSystem(), waterSystem(), gasSystem()];
}

export function getAllNodes(): SystemNode[] {
  return getMEPSystems().flatMap((s) => s.nodes);
}

export function getAllPipes(): SystemPipe[] {
  return getMEPSystems().flatMap((s) => s.pipes);
}

export function getNodeById(id: string): SystemNode | undefined {
  return getAllNodes().find((n) => n.id === id);
}
